# Changelog

## 0.1.0-alpha.2 — 2026-10-29

- Reject report destinations that are directories or have non-directory parents before executing README commands. Preserve regular-file overwrite behavior and symlink protections. See the [2026-10-25 maintenance record](docs/maintenance/2026-10-25-report-path-preflight.md).
- Fail closed on incomplete or malformed vendor checksum manifests and verify the two shipped MIT notices alongside parser bytes. This is integrity coverage, not a completed dependency security audit.
- Added an offline, explicitly synthetic README-only drift contrast: a fixed-command
  smoke test keeps passing after a README typo, while the README-bound QSG check
  fails at the source line and passes after restoration. Includes regression tests,
  temporary-copy isolation and a [maintenance record](docs/maintenance/2026-10-29-readme-only-drift.md).
  The demo itself makes no production CLI, dependency or workflow changes; no upstream bug/adoption claim.

## 0.1.0-alpha.1 — 2026-10-23

First runnable local alpha. Added explicit Markdown selection, strict YAML/config checks, bounded parsing worker, Linux Bash and Windows PowerShell runners, opt-in execution, literal assertions, timeout/output bounds, filtered environment, console/JSON/Markdown/GitHub reports, starter generator, CLI integration tests and success/failure fixtures.

Linux execution has been tested in this delivery environment. Windows implementation and CI are supplied; an actual Windows run is a release gate, not an accomplished result. No registry publication, public repository or external adoption is claimed. See VERIFICATION and vendor provenance.

### Public repository verification (2026-10-23)

The public GitHub Actions CI run on the `main` commit `84dec79` passed all four test matrix jobs: Ubuntu 24.04 and Windows 2025, each with Node.js 22 and 24. See [run #39941328349](https://github.com/rocktan1996-debug/quickstartguard/actions/runs/39941328349). This is an additional verification after local alpha delivery, not proof of all Windows environments or external adoption. The repository remains an Alpha; `private: true` still blocks npm registry publication.
