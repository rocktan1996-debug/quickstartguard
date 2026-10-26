# Vendor integrity coverage — 2026-10-26

## Scope and reproduced gap

Based on main `d2730965a5d2a85c51deb28ff679531bc0cacf86`, independent of draft PR #9 and the x424 pilot. This is a bounded integrity-check improvement related to issue #8, not its completion or a parser upgrade.

The previous verifier iterated whatever keys the checksum manifest supplied. `{}` or a manifest omitting a parser therefore exited successfully without checking all shipped parser bytes. The two required MIT notices were not covered by the committed manifest either.

## Change

Require an object with exactly the four known parser/license paths and valid lowercase SHA-256 values before reading any listed files. Iterate the independent required set, rejecting omissions, unexpected/path-like keys and malformed values. Add hashes of the unchanged MIT notices; leave parser bytes and existing parser hashes unchanged. The verifier remains usable offline and independent of cwd.

25 isolated-copy regression tests cover valid input, empty/non-object manifests, omission of each required entry, unexpected keys, malformed digests, mutation of each parser/notice and missing files. Against the previous verifier, 16 tests failed and 9 passed; all 25 pass with the fix. The empty/omitted manifest cases demonstrate the original false-success behaviour; other failures cover improved validation diagnostics.

## Verification and limits

Local environment: Linux, Node.js 24.22.1. `npm ci --ignore-scripts --cache /tmp/qsg-npm-cache`, `npm run check` (143 passed, 0 failed, 0 skipped), rebuilt-dist consistency, README validate/self-check and `npm pack --ignore-scripts` all passed. Hosted CI results are recorded in the draft PR after execution. Local success is not Windows evidence.

The first dependency-install attempt could not create the default `/home/agent/.npm` cache; installation was retried with a writable temporary cache. No dependency versions, lockfile, runtime source/dist, workflows, consent checks, or `private: true` settings are changed.

This detects accidental integrity-coverage regressions, not malicious coordinated edits to the verifier/manifest/files. Exact upstream artifact recovery, a reproducible maintained-parser build, SBOM and online vendored-dependency security review remain open in #8. No security-audit, release or merge claim is made.
