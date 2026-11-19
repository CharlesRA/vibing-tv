// SessionStart hook: starts the server, then (unless disabled) asks Claude to explain its edits and to give the link.
import { readFileSync, writeSync } from "node:fs";
import { HookEvents, SessionSources, type HookPayload } from "../core/protocol.ts";
import { readConfig } from "../node/config.ts";
import { launchFromEnv, LaunchStates, type LaunchState } from "../server/launch.ts";

const COACH =
  "[vibing-tv] The user is watching your file edits live in a viewer, with your messages shown alongside. Before each group of Write/Edit calls, write one or two sentences saying what you are about to change and why. For any task with more than one step, keep a markdown checklist of the steps (- [ ] step / - [x] step) in your messages, and post it again, updated, whenever a step is done.";
const link = (port: number) =>
  `[vibing-tv] The user can watch your file edits live at http://127.0.0.1:${port}. Begin your first reply in this conversation with one short line giving them this link, in the user's language. Do not repeat it later.`;
// Only a new conversation needs the link; after resume or compaction it was already given.
const NEW_CONVERSATION = new Set<string>([SessionSources.Startup, SessionSources.Clear]);
const SERVER_UP = new Set<LaunchState>([LaunchStates.Started, LaunchStates.Running, LaunchStates.Replaced]);

let source = "";
try {
  source = (JSON.parse(readFileSync(0, "utf8")) as HookPayload).source ?? "";
} catch {
  // no payload: no link
}

const config = readConfig();
let launched: Awaited<ReturnType<typeof launchFromEnv>> | null = null;
try {
  launched = await launchFromEnv();
} catch {
  // the viewer is a bonus: never get in Claude's way
}

const parts: string[] = [];
if (config.coach) parts.push(COACH);
if (config.link && launched && SERVER_UP.has(launched.state) && NEW_CONVERSATION.has(source)) {
  parts.push(link(launched.port));
}
if (parts.length) {
  const output = {
    hookSpecificOutput: { hookEventName: HookEvents.SessionStart, additionalContext: parts.join("\n\n") },
  };
  writeSync(1, JSON.stringify(output));
}
process.exit(0);
