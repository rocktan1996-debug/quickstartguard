import path from 'node:path';
import { QsgError } from './errors.js';
const ALLOWED = new Set(['PATH', 'PATHEXT', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'TEMP', 'TMP', 'TMPDIR',
    'HOME', 'USERPROFILE', 'HOMEDRIVE', 'HOMEPATH', 'APPDATA', 'LOCALAPPDATA', 'PROGRAMDATA',
    'PROGRAMFILES', 'PROGRAMFILES(X86)', 'PROGRAMW6432', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TZ']);
const FORBIDDEN = /^(GITHUB_|ACTIONS_|RUNNER_|BASH_ENV$|ENV$|NODE_OPTIONS$|NODE_PATH$|SHELLOPTS$|BASHOPTS$|CDPATH$)/i;
export function childEnvironment(parent, pass = []) {
    const result = {};
    const pathKey = process.platform === 'win32' ? 'Path' : 'PATH';
    for (const [name, value] of Object.entries(parent)) {
        if (value === undefined || !ALLOWED.has(name.toUpperCase()))
            continue;
        if (name.toUpperCase() === 'PATH')
            result[pathKey] = value;
        else
            result[name] = value;
    }
    for (const name of pass) {
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || FORBIDDEN.test(name))
            throw new QsgError('ENV_DENIED', `Cannot pass environment variable: ${name}`);
        const actual = process.platform === 'win32' ? Object.keys(parent).find(k => k.toUpperCase() === name.toUpperCase()) : name;
        if (!actual || parent[actual] === undefined)
            throw new QsgError('ENV_MISSING', `Requested environment variable is not set: ${name}`);
        if (name.toUpperCase() === 'PATH')
            result[pathKey] = parent[actual];
        else
            result[actual] = parent[actual];
    }
    result[pathKey] = [path.dirname(process.execPath), result[pathKey]].filter(Boolean).join(path.delimiter);
    result.CI = 'true';
    result.NO_COLOR = '1';
    result.TERM = 'dumb';
    return result;
}
export function redact(text, env = process.env) {
    let output = text;
    const secrets = Object.entries(env).filter(([key, value]) => /token|secret|password|credential|api.?key|authorization/i.test(key) && value && value.length >= 6)
        .map(([, value]) => value).sort((a, b) => b.length - a.length);
    for (const secret of secrets)
        output = output.split(secret).join('[REDACTED]');
    output = output.replace(/\b(?:gh[pousr]_[A-Za-z0-9_]{16,}|github_pat_[A-Za-z0-9_]{16,}|sk-[A-Za-z0-9_-]{16,})\b/g, '[REDACTED]');
    return output;
}
//# sourceMappingURL=environment.js.map