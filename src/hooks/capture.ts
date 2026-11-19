// PostToolUse/Stop hook: appends one event to the session log. Silent, always exits 0.
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { buildEvent } from "../core/event.ts";
import { dataDir, sessionFile } from "../node/paths.ts";
import { readTranscriptTail } from "../node/tail.ts";

try {
  const ev = buildEvent(JSON.parse(readFileSync(0, "utf8")), { readTranscriptTail });
  if (ev) {
    const file = sessionFile(dataDir(), ev.session_id);
    mkdirSync(dirname(file), { recursive: true });
    appendFileSync(file, JSON.stringify(ev) + "\n");
  }
} catch {
  // never get in Claude's way
}
process.exit(0);
