# 2026-10-29 — README-only drift contrast

## Scope and motivation

Based on main `d2730965a5d2a85c51deb28ff679531bc0cacf86`. Existing draft PRs #9
(report-path preflight) and #10 (vendor integrity) are not incorporated or changed.

A fixed `--help` smoke test does not establish an incremental need where the
project already tests that command. This iteration instead demonstrates the
specific difference between testing a fixed command and executing the text in an
actual README. The earlier isolated pilot's separate quickstart document is not
used as evidence of README binding.

**This is a deliberately synthetic, self-contained experiment.** The program, test,
README and injected typo are authored fixtures, not a discovered upstream defect.
No external project was executed, modified or contacted. No community adoption,
full upstream CI result, security audit, merge or release is claimed.

## Reproducible result

Run `node examples/readme-drift/run.mjs --execute` from the checkout. See the
[experiment guide](../../examples/readme-drift/README.md) for the exact mechanism.
The [captured summary](2026-10-29-readme-only-drift.json) was generated with
`node examples/readme-drift/run.mjs --execute --json`; it omits child output and
temporary/private paths.

Local host: Linux x86_64, Node v24.22.1, GNU Bash 5.2.37.

| Phase | Changed inputs | Fixed-command test | README-bound QSG |
| --- | --- | --- | --- |
| Baseline | None | 1 test passes; exit 0 | 1 pass; exit 0 |
| Inject typo at `README.md:8` | Only `README.md` | Same test passes; exit 0 | 1 failure; exit 1; `README.md:8-8` |
| Restore | Byte-identical to baseline | Same test passes; exit 0 | 1 pass; exit 0 |

QSG reads `file: README.md` from the unchanged config and reports the exact
single-command source line. No commands are substituted into QSG by the runner.
Only the selected Linux command changes from `node ./scripts/hello.mjs` to
`node ./scripts/hello-typo.mjs`; program/config/test remain byte-identical. SHA-256
snapshots verify every fixture input before and after each phase; only generated
reports are excluded. Original fixture unchanged; temporary copy removed.

The runner exits 0 because it verified the **expected** contrast, not because the
broken command passed. A fixed-command test is intentionally only one control
test, not an entire upstream project's test suite. Existing tests that read and
execute the README can provide the same coverage.

## Local checks actually executed

- `npm ci --ignore-scripts --cache /tmp/qsg-readme-drift-npm-cache --no-audit --no-fund`:
  installed the three unchanged locked development packages. No audit claimed.
- Before new tests: `npm run check`: **118 passed, 0 failed, 0 skipped**.
- Focused `node --test tests/readme-drift.test.mjs`: **4 passed**. Covers missing
  consent, unsupported options, actual pass/fail/pass with line attribution,
  repeated execution, outside-cwd resolution and temporary-directory cleanup.
- Final `npm run check`: vendor integrity, TypeScript build and **122 passed,
  0 failed, 0 skipped** locally. The existing test runner discovers the new tests;
  no network-dependent CI step or workflow change was added.
- `git diff --exit-code -- dist`: passed; production source and shipped dist unchanged.
- Repository README `validate` and `run --execute`: passed; one Linux check ran,
  the Windows check was explicitly skipped on this host.
- `npm pack --ignore-scripts`: local tarball created. Extracted tarball contained
  the runner, all four fixture files and guide; its contrast ran successfully from
  an unrelated working directory without installing dependencies.

The first local runner attempt expected the successful check reason to be
`completed`, but the CLI correctly reports `passed`. The demo assertion was fixed;
no production behavior was changed. Independent AI-assisted review then requested
escaping the shell-version banner before output, which was applied. This review
is not a security audit.

## Hosted evidence and limits

At the time this source record was prepared, final-head hosted CI had not yet run.
The draft PR will record exact commit/run links and actual Ubuntu/Windows × Node
22/24 conclusions after completion. Local Linux tests are not Windows evidence.
The Windows fixture is configured for actual PowerShell 7.4+, not simulation.

The repository remains `private: true`; no registry publication or release. No
runtime consent, environment filtering or output limits changed. Before another
external invitation, establish a genuine README issue and its absence from the
project's existing tests; this synthetic example does not satisfy that gate.
