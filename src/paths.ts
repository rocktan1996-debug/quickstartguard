import path from 'node:path';
import { lstat, mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { QsgError } from './errors.js';
export function isInside(root: string, candidate: string): boolean {
  const rel = path.relative(root, candidate);
  return rel === '' || (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel));
}
export function relativePath(value: string, label: string): string {
  if (!value || /[\x00-\x1f\x7f]/.test(value) || path.posix.isAbsolute(value) || path.win32.isAbsolute(value)
      || /^[a-z]:/i.test(value) || value.includes(':') || value.includes('\\')) {
    throw new QsgError('INVALID_PATH', `${label} must be a relative path using forward slashes.`);
  }
  if (value.split('/').includes('..')) throw new QsgError('PATH_ESCAPE', `${label} must not contain '..'.`);
  return value;
}
export async function insideExisting(root: string, value: string, kind: 'file' | 'directory'): Promise<string> {
  relativePath(value, kind);
  const lexical = path.resolve(root, value);
  if (!isInside(root, lexical)) throw new QsgError('PATH_ESCAPE', `${kind} escapes the config directory: ${value}`);
  let actual: string;
  try { actual = await realpath(lexical); } catch { throw new QsgError('MISSING_PATH', `${kind} not found: ${value}`); }
  if (!isInside(root, actual)) throw new QsgError('SYMLINK_ESCAPE', `${kind} resolves outside the config directory: ${value}`);
  const info = await stat(actual);
  if (kind === 'file' ? !info.isFile() : !info.isDirectory()) throw new QsgError('WRONG_PATH_TYPE', `Expected ${kind}: ${value}`);
  return actual;
}
export async function readLimited(file: string, maximum: number): Promise<string> {
  const info = await stat(file);
  if (!info.isFile() || info.size > maximum) throw new QsgError('INPUT_SIZE', `Input must be a regular file <= ${maximum} bytes.`);
  const data = await readFile(file);
  if (data.length > maximum) throw new QsgError('INPUT_SIZE', 'Input changed while reading or exceeds the size limit.');
  try { return new TextDecoder('utf-8', {fatal: true}).decode(data); }
  catch { throw new QsgError('INVALID_UTF8', 'Inputs must be valid UTF-8.'); }
}
// Restrict generated reports to the dedicated .qsg/ folder. Never overwrite README or package.json.
export async function reportPath(root: string, value: string, extension: '.json' | '.md'): Promise<string> {
  relativePath(value, 'report path');
  const normal = path.posix.normalize(value);
  if (!normal.startsWith('.qsg/') || !normal.endsWith(extension)) {
    throw new QsgError('INVALID_REPORT_PATH', `Reports must be inside .qsg/ and end with ${extension}.`);
  }
  let cursor = root;
  for (const part of normal.split('/')) {
    cursor = path.join(cursor, part);
    try {
      const info = await lstat(cursor);
      if (info.isSymbolicLink()) throw new QsgError('REPORT_SYMLINK', 'Report paths must not contain symbolic links.');
      if (!isInside(root, await realpath(cursor))) throw new QsgError('REPORT_ESCAPE', 'Report path escapes workspace.');
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  }
  return cursor;
}
export async function writeReport(root: string, value: string, content: string, extension: '.json' | '.md'): Promise<void> {
  const destination = await reportPath(root, value, extension);
  await mkdir(path.dirname(destination), {recursive: true});
  await reportPath(root, value, extension);
  await writeFile(destination, content, {mode: 0o600});
}
