import { expect, test } from "vitest";
import { charsPerTick, editOps, type OpsInput } from "../src/viewer/player.ts";

const edit = (before: string, old_string: string, new_string: string, replace_all = false): OpsInput => ({
  kind: "edit",
  before,
  edit: { old_string, new_string, replace_all },
});

test("an edit highlights then deletes the old text and types the new one", () => {
  expect(editOps(edit("a\nOLD\nb", "OLD", "NEW"))).toEqual([
    { type: "highlightDelete", start: 2, end: 5 },
    { type: "type", at: 2, text: "NEW" },
  ]);
});

test("replace_all animates each occurrence, rightmost first", () => {
  expect(editOps(edit("x-x", "x", "yy", true))).toEqual([
    { type: "highlightDelete", start: 2, end: 3 },
    { type: "type", at: 2, text: "yy" },
    { type: "highlightDelete", start: 0, end: 1 },
    { type: "type", at: 0, text: "yy" },
  ]);
});

test("a new file is typed from the start", () => {
  expect(editOps({ kind: "write", before: null, after: "hello" })).toEqual([{ type: "type", at: 0, text: "hello" }]);
});

test("an overwritten file is cleared then retyped", () => {
  expect(editOps({ kind: "write", before: "old", after: "new" })).toEqual([
    { type: "highlightDelete", start: 0, end: 3 },
    { type: "type", at: 0, text: "new" },
  ]);
});

test("unknown before or truncated content falls back to a full replace", () => {
  expect(
    editOps({ kind: "edit", before: null, after: "z", edit: { old_string: "a", new_string: "z", replace_all: false } }),
  ).toEqual([{ type: "replaceAll", text: "z" }]);
  expect(editOps({ kind: "edit", truncated: true })).toEqual([{ type: "replaceAll", text: null }]);
});

test("old text missing from before falls back to a full replace", () => {
  expect(editOps({ ...edit("abc", "zzz", "y"), after: "abc2" })).toEqual([{ type: "replaceAll", text: "abc2" }]);
});

test("typing speeds up as the queue grows, within a bound", () => {
  expect(charsPerTick(0, 2)).toBe(2);
  expect(charsPerTick(5, 2)).toBeGreaterThan(charsPerTick(1, 2));
  expect(charsPerTick(1000, 2)).toBeLessThanOrEqual(2000);
});

test("unchanged context around an edit is neither deleted nor retyped", () => {
  const before = "a\n  keep;\nz";
  expect(editOps(edit(before, "  keep;\n", "  keep;\n  added;\n"))).toEqual([
    { type: "highlightDelete", start: 10, end: 10 },
    { type: "type", at: 10, text: "  added;\n" },
  ]);
  expect(editOps(edit("let x = 1;", "x = 1", "x = 42"))).toEqual([
    { type: "highlightDelete", start: 8, end: 9 },
    { type: "type", at: 8, text: "42" },
  ]);
});
