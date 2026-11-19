# 0001. TypeScript, a build step and a release branch

Date: 2026-11-19. Status: accepted.

## Context

The prototype was plain JavaScript with no dependencies, installable straight from the repository. Claude Code installs a
plugin by copying its folder: it runs no build step, and it runs `npm install` whenever the plugin root holds a
`package.json` with a lockfile. The prototype also loaded Monaco from a CDN, so the viewer sent requests to a third party
and did not work offline.

## Decision

Write the project in strict TypeScript, split into modules with enforced boundaries. Build an installable plugin into
`dist/` (esbuild for the hooks and server, Vite for the viewer with Monaco bundled). Publish `dist/` to a `release`
branch from CI; the marketplace entry on `main` points to that branch:

```json
{ "source": "github", "repo": "CharlesRA/vibing-tv", "ref": "release" }
```

## Consequences

- Contributors get types, a standard toolchain and module boundaries checked by the linter.
- The viewer makes no external request.
- `main` is no longer installable as is; `npm run build` then `claude --plugin-dir ./dist` replaces it for development.
- Releasing needs CI and a token able to push to `release`.
- `dist/` must never contain a `package.json` (it would trigger an install) or a `bin/` folder (it would be put on the
  PATH of Claude's Bash tool). The build fails if either appears.
