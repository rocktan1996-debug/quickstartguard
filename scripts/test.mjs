import {readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
const files=(await readdir(new URL('../tests/',import.meta.url))).filter(name=>name.endsWith('.test.mjs')).sort().map(name=>`tests/${name}`);
const result=spawnSync(process.execPath,['--test','--test-concurrency=1',...process.argv.slice(2),...files],{cwd:root,stdio:'inherit'});
if(result.error) {console.error(result.error.message);process.exitCode=2;} else process.exitCode=result.status??2;
