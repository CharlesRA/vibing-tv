import { closeSync, fstatSync, openSync, readSync } from "node:fs";

const TAIL_BYTES = 512 * 1024;

// The last 512 KB of the transcript: enough for the current turn without rereading the whole history.
export function readTranscriptTail(path: string): string {
  const fd = openSync(path, "r");
  try {
    const size = fstatSync(fd).size;
    const length = Math.min(size, TAIL_BYTES);
    const buf = Buffer.alloc(length);
    readSync(fd, buf, 0, length, size - length);
    return buf.toString("utf8");
  } finally {
    closeSync(fd);
  }
}
