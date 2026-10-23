# Guidance for coding agents

Read README.zh-CN.md, docs/CONFIGURATION.md, docs/VERIFICATION.md, SECURITY.md and docs/CODEX_HANDOFF.md before changing behaviour.

- This is working local alpha code. Do not replace it with another design-only skeleton.
- src/ is the source of truth; dist/ is included so users can run offline. Rebuild both.
- Run npm run check after source changes. Without dependencies, node scripts/test.mjs tests the shipped dist only.
- No network dependencies at runtime, no telemetry, no automatic uploads.
- Preserve --execute consent, true host-platform selection, fail-closed zero-check behaviour and bounded output.
- Do not pass all parent env variables to executed scripts or re-emit raw workflow commands.
- CLI input parsing uses a bounded worker; don't silently move risky parsing to the main thread.
- Unit tests of a PowerShell wrapper are NOT Windows integration tests.
- Do not claim npm publication, GitHub CI, community adoption, award eligibility, or security audit success without real evidence.
- Do not push, publish, send outreach, or change private:true without the owner's explicit approval.
- Audit/update the vendored parser build before a public beta. Preserve MIT notices and the YAML prototype regression.
