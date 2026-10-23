#!/usr/bin/env node
import path from 'node:path';
import { appendFile, realpath } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { QsgError, errorMessage } from './errors.js';
import { loadProjectIsolated } from './isolated-planner.js';
import { selectChecks } from './planner.js';
import { childEnvironment } from './environment.js';
import { preflightShell, runProcess } from './runner.js';
import { evaluate } from './assertions.js';
import { annotation, consoleReport, jsonReport, safeConsole, summaryReport } from './reporters.js';
import { initialise } from './init.js';
import { isInside, reportPath, writeReport } from './paths.js';
import { VERSION } from './types.js';
const HELP = `QuickstartGuard ${VERSION}
Run explicitly selected README quickstarts as regression checks.

Usage:
  qsg init [--config qsg.yml]
  qsg validate [--config qsg.yml]
  qsg run --execute [--config qsg.yml] [options]

Options:
  -c, --config FILE       Configuration; its directory is the workspace root.
      --execute           Required consent to run commands (NOT a sandbox).
      --check ID          Run one check, on the actual host platform only.
      --json-out FILE     Write a JSON report under workspace .qsg/.
      --summary-out FILE  Write Markdown summary under workspace .qsg/.
      --include-output    Include captured output in JSON; may expose secrets.
      --verbose           Show captured output with workflow/control escaping.
      --github            Emit annotations + append GITHUB_STEP_SUMMARY.
      --pass-env NAME     Explicitly pass an extra environment variable; repeatable.
  -h, --help              Show this help.
  -V, --version           Show version.

Exit: 0 all selected checks passed; 1 failed; 2 config/environment error;
      130 interrupted. Zero selected checks is an error, not a pass.
Requirements: Node.js >=22; Bash on Linux or PowerShell >=7.4 on Windows.
`;
async function main() {
    const { values, positionals } = parseArgs({ options: {
            config: { type: 'string', short: 'c', default: 'qsg.yml' }, execute: { type: 'boolean' }, check: { type: 'string' },
            'json-out': { type: 'string' }, 'summary-out': { type: 'string' }, 'include-output': { type: 'boolean' },
            verbose: { type: 'boolean' }, github: { type: 'boolean' }, 'pass-env': { type: 'string', multiple: true },
            help: { type: 'boolean', short: 'h' }, version: { type: 'boolean', short: 'V' },
        }, allowPositionals: true, strict: true });
    if (values.version) {
        console.log(VERSION);
        return 0;
    }
    if (values.help || positionals.length === 0) {
        console.log(HELP);
        return 0;
    }
    if (positionals.length !== 1 || !['init', 'validate', 'run'].includes(positionals[0]))
        throw new QsgError('CLI_USAGE', 'Choose exactly one command: init, validate or run.');
    const command = positionals[0];
    if (command !== 'run' && ['execute', 'check', 'json-out', 'summary-out', 'include-output', 'verbose', 'github', 'pass-env'].some(k => values[k] !== undefined))
        throw new QsgError('CLI_USAGE', 'Execution/report options are only valid for qsg run.');
    if (command === 'init') {
        console.log(safeConsole(`Created ${(await initialise(values.config)).join(' and ')}.\nNext: qsg validate, then qsg run --execute.`));
        return 0;
    }
    if (command === 'run' && !values.execute)
        throw new QsgError('EXECUTION_NOT_APPROVED', 'No commands executed. Review your README first, then add --execute. QuickstartGuard is NOT a sandbox.');
    const project = await loadProjectIsolated(path.resolve(values.config));
    if (command === 'validate') {
        console.log(safeConsole(`VALID ${project.config.checks.length} checks in ${path.basename(project.configPath)}. No commands executed.`));
        for (const warning of project.warnings)
            console.log(safeConsole(`WARNING ${warning}`));
        return 0;
    }
    const selected = selectChecks(project, process.platform, values.check);
    if (values['json-out'])
        await reportPath(project.root, values['json-out'], '.json');
    if (values['summary-out'])
        await reportPath(project.root, values['summary-out'], '.md');
    const env = childEnvironment(process.env, values['pass-env'] ?? []);
    const shellVersion = preflightShell(selected[0].shell, env);
    const github = values.github || process.env.GITHUB_ACTIONS === 'true';
    let filePrefix = '';
    if (github && process.env.GITHUB_WORKSPACE) {
        const workspace = await realpath(process.env.GITHUB_WORKSPACE);
        if (isInside(workspace, project.root))
            filePrefix = path.relative(workspace, project.root).split(path.sep).join('/');
    }
    const report = {
        schemaVersion: 1, tool: { name: 'quickstartguard', version: VERSION }, startedAt: new Date().toISOString(), finishedAt: '',
        platform: process.platform, nodeVersion: process.version, shellVersion, config: path.basename(project.configPath),
        checksConfigured: project.checks.length, checksExecuted: 0, passed: 0, failed: 0, errors: 0, skipped: [], warnings: project.warnings, checks: [],
    };
    for (const check of project.checks)
        if (!selected.includes(check))
            report.skipped.push({ id: check.id, reason: check.platform !== process.platform ? `requires ${check.platform}` : 'not selected by --check' });
    const controller = new AbortController();
    const cancel = () => controller.abort();
    process.once('SIGINT', cancel);
    process.once('SIGTERM', cancel);
    try {
        for (const check of selected) {
            if (controller.signal.aborted) {
                report.skipped.push({ id: check.id, reason: 'interrupted before execution' });
                continue;
            }
            const result = evaluate(check, await runProcess(check, env, controller.signal));
            report.checks.push(result);
            report.checksExecuted++;
            if (result.status === 'pass')
                report.passed++;
            else if (result.status === 'fail')
                report.failed++;
            else
                report.errors++;
        }
    }
    finally {
        process.removeListener('SIGINT', cancel);
        process.removeListener('SIGTERM', cancel);
    }
    report.finishedAt = new Date().toISOString();
    process.stdout.write(consoleReport(report, values.verbose));
    if (values['json-out'])
        await writeReport(project.root, values['json-out'], jsonReport(report, values['include-output']), '.json');
    if (values['summary-out'])
        await writeReport(project.root, values['summary-out'], summaryReport(report), '.md');
    if (github) {
        for (const result of report.checks.filter(c => c.status !== 'pass'))
            console.log(annotation(result, filePrefix));
        if (process.env.GITHUB_STEP_SUMMARY)
            await appendFile(process.env.GITHUB_STEP_SUMMARY, summaryReport(report), { encoding: 'utf8' });
    }
    return controller.signal.aborted ? 130 : report.errors ? 2 : report.failed ? 1 : 0;
}
try {
    process.exitCode = await main();
}
catch (error) {
    console.error(safeConsole(`QSG ${error instanceof QsgError ? error.code : 'ERROR'}: ${errorMessage(error)}`));
    process.exitCode = 2;
}
//# sourceMappingURL=cli.js.map