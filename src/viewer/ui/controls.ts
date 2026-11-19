// Playback controls (pause, skip, typing speed), their keyboard shortcuts, and the edit counter.
import { ctx } from "./context.ts";
import { $ } from "./dom.ts";
import { icons } from "./icons.ts";

export const speed = (): number => Number(($("speed") as HTMLInputElement).value);

export function renderCounter(): void {
  const total = [...ctx.state.events.values()].filter((e) => e.file).length;
  $("counter").textContent = `${String(Math.min(ctx.played, total))}/${String(total)} edits`;
  $("queued").textContent = ctx.queue.length ? `${String(ctx.queue.length)} queued` : "";
}

function renderPause(): void {
  const pause = $("pause");
  pause.innerHTML = ctx.paused ? icons.play : icons.pause;
  pause.setAttribute("aria-pressed", String(ctx.paused));
  pause.setAttribute("aria-label", ctx.paused ? "Resume" : "Pause");
  pause.title = ctx.paused ? "Resume (Space)" : "Pause (Space)";
}

function togglePause(): void {
  ctx.paused = !ctx.paused;
  renderPause();
}

function skip(): void {
  ctx.skip = true;
}

export function wireControls(): void {
  $("skip").innerHTML = icons.skip;
  renderPause();
  $("pause").onclick = togglePause;
  $("skip").onclick = skip;
}

// Space pauses, → skips, S focuses the session picker. Not with a modifier held, nor in a field (Monaco's
// textarea included, where arrows move the cursor), nor Space on a button (it already clicks it).
export function wireShortcuts(): void {
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest("input, select, textarea")) return;
    if (target instanceof HTMLButtonElement && e.key === " ") return;
    if (e.key === " ") togglePause();
    else if (e.key === "ArrowRight") skip();
    else if (e.key === "s" || e.key === "S") $("session").focus();
    else return;
    e.preventDefault();
  });
}
