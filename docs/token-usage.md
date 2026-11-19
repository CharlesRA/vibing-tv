# Token usage

vibing-tv runs almost entirely outside the model. This page explains what does and does not cost tokens, and gives one
measurement.

## What is free

- **The capture hooks** (`PostToolUse`, `Stop`) read the hook payload and append to a local file. They print nothing, so
  nothing is sent to Claude.
- **The server and the viewer** run on your machine and never talk to the model.

## What costs tokens

| Source                                                                            | Kind                    | Size                | How to turn it off     |
| --------------------------------------------------------------------------------- | ----------------------- | ------------------- | ---------------------- |
| Coaching instruction, injected at session start                                   | input, stays in context | ~100 tokens         | `VIBING_TV_NO_COACH=1` |
| Link instruction, injected at the start of a new conversation                     | input, stays in context | ~55 tokens          | `VIBING_TV_NO_LINK=1`  |
| The sentences Claude writes before each group of edits, and its checklist updates | output                  | depends on the task | `VIBING_TV_NO_COACH=1` |
| The link line in Claude's first reply                                             | output                  | ~15 tokens          | `VIBING_TV_NO_LINK=1`  |

Injected instructions are re-read on every turn, but they sit at the start of the context, so they are normally served
from the prompt cache. Turning coaching off also empties the feed and the pinned steps: the code is still typed live,
without explanations.

## Measurement

Method: the same prompt run in an empty folder with `claude -p … --output-format json`, once with vibing-tv's defaults
(twice, to see the run-to-run noise) and once with `VIBING_TV_NO_COACH=1 VIBING_TV_NO_LINK=1`. Figures are the `usage`
block of each run.

Prompt: _"Build a tiny todo app in plain HTML/CSS/JS (index.html, style.css, app.js) with add, toggle and delete.
Implement directly, without waiting for validation."_ Claude Code 2.1.327, main model `claude-opus-5-5`, 2026-11-19.

| Run                       | Cache writes | Cache reads | Output | Turns | Cost (USD) |
| ------------------------- | -----------: | ----------: | -----: | ----: | ---------: |
| Defaults (A)              |       63,447 |     347,288 |  3,467 |     5 |      0.647 |
| Defaults (A2)             |       63,736 |     435,615 |  3,649 |     6 |      0.670 |
| Coaching and link off (B) |       63,033 |     346,588 |  2,991 |     5 |      0.634 |

Reading it:

- Output grew by about 500 to 650 tokens (+16 to 22 %): the explanations and checklists Claude writes for the feed.
- Cache writes grew by about 400 to 700 tokens: the injected instructions plus that extra text in later turns.
- The total cost of the task grew by 2 to 6 %. Part of that gap is run-to-run noise: A2 took one more turn than A.

One small task, one model, a handful of runs: take these as orders of magnitude, not a benchmark.
