// Entry point of the detached server process started by the launcher.
import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { readConfig } from "../node/config.ts";
import { startServer } from "./http.ts";
import { createStore } from "./store.ts";

const WEEK_MS = 7 * 24 * 3600 * 1000;

const config = readConfig();
const log = (msg: string) => {
  try {
    appendFileSync(join(config.dataDir, "server.log"), `${new Date().toISOString()} ${msg}\n`);
  } catch {
    // nowhere to log to
  }
};

try {
  mkdirSync(config.dataDir, { recursive: true });
  createStore(config.dataDir).prune(WEEK_MS);
  const server = await startServer({ port: config.port, dataDir: config.dataDir, idleMs: config.idleMs, log });
  await server.closed;
} catch (e) {
  // EADDRINUSE included: another session's server won the race, which is fine.
  log(`failed: ${e instanceof Error ? e.message : String(e)}`);
}
process.exit(0);
