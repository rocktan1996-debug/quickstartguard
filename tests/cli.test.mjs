import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {readFile,writeFile,access,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {project,invoke,check,platform,shell,ROOT,CLI} from './helpers.mjs';
test('help and version work without a config',()=>{
 assert.equal(invoke(ROOT,['--help']).status,0);assert.match(invoke(ROOT,['--version']).stdout,/0\.1\.0-alpha\.1/);
});
test('unknown command and flag return 2',()=>{assert.equal(invoke(ROOT,['unknown']).status,2);assert.equal(invoke(ROOT,['validate','--bogus']).status,2);});
test('run refuses to execute without consent',async t=>{
 const root=await project(t,{program:"import {writeFileSync} from 'node:fs';writeFileSync('ran.txt','yes');"});
 const r=invoke(root,['run']);assert.equal(r.status,2);assert.match(r.stderr,/No commands executed/);await assert.rejects(()=>access(path.join(root,'ran.txt')));
});
test('validate does not execute commands',async t=>{
 const root=await project(t,{program:"import {writeFileSync} from 'node:fs';writeFileSync('ran.txt','yes');"});
 const r=invoke(root,['validate']);assert.equal(r.status,0,r.stderr);await assert.rejects(()=>access(path.join(root,'ran.txt')));
});
test('validate rejects execution flags',async t=>{const root=await project(t);assert.equal(invoke(root,['validate','--execute']).status,2);});
test('successful real command returns 0 and creates reports',async t=>{
 const root=await project(t);const r=invoke(root,['run','--execute','--json-out','.qsg/results.json','--summary-out','.qsg/summary.md']);
 assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/PASS README.md:4-4/);
 const report=JSON.parse(await readFile(path.join(root,'.qsg/results.json'),'utf8'));
 assert.equal(report.passed,1);assert.equal(report.checksExecuted,1);assert.equal(report.checks[0].stdout.text,undefined);
 assert.match(await readFile(path.join(root,'.qsg/summary.md'),'utf8'),/1 passed/);
});
test('expected output mismatch returns 1',async t=>{
 const root=await project(t,{program:"console.log('not what we wanted')"});const r=invoke(root,['run','--execute']);assert.equal(r.status,1);assert.match(r.stdout,/assertion_failed/);
});
test('nonzero process returns failure',async t=>{const root=await project(t,{program:'process.exit(7)'});const r=invoke(root,['run','--execute']);assert.equal(r.status,1);assert.match(r.stdout,/received 7/);});
test('explicit expected nonzero process passes',async t=>{const root=await project(t,{program:'process.exit(7)',checks:[check({expect:{exitCode:7}})]});assert.equal(invoke(root,['run','--execute']).status,0);});
test('intermediate native failure cannot be hidden by later successful command',async t=>{
 const root=await project(t,{program:'process.exit(9)',code:'node ./work.mjs\nnode ./later.mjs',checks:[check({expect:{exitCode:0}})]});
 await writeFile(path.join(root,'later.mjs'),"import {writeFileSync} from 'node:fs';writeFileSync('later-ran','bad');console.log('ready');");
 const r=invoke(root,['run','--execute']);assert.equal(r.status,1,r.stderr);assert.match(r.stdout,/received 9/);await assert.rejects(()=>access(path.join(root,'later-ran')));
});
test('missing native command fails',async t=>{
 const root=await project(t,{code:'qsg_this_command_does_not_exist_98345',checks:[check({expect:{exitCode:0}})]});assert.equal(invoke(root,['run','--execute']).status,1);
});
test('timeout kills command and reports timeout',async t=>{
 const root=await project(t,{program:'setInterval(()=>{},1000)',checks:[check({timeoutSeconds:1})]});const start=Date.now();
 const r=invoke(root,['run','--execute']);assert.equal(r.status,1,r.stderr);assert.match(r.stdout,/Reason: timeout/);assert.ok(Date.now()-start<9000);
});
test('output flood is bounded and fails',async t=>{
 const root=await project(t,{program:"process.stdout.write('x'.repeat(200000));setInterval(()=>{},1000)",checks:[check({timeoutSeconds:5})]});
 const r=invoke(root,['run','--execute','--json-out','.qsg/flood.json','--include-output']);assert.equal(r.status,1);assert.match(r.stdout,/output_limit/);
 const report=JSON.parse(await readFile(path.join(root,'.qsg/flood.json'),'utf8'));assert.ok(report.checks[0].stdout.text.length<=65536);assert.equal(report.checks[0].stdout.truncated,true);
});
test('stderr positive and negative assertions execute',async t=>{
 const root=await project(t,{program:"console.log('ready');console.error('warning');",checks:[check({expect:{exitCode:0,stderrContains:['warning'],stderrNotContains:['FATAL']}})]});assert.equal(invoke(root,['run','--execute']).status,0);
});
test('negative stdout assertion detects forbidden string',async t=>{
 const root=await project(t,{checks:[check({expect:{exitCode:0,stdoutNotContains:['ready']}})]});assert.equal(invoke(root,['run','--execute']).status,1);
});
test('environment secrets and GitHub files are absent from child',async t=>{
 const root=await project(t,{program:"if(process.env.QSG_SECRET || process.env.GITHUB_ENV || process.env.NODE_OPTIONS) process.exit(4); console.log('ready');"});
 const r=invoke(root,['run','--execute'],{QSG_SECRET:'very-secret',GITHUB_ENV:'/tmp/evil',NODE_OPTIONS:'--no-warnings'});assert.equal(r.status,0,r.stderr);
});
test('explicit pass-env is available but default output remains hidden',async t=>{
 const root=await project(t,{program:"console.log(process.env.QSG_CUSTOM);",checks:[check({expect:{exitCode:0,stdoutContains:['hello-env']}})]});
 assert.equal(invoke(root,['run','--execute','--pass-env','QSG_CUSTOM'],{QSG_CUSTOM:'hello-env'}).status,0);
});
test('verbose stdout does not inject GitHub commands',async t=>{
 const root=await project(t,{program:"console.log('ready');console.log('prefix ::warning::injected');"});const r=invoke(root,['run','--execute','--verbose']);assert.equal(r.status,0);assert.equal(r.stdout.includes('::warning::'),false);assert.match(r.stdout,/: :warning: :/);
});
test('annotations and GitHub summary reflect failed source line',async t=>{
 const root=await project(t,{program:"console.log('wrong')"});const target=path.join(root,'summary.txt');
 const r=invoke(root,['run','--execute','--github'],{GITHUB_STEP_SUMMARY:target,GITHUB_WORKSPACE:root});assert.equal(r.status,1);assert.match(r.stdout,/::error file=README.md,line=4,endLine=4/);assert.match(await readFile(target,'utf8'),/1 failed/);
});
test('invalid JSON output path is rejected BEFORE commands run',async t=>{
 const root=await project(t,{program:"import {writeFileSync} from 'node:fs';writeFileSync('ran','bad');console.log('ready');"});
 assert.equal(invoke(root,['run','--execute','--json-out','package.json']).status,2);await assert.rejects(()=>access(path.join(root,'ran')));
});
test('wrong platform never reports zero checks as success',async t=>{
 const other=platform==='linux'?'win32':'linux';const otherShell=other==='linux'?'bash':'pwsh';
 const root=await project(t,{checks:[check({platform:other,shell:otherShell})],markdown:`\`\`\`${otherShell==='bash'?'bash':'powershell'} qsg=demo\necho ready\n\`\`\`\n`});
 const r=invoke(root,['run','--execute']);assert.equal(r.status,2);assert.match(r.stderr,/No checks match/);
});
test('init is usable and never overwrites an existing file',async t=>{
 const root=await project(t);await mkdir(path.join(root,'new'));
 const target=path.join(root,'new');assert.equal(invoke(target,['init']).status,0);assert.equal(invoke(target,['validate']).status,0);assert.equal(invoke(target,['run','--execute']).status,0);
 assert.equal(invoke(target,['init']).status,2);
});
test('unmarked block never executes alongside selected block',async t=>{
 const root=await project(t);const file=path.join(root,'README.md');await writeFile(file,(await readFile(file,'utf8'))+'\n```bash\nnode ./bad.mjs\n```\n');
 await writeFile(path.join(root,'bad.mjs'),"import {writeFileSync} from 'node:fs';writeFileSync('bad-ran','bad');");
 assert.equal(invoke(root,['run','--execute']).status,0);await assert.rejects(()=>access(path.join(root,'bad-ran')));
});
test('repository demo-valid passes and demo-broken fails on host platform',()=>{
 assert.equal(invoke(ROOT,['run','--execute','-c','fixtures/demo-valid/qsg.yml']).status,0);
 assert.equal(invoke(ROOT,['run','--execute','-c','fixtures/demo-broken/qsg.yml']).status,1);
});
test('SIGINT interrupts a long-running check and returns 130',{skip:process.platform==='win32'},async t=>{
 const root=await project(t,{program:"import {writeFileSync} from 'node:fs';writeFileSync('started','yes');setInterval(()=>{},1000);",checks:[check({timeoutSeconds:20})]});
 const child=spawn(process.execPath,[CLI,'run','--execute'],{cwd:root,stdio:['ignore','pipe','pipe']});
 let out='';child.stdout.on('data',b=>out+=b.toString());
 const exited=new Promise(resolve=>child.once('close',resolve));
 t.after(()=>{try{child.kill('SIGKILL')}catch{}});
 for(let i=0;i<100;i++){try{await access(path.join(root,'started'));break;}catch{await new Promise(r=>setTimeout(r,40));}}
 child.kill('SIGINT');const code=await exited;assert.equal(code,130);assert.match(out,/cancelled/);
});

