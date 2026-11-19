// Entry point of the detached server process started by the launcher.
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { dayjs } from "../core/time.ts";
import { readConfig } from "../node/config.ts";
import { startServer } from "./http.ts";
import { createStore } from "./store.ts";

const RETENTION = dayjs.duration(7, "days");

const config = readConfig();
const log = (msg: string) => {
  try {
    appendFileSync(join(config.dataDir, "server.log"), `${dayjs().toISOString()} ${msg}\n`);
  } catch {
    // nowhere to log to
  }
};

try {
  mkdirSync(config.dataDir, { recursive: true });
  const server = await startServer({ port: config.port, dataDir: config.dataDir, idleMs: config.idleMs, log });
  // only the server that won the port cleans up, and cleaning up can never keep it from starting
  createStore(config.dataDir).prune(RETENTION.asMilliseconds());
  await server.closed;
} catch (e) {
  // EADDRINUSE included: another session's server won the race, which is fine.
  log(`failed: ${e instanceof Error ? e.message : String(e)}`);
}
process.exit(0);
