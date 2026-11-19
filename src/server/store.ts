// Session logs (<data>/sessions/<id>.jsonl), read incrementally by offset. Late patches live in <id>.patches.
import {
  appendFileSync,
  closeSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  readSync,
  rmSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import type { Patch, SessionSummary, StreamEvent } from "../core/protocol.ts";
import { safeId } from "../node/paths.ts";

export interface Store {
  listSessions(): SessionSummary[];
  history(sessionId: string): StreamEvent[];
  addPatch(patch: Patch): void;
  poll(): StreamEvent[];
  prune(maxAgeMs: number): number;
}

// Complete lines only: a line still being written waits for its newline.
function parseComplete(text: string): { items: unknown[]; consumed: number } {
  const end = text.lastIndexOf("\n");
  const items: unknown[] = [];
  for (const line of text.slice(0, end + 1).split("\n")) {
    if (!line.trim()) continue;
    try {
      items.push(JSON.parse(line));
    } catch {
      // invalid line: skipped
    }
  }
  return { items, consumed: Buffer.byteLength(text.slice(0, end + 1)) };
}

function readFrom(file: string, offset: number): string {
  const fd = openSync(file, "r");
  try {
    const size = statSync(file).size;
    if (size <= offset) return "";
    const buf = Buffer.alloc(size - offset);
    readSync(fd, buf, 0, buf.length, offset);
    return buf.toString("utf8");
  } finally {
    closeSync(fd);
  }
}

export function createStore(dataDir: string): Store {
  const dir = join(dataDir, "sessions");
  const offsets = new Map<string, number>();
  const patchFile = (sessionId: string) => join(dir, `${safeId(sessionId)}.patches`);

  const withPatches = (sessionId: string, events: StreamEvent[]): StreamEvent[] => {
    let patches: Patch[] = [];
    try {
      patches = parseComplete(readFileSync(patchFile(sessionId), "utf8")).items as Patch[];
    } catch {
      // no patches yet
    }
    if (!patches.length) return events;
    const byId = new Map(patches.map((p) => [p.id, p]));
    return events.map((e) => ({ ...e, ...byId.get(e.id) }));
  };

  const files = (): string[] => {
    try {
      return readdirSync(dir).filter((f) => f.endsWith(".jsonl"));
    } catch {
      return [];
    }
  };

  const readAll = (file: string): StreamEvent[] => {
    try {
      return parseComplete(readFileSync(join(dir, file), "utf8")).items as StreamEvent[];
    } catch {
      return [];
    }
  };

  return {
    listSessions() {
      return files()
        .map((f): SessionSummary => {
          const events = readAll(f);
          const last_ts = events.reduce<string | null>((max, e) => (e.ts > (max ?? "") ? e.ts : max), null);
          return { session_id: f.slice(0, -6), cwd: events.at(-1)?.cwd ?? null, last_ts, count: events.length };
        })
        .filter((s) => s.count > 0)
        .sort((a, b) => String(b.last_ts).localeCompare(String(a.last_ts)));
    },

    history(sessionId) {
      const f = `${safeId(sessionId)}.jsonl`;
      return files().includes(f) ? withPatches(sessionId, readAll(f)) : [];
    },

    addPatch(patch) {
      mkdirSync(dir, { recursive: true });
      appendFileSync(patchFile(patch.session_id), JSON.stringify(patch) + "\n");
    },

    poll() {
      const out: StreamEvent[] = [];
      for (const f of files()) {
        const offset = offsets.get(f) ?? 0;
        const { items, consumed } = parseComplete(readFrom(join(dir, f), offset));
        offsets.set(f, offset + consumed);
        out.push(...(items as StreamEvent[]));
      }
      return out;
    },

    prune(maxAgeMs) {
      let removed = 0;
      for (const f of files()) {
        const p = join(dir, f);
        if (Date.now() - statSync(p).mtimeMs > maxAgeMs) {
          rmSync(p);
          rmSync(patchFile(f.slice(0, -6)), { force: true });
          offsets.delete(f);
          removed++;
        }
      }
      return removed;
    },
  };
}
