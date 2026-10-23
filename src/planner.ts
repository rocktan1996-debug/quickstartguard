import path from 'node:path';
import { realpath } from 'node:fs/promises';
import { parseConfig } from './config.js';
import { extractBlocks } from './markdown.js';
import { insideExisting, readLimited } from './paths.js';
import { QsgError } from './errors.js';
import { MAX_CONFIG_BYTES, MAX_MARKDOWN_BYTES, type CodeBlock, type Project } from './types.js';
export async function loadProject(configFile: string): Promise<Project> {
  let configPath: string;
  try { configPath = await realpath(path.resolve(configFile)); }
  catch { throw new QsgError('CONFIG_NOT_FOUND', `Config not found: ${configFile}`); }
  const root = path.dirname(configPath);
  const config = parseConfig(await readLimited(configPath, MAX_CONFIG_BYTES));
  const documents = new Map<string, CodeBlock[]>();
  const checks: Project['checks'] = [];
  const warnings: string[] = [];
  for (const check of config.checks) {
    const absoluteFile = await insideExisting(root, check.file, 'file');
    const absoluteCwd = await insideExisting(root, check.cwd, 'directory');
    if (!documents.has(absoluteFile)) documents.set(absoluteFile, extractBlocks(await readLimited(absoluteFile, MAX_MARKDOWN_BYTES), check.file));
    const block = documents.get(absoluteFile)!.find(b => b.id === check.id);
    if (!block) throw new QsgError('BLOCK_NOT_FOUND', `${check.file}: qsg=${check.id} was not found at document level.`);
    if (check.shell === 'bash' ? block.language !== 'bash' : !['powershell','pwsh'].includes(block.language)) {
      throw new QsgError('SHELL_MISMATCH', `${check.id}: Markdown language does not match shell: ${check.shell}.`);
    }
    checks.push({...check, absoluteFile, absoluteCwd, block});
  }
  for (const [file, blocks] of documents) for (const block of blocks) {
    if (!checks.some(c => c.absoluteFile === file && c.id === block.id)) warnings.push(`${path.relative(root,file)}: qsg=${block.id} is marked but not configured; it will NOT execute.`);
  }
  return {root, configPath, config, checks, warnings};
}
export function selectChecks(project: Project, platform: string, id?: string): Project['checks'] {
  if (!['linux','win32'].includes(platform)) throw new QsgError('UNSUPPORTED_PLATFORM', `Platform '${platform}' is not supported in this alpha.`);
  if (id && !project.checks.some(c => c.id === id)) throw new QsgError('UNKNOWN_CHECK', `Unknown check: ${id}`);
  const selected = project.checks.filter(check => check.platform === platform && (!id || check.id === id));
  if (!selected.length) throw new QsgError('NO_CHECKS', `No checks match platform ${platform}${id ? ` and ID ${id}` : ''}. No commands executed.`);
  return selected;
}
