import { stripVTControlCharacters } from 'node:util';
import { redact } from './environment.js';
import type { CheckResult, RunReport } from './types.js';
export function plain(text: string): string {
  return stripVTControlCharacters(text).replace(/\r\n?/g, '\n').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
}
export function safeConsole(text: string): string {
  // Prefixing is not sufficient: workflow commands can occur mid-line. Break ALL command delimiters.
  return redact(plain(text)).replace(/::/g, ': :');
}
export function escapeData(text: string): string {
  return text.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}
export function escapeProperty(text: string): string {
  return escapeData(text).replace(/:/g, '%3A').replace(/,/g, '%2C');
}
export function annotation(result: CheckResult, filePrefix = ''): string {
  const details = [result.reason, ...result.assertions.filter(a => !a.pass).map(a => a.message), result.message ?? ''].filter(Boolean).join('; ');
  const file = (filePrefix ? `${filePrefix}/` : '') + result.file;
  return `::error file=${escapeProperty(file)},line=${result.startLine},endLine=${result.endLine},title=QuickstartGuard::${escapeData(redact(plain(details)).slice(0,1000))}`;
}
export function consoleReport(report: RunReport, verbose = false): string {
  const lines = [`QuickstartGuard ${report.tool.version} | ${report.platform}`];
  for (const check of report.checks) {
    lines.push(`${check.status.toUpperCase()} ${check.file}:${check.startLine}-${check.endLine}  ${check.id}  ${check.durationMs}ms`);
    if (check.status !== 'pass') {
      lines.push(`  Reason: ${check.reason}`);
      for (const assertion of check.assertions.filter(item => !item.pass)) lines.push(`  ${assertion.message}`);
      if (check.message) lines.push(`  ${check.message}`);
    }
    if (verbose) for (const stream of ['stdout','stderr'] as const) {
      if (check[stream].text) {
        lines.push(`  ${stream}${check[stream].truncated ? ' (truncated)' : ''}:`);
        for (const line of check[stream].text.split(/\r?\n/)) lines.push(`  | ${line}`);
      }
    }
  }
  lines.push(`${report.checksConfigured} configured; ${report.checksExecuted} executed; ${report.passed} passed; ${report.failed} failed; ${report.errors} errors; ${report.skipped.length} skipped.`);
  for (const skipped of report.skipped) lines.push(`SKIP ${skipped.id}: ${skipped.reason}`);
  for (const warning of report.warnings) lines.push(`WARNING ${warning}`);
  return safeConsole(lines.join('\n')) + '\n';
}
function cell(text: string): string {
  return redact(plain(text)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\|/g,'&#124;').replace(/`/g,'&#96;').replace(/\[/g,'&#91;').replace(/\]/g,'&#93;').replace(/\*/g,'&#42;').replace(/\n/g,' ');
}
export function summaryReport(report: RunReport): string {
  const lines = [`## QuickstartGuard ${report.tool.version}`, '',
    `${report.passed} passed / ${report.failed} failed / ${report.errors} errors / ${report.skipped.length} skipped (${report.platform}).`, '',
    '| Check | Source | Result | Duration |', '| --- | --- | --- | --- |'];
  for (const check of report.checks) lines.push(`| ${cell(check.id)} | ${cell(check.file)}:${check.startLine}-${check.endLine} | ${check.status.toUpperCase()} (${cell(check.reason)}) | ${check.durationMs} ms |`);
  for (const check of report.checks.filter(c => c.status !== 'pass')) {
    lines.push('', `**${cell(check.id)}**: ${cell(check.reason)}`);
    for (const item of check.assertions.filter(a => !a.pass)) lines.push(`- ${cell(item.message)}`);
  }
  lines.push('', 'Raw command output is omitted. Checks execute with the runner user’s permissions; QuickstartGuard is not a sandbox.', '');
  return lines.join('\n');
}
export function jsonReport(report: RunReport, includeOutput = false): string {
  const serialised = {
    ...report,
    outputIncluded: includeOutput,
    checks: report.checks.map(check => ({...check,
      stdout: {bytesSeen: check.stdout.bytesSeen, truncated: check.stdout.truncated, ...(includeOutput ? {text: check.stdout.text} : {})},
      stderr: {bytesSeen: check.stderr.bytesSeen, truncated: check.stderr.truncated, ...(includeOutput ? {text: check.stderr.text} : {})},
    })),
  };
  // Redact values BEFORE JSON.stringify: substitution must never break JSON escaping.
  const clean = (value: unknown): unknown => {
    if (typeof value === 'string') return redact(plain(value));
    if (Array.isArray(value)) return value.map(clean);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,clean(v)]));
    return value;
  };
  return JSON.stringify(clean(serialised), null, 2) + '\n';
}
