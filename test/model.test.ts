import { expect, test } from "vitest";
import type { StreamEvent } from "../src/core/protocol.ts";
import { applyEvent, emptyState, hydrate } from "../src/viewer/model.ts";

let n = 0;
const ev = (over: Partial<StreamEvent>): StreamEvent =>
  ({
    v: 1,
    id: `e${String(++n)}`,
    ts: `2026-11-18T10:00:${String(n).padStart(2, "0")}Z`,
    session_id: "s",
    cwd: "/w",
    agent: null,
    explanation: null,
    ...over,
  }) as StreamEvent;
const write = (file: string, after: string, over: Partial<StreamEvent> = {}) =>
  ev({ kind: "write", file, before: null, after, ...over });
const edit = (file: string, before: string, after: string, over: Partial<StreamEvent> = {}) =>
  ev({ kind: "edit", file, before, after, edit: { old_string: "x", new_string: "y", replace_all: false }, ...over });

test("a created then edited file holds its latest content and stays new", () => {
  const s = hydrate([write("/w/a.js", "1"), edit("/w/a.js", "1", "2")]);
  const f = s.files.get("/w/a.js");
  expect({ content: f?.content, status: f?.status }).toEqual({ content: "2", status: "U" });
  expect(s.order).toEqual(["/w/a.js"]);
});

test("a file first seen through an edit is modified", () => {
  const s = hydrate([edit("/w/b.js", "old", "new")]);
  expect(s.files.get("/w/b.js")?.status).toBe("M");
});

test("events sharing an explanation key form one feed entry", () => {
  const e1 = write("/w/a.js", "1", { explanation: { key: "k", text: "Plan." } });
  const e2 = write("/w/b.js", "2", { explanation: { key: "k", text: "Plan." } });
  const s = hydrate([e1, e2]);
  expect(s.feed.length).toBe(1);
  expect(s.feed[0]?.text).toBe("Plan.");
  expect(s.feed[0]?.items).toEqual([
    { eventId: e1.id, file: "/w/a.js" },
    { eventId: e2.id, file: "/w/b.js" },
  ]);
});

test("an event without explanation gets its own entry with null text", () => {
  const s = hydrate([write("/w/a.js", "1"), write("/w/b.js", "2")]);
  expect(s.feed.length).toBe(2);
  expect(s.feed[0]?.text).toBeNull();
});

test("todos come from the latest event that carries them", () => {
  expect(hydrate([write("/w/a.js", "1")]).todos).toBeNull();
  const todos = [{ content: "a", status: "in_progress" as const }];
  const done = [{ content: "a", status: "completed" as const }];
  const s = hydrate([write("/w/a.js", "1", { todos }), ev({ kind: "todos", todos: done })]);
  expect(s.todos).toEqual(done);
  expect(s.feed.length, "a todos-only event adds no feed entry").toBe(1);
});

test("a truncated event keeps the previous content", () => {
  const s = hydrate([write("/w/a.js", "1"), ev({ kind: "edit", file: "/w/a.js", truncated: true })]);
  expect(s.files.get("/w/a.js")?.content).toBe("1");
});

test("the same event applied twice is ignored the second time", () => {
  const e = write("/w/a.js", "1");
  const s1 = hydrate([e]);
  expect(applyEvent(s1, e)).toBe(s1);
});

test("applyEvent does not mutate the previous state", () => {
  const s0 = emptyState();
  const s1 = applyEvent(s0, write("/w/a.js", "1"));
  expect(s0.files.size).toBe(0);
  expect(s0.feed.length).toBe(0);
  expect(s0.events.size).toBe(0);
  expect(s1.files.size).toBe(1);
});

test("events arriving out of order still leave each file at its latest content", () => {
  const first = edit("/w/a.js", "0", "1", { ts: "2026-11-18T11:00:01Z" });
  const second = edit("/w/a.js", "1", "2", { ts: "2026-11-18T11:00:02Z" });
  const s = hydrate([second, first]);
  expect(s.files.get("/w/a.js")?.content).toBe("2");
});

test("the feed stays in time order whatever the arrival order", () => {
  const a = write("/w/a.js", "1", { ts: "2026-11-18T12:00:01Z", explanation: { key: "ka", text: "A" } });
  const b = write("/w/b.js", "2", { ts: "2026-11-18T12:00:02Z", explanation: { key: "kb", text: "B" } });
  expect(hydrate([b, a]).feed.map((f) => f.text)).toEqual(["A", "B"]);
});
