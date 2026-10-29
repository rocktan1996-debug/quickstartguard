import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdtemp,writeFile,symlink,rm,mkdir,readFile,realpath} from 'node:fs/promises';
import os from 'node:os';
import {childEnvironment,redact} from '../dist/environment.js';
import {safeConsole,annotation,jsonReport,summaryReport} from '../dist/reporters.js';
import {loadProject,selectChecks} from '../dist/planner.js';
import {reportPath,isInside} from '../dist/paths.js';
import {OutputCapture,shellScript} from '../dist/runner.js';
import {evaluate} from '../dist/assertions.js';
import {project,check} from './helpers.mjs';
test('child does not inherit parent secrets or GitHub command channels',()=>{
 const env=childEnvironment({PATH:process.env.PATH,HOME:'/tmp/home',GITHUB_ENV:'/tmp/env',GITHUB_TOKEN:'secret-value',OPENAI_API_KEY:'secret-key',NODE_OPTIONS:'--require bad',BASH_ENV:'/tmp/bad'});
 assert.equal(env.GITHUB_ENV,undefined);assert.equal(env.GITHUB_TOKEN,undefined);assert.equal(env.OPENAI_API_KEY,undefined);assert.equal(env.BASH_ENV,undefined);assert.equal(env.NODE_OPTIONS,undefined);assert.equal(env.CI,'true');
});
test('explicit extra environment pass works',()=>assert.equal(childEnvironment({CUSTOM:'yes'},['CUSTOM']).CUSTOM,'yes'));
test('missing explicit variable errors',()=>assert.throws(()=>childEnvironment({},['MISSING']),/not set/));
test('workflow and shell hooks cannot be explicitly passed',()=>{for(const name of ['GITHUB_ENV','ACTIONS_RUNTIME_TOKEN','NODE_OPTIONS','BASH_ENV']) assert.throws(()=>childEnvironment({[name]:'x'},[name]),/Cannot pass/);});
test('secret redaction handles exact environment values',()=>assert.equal(redact('token=abcdefghi',{MY_TOKEN:'abcdefghi'}),'token=[REDACTED]'));
test('known key formats redacted without environment lookup',()=>assert.equal(redact('ghp_abcdefghijklmnopqrstuv',{}),'[REDACTED]'));
test('workflow command injection broken even mid-line',()=>assert.equal(safeConsole('hello ::error::oops\n::add-mask::x').includes('::'),false));
test('ANSI and carriage returns are normalised',()=>assert.equal(safeConsole('\x1b[31mRED\x1b[0m\r\nOK'),'RED\nOK'));
test('output limit retains only bounded bytes',()=>{const c=new OutputCapture(5);assert.equal(c.add(Buffer.from('abc')),false);assert.equal(c.add(Buffer.from('defgh')),true);assert.deepEqual(c.finish(),{text:'abcde',bytesSeen:8,truncated:true});});
test('Bash fail-fast wrapper contains pipefail',()=>assert.match(shellScript('bash','echo ready'),/set -euo pipefail/));
test('PowerShell wrapper catches native failures and stops',()=>{const s=shellScript('pwsh','node work.mjs');assert.match(s,/\$PSNativeCommandUseErrorActionPreference = \$true/);assert.match(s,/NativeCommandExitException/);assert.match(s,/exit \$_.Exception.ExitCode/);});
test('normal expected nonzero exit can pass',()=>{
 const c={...check({expect:{exitCode:7}}),block:{startLine:2,endLine:2}};
 const r=evaluate(c,{reason:'completed',exitCode:7,signal:null,durationMs:1,stdout:{text:'',bytesSeen:0,truncated:false},stderr:{text:'',bytesSeen:0,truncated:false}});
 assert.equal(r.status,'pass');
});
test('truncated output is NEVER a pass, including negative assertions',()=>{
 const c={...check({expect:{exitCode:0,stdoutNotContains:['danger']}}),block:{startLine:2,endLine:2}};
 assert.equal(evaluate(c,{reason:'output_limit',exitCode:0,signal:null,durationMs:1,stdout:{text:'fine',bytesSeen:100000,truncated:true},stderr:{text:'',bytesSeen:0,truncated:false}}).status,'fail');
});
test('normalise ANSI and CRLF before assertion',()=>{
 const c={...check(),block:{startLine:2,endLine:2}};
 assert.equal(evaluate(c,{reason:'completed',exitCode:0,signal:null,durationMs:1,stdout:{text:'\x1b[31mready\x1b[0m\r\n',bytesSeen:20,truncated:false},stderr:{text:'',bytesSeen:0,truncated:false}}).status,'pass');
});
test('report path cannot overwrite package.json or leave workspace',async t=>{
 const root=await project(t);for(const name of ['package.json','../outside.json','/tmp/out.json','.qsg/../../bad.json']) await assert.rejects(()=>reportPath(root,name,'.json'));
 assert.equal(await reportPath(root,'.qsg/run.json','.json'),path.join(root,'.qsg/run.json'));
});
test('prefix lookalike is not inside workspace',()=>assert.equal(isInside('/tmp/repo','/tmp/repo-other/file'),false));
test('report folder symlink denied',async t=>{
 const root=await project(t);const target=await mkdtemp(path.join(os.tmpdir(),'qsg-outside-'));t.after(()=>rm(target,{recursive:true,force:true}));
 await symlink(target,path.join(root,'.qsg'),process.platform==='win32'?'junction':'dir');await assert.rejects(()=>reportPath(root,'.qsg/report.json','.json'),/symbolic links/);
});
test('out-of-root source symlink denied',async t=>{
 const root=await project(t);const target=await mkdtemp(path.join(os.tmpdir(),'qsg-source-'));t.after(()=>rm(target,{recursive:true,force:true}));
 await writeFile(path.join(target,'README.md'),'x');await symlink(target,path.join(root,'outside'),process.platform==='win32'?'junction':'dir');
 await writeFile(path.join(root,'qsg.yml'),JSON.stringify({schemaVersion:1,checks:[check({file:'outside/README.md'})]}));
 await assert.rejects(()=>loadProject(path.join(root,'qsg.yml')),/outside/);
});
test('missing Markdown source fails before execution',async t=>{const root=await project(t,{checks:[check({file:'missing.md'})]});await assert.rejects(()=>loadProject(path.join(root,'qsg.yml')),/not found/);});
test('missing block fails before execution',async t=>{const root=await project(t,{checks:[check({id:'other'})]});await assert.rejects(()=>loadProject(path.join(root,'qsg.yml')),/not found/);});
test('zero platform matches fails rather than green',async t=>{
 const root=await project(t);const p=await loadProject(path.join(root,'qsg.yml'));assert.throws(()=>selectChecks(p,process.platform==='win32'?'linux':'win32'),/No checks/);
});
test('unknown selection fails',async t=>{const root=await project(t);const p=await loadProject(path.join(root,'qsg.yml'));assert.throws(()=>selectChecks(p,process.platform,'missing'),/Unknown check/);});
const fixtureCheck={id:'demo',file:'README.md',platform:'linux',shell:'bash',startLine:2,endLine:3,status:'fail',reason:'assertion_failed',durationMs:1,exitCode:1,signal:null,assertions:[{kind:'stdoutContains',pass:false,message:'bad\n::error file=x::injection <img src=x> |'}],stdout:{text:'secret output',bytesSeen:13,truncated:false},stderr:{text:'',bytesSeen:0,truncated:false}};
const fixtureReport={schemaVersion:1,tool:{name:'quickstartguard',version:'test'},checks:[fixtureCheck],passed:0,failed:1,errors:0,skipped:[],platform:'linux'};
test('annotation escapes line breaks and property delimiters',()=>{
 const s=annotation({...fixtureCheck,file:'README,a:b.md'},'sub');assert.equal(s.split('\n').length,1);assert.match(s,/README%2Ca%3Ab.md/);assert.match(s,/%0A/);
});
test('summary escapes HTML and table injection',()=>{const s=summaryReport(fixtureReport);assert.equal(s.includes('<img'),false);assert.match(s,/&#124;/);});
test('JSON excludes captured output by default',()=>{const r=JSON.parse(jsonReport(fixtureReport));assert.equal(r.checks[0].stdout.text,undefined);assert.equal(r.outputIncluded,false);});
test('JSON output can be included explicitly',()=>assert.equal(JSON.parse(jsonReport(fixtureReport,true)).checks[0].stdout.text,'secret output'));

test('Markdown/config shell mismatch rejected',async t=>{
 const root=await project(t,{markdown:'```'+(process.platform==='win32'?'bash':'powershell')+' qsg=demo\necho ready\n```\n'});
 await assert.rejects(()=>loadProject(path.join(root,'qsg.yml')),/does not match/);
});
test('invalid report suffix rejected',async t=>{const root=await project(t);await assert.rejects(()=>reportPath(root,'.qsg/run.txt','.json'),/end with/);});

test('existing regular report files and missing nested destinations remain valid', async t => {
 // Match loadProject's canonical root, including Windows temporary-directory aliases.
 const root = await realpath(await project(t));
 await mkdir(path.join(root, '.qsg'));
 await writeFile(path.join(root, '.qsg/result.json'), 'old report');
 assert.equal(await reportPath(root, '.qsg/result.json', '.json'), path.join(root, '.qsg/result.json'));
 assert.equal(await readFile(path.join(root, '.qsg/result.json'), 'utf8'), 'old report');
 assert.equal(await reportPath(root, '.qsg/new/nested/result.json', '.json'), path.join(root, '.qsg/new/nested/result.json'));
});
