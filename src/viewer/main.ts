// Viewer: loads a session's history, then types each new event live in Monaco.
import "./style.css";
import { ctx } from "./ui/context.ts";
import { connect, openSession, renderSessions } from "./ui/connection.ts";
import { wireControls } from "./ui/controls.ts";
import { $ } from "./ui/dom.ts";
import { playLoop } from "./ui/editor.ts";
import { editor } from "./ui/monaco.ts";

// Monaco cancels internal work when a model is replaced: harmless noise.
window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
  if ((e.reason as { name?: string } | null)?.name === "Canceled") e.preventDefault();
});

wireControls();
($("session") as HTMLSelectElement).onchange = (e) => {
  ctx.pinnedByUser = true;
  void openSession((e.target as HTMLSelectElement).value);
};

editor();
const sessions = await renderSessions();
await openSession(sessions[0]?.session_id ?? null);
connect();
void playLoop();
