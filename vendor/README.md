# Vendored parser provenance and maintenance

This offline-runnable alpha includes two MIT-licensed parser distributions. They are **not claimed to be the newest upstream versions**. `node scripts/verify-vendor.mjs` verifies the shipped bytes, not their security.

| File | Origin/version | Local modifications |
|---|---|---|
| `marked.cjs` | Marked 4.0.19, distribution from the installed nbclassic package (`static/components/marked/lib/marked.js`) | Renamed `.js` to `.cjs` for ESM interoperation; lexer bytes unchanged. Only block-token parsing is used, no HTML rendering. |
| `js-yaml.cjs` | js-yaml 4.1.0, a bundled module of the installed JupyterLab distribution | Extracted module, a small bundler-export adapter, and the upstream merge-prototype fix backported. This is **4.1.0 + backport**, not an official 4.1.1 distribution. |

The YAML backport replaces the unsafe `destination[key] = source[key]` in `mergeMappings` with an own-data-property definition when `key === '__proto__'`. Semantics follow upstream commit `383665ff4248ec2192d1274e934462bb30426879`. The original direct-key protection remains intact. A regression test covers the published merge payload. QuickstartGuard additionally uses JSON_SCHEMA (no YAML merge semantics), rejects anchors and unknown schema keys, limits input/depth, and parses in a time/memory-bounded worker.

Sources:
- https://github.com/nodeca/js-yaml/commit/383665ff4248ec2192d1274e934462bb30426879
- https://github.com/nodeca/js-yaml/security/advisories/GHSA-mh29-5h37-fv8m
- https://github.com/markedjs/marked/tree/v4.0.19
- https://github.com/markedjs/marked/security

Full licenses are in `licenses/`. SHA-256 values for both parser distributions and both MIT notices are in `checksums.json`. The verifier requires exactly those four entries with lowercase SHA-256 digests; an empty or incomplete manifest is an error. It resolves files relative to the script, not the current working directory.

When intentionally updating a parser or notice, review the source/license changes and update its digest. If the shipped set changes, update the required set in `scripts/verify-vendor.mjs` and its regression tests too. These checks detect accidental omissions and byte drift; a contributor able to edit both the verifier/manifest and files can change them together. They do not authenticate upstream provenance or establish that a dependency is safe.

## Before public beta

Replace these locally available parser distributions with reviewed, maintained upstream packages and a reproducible bundling step, keep the source mapping and security regression tests, record an SBOM, run an online dependency audit, and re-run both OS CI jobs. Do not remove license notices. Dependabot does not update vendored parser files automatically.

The current development environment could not reach the npm registry to fetch current package tarballs. Bundling makes the shipped CLI and tests usable without an npm download; it is not a claim of a completed dependency security audit.
