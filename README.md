# QuickstartGuard

**Publication in progress — full source code is not uploaded yet.**

QuickstartGuard is an opt-in CLI for testing explicitly marked README quickstarts on Windows (PowerShell) and Linux (Bash).

The first locally built alpha is `v0.1.0-alpha.1`. It includes TypeScript source, compiled `dist/`, test fixtures, offline parsers, and GitHub Actions workflows. The public repository is **not a usable release until these files are pushed**.

## Intended behavior

- `qsg validate`: parse and validate configuration without running code.
- `qsg run --execute`: explicitly run selected README command blocks.
- Failures report the README block location, assertion errors and execution status.

## Safety

Executing README commands runs arbitrary code with the current user's privileges. It is **not a sandbox**. Only run trusted commands in disposable environments without credentials. Do not use privileged PR workflow contexts for executing untrusted contributions.

## Release status

Windows execution has not been verified on an actual Windows runner. Do not treat the local Linux tests as Windows verification. No npm package is published yet.

License: MIT.
