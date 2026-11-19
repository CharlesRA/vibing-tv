# 0004. One shared server per machine

Date: 2026-11-19. Status: accepted.

## Context

Several Claude Code sessions can run at once, and the same machine can load the plugin two ways: installed from the
marketplace, or from a folder with `--plugin-dir` during development. Each way gets its own `CLAUDE_PLUGIN_DATA`, and
the prototype stored its logs there. The first server to start kept the port, so sessions loaded the other way wrote
logs nobody served.

## Decision

- One server per machine, on one port (`VIBING_TV_PORT`, 4317), started detached by the `SessionStart` hook.
- One data folder for every way of loading the plugin: `~/.vibing-tv` (or `VIBING_TV_DATA_DIR`), never
  `CLAUDE_PLUGIN_DATA`.
- A starting session replaces the running server **only if that server is older** (semver). It asks it to stop with
  `POST /shutdown` and a custom header, waits for the port to free up, then starts its own. A server of the same or a
  newer version is kept, so two sessions never fight over the port and nothing ever downgrades.
- A port held by another application is left alone and logged; Claude then gets no link.
- After spawning a server, the launcher waits up to two seconds for it to answer before reporting it as started, so
  Claude is never handed a dead link.

## Consequences

- Plugin updates take over from the previous server without manual steps.
- Uninstalling the plugin does not delete `~/.vibing-tv`; the README says how to.
- If `VIBING_TV_DATA_DIR` differs between two sessions, the second one keeps the running server and logs the mismatch.
