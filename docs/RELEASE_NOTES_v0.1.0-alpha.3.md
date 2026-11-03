# QuickstartGuard v0.1.0-alpha.3 — Bounded input reads

GitHub prerelease only; `private: true` remains set. No npm registry publication.

## Changes

Configuration and Markdown reads now retain at most their configured byte limit plus one detection byte. Previously, a file that grew after its metadata check could be read into memory in full before the size violation was reported. The reader now checks the opened file, handles short reads, rejects excess bytes and invalid UTF-8, and closes its handle on success or failure. The existing 64 KiB configuration / 512 KiB Markdown limits and isolated parser worker are unchanged.

Eight additional regressions cover empty/below-limit/exact-limit input, UTF-8 byte boundaries and BOMs, invalid bytes and file types, short reads splitting multibyte characters, and deterministic growth after metadata checks. The growth regression verifies that only limit + 1 bytes are retained/read and the file handle closes.

## Verification and use

Publication requires `npm run check`, rebuilt-dist consistency, README validation/self-check, extracted package execution, independent static review and hosted Ubuntu 24.04 / Windows 2025 × Node 22/24 CI on the final commit. The GitHub release records actual run links and counts. Existing local pinned development dependencies can run the checks; a clean offline reinstall was unavailable because the npm cache lacked the locked archive. Hosted CI performs a fresh locked installation.

Download the tagged source ZIP for the entire project, including tests. With Node.js 22+:

```text
node dist/cli.js --version
node dist/cli.js validate --config fixtures/demo-valid/qsg.yml
node dist/cli.js run --config fixtures/demo-valid/qsg.yml --execute
node examples/readme-drift/run.mjs --execute
```

Windows execution requires PowerShell 7.4+ (`pwsh`). Shipped CLI execution does not require installing development dependencies.

## Limits / 边界

This is an Alpha, not beta or stable software, and is **not a sandbox**. README commands run with the caller's permissions. Bounded input reads do not provide atomic filesystem snapshots or race-proof path containment. Vendor reproducibility, SBOM and a complete dependency security audit remain pending in [#8](https://github.com/rocktan1996-debug/quickstartguard/issues/8). Hosted Windows CI is not personal-hardware acceptance. Static review is not a security audit; no community adoption is claimed.

本版优化配置与 Markdown 文件读取：即使文件在大小检查后增长，也最多保留限制加一个检测字节；补充短读、UTF-8、字节边界和增长回归。仍是 GitHub Alpha 预览版，不发布 npm，不是沙箱，也不声称完成安全审计。
