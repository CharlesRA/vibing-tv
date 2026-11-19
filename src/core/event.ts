// Turns a hook payload into a StreamEvent. The disk is never read: Edit payloads carry the file before the edit.
import { SCHEMA_VERSION, type EditSpec, type HookPayload, type Patch, type StreamEvent } from "./protocol.ts";
import { isSensitive } from "./sensitive.ts";
import { explanationFor, lastTurnText, parseChecklist } from "./transcript.ts";

const MAX_BYTES = 1_000_000;

export interface EventIO {
  readTranscriptTail(path: string): string;
}

const byteLength = (s: string) => new TextEncoder().encode(s).length;

function applyEdit(before: string, { old_string, new_string, replace_all }: EditSpec): string {
  return replace_all ? before.split(old_string).join(new_string) : before.replace(old_string, () => new_string);
}

function safely<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

function base(payload: HookPayload & { session_id: string }, kind: StreamEvent["kind"], id: string): StreamEvent {
  return {
    v: SCHEMA_VERSION,
    id,
    ts: new Date(Date.now()).toISOString(),
    session_id: payload.session_id,
    cwd: payload.cwd ?? null,
    agent: payload.agent_id ?? payload.agent_type ?? null,
    kind,
    transcript: payload.transcript_path ?? null,
  };
}

// What the transcript tells about this event, if it is already written; null otherwise.
export function resolvePatch(ev: StreamEvent, transcriptText: string): Patch | null {
  if (ev.file && !ev.explanation) {
    const explanation = explanationFor(transcriptText, ev.id);
    if (!explanation) return null;
    const todos = parseChecklist(explanation.text);
    return { id: ev.id, session_id: ev.session_id, explanation, ...(todos && { todos }) };
  }
  if (ev.kind === "todos" && !ev.todos) {
    const todos = parseChecklist(lastTurnText(transcriptText));
    return todos ? { id: ev.id, session_id: ev.session_id, todos } : null;
  }
  return null;
}

export const needsPatch = (ev: StreamEvent): boolean =>
  !!ev.transcript && ((!!ev.file && !ev.explanation) || (ev.kind === "todos" && !ev.todos));

function fileEvent(payload: HookPayload & { session_id: string }, io: EventIO): StreamEvent | null {
  const { tool_name, tool_input = {}, tool_response = {} } = payload;
  const file = tool_input.file_path;
  if (!file || isSensitive(file)) return null;
  const kind = tool_name === "Write" ? "write" : "edit";
  const ev: StreamEvent = { ...base(payload, kind, payload.tool_use_id ?? ""), file };

  const original = tool_response.originalFile;
  let before: string | null | undefined;
  let after: string | undefined;
  if (kind === "edit") {
    const edit: EditSpec = {
      old_string: tool_input.old_string ?? "",
      new_string: tool_input.new_string ?? "",
      replace_all: !!tool_input.replace_all,
    };
    ev.edit = edit;
    if (typeof original === "string") {
      before = original;
      after = applyEdit(original, edit);
    }
  } else {
    before = typeof original === "string" ? original : null;
    after = tool_input.content ?? "";
  }

  const tooBig = [before, after].some((s) => typeof s === "string" && byteLength(s) > MAX_BYTES);
  if (after === undefined || tooBig) ev.truncated = true;
  else {
    ev.before = before ?? null;
    ev.after = after;
  }

  ev.explanation = null;
  return withPatch(ev, io);
}

function withPatch(ev: StreamEvent, io: EventIO): StreamEvent {
  const transcript = (ev.transcript && safely(() => io.readTranscriptTail(ev.transcript ?? ""))) ?? "";
  const patch = safely(() => resolvePatch(ev, transcript));
  return patch ? { ...ev, ...patch } : ev;
}

export function buildEvent(input: unknown, io: EventIO): StreamEvent | null {
  if (!input || typeof input !== "object") return null;
  const payload = input as HookPayload;
  const { session_id } = payload;
  if (!session_id) return null;
  const p = { ...payload, session_id };
  if (p.hook_event_name === "Stop") return withPatch(base(p, "todos", `stop-${Date.now()}`), io);
  if (p.tool_name === "Write" || p.tool_name === "Edit") return fileEvent(p, io);
  return null;
}
