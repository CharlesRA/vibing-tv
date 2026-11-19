import { expect, test } from "vitest";
import { buildEvent, type EventIO } from "../src/core/event.ts";
import { fixtureJson, transcript } from "./helpers.ts";

const io: EventIO = { readTranscriptTail: () => transcript() };

test("a created file has no before and its content as after", () => {
  const p = fixtureJson<{ tool_input: { content: string }; tool_use_id: string }>("posttooluse-write-create.json");
  const ev = buildEvent(p, io);
  expect(ev?.kind).toBe("write");
  expect(ev?.before).toBeNull();
  expect(ev?.after).toBe(p.tool_input.content);
  expect(ev?.id).toBe(p.tool_use_id);
  expect(ev?.file).toBe("/work/demo/notes.md");
});

test("an edit carries the file before and after", () => {
  const ev = buildEvent(fixtureJson("posttooluse-edit.json"), io);
  expect(ev?.kind).toBe("edit");
  expect(ev?.before).toBe("alpha\nbeta\ngamma\n");
  expect(ev?.after).toBe("alpha\nBETA\ngamma\n");
  expect(ev?.edit).toEqual({ old_string: "beta", new_string: "BETA", replace_all: false });
  expect(ev?.explanation?.text).toMatch(/^I don't have a task list tool/);
});

test("an edit preceded by a checklist carries the todos", () => {
  const ev = buildEvent(fixtureJson("posttooluse-edit-with-text.json"), io);
  expect(ev?.explanation?.text).toMatch(/^- \[x\] 1\./);
  expect(ev?.todos?.map((t) => t.status)).toEqual(["completed", "completed", "in_progress"]);
});

const editPayload = (originalFile: string | undefined, replace_all: boolean) => ({
  hook_event_name: "PostToolUse",
  session_id: "s",
  cwd: "/w",
  tool_name: "Edit",
  tool_use_id: "t",
  transcript_path: "x",
  tool_input: { file_path: "/w/f.txt", old_string: "x", new_string: "y", replace_all },
  tool_response: { originalFile },
});

test("replace_all replaces every occurrence, otherwise only the first", () => {
  expect(buildEvent(editPayload("a x a x", true), io)?.after).toBe("a y a y");
  expect(buildEvent(editPayload("a x a x", false), io)?.after).toBe("a y a x");
});

test("an edit without originalFile is marked truncated", () => {
  const ev = buildEvent(editPayload(undefined, false), io);
  expect(ev?.truncated).toBe(true);
  expect(ev?.before).toBeUndefined();
  expect(ev?.after).toBeUndefined();
});

test("sensitive files produce no event", () => {
  const p = editPayload("K=1", false);
  p.tool_input.file_path = "/w/.env";
  expect(buildEvent(p, io)).toBeNull();
});

test("files over 1 MB are truncated", () => {
  const ev = buildEvent(editPayload("x" + " ".repeat(1_000_001), false), io);
  expect(ev?.truncated).toBe(true);
  expect(ev?.before).toBeUndefined();
  expect(ev?.after).toBeUndefined();
});

test("Stop with a checklist in the last turn gives a todos event", () => {
  const ev = buildEvent({ hook_event_name: "Stop", session_id: "s", cwd: "/w", transcript_path: "x" }, io);
  expect(ev?.kind).toBe("todos");
  expect(ev?.todos?.length).toBe(3);
  expect(ev?.todos?.every((t) => t.status === "completed")).toBe(true);
});

test("Stop without a checklist yet leaves the steps for the server to fill in", () => {
  const plain: EventIO = {
    readTranscriptTail: () =>
      JSON.stringify({ type: "assistant", uuid: "a", message: { content: [{ type: "text", text: "ok" }] } }),
  };
  const ev = buildEvent({ hook_event_name: "Stop", session_id: "s", cwd: "/w", transcript_path: "x" }, plain);
  expect(ev?.kind).toBe("todos");
  expect(ev?.todos).toBeUndefined();
  expect(ev?.transcript).toBe("x");
});
