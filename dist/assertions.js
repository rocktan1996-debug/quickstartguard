import { stripVTControlCharacters } from 'node:util';
export function normaliseOutput(text) {
    return stripVTControlCharacters(text).replace(/\r\n?/g, '\n');
}
export function evaluate(check, result) {
    const assertions = [{ kind: 'exitCode', pass: result.exitCode === check.expect.exitCode,
            message: `Expected exit code ${check.expect.exitCode}; received ${result.exitCode === null ? 'none' : result.exitCode}.` }];
    for (const field of ['stdoutContains', 'stdoutNotContains', 'stderrContains', 'stderrNotContains']) {
        const text = normaliseOutput(field.startsWith('stdout') ? result.stdout.text : result.stderr.text);
        const absent = field.includes('NotContains');
        for (const expected of check.expect[field] ?? []) {
            const contains = text.includes(normaliseOutput(expected));
            assertions.push({ kind: field, pass: absent ? !contains : contains,
                message: `${field}: ${absent ? 'must not include' : 'must include'} ${JSON.stringify(expected)}` });
        }
    }
    const pass = result.reason === 'completed' && assertions.every(item => item.pass);
    return {
        id: check.id, file: check.file, platform: check.platform, shell: check.shell,
        startLine: check.block.startLine, endLine: check.block.endLine,
        status: result.reason === 'spawn_error' ? 'error' : pass ? 'pass' : 'fail',
        reason: result.reason !== 'completed' ? result.reason : pass ? 'passed' : 'assertion_failed',
        durationMs: result.durationMs, exitCode: result.exitCode, signal: result.signal,
        assertions, stdout: result.stdout, stderr: result.stderr, ...(result.error ? { message: result.error } : {}),
    };
}
//# sourceMappingURL=assertions.js.map