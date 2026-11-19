import { appendFileSync, existsSync, mkdirSync, mkdtempSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { createStore } from "../src/server/store.ts";

const ev = (session_id: string, id: string, ts: string) => ({
  v: 1,
  id,
  ts,
  session_id,
  cwd: `/w/${session_id}`,
  kind: "edit",
});

function setup() {
  const dir = mkdtempSync(join(tmpdir(), "vibing-tv-store-"));
  mkdirSync(join(dir, "sessions"));
  const add = (e: { session_id: string }, raw?: string) => {
    appendFileSync(join(dir, "sessions", `${e.session_id}.jsonl`), raw ?? JSON.stringify(e) + "\n");
  };
  return { dir, add };
}

test("sessions are listed most recent first", () => {
  const { dir, add } = setup();
  add(ev("old", "1", "2026-11-18T10:00:00Z"));
  add(ev("new", "2", "2026-11-18T11:00:00Z"));
  add(ev("old", "3", "2026-11-18T09:00:00Z"));
  const list = createStore(dir).listSessions();
  expect(list.map((s) => [s.session_id, s.count])).toEqual([
    ["new", 1],
    ["old", 2],
  ]);
  expect(list[1]?.last_ts).toBe("2026-11-18T10:00:00Z");
  expect(list[0]?.cwd).toBe("/w/new");
});

test("history returns one session's events in order", () => {
  const { dir, add } = setup();
  add(ev("a", "1", "t1"));
  add(ev("b", "2", "t2"));
  add(ev("a", "3", "t3"));
  expect(
    createStore(dir)
      .history("a")
      .map((e) => e.id),
  ).toEqual(["1", "3"]);
});

test("poll returns only what was appended since the last poll", () => {
  const { dir, add } = setup();
  const store = createStore(dir);
  add(ev("a", "1", "t"));
  add(ev("b", "2", "t"));
  expect(store.poll().length).toBe(2);
  expect(store.poll().length).toBe(0);
  add(ev("a", "3", "t"));
  expect(store.poll().map((e) => e.id)).toEqual(["3"]);
});

test("a line without its newline waits until it is complete", () => {
  const { dir, add } = setup();
  const store = createStore(dir);
  const line = JSON.stringify(ev("a", "1", "t"));
  add({ session_id: "a" }, line.slice(0, 10));
  expect(store.poll().length).toBe(0);
  add({ session_id: "a" }, line.slice(10) + "\n");
  expect(store.poll().map((e) => e.id)).toEqual(["1"]);
});

test("invalid JSON lines are skipped", () => {
  const { dir, add } = setup();
  add({ session_id: "a" }, "{oops\n");
  add(ev("a", "1", "t"));
  expect(
    createStore(dir)
      .poll()
      .map((e) => e.id),
  ).toEqual(["1"]);
});

test("prune removes sessions older than the limit", () => {
  const { dir, add } = setup();
  add(ev("old", "1", "t"));
  add(ev("recent", "2", "t"));
  const day = 24 * 3600 * 1000;
  const old = (Date.now() - 8 * day) / 1000;
  const recent = (Date.now() - day) / 1000;
  utimesSync(join(dir, "sessions", "old.jsonl"), old, old);
  utimesSync(join(dir, "sessions", "recent.jsonl"), recent, recent);
  expect(createStore(dir).prune(7 * day)).toBe(1);
  expect(existsSync(join(dir, "sessions", "old.jsonl"))).toBe(false);
  expect(existsSync(join(dir, "sessions", "recent.jsonl"))).toBe(true);
});

test("an empty data dir works", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibing-tv-store-"));
  const store = createStore(dir);
  expect(store.listSessions()).toEqual([]);
  expect(store.poll()).toEqual([]);
  expect(store.history("nope")).toEqual([]);
});
