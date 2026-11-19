// Plays edits in the editor: highlight what goes away, type what comes in.
import type { StreamEvent } from "../../core/protocol.ts";
import { charsPerTick, editOps, OpTypes } from "../player.ts";
import { ctx } from "./context.ts";
import { renderCounter, speed } from "./controls.ts";
import { $, sleep } from "./dom.ts";
import { show } from "./explorer.ts";
import { renderFeed } from "./feed.ts";
import { editor, modelFor, monaco } from "./monaco.ts";

const TICK_MS = 16;
const DELETE_MS = 400;
const FADE_MS = 1500;

// Read through a function: the controls flip it while an animation awaits, which TypeScript cannot see.
const skipping = () => ctx.skip;

function banner(text: string | null) {
  $("banner").hidden = !text;
  $("banner").textContent = text ?? "";
}

async function waitWhilePaused() {
  while (ctx.paused && !skipping()) await sleep(50);
}

async function animate(ev: StreamEvent & { file: string }) {
  const model = modelFor(ev.file);
  show(ev.file);
  banner(null);
  if (ev.before !== undefined) model.setValue(ev.before ?? "");
  let marks: string[] = [];
  for (const op of editOps(ev)) {
    if (skipping()) break;
    if (op.type === OpTypes.ReplaceAll) {
      if (op.text == null) banner("File too large or content unavailable: this edit is not shown.");
      else model.setValue(op.text);
      continue;
    }
    if (op.type === OpTypes.HighlightDelete) {
      if (op.start === op.end) continue;
      const range = monaco.Range.fromPositions(model.getPositionAt(op.start), model.getPositionAt(op.end));
      editor().revealRangeInCenterIfOutsideViewport(range);
      const del = model.deltaDecorations([], [{ range, options: { inlineClassName: "del-mark" } }]);
      await sleep(DELETE_MS / Math.sqrt(speed()));
      await waitWhilePaused();
      model.deltaDecorations(del, []);
      model.applyEdits([{ range, text: "" }]);
      continue;
    }
    let offset = op.at;
    let typed = 0;
    while (typed < op.text.length && !skipping()) {
      await waitWhilePaused();
      const chunk = op.text.slice(typed, typed + charsPerTick(ctx.queue.length, speed()));
      model.applyEdits([{ range: monaco.Range.fromPositions(model.getPositionAt(offset)), text: chunk }]);
      typed += chunk.length;
      offset += chunk.length;
      const end = model.getPositionAt(offset);
      marks = model.deltaDecorations(marks, [
        {
          range: monaco.Range.fromPositions(model.getPositionAt(op.at), end),
          options: { inlineClassName: "add-mark" },
        },
        { range: monaco.Range.fromPositions(end), options: { beforeContentClassName: "caret-mark" } },
      ]);
      editor().revealPositionInCenterIfOutsideViewport(end);
      await sleep(TICK_MS);
    }
  }
  if (ev.after !== undefined && model.getValue() !== ev.after) model.setValue(ev.after);
  // an older event may have arrived late: finish on the file's latest known content
  const latest = ctx.state.files.get(ev.file)?.content;
  const moreForFile = ctx.queue.some((q) => q.file === ev.file);
  if (!ctx.replaying && latest != null && !moreForFile && model.getValue() !== latest) model.setValue(latest);
  const done = marks;
  setTimeout(() => {
    if (!model.isDisposed()) model.deltaDecorations(done, []);
  }, FADE_MS);
}

export async function replay(eventId: string): Promise<void> {
  const ev = ctx.state.events.get(eventId);
  if (!ev?.file || ctx.replaying) return;
  const file = ev.file;
  ctx.replaying = true;
  const wasPaused = ctx.paused;
  ctx.paused = false;
  ctx.skip = false;
  ctx.playingId = ev.id;
  renderFeed((id) => void replay(id));
  try {
    await animate({ ...ev, file });
  } finally {
    const current = ctx.state.files.get(file)?.content;
    if (current != null) modelFor(file).setValue(current);
    ctx.paused = wasPaused;
    ctx.replaying = false;
  }
}

// Fallback after a failed animation; must never throw, or the play loop would stop for good.
function showFinalContent(file: string, after: string | undefined) {
  try {
    if (after !== undefined) modelFor(file).setValue(after);
  } catch (e) {
    console.error(e);
  }
}

export async function playLoop(): Promise<never> {
  for (;;) {
    const ev = ctx.paused || ctx.replaying ? undefined : ctx.queue.shift();
    if (!ev) {
      await sleep(50);
      continue;
    }
    if (ev.session_id !== ctx.sessionId || !ev.file) continue;
    const file = ev.file;
    ctx.playingId = ev.id;
    ctx.skip = false;
    renderFeed((id) => void replay(id));
    renderCounter();
    try {
      await animate({ ...ev, file });
    } catch (e) {
      console.error(e);
      showFinalContent(file, ev.after);
    }
    ctx.played++;
    renderCounter();
  }
}
