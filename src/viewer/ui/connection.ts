// Sessions, history and the live SSE stream.
import { SSE_EVENT, type Patch, type SessionSummary, type StreamEvent } from "../../core/protocol.ts";
import { dayjs } from "../../core/time.ts";
import { applyEvent, applyPatch, hydrate } from "../model.ts";
import { ctx } from "./context.ts";
import { renderCounter } from "./controls.ts";
import { $ } from "./dom.ts";
import { replay } from "./editor.ts";
import { renderFiles, renderTabs, show } from "./explorer.ts";
import { renderFeed } from "./feed.ts";
import { modelFor, resetModels } from "./monaco.ts";
import { renderSteps } from "./steps.ts";

const onReplay = (id: string) => void replay(id);

export function renderAll(): void {
  renderFiles();
  renderTabs();
  renderSteps();
  renderFeed(onReplay);
  renderCounter();
}

async function json<T>(path: string): Promise<T> {
  const r = await fetch(path);
  return (await r.json()) as T;
}

const history = (id: string) => json<StreamEvent[]>(`/history?session=${encodeURIComponent(id)}`);

export async function renderSessions(): Promise<SessionSummary[]> {
  const sessions = await json<SessionSummary[]>("/sessions");
  $("session").replaceChildren(
    ...sessions.map((s) => {
      const o = document.createElement("option");
      o.value = s.session_id;
      o.textContent = `${s.cwd ?? "?"} · ${s.last_ts ? dayjs(s.last_ts).format("YYYY-MM-DD HH:mm") : ""}`;
      o.selected = s.session_id === ctx.sessionId;
      return o;
    }),
  );
  return sessions;
}

// Applies a new event of the current session and queues file events for typing, sorted by ts
// (hooks can deliver out of order).
function enqueue(ev: StreamEvent): void {
  if (ctx.state.events.has(ev.id)) return;
  ctx.state = applyEvent(ctx.state, ev);
  if (!ev.file) return;
  const at = ctx.queue.findIndex((q) => q.ts > ev.ts);
  if (at === -1) ctx.queue.push(ev);
  else ctx.queue.splice(at, 0, ev);
}

// `before`: when a live event switches the view to its session, hydrate only what precedes it,
// so that this event and the next ones are animated.
export async function openSession(id: string | null, before: StreamEvent | null = null): Promise<void> {
  ctx.sessionId = id;
  ctx.queue = [];
  resetModels();
  ctx.activeFile = null;
  $("empty").hidden = false;
  const events = id ? await history(id) : [];
  // live events of this session that arrived while the history was loading
  const arrived = ctx.queue;
  ctx.queue = [];
  ctx.state = hydrate(before ? events.filter((e) => e.ts < before.ts && e.id !== before.id) : events);
  for (const file of ctx.state.order) modelFor(file).setValue(ctx.state.files.get(file)?.content ?? "");
  ctx.played = [...ctx.state.events.values()].filter((e) => e.file).length;
  // `before` and everything after it are played like live events, in time order
  const later = before ? [...events.filter((e) => !ctx.state.events.has(e.id)), before] : [];
  for (const ev of [...later, ...arrived].sort((x, y) => x.ts.localeCompare(y.ts))) enqueue(ev);
  const last = [...ctx.state.events.values()].reverse().find((e) => e.file);
  if (last?.file) show(last.file);
  ctx.playingId = null;
  renderAll();
  await renderSessions();
}

function onEvent(ev: StreamEvent): void {
  if (ev.session_id !== ctx.sessionId) {
    if (!ctx.pinnedByUser) {
      void openSession(ev.session_id, ev).then(() => {
        onEvent(ev);
      });
    } else {
      void renderSessions();
    }
    return;
  }
  enqueue(ev);
  renderAll();
}

export function connect(): void {
  const source = new EventSource("/events");
  source.onopen = async () => {
    $("status").classList.add("ok");
    // silently catch up on what was missed during a disconnection (not animated)
    if (!ctx.sessionId) return;
    const touched = new Set<string>();
    for (const ev of await history(ctx.sessionId)) {
      if (ctx.state.events.has(ev.id)) continue;
      ctx.state = applyEvent(ctx.state, ev);
      if (!ev.file) continue;
      touched.add(ev.file);
      ctx.played++;
    }
    // missed events may have finished out of order: show each file's latest content, as the model knows it
    for (const file of touched) {
      if (ctx.queue.some((q) => q.file === file)) continue;
      modelFor(file).setValue(ctx.state.files.get(file)?.content ?? "");
    }
    renderAll();
  };
  source.onerror = () => {
    $("status").classList.remove("ok");
  };
  source.addEventListener(SSE_EVENT.event, (m) => {
    onEvent(JSON.parse((m as MessageEvent<string>).data) as StreamEvent);
  });
  source.addEventListener(SSE_EVENT.patch, (m) => {
    const patch = JSON.parse((m as MessageEvent<string>).data) as Patch;
    if (patch.session_id !== ctx.sessionId) return;
    ctx.state = applyPatch(ctx.state, patch);
    renderSteps();
    renderFeed(onReplay);
  });
}
