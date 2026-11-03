import path from 'node:path';
import { lstat, mkdir, open, realpath, stat, writeFile } from 'node:fs/promises';
import { QsgError } from './errors.js';
export function isInside(root, candidate) {
    const rel = path.relative(root, candidate);
    return rel === '' || (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel));
}
export function relativePath(value, label) {
    if (!value || /[\x00-\x1f\x7f]/.test(value) || path.posix.isAbsolute(value) || path.win32.isAbsolute(value)
        || /^[a-z]:/i.test(value) || value.includes(':') || value.includes('\\')) {
        throw new QsgError('INVALID_PATH', `${label} must be a relative path using forward slashes.`);
    }
    if (value.split('/').includes('..'))
        throw new QsgError('PATH_ESCAPE', `${label} must not contain '..'.`);
    return value;
}
export async function insideExisting(root, value, kind) {
    relativePath(value, kind);
    const lexical = path.resolve(root, value);
    if (!isInside(root, lexical))
        throw new QsgError('PATH_ESCAPE', `${kind} escapes the config directory: ${value}`);
    let actual;
    try {
        actual = await realpath(lexical);
    }
    catch {
        throw new QsgError('MISSING_PATH', `${kind} not found: ${value}`);
    }
    if (!isInside(root, actual))
        throw new QsgError('SYMLINK_ESCAPE', `${kind} resolves outside the config directory: ${value}`);
    const info = await stat(actual);
    if (kind === 'file' ? !info.isFile() : !info.isDirectory())
        throw new QsgError('WRONG_PATH_TYPE', `Expected ${kind}: ${value}`);
    return actual;
}
export async function readLimited(file, maximum) {
    const info = await stat(file);
    if (!info.isFile() || info.size > maximum)
        throw new QsgError('INPUT_SIZE', `Input must be a regular file <= ${maximum} bytes.`);
    // Check and read the same open file, retaining at most the limit plus one byte.
    // The extra byte detects growth after stat without an unbounded readFile allocation.
    const handle = await open(file, 'r');
    try {
        const openedInfo = await handle.stat();
        if (!openedInfo.isFile() || openedInfo.size > maximum)
            throw new QsgError('INPUT_SIZE', `Input must be a regular file <= ${maximum} bytes.`);
        const buffer = Buffer.alloc(maximum + 1);
        let length = 0;
        while (length < buffer.length) {
            const { bytesRead } = await handle.read(buffer, length, buffer.length - length, null);
            if (bytesRead === 0)
                break;
            length += bytesRead;
        }
        if (length > maximum)
            throw new QsgError('INPUT_SIZE', 'Input changed while reading or exceeds the size limit.');
        try {
            return new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, length));
        }
        catch {
            throw new QsgError('INVALID_UTF8', 'Inputs must be valid UTF-8.');
        }
    }
    finally {
        await handle.close();
    }
}
// Restrict generated reports to the dedicated .qsg/ folder. Never overwrite README or package.json.
export async function reportPath(root, value, extension) {
    relativePath(value, 'report path');
    const normal = path.posix.normalize(value);
    if (!normal.startsWith('.qsg/') || !normal.endsWith(extension)) {
        throw new QsgError('INVALID_REPORT_PATH', `Reports must be inside .qsg/ and end with ${extension}.`);
    }
    let cursor = root;
    const parts = normal.split('/');
    for (const [index, part] of parts.entries()) {
        cursor = path.join(cursor, part);
        try {
            const info = await lstat(cursor);
            if (info.isSymbolicLink())
                throw new QsgError('REPORT_SYMLINK', 'Report paths must not contain symbolic links.');
            const isDestination = index === parts.length - 1;
            if (isDestination ? !info.isFile() : !info.isDirectory()) {
                throw new QsgError('INVALID_REPORT_PATH_TYPE', isDestination
                    ? 'An existing report destination must be a regular file.'
                    : 'Existing report parent paths must be directories.');
            }
            if (!isInside(root, await realpath(cursor)))
                throw new QsgError('REPORT_ESCAPE', 'Report path escapes workspace.');
        }
        catch (error) {
            if (error.code !== 'ENOENT')
                throw error;
        }
    }
    return cursor;
}
export async function writeReport(root, value, content, extension) {
    const destination = await reportPath(root, value, extension);
    await mkdir(path.dirname(destination), { recursive: true });
    await reportPath(root, value, extension);
    await writeFile(destination, content, { mode: 0o600 });
}
//# sourceMappingURL=paths.js.map