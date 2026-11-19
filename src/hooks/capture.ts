// PostToolUse/Stop hook: appends one event to the session log. Silent, always exits 0.
// At the end of each turn (Stop) it also restarts the server if it stopped while idle, so the link Claude gave
// keeps working; edits themselves never wait on the server.
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { buildEvent } from "../core/event.ts";
import { HookEvents, type HookPayload } from "../core/protocol.ts";
import { dataDir, sessionFile } from "../node/paths.ts";
import { readTranscriptTail } from "../node/tail.ts";
import { launchFromEnv } from "../server/launch.ts";

let payload: HookPayload | null = null;
try {
  payload = JSON.parse(readFileSync(0, "utf8")) as HookPayload;
  const ev = buildEvent(payload, { readTranscriptTail });
  if (ev) {
    const file = sessionFile(dataDir(), ev.session_id);
    mkdirSync(dirname(file), { recursive: true });
    appendFileSync(file, JSON.stringify(ev) + "\n");
  }
} catch {
  // never get in Claude's way
}
if (payload?.hook_event_name === HookEvents.Stop) {
  try {
    await launchFromEnv();
  } catch {
    // the viewer is a bonus
  }
}
process.exit(0);
