# 0003. A markdown checklist for the steps

Date: 2026-11-18 (prototype), carried over 2026-11-19. Status: accepted.

## Context

The viewer pins Claude's plan above the feed. The design first assumed a task-list tool whose calls a hook could read.
On Claude Code 2.1.326 there is no such tool (neither `TodoWrite` nor `TaskCreate`); asked for a task list, Claude keeps
it as a markdown checklist in its messages.

## Decision

The `SessionStart` hook adds a short instruction to Claude's context: before each group of edits, say what is changing
and why; for any task with more than one step, keep a markdown checklist (`- [ ]` / `- [x]`) and post it again when a
step is done. The steps shown are the last checklist in the text before an edit, or in the last turn when Claude stops.
The first unchecked item is shown as in progress.

The same hook asks Claude to open its first reply of a new conversation with the viewer's link.

## Consequences

- The feed and the steps work without any tool Claude Code may or may not have.
- The instructions cost a little input, and the explanations a little output (see [token usage](../token-usage.md)).
- `VIBING_TV_NO_COACH=1` and `VIBING_TV_NO_LINK=1` turn them off; the code is then still typed live, without feed or
  steps.
