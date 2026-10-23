export const VERSION = '0.1.0-alpha.1';
export const ID_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
export const MAX_CONFIG_BYTES = 64 * 1024;
export const MAX_MARKDOWN_BYTES = 512 * 1024;
export const MAX_SCRIPT_BYTES = 64 * 1024;
export const OUTPUT_LIMIT = 64 * 1024;
export type Platform = 'linux' | 'win32';
export type Shell = 'bash' | 'pwsh';
export interface Expectation {
  exitCode: number;
  stdoutContains?: string[];
  stdoutNotContains?: string[];
  stderrContains?: string[];
  stderrNotContains?: string[];
}
export interface Check {
  id: string;
  file: string;
  platform: Platform;
  shell: Shell;
  cwd: string;
  timeoutSeconds: number;
  expect: Expectation;
}
export interface Config { schemaVersion: 1; checks: Check[] }
export interface CodeBlock {
  id: string; language: string; code: string;
  fenceLine: number; startLine: number; endLine: number;
}
export interface PlannedCheck extends Check {
  absoluteFile: string; absoluteCwd: string; block: CodeBlock;
}
export interface Project {
  root: string; configPath: string; config: Config; checks: PlannedCheck[];
  warnings: string[];
}
export interface Capture {
  text: string; bytesSeen: number; truncated: boolean;
}
export type RunReason = 'completed' | 'timeout' | 'output_limit' | 'spawn_error' | 'cancelled';
export interface ProcessResult {
  reason: RunReason; exitCode: number | null; signal: string | null;
  durationMs: number; stdout: Capture; stderr: Capture; error?: string;
}
export interface Assertion {
  kind: keyof Expectation; pass: boolean; message: string;
}
export interface CheckResult {
  id: string; file: string; platform: Platform; shell: Shell;
  startLine: number; endLine: number;
  status: 'pass' | 'fail' | 'error'; reason: string;
  durationMs: number; exitCode: number | null; signal: string | null;
  assertions: Assertion[]; stdout: Capture; stderr: Capture; message?: string;
}
export interface RunReport {
  schemaVersion: 1;
  tool: { name: 'quickstartguard'; version: string };
  startedAt: string; finishedAt: string; platform: string;
  nodeVersion: string; shellVersion: string;
  config: string;
  checksConfigured: number; checksExecuted: number;
  passed: number; failed: number; errors: number;
  skipped: { id: string; reason: string }[];
  warnings: string[]; checks: CheckResult[];
}
