// Tolerant reader for Claude Code's JSONL transcript: one line per content block.
import { TodoStatuses, type Explanation, type Todo } from "./protocol.ts";

// Line and content-block types of the transcript that matter here; every other kind is ignored.
const EntryTypes = { Assistant: "assistant", User: "user" } as const;
const BlockTypes = { Text: "text", ToolUse: "tool_use", ToolResult: "tool_result" } as const;

interface Block {
  type?: string;
  text?: string;
  id?: string;
}
interface Entry {
  type?: string;
  uuid?: string;
  message?: { id?: string; content?: unknown };
}

function parseLines(text: string): Entry[] {
  const entries: Entry[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      const parsed: unknown = JSON.parse(line);
      if (parsed && typeof parsed === "object") entries.push(parsed);
    } catch {
      // partial or unreadable line: skipped
    }
  }
  return entries;
}

const blocks = (entry: Entry): Block[] => {
  const content = entry.message?.content;
  return Array.isArray(content) ? (content as Block[]) : [];
};
const isToolResult = (entry: Entry) =>
  blocks(entry).length > 0 && blocks(entry).every((b) => b.type === BlockTypes.ToolResult);
const findToolUse = (entries: Entry[], toolUseId: string) =>
  entries.findIndex(
    (e) =>
      e.type === EntryTypes.Assistant && blocks(e).some((b) => b.type === BlockTypes.ToolUse && b.id === toolUseId),
  );
const textOf = (entry: Entry): string[] =>
  blocks(entry).flatMap((b) => (b.type === BlockTypes.Text && b.text ? [b.text] : []));

export const hasToolUse = (transcriptText: string, toolUseId: string): boolean =>
  findToolUse(parseLines(transcriptText), toolUseId) !== -1;

// The assistant's last text before this call, within the current turn: tool results are crossed
// (Claude often announces several edits in one sentence), the user's prompt never is.
export function explanationFor(transcriptText: string, toolUseId: string): Explanation | null {
  const entries = parseLines(transcriptText);
  const at = findToolUse(entries, toolUseId);
  if (at === -1) return null;
  for (let i = at - 1; i >= 0; i--) {
    const e = entries[i];
    if (!e) continue;
    if (e.type === EntryTypes.User && !isToolResult(e)) return null;
    if (e.type !== EntryTypes.Assistant) continue;
    const texts = textOf(e);
    if (!texts.length) continue;
    // consecutive text blocks of one message form the explanation
    const all = [texts.join("\n\n")];
    for (let j = i - 1; j >= 0; j--) {
      const prev = entries[j];
      if (prev?.type !== EntryTypes.Assistant || prev.message?.id !== e.message?.id) break;
      const more = textOf(prev);
      if (more.length) all.unshift(more.join("\n\n"));
    }
    return { key: e.uuid ?? "", text: all.join("\n\n") };
  }
  return null;
}

export function lastTurnText(transcriptText: string): string | null {
  const entries = parseLines(transcriptText);
  const texts: string[] = [];
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    if (e?.type === EntryTypes.User) break;
    if (e?.type === EntryTypes.Assistant) texts.unshift(...textOf(e));
  }
  return texts.length ? texts.join("\n\n") : null;
}

const CHECKLIST_LINE = /^\s*[-*]\s+\[([ xX])\]\s+(.+?)\s*$/;

// The last markdown checklist in the text; the first open item is the one in progress.
export function parseChecklist(text: string | null): Todo[] | null {
  if (!text) return null;
  type Item = { content: string; done: boolean };
  let current: Item[] | null = null;
  let last: Item[] | null = null;
  for (const line of text.split("\n")) {
    const m = CHECKLIST_LINE.exec(line);
    if (m) {
      current ??= [];
      current.push({ content: m[2] ?? "", done: m[1] !== " " });
      last = current;
    } else {
      current = null;
    }
  }
  if (!last) return null;
  let open = false;
  return last.map(({ content, done }): Todo => {
    if (done) return { content, status: TodoStatuses.Completed };
    const status = open ? TodoStatuses.Pending : TodoStatuses.InProgress;
    open = true;
    return { content, status };
  });
}
