// Fills in, after the fact, the explanation and steps of events whose transcript was not written yet.
import { needsPatch, resolvePatch } from "../core/event.ts";
import type { Patch, StreamEvent } from "../core/protocol.ts";
import { readTranscriptTail } from "../node/tail.ts";

const GIVE_UP_MS = 120_000;

export interface Enricher {
  track(events: StreamEvent[]): void;
  // Patches found on this tick; events older than GIVE_UP_MS are dropped.
  tick(): Patch[];
  // For /history: immediate attempt on events still incomplete.
  resolveNow(events: StreamEvent[]): Patch[];
}

export function createEnricher({
  readTail = readTranscriptTail,
  now = Date.now,
}: { readTail?: (path: string) => string; now?: () => number } = {}): Enricher {
  const pending = new Map<string, { ev: StreamEvent; since: number }>();

  const tryResolve = (evs: StreamEvent[]): Patch[] => {
    const cache = new Map<string, string>();
    const read = (path: string): string => {
      let text = cache.get(path);
      if (text === undefined) {
        try {
          text = readTail(path);
        } catch {
          text = "";
        }
        cache.set(path, text);
      }
      return text;
    };
    return evs.flatMap((ev) => resolvePatch(ev, read(ev.transcript ?? "")) ?? []);
  };

  return {
    track(events) {
      for (const ev of events) if (needsPatch(ev) && !pending.has(ev.id)) pending.set(ev.id, { ev, since: now() });
    },
    tick() {
      const patches = tryResolve([...pending.values()].map((p) => p.ev));
      for (const p of patches) pending.delete(p.id);
      for (const [id, p] of pending) if (now() - p.since > GIVE_UP_MS) pending.delete(id);
      return patches;
    },
    resolveNow: (events) => tryResolve(events.filter(needsPatch)),
  };
}
