import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import http from "node:http";
import net from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { dayjs } from "../src/core/time.ts";
import type { Health } from "../src/core/protocol.ts";
import { startServer } from "../src/server/http.ts";
import { ensureServer } from "../src/server/launch.ts";

const freePort = () =>
  new Promise<number>((resolve) => {
    const s = net.createServer().listen(0, "127.0.0.1", () => {
      const { port } = s.address() as net.AddressInfo;
      s.close(() => {
        resolve(port);
      });
    });
  });

const health = async (port: number) => (await (await fetch(`http://127.0.0.1:${port}/health`)).json()) as Health;
const waitFor = async <T>(fn: () => Promise<T>): Promise<T> => {
  const end = dayjs().add(3, "seconds");
  for (;;) {
    try {
      return await fn();
    } catch (e) {
      if (dayjs().isAfter(end)) throw e;
      await new Promise((r) => setTimeout(r, 100));
    }
  }
};

test("starts one server, then sees it running", async () => {
  const port = await freePort();
  const dataDir = mkdtempSync(join(tmpdir(), "vibing-tv-launch-"));
  expect(await ensureServer({ port, dataDir })).toBe("started");
  const h = await waitFor(() => health(port));
  expect(h.app).toBe("vibing-tv");
  expect(h.pid).not.toBe(process.pid);
  expect(await ensureServer({ port, dataDir })).toBe("running");
  process.kill(h.pid);

  // an older vibing-tv server on the port is replaced by this version
  const port2 = await freePort();
  const old = await startServer({
    port: port2,
    dataDir,
    idleMs: dayjs.duration(1, "minute").asMilliseconds(),
    version: "0.0.1",
  });
  expect(await ensureServer({ port: port2, dataDir, version: "99.0.0" })).toBe("replaced");
  await old.closed;
  const h2 = await waitFor(() => health(port2));
  expect(h2.pid).not.toBe(process.pid);
  process.kill(h2.pid);
});

test("a foreign app on the port is left alone", async () => {
  const foreign = http
    .createServer((_, res) => {
      res.end("hello");
    })
    .listen(0, "127.0.0.1");
  await new Promise((r) => foreign.once("listening", r));
  const { port } = foreign.address() as net.AddressInfo;
  expect(await ensureServer({ port, dataDir: mkdtempSync(join(tmpdir(), "vibing-tv-launch-")) })).toBe("port-busy");
  foreign.close();
});

const sessionStart = (env: Record<string, string>) =>
  spawnSync(
    process.execPath,
    ["--no-warnings", fileURLToPath(new URL("../src/hooks/session-start.ts", import.meta.url))],
    {
      input: JSON.stringify({ hook_event_name: "SessionStart", session_id: "s", source: "startup" }),
      env: { ...process.env, ...env },
      encoding: "utf8",
    },
  );

test("session-start injects the coaching context", async () => {
  const port = await freePort();
  const r = sessionStart({
    VIBING_TV_PORT: String(port),
    VIBING_TV_DATA_DIR: mkdtempSync(join(tmpdir(), "vibing-tv-ss-")),
  });
  expect(r.status).toBe(0);
  expect(r.stderr).toBe("");
  const out = JSON.parse(r.stdout) as { hookSpecificOutput: { hookEventName: string; additionalContext: string } };
  expect(out.hookSpecificOutput.hookEventName).toBe("SessionStart");
  expect(out.hookSpecificOutput.additionalContext).toMatch(/markdown checklist/);
  const h = await waitFor(() => health(port));
  process.kill(h.pid);
});

test("VIBING_TV_NO_COACH=1 and VIBING_TV_NO_LINK=1 keep session-start silent", async () => {
  const port = await freePort();
  const r = sessionStart({
    VIBING_TV_PORT: String(port),
    VIBING_TV_DATA_DIR: mkdtempSync(join(tmpdir(), "vibing-tv-ss-")),
    VIBING_TV_NO_COACH: "1",
    VIBING_TV_NO_LINK: "1",
  });
  expect(r.status).toBe(0);
  expect(r.stdout + r.stderr).toBe("");
  const h = await waitFor(() => health(port));
  process.kill(h.pid);
});
