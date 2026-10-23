# QuickstartGuard v0.1.0-alpha.1 — First public alpha

QuickstartGuard is an opt-in command-line tool that tests explicitly marked README quickstart commands across operating systems.

## Included

- Markdown block selection, strict configuration validation, and `qsg init`
- Bash / PowerShell command execution **only with `--execute`**
- Exit-code and output assertions; process timeout and bounded output
- Console, JSON, Markdown and GitHub Actions summaries / annotations
- TypeScript source, compiled `dist/`, examples, tests and MIT license

## Verified

GitHub Actions on the `main` commit `84dec79` completed successfully for Ubuntu 24.04 and Windows 2025, with Node.js 22 and Node.js 24 (four jobs). See [CI evidence](https://github.com/rocktan1996-debug/quickstartguard/actions/runs/39941328349). Later documentation-only changes do not alter the CLI, but should be checked separately as appropriate.

## Known limits

- This is an **alpha preview**, not a stable release or guarantee of general compatibility.
- Runs actual README commands under the caller's identity. **Not a sandbox**; use only reviewed code in disposable, credential-free environments.
- Validates checked-out source and current runners; not yet a full clean-install test of published binaries.
- npm registry publication is intentionally disabled with `private: true`. There is no npm distribution.
- Independent community adoption, personal Windows hardware tests, broader dependency/security review remain pending.

## Getting started

Download the repository source ZIP, extract, and run with Node.js 22+:

```text
node dist/cli.js --help
node dist/cli.js validate --config fixtures/demo-valid/qsg.yml
node dist/cli.js run --config fixtures/demo-valid/qsg.yml --execute
```

On Windows, actual execution requires PowerShell 7.4+ (`pwsh`). Use Linux Bash on Linux.

Read [README](../README.md), [中文指南](../README.zh-CN.md), and [security information](../SECURITY.md). Report real reproducible problems in GitHub Issues.

This is a voluntary open-source project, not affiliated with OpenAI.
