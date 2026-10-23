import path from 'node:path';
import os from 'node:os';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
export const ROOT = fileURLToPath(new URL('../',import.meta.url));
export const CLI = path.join(ROOT,'dist','cli.js');
export const platform = process.platform === 'win32' ? 'win32' : 'linux';
export const shell = platform === 'win32' ? 'pwsh' : 'bash';
export function check(overrides={}) {
  return {id:'demo',file:'README.md',platform,shell,timeoutSeconds:5,expect:{exitCode:0,stdoutContains:['ready']},...overrides};
}
export async function project(t,{code='node ./work.mjs',program="console.log('ready');",checks=[check()],markdown}={}) {
  const root=await mkdtemp(path.join(os.tmpdir(),'qsg test 中文-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  await writeFile(path.join(root,'qsg.yml'),JSON.stringify({schemaVersion:1,checks},null,2));
  await writeFile(path.join(root,'README.md'),markdown??`# Project\n\n\`\`\`${shell==='bash'?'bash':'powershell'} qsg=demo\n${code}\n\`\`\`\n`);
  await writeFile(path.join(root,'work.mjs'),program);
  return root;
}
export function invoke(root,args,extraEnv={}) {
  const env={...process.env};
  for(const k of ['GITHUB_ACTIONS','GITHUB_STEP_SUMMARY','GITHUB_WORKSPACE','NODE_OPTIONS']) delete env[k];
  return spawnSync(process.execPath,[CLI,...args],{cwd:root,env:{...env,...extraEnv},encoding:'utf8',timeout:20000,maxBuffer:2*1024*1024});
}