test('timeout also stops a normal descendant process group on Linux',{skip:process.platform!=='linux'},async t=>{
 const root=await project(t,{program:"import {spawn} from 'node:child_process';spawn(process.execPath,['./descendant.mjs'],{stdio:'ignore'});setInterval(()=>{},1000);",checks:[check({timeoutSeconds:1})]});
 await writeFile(path.join(root,'descendant.mjs'),"import {writeFileSync} from 'node:fs';setTimeout(()=>writeFileSync('descendant-survived','bad'),2000);");
 const r=invoke(root,['run','--execute']);assert.equal(r.status,1);await new Promise(r=>setTimeout(r,1500));await assert.rejects(()=>access(path.join(root,'descendant-survived')));
});
test('all selected checks run and failures are aggregated',async t=>{
 const checks=[check(),check({id:'second',expect:{exitCode:0,stdoutContains:['never printed']}})];
 const lang=shell==='bash'?'bash':'powershell';
 const root=await project(t,{checks,markdown:`\`\`\`${lang} qsg=demo\nnode work.mjs\n\`\`\`\n\n\`\`\`${lang} qsg=second\nnode work.mjs\n\`\`\`\n`});
 const r=invoke(root,['run','--execute']);assert.equal(r.status,1);assert.match(r.stdout,/2 executed; 1 passed; 1 failed/);
 assert.equal(invoke(root,['run','--execute','--check','demo']).status,0);
});
test('marked but unconfigured block warns and does not run',async t=>{
 const root=await project(t);const file=path.join(root,'README.md');
 await writeFile(file,(await readFile(file,'utf8'))+'\n```bash qsg=ignored\nthis_command_must_not_run\n```\n');
 const r=invoke(root,['run','--execute']);assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/marked but not configured/);
});
test('invalid UTF-8 input is rejected without execution',async t=>{
 const root=await project(t);await writeFile(path.join(root,'README.md'),Buffer.from([0xff,0xfe]));const r=invoke(root,['validate']);assert.equal(r.status,2);assert.match(r.stderr,/UTF-8/);
});
test('JSON inclusion redacts a known token without corrupting JSON',async t=>{
 const root=await project(t,{program:"console.log('ready');console.log('ghp_abcdefghijklmnopqrstuv');"});
 const r=invoke(root,['run','--execute','--json-out','.qsg/redacted.json','--include-output']);assert.equal(r.status,0);
 const report=JSON.parse(await readFile(path.join(root,'.qsg/redacted.json'),'utf8'));assert.match(report.checks[0].stdout.text,/\[REDACTED\]/);assert.equal(report.checks[0].stdout.text.includes('ghp_'),false);
});
test('init collision does not partially overwrite project',async t=>{
 const root=await project(t);await mkdir(path.join(root,'new'));const d=path.join(root,'new');
 await writeFile(path.join(d,'quickstart.qsg.md'),'keep me');assert.equal(invoke(d,['init']).status,2);
 assert.equal(await readFile(path.join(d,'quickstart.qsg.md'),'utf8'),'keep me');await assert.rejects(()=>access(path.join(d,'qsg.yml')));
});

