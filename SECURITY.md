# Security

## What vibing-tv records

To replay edits, vibing-tv stores on your machine, for every file Claude creates or edits:

- the full content of the file before and after the edit;
- the path of the file and of the project folder;
- the text Claude wrote before the edit and its checklist, read from the local session transcript.

It never records `.env`, `.env.*`, `*.pem`, `*.key`, `*.p12` or `id_rsa*` files. Files over 1 MB are recorded as "too
large", without their content.

## Where it is stored

In `~/.vibing-tv` (or `VIBING_TV_DATA_DIR`), one log per session. Logs are deleted after 7 days. Uninstalling the plugin
does **not** delete this folder: remove it yourself with `rm -rf ~/.vibing-tv`.

## Who can read it

- The server listens on `127.0.0.1` only, never on the network.
- It refuses requests whose `Host` header is not `127.0.0.1:<port>` or `localhost:<port>`, which blocks DNS rebinding
  from web pages.
- The viewer is bundled with the plugin: it makes no request to any other site, and vibing-tv sends no telemetry.
- Anyone with access to your user account can read `~/.vibing-tv`, as with any file in your home folder.

## Reporting a vulnerability

Please report security issues privately through
[GitHub Security Advisories](https://github.com/CharlesRA/vibing-tv/security/advisories/new), not in a public issue. You
should get an answer within a week. Include the version (`curl -s http://127.0.0.1:4317/health`), your OS and the steps
to reproduce.
