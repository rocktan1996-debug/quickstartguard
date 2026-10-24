# Independent x424 pilot

Run the existing **Verify QuickstartGuard** workflow manually, choosing branch
`pilot/x424-validation-20261024`. The x424 jobs cannot run on push, PR,
workflow_call or any other branch. Existing QSG tests retain their old triggers.

## Pins and safety review

- Upstream: x424protocol/x424@52f49d95b0ebf9d5898d9c89239b604656073bb8.
- QSG: rocktan1996-debug/quickstartguard@d2730965a5d2a85c51deb28ff679531bc0cacf86.
- Node 22.22.0; pnpm 9.12.0; dependency versions/integrity from upstream lockfile.
- Checkout/setup-node use existing repository full commit pins.
- Ephemeral GitHub-hosted Ubuntu 24.04/Windows 2025; read-only token;
  no persisted Git credentials, supplied secrets, self-hosted runners,
  pull_request_target, environment approvals, caches or automatic artifact upload.
- npm/pnpm dependency lifecycle scripts disabled. Installation still downloads
  dependencies and executing the example executes dependency code. Pinning is
  reproducibility, not a dependency security audit or network sandbox.
- Reviewed upstream local-stack.ts uses a fake adapter and freshly generated
  ephemeral keys; scripted-client.ts uses fixture:true and loopback endpoints.
  No World account, real identity proof or production service is required.
- QSG is not a sandbox; it filters child environment but HOME remains readable.
  Never reuse this workflow on a credential-bearing personal runner.

## Evidence boundaries

The configuration validates Markdown command selection. Only actual hosted-run
outputs prove Windows/Linux execution. Skipped checks are not passes. The
synthetic quickstart must return 201 and the completion banner with exit zero.
No status is fabricated. Upstream source remains unmodified, including its
potential Windows pnpm.cmd spawning issue. If reproduced, preserve the failing
baseline and propose a separately reviewed minimal script fix; do not replace
it with a passing alternative and call the original quickstart validated.

This pilot does not run upstream pnpm check and does not satisfy all of Issue
#19's definition of done. It also does not test real World verification,
Corepack setup, personal Windows machines, or establish maintainer acceptance.
No upstream Issue, PR or contact is authorized by this work.

## Current state

Prepared for manual execution. Record exact run URLs and job conclusions after
execution; do not infer success from a commit or from QSG's own unit tests.

### Local checks, 2026-10-24

- QSG runtime vendor checksum verification passed; shipped CLI tests:
  118 passed, 0 failed, 0 skipped on Linux / Node 24.22.1.
- Pilot YAML and all four selected Markdown checks validated without execution.
- Actual local dependency installation did not complete. The default filtered
  environment produced registry DNS EAI_AGAIN; a local-only explicit proxy
  pass-through retry encountered an untrusted proxy certificate chain and hit
  the 300-second timeout. TLS verification was not disabled.
- Consequently tsx was unavailable and the quickstart failed before HTTP
  execution. Windows checks were skipped on Linux. No actual 201 was observed.
- Lifecycle-script-disabled runtime compatibility and both hosted platforms
  remain unverified. These environment failures are not confirmed upstream bugs.
