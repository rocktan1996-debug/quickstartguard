# Implemented architecture

`CLI → isolated planner worker → YAML/config validation + Markdown block AST → file/cwd checks → host check selection → shell preflight → serial runner → assertions → console/JSON/Markdown/GitHub reporters`.

The planner's worker performs no README execution. It reads bounded UTF-8 inputs and returns plain structured data. Runtime scripts are temporary files, not command strings interpolated into another shell. `spawn` launches Bash/PowerShell directly. Each shell sees a filtered environment and closed stdin.

Modules: `config.ts` enforces schema; `markdown.ts` maps top-level block tokens to source ranges; `paths.ts` enforces input/report paths; `planner.ts` validates references; `isolated-planner.ts` controls parser resource limits; `runner.ts` handles scripts, pipes and cancellation; `assertions.ts` evaluates outcomes; `reporters.ts` separates raw captured data from user-visible reporting; `init.ts` creates a non-overwriting starter; `cli.ts` handles flags and exit status.

Tests use Node's built-in test runner rather than Vitest. Compiling uses tsc rather than a bundler. No server, database, SaaS account or OpenAI API integration exists. These are deliberate implementation simplifications from the earlier product plan.

Runtime parser distributions are vendored for offline operation. This differs from the planned remark/yaml npm dependency stack: the current package uses Marked's block AST and a restricted js-yaml loader, with explicit provenance and a security fix backport. Public beta must replace this with a reproducible reviewed upstream dependency build.

Data is local except where a configured command itself talks to the network or GitHub Actions displays a requested summary. Captured output is discarded from default JSON. Metrics and timestamps describe this run only.
