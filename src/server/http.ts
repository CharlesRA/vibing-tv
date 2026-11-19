// Local server: session logs → SSE, plus the static viewer. Listens on 127.0.0.1 only.
import { readFileSync } from "node:fs";
import http from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { APP_ID, SCHEMA_VERSION, SSE_EVENT, type Health } from "../core/protocol.ts";
import { dayjs } from "../core/time.ts";
import { VERSION } from "../node/version.ts";
import { createEnricher, type Enricher } from "./enrich.ts";
import { createStore } from "./store.ts";

const HOST = "127.0.0.1";
const POLL_MS = 300;
const PING_EVERY = dayjs.duration(15, "seconds");
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
};
const SEGMENT = /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/;
const DEFAULT_VIEWER = fileURLToPath(new URL("../viewer/", import.meta.url));

// The launcher sends this header to stop an older server. A custom header forces a CORS preflight,
// so a web page cannot trigger it.
export const SHUTDOWN_HEADER = "x-vibing-tv-shutdown";

export interface ServerOptions {
  port: number;
  dataDir: string;
  idleMs: number;
  version?: string;
  viewerDir?: string;
  log?: (msg: string) => void;
  enricher?: Enricher;
}

export interface RunningServer {
  port: number;
  address: string;
  close(): Promise<void>;
  closed: Promise<void>;
}

// "/viewer/assets/x.js" → absolute file under viewerDir, or null for anything that could escape it.
function viewerPath(viewerDir: string, rawPath: string): string | null {
  let segments: string[];
  try {
    segments = rawPath.split("/").map(decodeURIComponent);
  } catch {
    return null;
  }
  if (!segments.length || !segments.every((s) => SEGMENT.test(s))) return null;
  const root = resolve(viewerDir);
  const file = resolve(join(root, ...segments));
  return file.startsWith(root + sep) && extname(file) in TYPES ? file : null;
}

export function startServer({
  port,
  dataDir,
  idleMs,
  version = VERSION,
  viewerDir = DEFAULT_VIEWER,
  log = () => undefined,
  enricher = createEnricher(),
}: ServerOptions): Promise<RunningServer> {
  const store = createStore(dataDir);
  store.poll(); // existing events are not replayed: clients get them from /history
  const clients = new Set<http.ServerResponse>();
  let lastActivity = dayjs();
  let boundPort = port;

  const json = (res: http.ServerResponse, body: unknown) => {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
  };
  const status = (res: http.ServerResponse, code: number) => {
    res.writeHead(code, { "content-type": "text/plain" });
    res.end(code === 404 ? "not found" : "");
  };
  const serveFile = (res: http.ServerResponse, file: string | null) => {
    if (!file) {
      status(res, 404);
      return;
    }
    try {
      const body = readFileSync(file);
      res.writeHead(200, { "content-type": TYPES[extname(file)], "cache-control": "no-store" });
      res.end(body);
    } catch {
      status(res, 404);
    }
  };
  const broadcast = (event: string, data: unknown) => {
    for (const c of clients) c.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const server = http.createServer((req, res) => {
    // DNS rebinding guard: only answer requests addressed to this loopback port.
    const host = req.headers.host ?? "";
    if (host !== `${HOST}:${boundPort}` && host !== `localhost:${boundPort}`) {
      status(res, 403);
      return;
    }
    const url = new URL(req.url ?? "/", `http://${HOST}`);
    if (req.method === "POST" && url.pathname === "/shutdown") {
      if (req.headers[SHUTDOWN_HEADER] !== "1") {
        status(res, 403);
        return;
      }
      res.writeHead(204).end(() => {
        log("shutdown requested");
        void close();
      });
      return;
    }
    if (req.method !== "GET") {
      status(res, 404);
      return;
    }
    switch (url.pathname) {
      case "/health": {
        const health: Health = { app: APP_ID, version, schema: SCHEMA_VERSION, dataDir, pid: process.pid };
        json(res, health);
        return;
      }
      case "/sessions":
        json(res, store.listSessions());
        return;
      case "/history": {
        const sid = url.searchParams.get("session") ?? "";
        enricher.resolveNow(store.history(sid)).forEach((p) => {
          store.addPatch(p);
        });
        json(res, store.history(sid));
        return;
      }
      case "/":
        serveFile(res, viewerPath(viewerDir, "index.html"));
        return;
      case "/events":
        res.writeHead(200, {
          "content-type": "text/event-stream",
          "cache-control": "no-store",
          connection: "keep-alive",
        });
        res.write(": connected\n\n");
        clients.add(res);
        req.on("close", () => {
          clients.delete(res);
          lastActivity = dayjs();
        });
        return;
    }
    if (url.pathname.startsWith("/viewer/"))
      serveFile(res, viewerPath(viewerDir, url.pathname.slice("/viewer/".length)));
    else status(res, 404);
  });

  let closedResolve: () => void = () => undefined;
  const closed = new Promise<void>((r) => (closedResolve = r));
  const timers: NodeJS.Timeout[] = [];
  let closing: Promise<void> | null = null;
  const close = () =>
    (closing ??= new Promise<void>((done) => {
      timers.forEach(clearInterval);
      for (const c of clients) c.end();
      server.close(() => {
        closedResolve();
        done();
      });
      server.closeAllConnections();
    }));

  timers.push(
    setInterval(
      () => {
        const events = store.poll();
        if (events.length) lastActivity = dayjs();
        for (const e of events) broadcast(SSE_EVENT.event, e);
        enricher.track(events);
        for (const p of enricher.tick()) {
          store.addPatch(p);
          broadcast(SSE_EVENT.patch, p);
        }
        if (clients.size === 0 && dayjs().isAfter(lastActivity.add(idleMs, "ms"))) {
          log("idle, shutting down");
          void close();
        }
      },
      Math.min(POLL_MS, idleMs),
    ),
    setInterval(() => {
      for (const c of clients) c.write(": ping\n\n");
    }, PING_EVERY.asMilliseconds()),
  );

  return new Promise((resolveStart, reject) => {
    server.once("error", (e) => {
      timers.forEach(clearInterval);
      reject(e);
    });
    server.listen(port, HOST, () => {
      const addr = server.address() as { address: string; port: number };
      boundPort = addr.port;
      log(`listening on ${addr.address}:${addr.port}`);
      resolveStart({ port: addr.port, address: addr.address, close, closed });
    });
  });
}
