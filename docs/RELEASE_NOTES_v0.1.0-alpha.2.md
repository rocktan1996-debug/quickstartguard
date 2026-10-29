# QuickstartGuard v0.1.0-alpha.2 — Maintenance preview

GitHub prerelease only; `private: true` remains set. No npm publication.

## Changes

- #9: reject report destinations that are directories, or have non-directory parents, before executing README commands. Existing regular-file overwrite and symlink protections remain.
- #10: require the complete vendored parser/license manifest with valid SHA-256 values. Parser bytes and dependency versions are unchanged; this is integrity verification, not a security audit.
- #11: offline, opt-in synthetic README-drift demonstration. A README-only typo leaves a fixed smoke test green while the README-bound check fails; restoration returns both to green. This is invented test evidence, not real upstream adoption or a reported upstream defect.
- Updated package, lockfile, CLI version, compiled output and bilingual entry points together.

## Verification and use

The release integration must pass `npm run check`, shipped-dist consistency, README validation/self-check, package extraction and the hosted Ubuntu 24.04 / Windows 2025 × Node 22/24 matrix before publication. Exact final run links and counts are recorded in the GitHub release, not inferred from earlier individual PR runs. There is no separate lint script; TypeScript compilation and the repository test suite are the configured checks.

Download the tagged source ZIP, extract, and use Node.js 22+:

```text
node dist/cli.js --version
node dist/cli.js validate --config fixtures/demo-valid/qsg.yml
node dist/cli.js run --config fixtures/demo-valid/qsg.yml --execute
node examples/readme-drift/run.mjs --execute
```

On Windows, execution additionally needs PowerShell 7.4+ (`pwsh`). No development dependency installation is needed to run the included CLI.

## Limits / 边界

This remains an alpha, not beta/stable software. README scripts run with the caller's permissions: **not a sandbox**. Vendor provenance/reproducible build/SBOM/security audit remains incomplete in [#8](https://github.com/rocktan1996-debug/quickstartguard/issues/8). Hosted Windows coverage is not personal-hardware acceptance. No independent adoption or complete security audit is claimed.

本版仅为 GitHub Alpha 维护预览：提前拒绝无效报告路径、补全解析库及许可证的完整性校验，并加入明确标为人工构造的 README 漂移演示。没有 npm 发布、真实上游缺陷或社区采用声明。安全审计与可重现依赖构建仍未完成；执行 README 命令不是沙箱操作。
