import { expect, test } from "vitest";
import { explanationFor, hasToolUse, lastTurnText, parseChecklist } from "../src/core/transcript.ts";
import { fixtureJson, transcript } from "./helpers.ts";

type Payload = { tool_use_id: string };
const writeId = fixtureJson<Payload>("posttooluse-write-create.json").tool_use_id;
const silentEditId = fixtureJson<Payload>("posttooluse-edit.json").tool_use_id;
const textEditId = fixtureJson<Payload>("posttooluse-edit-with-text.json").tool_use_id;
const jsonl = (lines: object[]) => lines.map((l) => JSON.stringify(l)).join("\n");

test("text written just before a tool call is its explanation", () => {
  const e = explanationFor(transcript(), writeId);
  expect(e?.text).toMatch(/^I don't have a task list tool/);
  expect(e?.key.length).toBeGreaterThan(0);
});

test("tool calls chained after one sentence all get that sentence, with the same key", () => {
  const first = explanationFor(transcript(), writeId);
  expect(explanationFor(transcript(), silentEditId)).toEqual(first);
});

test("the explanation never reaches back past the user's prompt", () => {
  const lines = jsonl([
    { type: "assistant", uuid: "a0", message: { content: [{ type: "text", text: "Previous turn." }] } },
    { type: "user", uuid: "u1", message: { role: "user", content: "next request" } },
    { type: "assistant", uuid: "a1", message: { content: [{ type: "tool_use", id: "t1", name: "Write" }] } },
  ]);
  expect(explanationFor(lines, "t1")).toBeNull();
});

test("hasToolUse tells whether the call is already in the transcript", () => {
  expect(hasToolUse(transcript(), writeId)).toBe(true);
  expect(hasToolUse(transcript(), "toolu_nope")).toBe(false);
});

test("unknown tool id gives null", () => {
  expect(explanationFor(transcript(), "toolu_nope")).toBeNull();
});

test("a truncated last line does not throw", () => {
  const t = transcript() + '{"type":"assistant","message":{"content":[{"ty';
  expect(explanationFor(t, textEditId)?.text).toMatch(/^- \[x\] 1\./);
});

test("two tool calls after the same text share its key", () => {
  const lines = jsonl([
    { type: "user", uuid: "u1", message: { role: "user", content: "go" } },
    { type: "assistant", uuid: "a1", message: { content: [{ type: "text", text: "Plan." }] } },
    { type: "assistant", uuid: "a2", message: { content: [{ type: "tool_use", id: "t1", name: "Write" }] } },
    { type: "assistant", uuid: "a3", message: { content: [{ type: "tool_use", id: "t2", name: "Edit" }] } },
  ]);
  const a = explanationFor(lines, "t1");
  const b = explanationFor(lines, "t2");
  expect(a?.key).toBe("a1");
  expect(a).toEqual(b);
});

test("thinking blocks are never part of an explanation", () => {
  const lines = jsonl([
    { type: "assistant", uuid: "a0", message: { content: [{ type: "thinking", thinking: "secret" }] } },
    { type: "assistant", uuid: "a1", message: { content: [{ type: "tool_use", id: "t1", name: "Write" }] } },
  ]);
  expect(explanationFor(lines, "t1")).toBeNull();
});

test("lastTurnText returns the assistant text after the last user line", () => {
  expect(lastTurnText(transcript())).toMatch(/^All three steps are done/);
});

test("parseChecklist keeps the last checklist and marks the first open item in progress", () => {
  expect(parseChecklist("intro\n- [x] a\n- [ ] b\n* [ ] c")).toEqual([
    { content: "a", status: "completed" },
    { content: "b", status: "in_progress" },
    { content: "c", status: "pending" },
  ]);
  expect(parseChecklist("- [ ] old\n\nthen\n- [X] new")).toEqual([{ content: "new", status: "completed" }]);
  expect(parseChecklist("nothing")).toBeNull();
});
