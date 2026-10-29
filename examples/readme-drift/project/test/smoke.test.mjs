import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('the greeting program works (fixed command, not README-bound)', () => {
  const result = spawnSync(process.execPath, ['./scripts/hello.mjs'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    encoding: 'utf8', timeout: 5000, maxBuffer: 65536,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), 'Hello, reader!');
});
