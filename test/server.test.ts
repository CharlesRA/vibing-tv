import { appendFileSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { dayjs } from "../src/core/time.ts";
import type { Health, SessionSummary, StreamEvent } from "../src/core/protocol.ts";
import { startServer, type ServerOptions } from "../src/server/http.ts";

const ev = (session_id: string, id: string) => ({
  v: 1,
  id,
  ts: dayjs().toISOString(),
  session_id,
  cwd: "/w",
  kind: "edit",
});

async function setup(opts: Partial<ServerOptions> = {}) {
  const dir = mkdtempSync(join(tmpdir(), "vibing-tv-srv-"));
  mkdirSync(join(dir, "sessions"));
  const viewerDir = mkdtempSync(join(tmpdir(), "vibing-tv-viewer-"));
  writeFileSync(join(viewerDir, "index.html"), "<!doctype html><title>vibing-tv</title>");
  writeFileSync(join(viewerDir, "app.js"), "console.log(1)");
  const add = (e: { session_id: string }) => {
    appendFileSync(join(dir, "sessions", `${e.session_id}.jsonl`), JSON.stringify(e) + "\n");
  };
  const srv = await startServer({
    port: 0,
    dataDir: dir,
    idleMs: dayjs.duration(1, "minute").asMilliseconds(),
    viewerDir,
    ...opts,
  });
  const url = (p: string) => `http://127.0.0.1:${srv.port}${p}`;
  return { dir, add, srv, url };
}

const get = async (url: string) => {
  const r = await fetch(url);
  return { status: r.status, type: r.headers.get("content-type"), body: await r.text() };
};

const statusWithHost = (port: number, path: string, host: string) =>
  new Promise<number | undefined>((resolve, reject) => {
    http
      .request({ host: "127.0.0.1", port, path, headers: { host } }, (res) => {
        res.resume();
        resolve(res.statusCode);
      })
      .on("error", reject)
      .end();
  });

test("health identifies the app", async () => {
  const { srv, url, dir } = await setup({ version: "9.9.9" });
  const h = JSON.parse((await get(url("/health"))).body) as Health;
  expect(h.app).toBe("vibing-tv");
  expect(h.version).toBe("9.9.9");
  expect(h.schema).toBe(1);
  expect(h.dataDir).toBe(dir);
  expect(h.pid).toBe(process.pid);
  // DNS rebinding: a request addressed to another host name is refused
  expect(await statusWithHost(srv.port, "/health", "evil.example:80")).toBe(403);
  await srv.close();
});

test("sessions and history expose what was written", async () => {
  const { srv, url, add } = await setup();
  add(ev("s1", "a"));
  add(ev("s1", "b"));
  const sessions = JSON.parse((await get(url("/sessions"))).body) as SessionSummary[];
  expect(sessions.map((s) => s.session_id)).toEqual(["s1"]);
  const hist = JSON.parse((await get(url("/history?session=s1"))).body) as StreamEvent[];
  expect(hist.map((e) => e.id)).toEqual(["a", "b"]);
  await srv.close();
});

test("SSE clients receive new events but not older ones", async () => {
  const { srv, url, add } = await setup();
  add(ev("s1", "before"));
  await new Promise((r) => setTimeout(r, 400)); // let the server see what already exists
  const received: StreamEvent[] = [];
  const req = http.get(url("/events"));
  const res = await new Promise<http.IncomingMessage>((r) => req.on("response", r));
  expect(res.headers["content-type"]).toMatch(/text\/event-stream/);
  res.setEncoding("utf8");
  let buf = "";
  const got = new Promise<void>((resolve) => {
    res.on("data", (chunk: string) => {
      buf += chunk;
      for (const m of buf.matchAll(/^data: (.+)$/gm)) {
        const e = JSON.parse(m[1] ?? "") as StreamEvent;
        if (!received.some((x) => x.id === e.id)) received.push(e);
      }
      if (received.some((e) => e.id === "after")) resolve();
    });
  });
  await new Promise((r) => setTimeout(r, 400));
  add(ev("s1", "after"));
  await got;
  req.destroy();
  await srv.close();
  expect(received.map((e) => e.id)).toEqual(["after"]);
});

test("viewer files are served and path traversal is refused", async () => {
  const { srv, url } = await setup();
  const index = await get(url("/"));
  expect(index.status).toBe(200);
  expect(index.type).toMatch(/text\/html/);
  const js = await get(url("/viewer/app.js"));
  expect(js.status).toBe(200);
  expect(js.type).toMatch(/javascript/);
  expect((await get(url("/viewer/..%2Fpackage.json"))).status).toBe(404);
  expect((await get(url("/viewer/../package.json"))).status).toBe(404);
  expect((await get(url("/nope"))).status).toBe(404);
  await srv.close();
});

test("binds to loopback only", async () => {
  const { srv } = await setup();
  expect(srv.address).toBe("127.0.0.1");
  await srv.close();
});

test("stops by itself when idle with no client", async () => {
  const { srv } = await setup({ idleMs: 200 });
  await Promise.race([
    srv.closed,
    new Promise((_, rej) =>
      setTimeout(() => {
        rej(new Error("still running"));
      }, 3000),
    ),
  ]);
});
