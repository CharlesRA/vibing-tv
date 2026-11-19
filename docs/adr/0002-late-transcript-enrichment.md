# 0002. Late transcript enrichment

Date: 2026-11-18 (prototype), carried over 2026-11-19. Status: accepted.

## Context

The feed shows the text Claude wrote before each edit. That text lives in the session transcript (`transcript_path`),
not in the hook payload. Observed on Claude Code 2.1.326:

- the transcript has one line per content block (`text`, `tool_use`, `thinking`); blocks of one message share
  `message.id`, and tool results are `user` lines;
- Claude Code writes the transcript **in batches, sometimes seconds after the hook runs**. Reading it from the hook works
  only some of the time, and waiting in the hook would slow Claude down;
- `PostToolUse` for Edit carries `tool_response.originalFile`, the whole file before the edit, so the hook never needs to
  read the disk.

## Decision

The hook stays synchronous and instant. It records the event with whatever the transcript already shows, plus the
transcript's path. The server keeps rereading the transcript for events still missing their explanation or steps, for
up to two minutes (`ENRICH_WINDOW`). When it finds them, it stores a `Patch` next to the session log and broadcasts it
(`event: patch`). The viewer derives its feed from events, so a late patch regroups the feed on its own.

An edit's explanation is the assistant's last text before the tool call, walking back across tool results but never past
the user's prompt: Claude often announces several edits in one sentence.

## Consequences

- Hooks never block Claude.
- An explanation may appear a few seconds after its edit ("explanation pending…").
- Events whose explanation never shows up within two minutes stay without one.
