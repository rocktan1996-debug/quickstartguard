import path from 'node:path';
import { access, realpath, unlink, writeFile } from 'node:fs/promises';
import { QsgError } from './errors.js';
export const EXAMPLE_MARKDOWN = '# QuickstartGuard starter\n\nReplace these examples with your real README commands after trying the demo.\n\n```bash qsg=hello-linux\nnode -e "console.log(\'Hello from QuickstartGuard\')"\n```\n\n```powershell qsg=hello-windows\nnode -e "console.log(\'Hello from QuickstartGuard\')"\n```\n';
export const EXAMPLE_CONFIG = `schemaVersion: 1
checks:
  - id: hello-linux
    file: quickstart.qsg.md
    platform: linux
    shell: bash
    timeoutSeconds: 30
    expect:
      exitCode: 0
      stdoutContains: ["Hello from QuickstartGuard"]
  - id: hello-windows
    file: quickstart.qsg.md
    platform: win32
    shell: pwsh
    timeoutSeconds: 30
    expect:
      exitCode: 0
      stdoutContains: ["Hello from QuickstartGuard"]
`;
export async function initialise(configFile) {
    const absolute = path.resolve(configFile);
    const root = await realpath(path.dirname(absolute));
    const targets = [[path.join(root, path.basename(absolute)), EXAMPLE_CONFIG], [path.join(root, 'quickstart.qsg.md'), EXAMPLE_MARKDOWN]];
    if (targets[0][0] === targets[1][0])
        throw new QsgError('INIT_CONFLICT', 'The config and Markdown file must have different names.');
    for (const [file] of targets) {
        try {
            await access(file);
            throw new QsgError('INIT_EXISTS', `Refusing to overwrite ${path.basename(file)}.`);
        }
        catch (error) {
            if (error.code !== 'ENOENT')
                throw error;
        }
    }
    const created = [];
    try {
        for (const [file, content] of targets) {
            await writeFile(file, content, { flag: 'wx', mode: 0o644 });
            created.push(file);
        }
    }
    catch (error) {
        for (const file of created)
            await unlink(file).catch(() => { });
        throw error;
    }
    return created.map(file => path.basename(file));
}
//# sourceMappingURL=init.js.map