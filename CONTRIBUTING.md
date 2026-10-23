# Contributing

Start with a reproducible issue and a failing regression test. Follow the config contract in `docs/CONFIGURATION.md`.

1. Install Node 22+ and Bash (Linux) or PowerShell 7.4+ (Windows).
2. Run `npm ci --ignore-scripts` on a networked machine.
3. Run `npm run check` (vendor checksums, TypeScript build, all tests).
4. Include source and regenerated dist changes. Do not hand-edit dist only.
5. Confirm tests on the platforms you claim to support. Linux success is not Windows evidence.

Prefer focused PRs. Explain behaviour changes, add fixtures, update CHANGELOG and docs. Never send real secrets or private user logs. For parser changes, preserve licenses, provenance and security regression tests. Respect maintainers and users; no harassment, spam or fabricated adoption metrics.

First contributions: improve error messages and docs, add real anonymised README fixtures, run Windows tests, and implement the release gates in `docs/CODEX_HANDOFF.md`.
