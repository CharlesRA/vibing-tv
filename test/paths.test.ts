import { homedir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { dataDir, sessionFile } from "../src/node/paths.ts";

test("VIBING_TV_DATA_DIR wins, CLAUDE_PLUGIN_DATA is ignored", () => {
  expect(dataDir({ VIBING_TV_DATA_DIR: "/s", CLAUDE_PLUGIN_DATA: "/c" })).toBe("/s");
  expect(dataDir({ CLAUDE_PLUGIN_DATA: "/c" })).toBe(join(homedir(), ".vibing-tv"));
  expect(dataDir({})).toBe(join(homedir(), ".vibing-tv"));
});

test("session ids cannot escape the sessions directory", () => {
  expect(sessionFile("/d", "abc-123_X")).toBe(join("/d", "sessions", "abc-123_X.jsonl"));
  expect(sessionFile("/d", "../../etc/passwd")).toBe(join("/d", "sessions", "etcpasswd.jsonl"));
});
