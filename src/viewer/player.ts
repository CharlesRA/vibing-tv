// Turns an event into animation operations, and paces the typing. No DOM.
import { EventKinds, type StreamEvent } from "../core/protocol.ts";

export const OpTypes = { Type: "type", HighlightDelete: "highlightDelete", ReplaceAll: "replaceAll" } as const;
export type Op =
  | { type: typeof OpTypes.Type; at: number; text: string }
  | { type: typeof OpTypes.HighlightDelete; start: number; end: number }
  | { type: typeof OpTypes.ReplaceAll; text: string | null };

export type OpsInput = Pick<StreamEvent, "kind"> &
  Partial<Pick<StreamEvent, "before" | "after" | "edit" | "truncated">>;

function occurrences(text: string, needle: string, all: boolean): number[] {
  const found: number[] = [];
  for (let i = text.indexOf(needle); i !== -1; i = text.indexOf(needle, i + needle.length)) {
    found.push(i);
    if (!all) break;
  }
  return found;
}

// Keeps only the part that really changes: Claude often includes identical context lines.
function trimCommon(a: string, b: string) {
  let p = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) p++;
  let s = 0;
  while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
  return { prefix: p, oldEnd: a.length - s, text: b.slice(p, b.length - s) };
}

export function editOps(ev: OpsInput): Op[] {
  if (ev.truncated) return [{ type: OpTypes.ReplaceAll, text: ev.after ?? null }];
  if (ev.kind === EventKinds.Write) {
    const after = ev.after ?? "";
    if (ev.before == null) return [{ type: OpTypes.Type, at: 0, text: after }];
    return [
      { type: OpTypes.HighlightDelete, start: 0, end: ev.before.length },
      { type: OpTypes.Type, at: 0, text: after },
    ];
  }
  const { old_string, new_string = "", replace_all = false } = ev.edit ?? {};
  const found = ev.before == null || !old_string ? [] : occurrences(ev.before, old_string, replace_all);
  if (!old_string || !found.length) return [{ type: OpTypes.ReplaceAll, text: ev.after ?? null }];
  const { prefix, oldEnd, text } = trimCommon(old_string, new_string);
  return found.reverse().flatMap((start): Op[] => [
    { type: OpTypes.HighlightDelete, start: start + prefix, end: start + oldEnd },
    { type: OpTypes.Type, at: start + prefix, text },
  ]);
}

export function charsPerTick(queueLength: number, base: number): number {
  return Math.min(base * 1000, base * 2 ** Math.min(queueLength, 10));
}
