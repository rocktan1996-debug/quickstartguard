import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { OUTPUT_LIMIT } from './types.js';
import { QsgError, errorMessage } from './errors.js';
export function preflightShell(shell, env) {
    const args = shell === 'bash' ? ['--version'] : ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', '$PSVersionTable.PSVersion.ToString()'];
    const result = spawnSync(shell, args, { encoding: 'utf8', env, timeout: 5000, windowsHide: true, maxBuffer: 65536 });
    if (result.error || result.status !== 0)
        throw new QsgError('SHELL_UNAVAILABLE', `${shell} could not start. ${shell === 'pwsh' ? 'Install PowerShell 7.4 or newer; Windows PowerShell 5.1 is not supported.' : 'Install Bash and add it to PATH.'}`);
    const version = (result.stdout ?? '').trim().split(/\r?\n/)[0] ?? '';
    if (shell === 'pwsh') {
        const match = /^(\d+)\.(\d+)/.exec(version);
        if (!match || +match[1] < 7 || (+match[1] === 7 && +match[2] < 4))
            throw new QsgError('SHELL_VERSION', 'PowerShell 7.4 or newer is required for reliable native-command failure handling.');
    }
    return version;
}
export function shellScript(shell, code) {
    if (shell === 'bash')
        return `#!/usr/bin/env bash\nset -euo pipefail\n${code}\n`;
    return `$ErrorActionPreference = 'Stop'\n$PSNativeCommandUseErrorActionPreference = $true\n$ProgressPreference = 'SilentlyContinue'\n$PSStyle.OutputRendering = 'PlainText'\ntry {\n${code}\n} catch {\n  [Console]::Error.WriteLine($_.ToString())\n  if ($_.Exception -is [System.Management.Automation.NativeCommandExitException]) {\n    exit $_.Exception.ExitCode\n  }\n  exit 1\n}\nexit 0\n`;
}
export class OutputCapture {
    limit;
    chunks = [];
    retained = 0;
    bytesSeen = 0;
    constructor(limit = OUTPUT_LIMIT) {
        this.limit = limit;
    }
    add(chunk) {
        this.bytesSeen += chunk.length;
        const remaining = Math.max(0, this.limit - this.retained);
        if (remaining > 0) {
            const keep = chunk.subarray(0, remaining);
            this.chunks.push(keep);
            this.retained += keep.length;
        }
        return this.bytesSeen > this.limit;
    }
    finish() {
        return { text: Buffer.concat(this.chunks).toString('utf8'), bytesSeen: this.bytesSeen, truncated: this.bytesSeen > this.limit };
    }
}
async function killWindowsTree(pid) {
    const systemRoot = process.env.SystemRoot ?? process.env.SYSTEMROOT ?? 'C:\\Windows';
    const executable = path.join(systemRoot, 'System32', 'taskkill.exe');
    await new Promise(resolve => {
        const killer = spawn(executable, ['/PID', String(pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
        const timeout = setTimeout(() => { killer.kill(); resolve(); }, 3000);
        const done = () => { clearTimeout(timeout); resolve(); };
        killer.once('error', done);
        killer.once('close', done);
    });
}
function killPosixGroup(pid, signal) {
    try {
        process.kill(-pid, signal);
    }
    catch (error) {
        if (error.code !== 'ESRCH') {
            try {
                process.kill(pid, signal);
            }
            catch { }
        }
    }
}
export async function runProcess(check, env, signal) {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'qsg-'));
    const script = path.join(directory, check.shell === 'bash' ? 'check.sh' : 'check.ps1');
    await writeFile(script, shellScript(check.shell, check.block.code), { encoding: 'utf8', mode: 0o600 });
    const start = performance.now();
    try {
        return await new Promise(resolve => {
            const stdout = new OutputCapture(), stderr = new OutputCapture();
            let reason = 'completed';
            let settled = false;
            let spawnError;
            let forced;
            let escalation;
            let cleanup = Promise.resolve();
            const args = check.shell === 'bash' ? ['--noprofile', '--norc', script] : ['-NoLogo', '-NoProfile', '-NonInteractive', '-File', script];
            const child = spawn(check.shell, args, {
                cwd: check.absoluteCwd, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
                detached: process.platform !== 'win32',
            });
            const finish = (code, exitSignal) => {
                if (settled)
                    return;
                settled = true;
                clearTimeout(timeout);
                if (forced)
                    clearTimeout(forced);
                if (escalation)
                    clearTimeout(escalation);
                signal?.removeEventListener('abort', abort);
                if (child.pid && process.platform !== 'win32')
                    killPosixGroup(child.pid, 'SIGKILL');
                child.stdout?.destroy();
                child.stderr?.destroy();
                void cleanup.finally(() => resolve({ reason, exitCode: code, signal: exitSignal,
                    durationMs: Math.round(performance.now() - start), stdout: stdout.finish(), stderr: stderr.finish(), ...(spawnError ? { error: spawnError } : {}) }));
            };
            const stop = (cause) => {
                if (settled || reason !== 'completed')
                    return;
                reason = cause;
                if (child.pid) {
                    if (process.platform === 'win32')
                        cleanup = killWindowsTree(child.pid);
                    else {
                        killPosixGroup(child.pid, 'SIGTERM');
                        escalation = setTimeout(() => { if (child.pid)
                            killPosixGroup(child.pid, 'SIGKILL'); }, 250);
                    }
                }
                // A process may escape the tree or retain a pipe. Always bound the controller's wait.
                forced = setTimeout(() => { try {
                    child.kill('SIGKILL');
                }
                catch { } finish(null, 'SIGKILL'); }, 4000);
            };
            const abort = () => stop('cancelled');
            const timeout = setTimeout(() => stop('timeout'), check.timeoutSeconds * 1000);
            child.stdout?.on('data', (chunk) => { if (stdout.add(chunk))
                stop('output_limit'); });
            child.stderr?.on('data', (chunk) => { if (stderr.add(chunk))
                stop('output_limit'); });
            child.once('error', error => { spawnError = errorMessage(error); reason = 'spawn_error'; finish(null, null); });
            child.once('close', (code, exitSignal) => finish(code, exitSignal));
            signal?.addEventListener('abort', abort, { once: true });
            if (signal?.aborted)
                abort();
        });
    }
    finally {
        await rm(directory, { recursive: true, force: true });
    }
}
//# sourceMappingURL=runner.js.map