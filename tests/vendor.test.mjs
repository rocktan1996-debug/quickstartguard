import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,copyFile,readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const files=['js-yaml.cjs','marked.cjs','licenses/js-yaml-MIT.txt','licenses/marked-MIT.txt'];
async function fixture(t) {
 const root=await mkdtemp(path.join(os.tmpdir(),'qsg-vendor-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 await mkdir(path.join(root,'scripts'));
 await mkdir(path.join(root,'vendor/licenses'),{recursive:true});
 await copyFile(new URL('../scripts/verify-vendor.mjs',import.meta.url),path.join(root,'scripts/verify-vendor.mjs'));
 const manifest={};
 for(const file of files) {
  const bytes=await readFile(new URL(`../vendor/${file}`,import.meta.url));
  await writeFile(path.join(root,'vendor',file),bytes);
  manifest[file]=createHash('sha256').update(bytes).digest('hex');
 }
 return {root,manifest};
}
async function verify(root,manifest) {
 await writeFile(path.join(root,'vendor/checksums.json'),JSON.stringify(manifest));
 // Deliberately unrelated cwd: verification is relative to the shipped script.
 return spawnSync(process.execPath,[path.join(root,'scripts/verify-vendor.mjs')],{cwd:os.tmpdir(),encoding:'utf8',timeout:10000});
}
function fails(result,pattern) {
 assert.equal(result.error,undefined);
 assert.notEqual(result.status,0,result.stdout);
 assert.match(result.stderr,pattern);
}
test('vendor verifier accepts the complete parser and license manifest from another cwd',async t=>{
 const {root,manifest}=await fixture(t);const result=await verify(root,manifest);
 assert.equal(result.error,undefined);assert.equal(result.status,0,result.stderr);
 for(const file of files) assert.ok(result.stdout.includes(`Verified ${file}`));
});
for(const value of [{},[],null,'invalid']) test(`vendor verifier rejects incomplete or non-object manifest ${JSON.stringify(value)}`,async t=>{
 const {root}=await fixture(t);fails(await verify(root,value),/Invalid vendor checksum manifest/);
});
for(const file of files) test(`vendor verifier rejects omitted required entry ${file}`,async t=>{
 const {root,manifest}=await fixture(t);delete manifest[file];
 fails(await verify(root,manifest),/Invalid vendor checksum manifest/);
});
for(const extra of ['extra.cjs','../outside','https://example.invalid/file']) test(`vendor verifier rejects unexpected key ${extra} before reading files`,async t=>{
 const {root,manifest}=await fixture(t);manifest[extra]='0'.repeat(64);
 fails(await verify(root,manifest),/Invalid vendor checksum manifest/);
});
for(const hash of ['', 'a'.repeat(63),'g'.repeat(64),null,42]) test(`vendor verifier rejects malformed digest ${JSON.stringify(hash)}`,async t=>{
 const {root,manifest}=await fixture(t);manifest['marked.cjs']=hash;
 fails(await verify(root,manifest),/Invalid vendor checksum manifest/);
});
for(const file of files) test(`vendor verifier detects modified bytes in ${file}`,async t=>{
 const {root,manifest}=await fixture(t);await writeFile(path.join(root,'vendor',file),'changed bytes');
 fails(await verify(root,manifest),/Vendor integrity mismatch/);
});
for(const file of files) test(`vendor verifier fails when ${file} is missing`,async t=>{
 const {root,manifest}=await fixture(t);await rm(path.join(root,'vendor',file));
 fails(await verify(root,manifest),/ENOENT/);
});