for (const [flag, report] of [['--json-out', '.qsg/results.json'], ['--summary-out', '.qsg/summary.md']]) {
 test(`${flag} rejects an existing destination directory BEFORE commands run`, async t => {
  const root = await project(t, {program: "import {writeFileSync} from 'node:fs';writeFileSync('ran', 'unexpected');console.log('ready');"});
  await mkdir(path.join(root, report), {recursive: true});
  const result = invoke(root, ['run', '--execute', flag, report]);
  assert.equal(result.status, 2, result.stderr);
  await assert.rejects(() => access(path.join(root, 'ran')), 'README command must not execute when the report target is a directory');
  assert.match(result.stderr, /INVALID_REPORT_PATH_TYPE/);
 });
}

for (const [flag, report] of [['--json-out', '.qsg/blocked/results.json'], ['--summary-out', '.qsg/blocked/summary.md']]) {
 test(`${flag} rejects a file in the parent path BEFORE commands run`, async t => {
  const root = await project(t, {program: "import {writeFileSync} from 'node:fs';writeFileSync('ran', 'unexpected');console.log('ready');"});
  await mkdir(path.join(root, '.qsg'));
  await writeFile(path.join(root, '.qsg/blocked'), 'keep parent');
  const result = invoke(root, ['run', '--execute', flag, report]);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /INVALID_REPORT_PATH_TYPE/);
  await assert.rejects(() => access(path.join(root, 'ran')));
  assert.equal(await readFile(path.join(root, '.qsg/blocked'), 'utf8'), 'keep parent');
 });
}

for (const [flag, report] of [['--json-out', '.qsg/results.json'], ['--summary-out', '.qsg/summary.md']]) {
 test(`${flag} can still overwrite an existing regular report`, async t => {
  const root = await project(t);
  await mkdir(path.join(root, '.qsg'));
  await writeFile(path.join(root, report), 'old report');
  const result = invoke(root, ['run', '--execute', flag, report]);
  assert.equal(result.status, 0, result.stderr);
  const text = await readFile(path.join(root, report), 'utf8');
  assert.notEqual(text, 'old report');
  if (flag === '--json-out') assert.equal(JSON.parse(text).passed, 1);
  else assert.match(text, /1 passed/);
 });
}
