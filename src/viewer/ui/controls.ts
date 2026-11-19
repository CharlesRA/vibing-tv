// Bottom bar: pause, skip, typing speed and the edit counter.
import { ctx } from "./context.ts";
import { $ } from "./dom.ts";

export const speed = (): number => Number(($("speed") as HTMLInputElement).value);

export function renderCounter(): void {
  const total = [...ctx.state.events.values()].filter((e) => e.file).length;
  const queued = ctx.queue.length ? ` · ${String(ctx.queue.length)} queued` : "";
  $("counter").textContent = `${String(Math.min(ctx.played, total))}/${String(total)} edits${queued}`;
}

export function wireControls(): void {
  $("pause").onclick = () => {
    ctx.paused = !ctx.paused;
    $("pause").textContent = ctx.paused ? "▶ Resume" : "⏸ Pause";
  };
  $("skip").onclick = () => {
    ctx.skip = true;
  };
}
