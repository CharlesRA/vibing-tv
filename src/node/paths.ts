import { homedir } from "node:os";
import { join } from "node:path";

// One data folder for every way the plugin is loaded (installed or --plugin-dir), so their servers never disagree.
export function dataDir(env: NodeJS.ProcessEnv = process.env): string {
  return env.VIBING_TV_DATA_DIR || join(homedir(), ".vibing-tv");
}

export const safeId = (id: string): string => id.replace(/[^A-Za-z0-9_-]/g, "");

export function sessionFile(dir: string, sessionId: string): string {
  return join(dir, "sessions", `${safeId(sessionId)}.jsonl`);
}
