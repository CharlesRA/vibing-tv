import { expect, test } from "vitest";
import { isSensitive } from "../src/core/sensitive.ts";

test("secrets and keys are sensitive", () => {
  for (const p of ["/a/.env", "/a/.env.local", "/a/cert.pem", "/a/x.key", "/a/x.p12", "/home/u/.ssh/id_rsa.pub"]) {
    expect(isSensitive(p), p).toBe(true);
  }
});

test("ordinary source files are not sensitive", () => {
  for (const p of ["/a/env.ts", "/a/keyboard.ts", "/a/notes.md"]) {
    expect(isSensitive(p), p).toBe(false);
  }
});
