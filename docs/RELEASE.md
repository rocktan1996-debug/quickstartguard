# Release checklist

## Local alpha (this delivery)

Compiled CLI, TypeScript source, tests, fixtures, lockfile, vendored runtime libraries and licenses are included. `private: true` intentionally blocks accidental registry publication. A local tarball can still be packed and installed.

```text
node scripts/verify-vendor.mjs
npm run check
npm pack --ignore-scripts
```

On a machine without development dependencies, run `node scripts/test.mjs` against the included dist. This is not a substitute for rebuilding changed source.

## Public beta gates

- [x] GitHub-hosted Windows 2025 + Ubuntu 24.04; Node 22 and 24 matrix green ([main run #39941328349](https://github.com/rocktan1996-debug/quickstartguard/actions/runs/39941328349)). Individual Windows hardware coverage remains to be established.
- Clean `npm ci --ignore-scripts` from the locked versions; online dependency review/audit.
- Reproducible upstream parser bundling and license/SBOM review; preserve the YAML security test.
- Review pinned GitHub Actions revisions against the then-current security advisories; Dependabot enabled.
- Validate npm tarball installation in a separate directory, including files with spaces/Unicode.
- Name/trademark/package availability checked; maintainer/repository/security contact filled in.
- No personal data, logs, credentials, node_modules or private original plans in the archive.
- A human maintainer has followed the README without coaching.
- Owner explicitly approves GitHub push/npm publication and removing private:true.

The included package-build workflow produces an artifact, not a GitHub Release or npm publication. It has no publishing credentials. A tag is not evidence that the Windows job passed: the package build is made dependent on the verification workflow.
