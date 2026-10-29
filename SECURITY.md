# Security model and reporting

QuickstartGuard is a command runner, **not a sandbox or security scanner**. `run --execute` grants README scripts the caller's process permissions. Review the configuration, Markdown and repository before executing. Use disposable hosted runners with no valuable credentials; never use a self-hosted runner for arbitrary external PR code.

Default environment filtering does not hide credential files, prevent networking, prevent filesystem writes, prevent reading another process, or stop a malicious program from escaping its process group. HOME is available for tool compatibility. Tree killing is best-effort; Windows descendants and detached/session-changing processes require OS-level isolation for guarantees.

Defences implemented: explicit execution consent; strict typed config; source-path containment; top-level marked fences only; bounded parser worker; script/time/output bounds; fail-fast shells; filtered child environment; no raw output in default reports; best-effort redaction; escaped annotations; no CLI telemetry; generated reports confined to `.qsg/`.

Use GitHub `pull_request` with `contents: read`, `persist-credentials: false`, and no referenced secrets. Do not execute untrusted PR contents via `pull_request_target` or a privileged `workflow_run`. CI tokens, artifacts and shared infrastructure are not neutralised merely by these settings. Require maintainer review/approval for outside contributions.

Raw stdout/stderr may contain secrets, commands or private paths. `--verbose` and `--include-output` are deliberate opt-ins. Known patterns/environment values are redacted only best-effort. Never assume a report is safe to post without reviewing it. Don't upload `.qsg/` automatically.

Vendored parsers have recorded provenance and one upstream YAML security backport. See `vendor/README.md`; a current online dependency audit and reproducible upstream upgrade remain public-beta gates (tracked in issue #8).

## Reporting

The public repository is https://github.com/rocktan1996-debug/quickstartguard. A private security contact and GitHub private vulnerability reporting still need maintainer verification before public beta. Do not post credentials or an operational exploit against a third party. For now, notify the project owner privately using your existing contact channel.

Supported security-review target: 0.1.0-alpha.2. No production support/SLA is implied.
