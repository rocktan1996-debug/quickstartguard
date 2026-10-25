# Report-path preflight maintenance — 2026-10-25

## Problem and scope

Based on main commit `d2730965a5d2a85c51deb28ff679531bc0cacf86`.
When `.qsg/results.json` or `.qsg/summary.md` was an existing directory,
`reportPath` accepted the path. `run --execute` then executed the README before
report writing failed. Both new regression tests reproduced the unwanted
command side effect against the previously shipped CLI.

This change is limited to report-path type validation. Existing destination
objects must be regular files; existing parent components must be directories.
The CLI now reports `INVALID_REPORT_PATH_TYPE` during its existing preflight,
before any README commands run. Symlink rejection remains first; missing nested
paths and overwriting existing regular report files remain supported.

This is not sandboxing, a complete writable-permission check, or elimination of
filesystem race conditions. Paths can still change after preflight; write-time
checks remain in place. No timeout, environment filtering or execution-consent
behavior was changed.

## Validation

- Before the fix: both added directory-destination CLI regressions failed because
  the README's sentinel file was actually created.
- After rebuilding: `npm run check` passed vendor checks, TypeScript compilation
  and all 125 tests on local Linux / Node 24.22.1 (0 failures, 0 skipped).
- New coverage includes JSON and Markdown directory destinations, non-directory
  parents, existing regular-file overwrites, and missing nested destinations.
- `dist/paths.js` and its source map were regenerated from `src/paths.ts`.
- Hosted Windows/Linux results must be read from the pull request's exact-commit
  CI checks; local Linux tests alone do not establish Windows acceptance.

### Hosted test correction

The first hosted run on commit `3e05ba5` passed the new CLI regressions but found
that the direct path unit test supplied a noncanonical Windows temporary root.
Production obtains its root through `realpath`; the unit fixture now does the
same. No production containment check was relaxed. Final hosted acceptance is
recorded against the final PR head, not inferred from that initial failed run.

## Boundaries

This maintenance branch does not merge or modify the isolated x424 pilot. It
makes no upstream adoption claim, publishes no npm package, and does not change
`private: true`, vendored parser bytes, runtime dependencies or CI permissions.
The change is proposed for review, not merged or released.
