# Contributing to vibing-tv

Thanks for helping. This page covers everything you need to work on the plugin locally.

## Prerequisites

- Node.js **22.18 or later** (`.nvmrc` pins the version CI uses). The sources run directly with Node's type stripping.
- Claude Code **2.1.292 or later**.
- For the dev tools only: Google Chrome (`CHROME_PATH` if it is not in the usual place), `ffmpeg` for the demo GIF.

## Set up

```bash
npm ci
npm run check        # typecheck, lint, format check and tests
```

## Run your changes in Claude Code

```bash
npm run dev                          # builds into dist/ and rebuilds on change
claude --plugin-dir ./dist           # in another terminal, from any project folder
```

Open the link Claude gives in its first reply (http://127.0.0.1:4317 by default). Hooks are loaded when a session
starts: restart the Claude Code session after changing hook code. If an older vibing-tv server is running, the new
session replaces it; a server of the same version is kept, so stop it with
`curl -X POST -H 'x-vibing-tv-shutdown: 1' http://127.0.0.1:4317/shutdown` after changing server code.

## Project layout

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) first. The short version:

- `src/core` is pure and is the only place the event protocol is defined.
- `src/hooks` must stay fast and silent: they always exit 0 and print nothing but their JSON output.
- `src/viewer` never imports Node code. ESLint enforces the module boundaries.

## Checks

| Command                            | What it does                                                    |
| ---------------------------------- | --------------------------------------------------------------- |
| `npm test`                         | Vitest, unit and integration tests                              |
| `npm run typecheck`                | `tsc --noEmit`                                                  |
| `npm run lint`                     | ESLint, including module boundaries                             |
| `npm run format`                   | Prettier                                                        |
| `npm run build`                    | builds `dist/`; then `claude plugin validate dist`              |
| `npm run check-viewer -- <folder>` | headless Chrome check of the built viewer, with screenshots     |
| `npm run demo`                     | regenerates `docs/demo/demo.gif` from `docs/demo/session.jsonl` |

## Commits and pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/) for PR titles (`feat:`, `fix:`, `docs:`…). PRs are
  squash-merged, and release-please builds the changelog and the version from these titles.
- Keep a PR to one change. Explain the why in the description.
- Change the protocol (`src/core/protocol.ts`) only with a plan for logs written by the previous version.

## Releases

Maintainers merge the release PR that release-please keeps open. CI then tags the version, builds `dist/` and publishes it
to the `release` branch, which is what users install.
