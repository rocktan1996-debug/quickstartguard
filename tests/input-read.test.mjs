import test from 'node:test';
import assert from 'node:assert/strict';
import {open, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {readLimited} from '../dist/paths.js';
import {project} from './helpers.mjs';

for (const [name, content, maximum] of [
 ['empty', '', 0], ['below limit', 'hello', 8], ['exact limit', 'hello', 5],
 ['UTF-8 byte boundary', '中文', 6], ['BOM', '\uFEFFhello', 8],
]) test(`bounded input reader accepts ${name}`, async t => {
 const root = await project(t);
 const file = path.join(root, 'input.md');
 await writeFile(file, content);
 assert.equal(await readLimited(file, maximum), content.replace(/^\uFEFF/, ''));
});

test('bounded input reader rejects oversized, invalid UTF-8 and non-file input', async t => {
 const root = await project(t);
 const file = path.join(root, 'input.md');
 await writeFile(file, '中文');
 await assert.rejects(readLimited(file, 5), {code:'INPUT_SIZE'});
 await writeFile(file, Buffer.from([0xc3]));
 await assert.rejects(readLimited(file, 5), {code:'INVALID_UTF8'});
 await assert.rejects(readLimited(root, 5), {code:'INPUT_SIZE'});
});

test('bounded input reader handles short reads without truncating UTF-8', async t => {
 const root = await project(t);
 const file = path.join(root, 'input.md');
 await writeFile(file, '中文ready');
 const probe = await open(file, 'r');
 const proto = Object.getPrototypeOf(probe);
 await probe.close();
 const original = proto.read;
 t.mock.method(proto, 'read', function(buffer, offset, length, position) {
   return original.call(this, buffer, offset, Math.min(length, 1), position);
 });
 assert.equal(await readLimited(file, 11), '中文ready');
});

test('growth after metadata checks reads only limit plus one and closes the file', async t => {
 const root = await project(t);
 const file = path.join(root, 'input.md');
 await writeFile(file, 'small');
 const probe = await open(file, 'r');
 const proto = Object.getPrototypeOf(probe);
 await probe.close();
 const originalStat = proto.stat, originalRead = proto.read;
 let bytes = 0, opened;
 t.mock.method(proto, 'stat', async function(...args) {
   opened = this;
   const info = await originalStat.apply(this, args);
   await writeFile(file, Buffer.alloc(1024 * 1024, 120));
   return info;
 });
 t.mock.method(proto, 'read', async function(...args) {
   assert.ok(args[0].length <= 9);
   const result = await originalRead.apply(this, args);
   bytes += result.bytesRead;
   return result;
 });
 await assert.rejects(readLimited(file, 8), {code:'INPUT_SIZE'});
 assert.equal(bytes, 9);
 assert.equal(opened.fd, -1);
});
