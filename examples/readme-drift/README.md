# README-only drift: a controlled contrast

**Synthetic experiment, not a discovered upstream bug.** This fixture and its typo
were deliberately authored for the demonstration. It does not show community
adoption, a real maintainer's feedback, or an upstream project's full CI result.

The question is narrow: if a smoke test repeats a fixed command instead of reading
the README, can a README-only typo escape that test? QSG already supports binding
to README blocks; this adds reproducible evidence, not a new detection algorithm.

## Run offline

Review `run.mjs` and the four files under `project/` first. From the QSG checkout or
extracted local package (Node 22+, Linux/Bash or Windows/PowerShell 7.4+):

```text
node examples/readme-drift/run.mjs --execute
```

The shipped `dist/` is sufficient; no npm install, external repository, credentials,
network request, package registry or service is used. This is still command
execution, **not sandboxing**. Only the real host's check runs. Unsupported hosts
or missing shells are errors, not successful skips. The command works from another
working directory too when given the runner's absolute path.

For a machine-readable summary without child stdout/stderr:

```text
node examples/readme-drift/run.mjs --execute --json
```

## What actually runs

The runner copies `project/` into a fresh temporary directory. Its three phases use
the same program, same control test, same QSG config and same filtered environment:

| Phase | Changed fixture inputs | Fixed-command smoke test | QSG reading `README.md` |
| --- | --- | --- | --- |
| Baseline | None | PASS, exit 0 | PASS, exit 0 |
| Deliberate typo | Only `README.md` | PASS, exit 0 | FAIL, exit 1 |
| Restored | None (byte-identical) | PASS, exit 0 | PASS, exit 0 |

- Control: `node --test --test-reporter=tap test/smoke.test.mjs`. The one test always
  invokes `node ./scripts/hello.mjs` and checks `Hello, reader!`. It never reads the
  README. This is a **single smoke test**, not a claim that an upstream suite passed.
- Treatment: the shipped QSG CLI runs `run --execute --json-out .qsg/<phase>.json`
  with the unchanged `qsg.yml`, whose `file` is the fixture's actual `README.md`.
  The selected fenced block supplies the command; no second quickstart document
  or command override is supplied to QSG.
- Mutation: only the host's command line changes from `node ./scripts/hello.mjs`
  to `node ./scripts/hello-typo.mjs`. That target does not exist. The expected
  output/exit assertions are not weakened to accept failure.
- QSG must execute exactly one check and report the correct source command line:
  Linux `README.md:8-8`, Windows `README.md:14-14`. The other platform is explicitly
  skipped, not simulated.
- Before and after each phase, SHA-256 snapshots compare **all fixture inputs**,
  including the fixed test, program and config. Only generated `.qsg/` reports are
  excluded. The restored copy must be byte-identical to the baseline. The original
  source fixture must stay unchanged, and temporary files are removed in `finally`.

The demo itself exits **0 only when the entire expected pass/fail/pass contrast is
verified**. This does not mean the broken README passed. A missing consent flag,
unexpected check result, unavailable shell or failed invariant makes the demo
exit 2. Internal QSG JSON reports are discarded with the temporary copy; `--json`
prints only the bounded experiment summary, with no raw command output.

## Meaning and limits

This isolates the value of reading the documented command rather than maintaining
a second command string in a smoke test. A test suite that already extracts and
executes these README commands can cover the same gap; QSG is not necessary merely
because a project has a `--help` command. The fixture does not install dependencies,
test a published artifact, reproduce real-world drift, or prove any security claim.
No upstream project was modified or contacted for this experiment.

Before another external invitation, find and reproduce a genuine README problem,
then inspect that project's existing tests to establish the uncovered gap. Do not
present this invented typo as that evidence.

Local and hosted verification are recorded separately in the
[maintenance record](../../docs/maintenance/2026-10-29-readme-only-drift.md) and its PR.
