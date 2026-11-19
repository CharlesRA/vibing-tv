// Starts a detached vibing-tv server unless one of the same or a newer version already runs on the port. Silent.
import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import http from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { APP_ID, type Health } from "../core/protocol.ts";
import { dayjs } from "../core/time.ts";
import type { Values } from "../core/values.ts";
import { compareVersions } from "../core/version.ts";
import { readConfig } from "../node/config.ts";
import { VERSION } from "../node/version.ts";
import { SHUTDOWN_HEADER } from "./http.ts";

export const LaunchStates = {
  Started: "started",
  Running: "running",
  Replaced: "replaced",
  PortBusy: "port-busy",
  // the server was spawned but never answered (e.g. its data folder is not writable)
  Failed: "failed",
} as const;
export type LaunchState = Values<typeof LaunchStates>;

const ProbeKinds = { Free: "free", Busy: "busy", Ours: "ours" } as const;
type Probe =
  | { kind: typeof ProbeKinds.Free }
  | { kind: typeof ProbeKinds.Busy }
  | { kind: typeof ProbeKinds.Ours; health: Health };

// Run from the sources in development, from the bundle once built.
const SERVER = fileURLToPath(new URL(import.meta.url.endsWith(".ts") ? "./main.ts" : "./server.mjs", import.meta.url));
const SHUTDOWN_WAIT = dayjs.duration(3, "seconds");
const STARTUP_WAIT = dayjs.duration(2, "seconds");

function request(port: number, method: "GET" | "POST", path: string, headers: Record<string, string> = {}) {
  return new Promise<{ status: number; body: string } | "refused" | "error">((resolve) => {
    const req = http.request({ host: "127.0.0.1", port, method, path, headers, timeout: 500 }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (c: string) => (body += c));
      res.on("end", () => {
        resolve({ status: res.statusCode ?? 0, body });
      });
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (e: NodeJS.ErrnoException) => {
      resolve(e.code === "ECONNREFUSED" ? "refused" : "error");
    });
    req.end();
  });
}

async function probe(port: number): Promise<Probe> {
  const r = await request(port, "GET", "/health");
  if (r === "refused") return { kind: ProbeKinds.Free };
  if (r === "error") return { kind: ProbeKinds.Busy };
  try {
    const health = JSON.parse(r.body) as Partial<Health>;
    return health.app === APP_ID ? { kind: ProbeKinds.Ours, health: health as Health } : { kind: ProbeKinds.Busy };
  } catch {
    return { kind: ProbeKinds.Busy };
  }
}

async function waitFor(port: number, kind: Probe["kind"], within: ReturnType<typeof dayjs.duration>): Promise<boolean> {
  const end = dayjs().add(within);
  while (dayjs().isBefore(end)) {
    if ((await probe(port)).kind === kind) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

export async function ensureServer({
  port,
  dataDir,
  version = VERSION,
  env = process.env,
}: {
  port: number;
  dataDir: string;
  version?: string;
  env?: NodeJS.ProcessEnv;
}): Promise<LaunchState> {
  const log = (msg: string) => {
    try {
      mkdirSync(dataDir, { recursive: true });
      appendFileSync(join(dataDir, "server.log"), `${dayjs().toISOString()} ${msg}\n`);
    } catch {
      // nowhere to log to
    }
  };
  const start = async (): Promise<boolean> => {
    spawn(process.execPath, ["--no-warnings", SERVER], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      env: { ...env, VIBING_TV_PORT: String(port), VIBING_TV_DATA_DIR: dataDir },
    }).unref();
    if (await waitFor(port, ProbeKinds.Ours, STARTUP_WAIT)) return true;
    log(`server did not answer on port ${port} after ${STARTUP_WAIT.asSeconds()} s`);
    return false;
  };

  const state = await probe(port);
  if (state.kind === ProbeKinds.Free) return (await start()) ? LaunchStates.Started : LaunchStates.Failed;
  if (state.kind === ProbeKinds.Busy) {
    log(`port ${port} busy with another app`);
    return LaunchStates.PortBusy;
  }
  const running = state.health;
  if (compareVersions(running.version, version) < 0) {
    await request(port, "POST", "/shutdown", { [SHUTDOWN_HEADER]: "1" });
    if (!(await waitFor(port, ProbeKinds.Free, SHUTDOWN_WAIT))) {
      log(`server ${running.version} on port ${port} did not stop; keeping it`);
      return LaunchStates.Running;
    }
    return (await start()) ? LaunchStates.Replaced : LaunchStates.Failed;
  }
  if (running.dataDir !== dataDir) log(`server on port ${port} uses ${running.dataDir}, not ${dataDir}; keeping it`);
  return LaunchStates.Running;
}

export async function launchFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ state: LaunchState; port: number }> {
  const { port, dataDir } = readConfig(env);
  return { state: await ensureServer({ port, dataDir, env }), port };
}
