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

The original baseline has now been run on both hosted platforms; see the
results below. The separate candidate still requires its own new manual run.
Do not infer candidate success from the baseline or QSG unit tests.

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

## Hosted baseline: 2026-10-24

Manual run [40099493434](https://github.com/rocktan1996-debug/quickstartguard/actions/runs/40099493434)
executed pilot commit `bc1ef4a74cf72eaf12c74f926e0d8857db50447d` and finished
**failure**. The four ordinary QSG self-test jobs passed; these are not x424 tests.

- [Linux x424 job](https://github.com/rocktan1996-debug/quickstartguard/actions/runs/40099493434/job/120888523966):
  installation passed in 3.527s; original quickstart passed in 2.340s. Output
  included actual `"status": 201`, `HUMAN-PROOF accepted`, and upstream's
  `424 challenge → proof → bound retry → 201` completion banner. Ubuntu 24.04.5,
  kernel 6.17.0-1022-azure, Node 22.22.0, pnpm 9.12.0; QSG executes Bash.
- [Windows x424 job](https://github.com/rocktan1996-debug/quickstartguard/actions/runs/40099493434/job/120888524038):
  installation passed in 11.705s; original quickstart failed in 1.102s with
  `spawn EINVAL` at `scripts/run-quickstart.mjs:71:15`, before server startup.
  Windows Server 2025 / 10.0.26100, PowerShell 7.6.7, Node 22.22.0, pnpm 9.12.0.
  The checked source invokes `spawn('pnpm.cmd', ...)` without a shell there.
  QSG correctly retained exit 1 and reported missing expected HTTP output.
- Both upstream tracked-source diff checks passed. Dependency installation used
  the frozen lockfile and disabled lifecycle scripts on both platforms.
- No artifacts were uploaded. Job logs are the execution evidence.

This reproduces the previously suspected .cmd-launch compatibility problem on
this Windows combination. It is not evidence that every Windows setup fails.
The Node documentation explains that Windows .cmd files require a command
interpreter; this candidate avoids introducing a shell instead.

## Independent Windows candidate (not yet hosted-verified)

`candidate-run-quickstart.mjs` starts the same unmodified pinned local-stack.ts
and scripted-client.ts using `process.execPath` with `--import tsx`. It changes
only test orchestration in this pilot repository, not upstream files,
authentication, protocol, fake provider behavior or assertions. See
[tsx's documented Node CLI usage](https://github.com/privatenumber/tsx/blob/master/docs/dev-api/node-cli.md)
and [Node child-process documentation](https://nodejs.org/api/child_process.html#spawning-bat-and-cmd-files-on-windows).

The additional Windows check is separate and can run when the baseline launcher
fails, but only after the baseline JSON proves successful Windows installation.
Missing/failed prerequisite evidence explicitly skips it as inconclusive. The baseline remains unchanged and failing; no continue-on-error or
weakened expected output hides it. Thus the overall run may correctly remain red
even if the candidate succeeds. A candidate pass would show only that this
launcher can exercise the synthetic flow, not that the documented upstream
`pnpm quickstart` is fixed or that x424 has adopted QSG.

After committing, a **new manual dispatch of the new branch SHA** is necessary.
Re-running an old workflow run reuses its old commit and cannot validate this
candidate. An upstream script fix, pnpm check, maintainer agreement and any
integration PR remain separate work requiring the appropriate scope/approval.

### Local candidate verification, 2026-10-24

After explicitly retaining the cloud environment's existing CA certificate path
alongside its proxy variables, the unchanged frozen/no-lifecycle installation
passed in 46.687s. TLS verification remained enabled; no trust-store setting
was changed. This supersedes the local installation blockage above.

A temporary, uncommitted Linux analogue of the candidate check passed with
actual `"status": 201` and `HUMAN-PROOF accepted`, exit 0, in 784ms on Linux /
Node 24.22.1. The server process exited through the launcher's awaited cleanup.
This is a Linux functional check, not Windows candidate acceptance. Candidate
syntax, both committed QSG configs and workflow YAML were also validated.
