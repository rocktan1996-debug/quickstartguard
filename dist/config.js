import { QsgError } from './errors.js';
import { yaml } from './vendor.js';
import { ID_PATTERN, MAX_CONFIG_BYTES } from './types.js';
import { relativePath } from './paths.js';
function object(value, label) {
    if (!value || typeof value !== 'object' || Array.isArray(value)
        || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
        throw new QsgError('CONFIG_SCHEMA', `${label} must be a plain mapping.`);
    }
    return value;
}
function keys(value, allowed, label) {
    for (const key of Object.keys(value))
        if (!allowed.includes(key)) {
            throw new QsgError('CONFIG_SCHEMA', `Unknown field ${label}.${key}`);
        }
}
function string(value, label) {
    if (typeof value !== 'string' || value.length === 0 || value.length > 4096)
        throw new QsgError('CONFIG_SCHEMA', `${label} must be a non-empty string <= 4096 characters.`);
    return value;
}
function number(value, min, max, label) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max)
        throw new QsgError('CONFIG_SCHEMA', `${label} must be an integer in ${min}..${max}.`);
    return value;
}
export function parseConfig(source) {
    if (Buffer.byteLength(source) > MAX_CONFIG_BYTES)
        throw new QsgError('INPUT_SIZE', 'Configuration exceeds 64 KiB.');
    let value;
    let depth = 0;
    try {
        value = yaml.load(source.replace(/^\uFEFF/, ''), {
            schema: yaml.JSON_SCHEMA,
            json: false, // Duplicate mapping keys must be errors, not last-value-wins.
            listener(event, state) {
                if (event === 'open' && ++depth > 32)
                    throw new QsgError('CONFIG_DEPTH', 'YAML nesting exceeds 32.');
                if (event === 'close') {
                    depth--;
                    if (state.anchor != null)
                        throw new QsgError('CONFIG_ANCHOR', 'YAML anchors and aliases are not supported.');
                }
            },
            onWarning(warning) { throw warning; },
        });
    }
    catch (error) {
        if (error instanceof QsgError)
            throw error;
        const e = error;
        const position = e.mark ? ` at line ${e.mark.line + 1}, column ${e.mark.column + 1}` : '';
        throw new QsgError('YAML_PARSE', `${e.reason ?? e.message ?? 'Invalid YAML'}${position}`);
    }
    return validateConfig(value);
}
export function validateConfig(value) {
    const root = object(value, 'config');
    keys(root, ['schemaVersion', 'checks'], 'config');
    if (root.schemaVersion !== 1)
        throw new QsgError('CONFIG_VERSION', 'schemaVersion must be 1.');
    if (!Array.isArray(root.checks) || root.checks.length < 1 || root.checks.length > 100)
        throw new QsgError('CONFIG_CHECKS', 'checks must contain 1..100 items.');
    const ids = new Set();
    const checks = root.checks.map((raw, index) => {
        const label = `checks[${index}]`;
        const item = object(raw, label);
        keys(item, ['id', 'file', 'platform', 'shell', 'cwd', 'timeoutSeconds', 'expect'], label);
        const id = string(item.id, `${label}.id`);
        if (!ID_PATTERN.test(id))
            throw new QsgError('INVALID_ID', `${id}: use a lowercase letter followed by up to 63 letters, digits or hyphens.`);
        if (ids.has(id))
            throw new QsgError('DUPLICATE_ID', `Duplicate check ID: ${id}`);
        ids.add(id);
        if (!['linux', 'win32'].includes(item.platform))
            throw new QsgError('CONFIG_PLATFORM', `${id}: platform must be linux or win32.`);
        const platform = item.platform;
        const shell = platform === 'linux' ? 'bash' : 'pwsh';
        if (item.shell !== shell)
            throw new QsgError('CONFIG_SHELL', `${id}: ${platform} requires shell: ${shell}.`);
        const expectation = object(item.expect ?? {}, `${label}.expect`);
        keys(expectation, ['exitCode', 'stdoutContains', 'stdoutNotContains', 'stderrContains', 'stderrNotContains'], `${label}.expect`);
        const expect = { exitCode: number(expectation.exitCode ?? 0, 0, 255, `${label}.expect.exitCode`) };
        for (const field of ['stdoutContains', 'stdoutNotContains', 'stderrContains', 'stderrNotContains']) {
            if (expectation[field] !== undefined) {
                const values = expectation[field];
                if (!Array.isArray(values) || values.length === 0 || values.length > 32)
                    throw new QsgError('CONFIG_ASSERTION', `${id}: ${field} must be a list of 1..32 strings.`);
                expect[field] = values.map((v, i) => string(v, `${id}.${field}[${i}]`));
            }
        }
        const file = relativePath(string(item.file, `${label}.file`), `${label}.file`);
        if (!/\.(?:md|markdown|mdown)$/i.test(file))
            throw new QsgError('CONFIG_FILE', `${id}: file must be a Markdown file.`);
        const cwd = relativePath(string(item.cwd ?? '.', `${label}.cwd`), `${label}.cwd`);
        return { id, file, platform, shell, cwd, timeoutSeconds: number(item.timeoutSeconds ?? 120, 1, 300, `${label}.timeoutSeconds`), expect };
    });
    return { schemaVersion: 1, checks };
}
//# sourceMappingURL=config.js.map