// Viewer state, rebuilt from events. Pure: every call returns a new state.
import type { Patch, StreamEvent, Todo } from "../core/protocol.ts";

export interface FileState {
  content: string | null;
  status: "U" | "M";
  ts: string | null;
}
export interface FeedEntry {
  key: string;
  text: string | null;
  ts: string;
  items: { eventId: string; file: string }[];
}
export interface State {
  files: Map<string, FileState>;
  order: string[];
  feed: FeedEntry[];
  todos: Todo[] | null;
  events: Map<string, StreamEvent>;
}

export function emptyState(): State {
  return { files: new Map(), order: [], feed: [], todos: null, events: new Map() };
}

const byTs = (a: StreamEvent, b: StreamEvent) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0);

// Feed and steps derive from the events: an explanation that arrives late (a patch) regroups the feed by itself.
function derive(state: State): State {
  const sorted = [...state.events.values()].sort(byTs);
  const feed: FeedEntry[] = [];
  const byKey = new Map<string, FeedEntry>();
  let todos: Todo[] | null = null;
  for (const ev of sorted) {
    if (ev.todos) todos = ev.todos;
    if (!ev.file) continue;
    const key = ev.explanation?.key ?? ev.id;
    const item = { eventId: ev.id, file: ev.file };
    const existing = byKey.get(key);
    if (existing) existing.items.push(item);
    else {
      const entry: FeedEntry = { key, text: ev.explanation?.text ?? null, ts: ev.ts, items: [item] };
      byKey.set(key, entry);
      feed.push(entry);
    }
  }
  return { ...state, feed, todos };
}

// Events can arrive out of order: `ts` (taken when the hook starts) decides.
function withFile(state: State, ev: StreamEvent & { file: string }): State {
  const prev = state.files.get(ev.file);
  const newer = !prev || prev.ts == null || ev.ts >= prev.ts;
  const files = new Map(state.files);
  const createdNow = ev.kind === "write" && ev.before === null;
  files.set(ev.file, {
    content: newer ? (ev.after ?? prev?.content ?? null) : prev.content,
    status: prev ? (createdNow && !newer ? "U" : prev.status) : createdNow ? "U" : "M",
    ts: newer ? ev.ts : prev.ts,
  });
  const order = prev ? state.order : [...state.order, ev.file];
  return { ...state, files, order };
}

const hasFile = (ev: StreamEvent): ev is StreamEvent & { file: string } => !!ev.file;

export function applyEvent(state: State, ev: StreamEvent): State {
  if (state.events.has(ev.id)) return state;
  const next = hasFile(ev) && ev.kind !== "todos" ? withFile(state, ev) : { ...state };
  next.events = new Map(state.events).set(ev.id, ev);
  return derive(next);
}

// Late patch from the server: explanation and/or steps for an event already received.
export function applyPatch(state: State, patch: Patch): State {
  const ev = state.events.get(patch.id);
  if (!ev) return state;
  const events = new Map(state.events).set(patch.id, { ...ev, ...patch });
  return derive({ ...state, events });
}

export const hydrate = (events: StreamEvent[]): State => events.reduce(applyEvent, emptyState());
