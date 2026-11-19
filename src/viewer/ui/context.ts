// The viewer's mutable runtime state, shared by the UI modules. The derived data lives in `state` (see model.ts).
import type { StreamEvent } from "../../core/protocol.ts";
import { emptyState } from "../model.ts";

export const ctx = {
  state: emptyState(),
  sessionId: null as string | null,
  // once the user picks a session, live events from other sessions no longer switch the view
  pinnedByUser: false,
  activeFile: null as string | null,
  playingId: null as string | null,
  // file events waiting to be typed, sorted by ts
  queue: [] as StreamEvent[],
  paused: false,
  skip: false,
  replaying: false,
  played: 0,
};
