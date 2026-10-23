# Configuration reference — schemaVersion 1

## Commands

`init` creates two starter files, refusing collisions. `validate` parses all configured Markdown, checks IDs/languages/paths, and executes no script. `run --execute` performs the same validation, selects the host platform, checks the shell version, then runs checks serially. `--check ID` filters after all configuration has been validated.

## Check fields

| Field | Required | Values / default |
|---|---|---|
| id | yes | `[a-z][a-z0-9-]{0,63}`; unique in config |
| file | yes | Workspace-relative `.md`, `.markdown` or `.mdown` path; use `/` |
| platform | yes | `linux` or `win32` |
| shell | yes | `bash` for Linux, `pwsh` for Windows |
| cwd | no | `.`; existing directory inside config root |
| timeoutSeconds | no | integer 1..300; default 120 |
| expect.exitCode | no | integer 0..255; default 0 |
| expect.stdoutContains | no | 1..32 non-empty literal strings |
| expect.stdoutNotContains | no | 1..32 non-empty literal strings |
| expect.stderrContains | no | 1..32 non-empty literal strings |
| expect.stderrNotContains | no | 1..32 non-empty literal strings |

Assertions are literal substring checks, not regexes. ANSI sequences are removed and CRLF/CR are normalised to LF before matching. Specified expected strings are normalised the same way. A timeout, cancellation, spawn error or output overflow cannot pass even if the captured exit code/output would otherwise match.

A block must have an explicit closing fence and non-empty body. Bash, powershell and pwsh fence language labels are accepted; shell matching is enforced. Marked blocks in lists and quotes are rejected to avoid accidentally running illustrative content. Inline snippets, HTML comments and unmarked fences are not run. Unconfigured marked blocks warn and remain unexecuted.

## Workspace and resource boundaries

The real configuration file's parent is the root. Markdown source and cwd reject absolute paths, drive-relative paths, traversal, backslashes and symlinks that resolve outside this root. This constrains QSG's inputs; shell commands are not restricted to that root.

Maximum config: 64 KiB. Maximum Markdown document: 512 KiB. Maximum individual script: 64 KiB. 1..100 configured checks. YAML nesting: 32. Input planning runs in a worker with a 5-second time limit and a 96 MiB old-generation heap limit; these limits are not a complete process memory limit.

Maximum retained stdout and stderr: 64 KiB **each**. Exceeding either limit terminates the check and fails it. JSON records bytes observed; they may increase briefly while termination completes. No regex assertions means no user-configured regex execution.

## Execution semantics

Bash is started without profile/rc files and begins with `set -euo pipefail`. Normal Bash conditional/pipeline semantics still apply; scripts may intentionally override their settings. Windows uses `pwsh -NoLogo -NoProfile -NonInteractive -File`, `$ErrorActionPreference='Stop'`, and native-command error handling supported by PowerShell 7.4+. Native nonzero exit codes caught by the wrapper are retained; ordinary PowerShell exceptions map to exit 1.

stdin is closed; interactive quickstarts are unsupported. Each check gets a new shell process and a private temporary script file. The project working tree is shared between checks. There is no clean-install provisioning or cross-check shell-variable persistence. Avoid destructive commands, services, detached processes, privilege elevation and interactive prompts.

## Environment and reports

Only OS basics (PATH, home, temporary directories, locale, Windows system directories) are inherited. The current Node executable directory is prepended to PATH. CI=true, NO_COLOR=1 and TERM=dumb are set. Use repeatable `--pass-env NAME` for additional variables. GitHub/Actions/Runner command channels, BASH_ENV, ENV, NODE_OPTIONS, NODE_PATH, SHELLOPTS, BASHOPTS and CDPATH cannot be passed.

Reports must be placed under `.qsg/` with `.json` or `.md` suffixes. Existing report files may be overwritten; no symlink components are allowed. They are written with restrictive file mode where supported. This is not an ACL or race-proof sandbox. GitHub Summary uses the parent process's `GITHUB_STEP_SUMMARY` path without passing it to the child.

There is no `--platform` simulation flag: Linux cannot be used to claim a Windows test run.
