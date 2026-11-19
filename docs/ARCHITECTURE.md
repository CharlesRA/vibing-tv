# Architecture

vibing-tv is a Claude Code plugin. Hooks record every file Claude writes or edits, a small local server streams those
records to a browser tab, and the viewer types each edit into a Monaco editor next to what Claude said it was doing.

## Data flow

```
Claude Code ── PostToolUse (Write|Edit), Stop ──▶ runtime/capture.mjs ── append ──▶ <data>/sessions/<session>.jsonl
            ── SessionStart ────────────────────▶ runtime/session-start.mjs ──▶ ensureServer() + instructions for Claude

runtime/server.mjs   polls the logs every 300 ms ──▶ SSE /events (event: ev | patch) ──▶ viewer (Monaco)
                     enricher: rereads transcripts ──▶ <data>/sessions/<session>.patches
```

`<data>` is `~/.vibing-tv` unless `VIBING_TV_DATA_DIR` says otherwise.

## Processes

| Process             | Started by                     | Lifetime                         | Job                                                                           |
| ------------------- | ------------------------------ | -------------------------------- | ----------------------------------------------------------------------------- |
| `capture.mjs`       | `PostToolUse` and `Stop` hooks | ~1 ms per call                   | Turn the hook payload into a `StreamEvent` and append it to the session log.  |
| `session-start.mjs` | `SessionStart` hook            | until the server answers (≤ 2 s) | Make sure a server runs, then inject the coaching and link instructions.      |
| `server.mjs`        | `session-start.mjs`, detached  | until 30 min without activity    | Serve the viewer, the history and the live stream; fill in late explanations. |

One server runs per machine, shared by every Claude Code session. A session that starts with a newer plugin version asks
an older server to stop and replaces it (see [ADR 0004](adr/0004-single-shared-server.md)).

## Source layout and module boundaries

```
src/
├── core/     pure: protocol, transcript parsing, event building, version ordering, time helpers
├── node/     Node adapters shared by hooks and server: config, paths, transcript tail, VERSION
├── hooks/    hook entry points (thin: stdin → core → file, always exit 0)
├── server/   store, enricher, HTTP/SSE server, launcher, process entry point
└── viewer/   model.ts and player.ts (pure), ui/ (DOM and Monaco), index.html, style.css
```

ESLint enforces who may import what:

| Module   | May import                                    |
| -------- | --------------------------------------------- |
| `core`   | nothing from the project, no `node:*`, no DOM |
| `node`   | `core`                                        |
| `server` | `core`, `node`                                |
| `hooks`  | `core`, `node`, `server/launch`               |
| `viewer` | `core`, `monaco-editor`                       |

## The protocol

[`src/core/protocol.ts`](../src/core/protocol.ts) is the single contract between hooks, server and viewer.

- **`StreamEvent`**: one line of a session log. `kind` is `write`, `edit` or `todos`. File events carry `before` and
  `after` (the whole file), or `truncated: true` when the content is unknown or over 1 MB. `explanation` and `todos` may be
  missing at first and arrive later as a patch.
- **`Patch`**: what the transcript revealed about an event after it was recorded (`explanation`, `todos`). Stored next to
  the log in `<session>.patches` and merged by `/history`.
- **SSE** (`GET /events`): `event: ev` carries a new `StreamEvent`, `event: patch` a `Patch`. Past events are not replayed
  on the stream; clients load them from `GET /history?session=<id>`.
- **`GET /health`**: `{ app: "vibing-tv", version, schema, dataDir, pid }`. The launcher uses it to recognise its own
  server and compare versions.

Every event has `v` (`SCHEMA_VERSION`). Bump it on any incompatible change to `StreamEvent` or `Patch`, and keep the
viewer able to read the previous version for as long as logs of that version can still exist (7 days).

## Security model

The logs contain the full content of edited files, so:

- the server listens on `127.0.0.1` only and refuses any request whose `Host` header is not `127.0.0.1:<port>` or
  `localhost:<port>` (DNS rebinding);
- `POST /shutdown` requires a custom header, which a web page cannot send without a CORS preflight the server never
  grants;
- the viewer is bundled: no request leaves the machine;
- `.env*`, `*.pem`, `*.key`, `*.p12` and `id_rsa*` are never recorded.

See [SECURITY.md](../SECURITY.md).

## Build and release

`npm run build` writes the installable plugin to `dist/`: esbuild bundles the hooks and the server into
`dist/runtime/*.mjs`, Vite builds the viewer into `dist/viewer/`, and the manifests from `plugin/` are copied with the
version from `package.json`. `dist/` never contains a `package.json` or a `bin/` folder. On release, CI publishes `dist/`
to the `release` branch, which the marketplace entry points to (see
[ADR 0001](adr/0001-typescript-build-and-release-branch.md)).

## Decisions

- [0001 TypeScript, a build step and a release branch](adr/0001-typescript-build-and-release-branch.md)
- [0002 Late transcript enrichment](adr/0002-late-transcript-enrichment.md)
- [0003 A markdown checklist for the steps](adr/0003-markdown-checklist-for-steps.md)
- [0004 One shared server per machine](adr/0004-single-shared-server.md)
