import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { fixture } from "./helpers.ts";

const script = fileURLToPath(new URL("../src/hooks/capture.ts", import.meta.url));
const run = (input: string, dir: string) =>
  spawnSync(process.execPath, ["--no-warnings", script], {
    input,
    env: { ...process.env, VIBING_TV_DATA_DIR: dir },
    encoding: "utf8",
    cwd: fileURLToPath(new URL("..", import.meta.url)),
  });

test("an Edit payload is appended to its session file, silently", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibing-tv-"));
  const r = run(fixture("posttooluse-edit.json"), dir);
  expect(r.status).toBe(0);
  expect(r.stdout).toBe("");
  expect(r.stderr).toBe("");
  const sid = (JSON.parse(fixture("posttooluse-edit.json")) as { session_id: string }).session_id;
  const lines = readFileSync(join(dir, "sessions", `${sid}.jsonl`), "utf8")
    .trim()
    .split("\n");
  expect(lines.length).toBe(1);
  expect((JSON.parse(lines[0] ?? "") as { kind: string }).kind).toBe("edit");
});

test("garbage on stdin exits 0 and writes nothing", () => {
  const dir = mkdtempSync(join(tmpdir(), "vibing-tv-"));
  const r = run("not json", dir);
  expect(r.status).toBe(0);
  expect(r.stdout + r.stderr).toBe("");
  expect(existsSync(join(dir, "sessions")) ? readdirSync(join(dir, "sessions")).length : 0).toBe(0);
});
