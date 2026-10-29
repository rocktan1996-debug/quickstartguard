# QuickstartGuard

**Turn explicitly selected README quickstarts into regression checks.**

Version: **0.1.0-alpha.2**. Working CLI, not a hosted service. English / [中文上手说明](README.zh-CN.md).

This alpha checks the current checkout and current runner. It does not guarantee that published packages work on a fresh OS. It does not automatically fix commands, install PowerShell, create GitHub repositories, or publish to npm.

## Run the downloaded package

You need Node.js 22 or newer. For execution, Linux uses Bash; Windows requires **PowerShell 7.4+ (`pwsh`)**. Windows PowerShell 5.1 is not supported. `validate` does not need a shell and does not execute code.

The ZIP contains compiled `dist/` and vendored runtime parsers. **No `npm install` is needed to run the CLI or its tests.**

```text
node dist/cli.js --help
node dist/cli.js validate --config fixtures/demo-valid/qsg.yml
node dist/cli.js run --config fixtures/demo-valid/qsg.yml --execute
node scripts/test.mjs
```

A deliberate failure demonstration:

```text
node dist/cli.js run --config fixtures/demo-broken/qsg.yml --execute
```

It must return exit code 1 and point to the selected command in README. That failure is a successful demonstration of the detector, not an installation error.

### What does reading the README add over a fixed smoke test?

Run the [README-only drift contrast](examples/readme-drift/README.md):

```text
node examples/readme-drift/run.mjs --execute
```

In a temporary copy of a **synthetic fixture**, both checks pass initially. The runner changes only a command in that fixture's actual `README.md`: its fixed-command smoke test still passes, but QSG reads the changed README and fails at the command's source line. Restoring the README makes both pass again. No installation or network is needed. This demonstrates README binding, **not a real upstream bug, adoption, or a full upstream CI result**; tests that already execute README commands may provide the same coverage.

## Configure your own project

From your project's directory, run the downloaded CLI using its full path:

```text
node /path/to/quickstartguard/dist/cli.js init
```

This creates `qsg.yml` and `quickstart.qsg.md` without overwriting existing files. Replace the starter examples with real commands in your README, then point `file` to that README.

Example README markup (this example is documentation, not an executable block in this repository):

````markdown
```bash qsg=install-linux
npm ci
npm run build
node ./dist/cli.js --help
```

```powershell qsg=install-windows
npm ci
npm run build
node ./dist/cli.js --help
```
````

Example `qsg.yml`:

```yaml
schemaVersion: 1
checks:
  - id: install-linux
    file: README.md
    platform: linux
    shell: bash
    cwd: .
    timeoutSeconds: 120
    expect:
      exitCode: 0
      stdoutContains: ["Usage:"]
      stderrNotContains: ["FATAL"]
  - id: install-windows
    file: README.md
    platform: win32
    shell: pwsh
    expect:
      exitCode: 0
      stdoutContains: ["Usage:"]
```

`file`, `cwd`, and report paths are relative to the **configuration file's directory**, not the invocation directory. Configs support YAML or JSON, but not anchors, aliases, merge keys, custom types, or unknown fields. Each check ID must appear once in config and once in its document. Only top-level fenced blocks are executable; marked blocks in lists/quotes are rejected.

Run:

```text
node /path/to/quickstartguard/dist/cli.js validate
node /path/to/quickstartguard/dist/cli.js run --execute --json-out .qsg/results.json --summary-out .qsg/summary.md
```

All checks are validated; only the real host platform is executed. No selected checks is an error. Checks run serially in separate shell processes. They share the working tree, not shell variables. Commands within a single code block share a shell.

## Reports and exit codes

- Console: pass/fail, ID, source block line range, reason, duration.
- JSON: `--json-out .qsg/results.json`; command output is omitted unless `--include-output` is added.
- Markdown: `--summary-out .qsg/summary.md`.
- GitHub: `--github`, or automatic when `GITHUB_ACTIONS=true`; failures get escaped annotations and `GITHUB_STEP_SUMMARY` gets a summary. No PR comments or write token are needed.

| Exit | Meaning |
|---|---|
| 0 | All selected, actually executed checks passed; or init/validate succeeded |
| 1 | A check failed, timed out, or exceeded output limits |
| 2 | Invalid config, missing shell, parser, filesystem or environment error; or zero selected checks |
| 130 | Interrupted |

Line ranges identify the source code block. They do not claim to identify the exact failing sub-command inside a multi-line shell script. CLI annotations from configs in subfolders are made repository-relative when `GITHUB_WORKSPACE` is available.

## Safety model

`run --execute` executes arbitrary repository commands with your user permissions. **It is not a sandbox.** Run only reviewed code in disposable, credential-free environments. It can access the network and files outside the repo even though QSG's own input paths are confined.

The child environment uses a small OS allowlist; extra variables require `--pass-env NAME`. Shell injection hooks and GitHub workflow control variables cannot be passed. HOME and OS directories remain visible, so local credential files can still be read by executed code. No telemetry or automatic log upload exists in the CLI.

Defaults: 120-second check timeout, 300-second maximum; 64 KiB per output stream (overflow fails and stops the check); explicit `--execute`; no raw output in default reports. Known secret values/formats are redacted best-effort, **not guaranteed**. Review every report before sharing. Tree cleanup is best-effort, not containment against a program intentionally escaping its process group.

See [SECURITY.md](SECURITY.md), [configuration reference](docs/CONFIGURATION.md), and [verification status](docs/VERIFICATION.md).

## Development

For source changes, install development dependencies on a networked machine:

```text
npm ci --ignore-scripts
npm run check
```

`npm test` runs the delivered compiled CLI; **after editing `src/`, always build first or use `npm run check`**. TypeScript and `@types/node` are dev-only. Runtime libraries, versions, backport and license details are in [vendor/README.md](vendor/README.md).

The package is deliberately `private: true` to prevent accidental **npm registry** publication. Local `npm pack` and local installation work. The GitHub Actions matrix on `main` has passed on Ubuntu 24.04 and Windows 2025 with Node.js 22 and 24 ([run evidence](https://github.com/rocktan1996-debug/quickstartguard/actions/runs/39941328349)). This is hosted-runner evidence, not a guarantee for every Windows machine or a full security audit. Name ownership, online dependency audit, fresh dependency installation, and a human-maintainer usability test remain beta/registry release gates. See [release checklist](docs/RELEASE.md) and [public alpha notes](docs/RELEASE_NOTES_v0.1.0-alpha.2.md).

## Self-check examples used by this repo

Linux:

```bash qsg=package-linux
node ./dist/cli.js --version
```

Windows:

```powershell qsg=package-windows
node ./dist/cli.js --version
```

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md). There is no affiliation with OpenAI and no promise of a Codex for Open Source award. Community adoption and maintenance records must be genuine. [Evidence plan](docs/OSS_EVIDENCE.md).

MIT licensed. Third-party notices are included in `vendor/licenses/`.
