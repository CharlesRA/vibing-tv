// The contract shared by the hooks, the server and the viewer. Bump SCHEMA_VERSION on any incompatible change.

export const APP_ID = "vibing-tv";
export const SCHEMA_VERSION = 1;
export const SSE_EVENT = { event: "ev", patch: "patch" } as const;

export type TodoStatus = "completed" | "in_progress" | "pending";
export interface Todo {
  content: string;
  status: TodoStatus;
}

export interface Explanation {
  key: string;
  text: string;
}

export interface EditSpec {
  old_string: string;
  new_string: string;
  replace_all: boolean;
}

export interface StreamEvent {
  v: typeof SCHEMA_VERSION;
  id: string;
  ts: string;
  session_id: string;
  cwd: string | null;
  agent: string | null;
  kind: "write" | "edit" | "todos";
  // Claude Code writes its transcript in batches, sometimes seconds after the hook:
  // the server fills in explanation and steps later from this path (see server/enrich.ts).
  transcript: string | null;
  file?: string;
  before?: string | null;
  after?: string;
  edit?: EditSpec;
  truncated?: true;
  explanation?: Explanation | null;
  todos?: Todo[];
}

// What the transcript revealed about an event after it was recorded.
export interface Patch {
  id: string;
  session_id: string;
  explanation?: Explanation;
  todos?: Todo[];
}

export interface SessionSummary {
  session_id: string;
  cwd: string | null;
  last_ts: string | null;
  count: number;
}

export interface Health {
  app: typeof APP_ID;
  version: string;
  schema: number;
  dataDir: string;
  pid: number;
}

// The fields of a Claude Code hook payload that vibing-tv reads (observed on Claude Code 2.1.326).
export interface HookPayload {
  hook_event_name?: string;
  session_id?: string;
  cwd?: string;
  transcript_path?: string;
  source?: string;
  tool_name?: string;
  tool_use_id?: string;
  agent_id?: string;
  agent_type?: string;
  tool_input?: {
    file_path?: string;
    content?: string;
    old_string?: string;
    new_string?: string;
    replace_all?: boolean;
  };
  // For Edit, originalFile is the whole file before the edit; for a created file it is null.
  tool_response?: { originalFile?: string | null; type?: string };
}
