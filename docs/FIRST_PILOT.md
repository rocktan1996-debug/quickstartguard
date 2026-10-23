# First external pilot — maintainer checklist

QuickstartGuard helps catch regressions in explicitly selected README commands. The current public release candidate is `0.1.0-alpha.1`, and [main-branch CI](https://github.com/rocktan1996-debug/quickstartguard/actions/runs/39975800070) passed on Windows 2025 and Ubuntu 24.04, both Node.js 22/24.

## What a pilot maintainer does

1. Review [SECURITY.md](../SECURITY.md). Only proceed if your README commands are trusted and safe to run without secrets.
2. Start with `node dist/cli.js validate` on your own QSG clone; this does not execute commands.
3. Mark only one **noninteractive, non-destructive** README command block with `qsg=check-name`, and add a matching entry to `qsg.yml`. See [configuration reference](CONFIGURATION.md).
4. Run it locally in a disposable checkout and verify that the result is meaningful before introducing CI.
5. Copy [pilot workflow](../examples/consumer.workflow.yml) to `.github/workflows/quickstart.yml` in your own repository. It pins a reviewed commit instead of floating to `main`. Ensure your workflow paths and required toolchain match your project.
6. Inspect CI on Windows and Ubuntu. Report failures using a redacted public reproduction; do not upload private logs.

## What would count as success?

- The project's own maintainer agrees the check is useful and keeps it enabled.
- A real installation or startup regression is detected and repaired.
- The maintainer confirms the setup cost and remaining gaps.

No stars, installs or adoption are claimed in advance.

## Constraints

GitHub-hosted runners are not entirely clean OS images. Scripts execute with runner privileges; QSG is not a sandbox. The sample workflow intentionally avoids secrets and `pull_request_target`, and triggers on manual dispatch plus trusted pushes only. Do not point it at an unreviewed branch.

Feedback: [open a bug or discussion request](https://github.com/rocktan1996-debug/quickstartguard/issues/new/choose) or share a reviewed public issue link.
