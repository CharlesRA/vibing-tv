// Turns a hook payload into a StreamEvent. The disk is never read: Edit payloads carry the file before the edit.
import {
  EventKinds,
  HookEvents,
  SCHEMA_VERSION,
  ToolNames,
  type EditSpec,
  type EventKind,
  type HookPayload,
  type Patch,
  type StreamEvent,
} from "./protocol.ts";
import { isSensitive } from "./sensitive.ts";
import { dayjs } from "./time.ts";
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

function base(payload: HookPayload & { session_id: string }, kind: EventKind, id: string): StreamEvent {
  return {
    v: SCHEMA_VERSION,
    id,
    ts: dayjs().toISOString(),
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
    return { id: ev.id, session_id: ev.session_id, explanation, ...(todos ? { todos } : {}) };
  }
  if (ev.kind === EventKinds.Todos && !ev.todos) {
    const todos = parseChecklist(lastTurnText(transcriptText));
    return todos ? { id: ev.id, session_id: ev.session_id, todos } : null;
  }
  return null;
}

export const needsPatch = (ev: StreamEvent): boolean =>
  !!ev.transcript && ((!!ev.file && !ev.explanation) || (ev.kind === EventKinds.Todos && !ev.todos));

function fileEvent(payload: HookPayload & { session_id: string }, io: EventIO): StreamEvent | null {
  const { tool_name, tool_input = {}, tool_response = {} } = payload;
  const file = tool_input.file_path;
  if (!file || isSensitive(file)) return null;
  const kind = tool_name === ToolNames.Write ? EventKinds.Write : EventKinds.Edit;
  const ev: StreamEvent = { ...base(payload, kind, payload.tool_use_id ?? ""), file };

  const original = tool_response.originalFile;
  let before: string | null | undefined;
  let after: string | undefined;
  if (kind === EventKinds.Edit) {
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
  const path = ev.transcript;
  const transcript = path ? (safely(() => io.readTranscriptTail(path)) ?? "") : "";
  const patch = safely(() => resolvePatch(ev, transcript));
  return patch ? { ...ev, ...patch } : ev;
}

export function buildEvent(input: unknown, io: EventIO): StreamEvent | null {
  if (!input || typeof input !== "object") return null;
  const payload = input as HookPayload;
  const { session_id } = payload;
  if (!session_id) return null;
  const p = { ...payload, session_id };
  if (p.hook_event_name === HookEvents.Stop) {
    return withPatch(base(p, EventKinds.Todos, `stop-${String(dayjs().valueOf())}`), io);
  }
  if (p.tool_name === ToolNames.Write || p.tool_name === ToolNames.Edit) return fileEvent(p, io);
  return null;
}
