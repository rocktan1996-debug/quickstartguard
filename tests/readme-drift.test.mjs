import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp, readFile, readdir, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {ROOT} from './helpers.mjs';
import {childEnvironment} from '../dist/environment.js';

const script = path.join(ROOT, 'examples/readme-drift/run.mjs');
const source = path.join(ROOT, 'examples/readme-drift/project/README.md');

async function run(t, args) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'qsg contrast test 中文-'));
  t.after(() => rm(temporaryRoot, {recursive: true, force: true}));
  const before = await readFile(source);
  const result = spawnSync(process.execPath, [script, ...args], {
    // Run outside the checkout to cover resolution by import.meta.url, not cwd.
    cwd: temporaryRoot, encoding: 'utf8', timeout: 30000, maxBuffer: 128 * 1024,
    env: {...childEnvironment(process.env), TMPDIR: temporaryRoot, TEMP: temporaryRoot, TMP: temporaryRoot},
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null);
  assert.deepEqual(await readFile(source), before, 'Source README must not be mutated');
  assert.deepEqual(await readdir(temporaryRoot), [], 'Temporary experiment must be removed');
  return result;
}

test('README drift demo requires explicit execution consent', async t => {
  const result = await run(t, []);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /No commands executed.*--execute/);
  assert.equal(result.stdout, '');
});

test('README drift demo rejects unsupported options before execution', async t => {
  const result = await run(t, ['--execute', '--platform', 'linux']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Only --execute and --json/);
  assert.equal(result.stdout, '');
});

test('README-only typo escapes the fixed test but fails the README-bound check, then restores', async t => {
  const result = await run(t, ['--execute', '--json']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  const report = JSON.parse(result.stdout);
  assert.equal(report.experiment, 'synthetic-readme-only-drift');
  assert.equal(report.platform, process.platform);
  assert.equal(report.nodeVersion, process.version);
  assert.equal(report.sourceFixtureUnchanged, true);
  assert.equal(report.restoredInputsIdentical, true);
  assert.equal(report.temporaryCopyRemoved, true);
  assert.equal(report.mutation.file, 'README.md');
  assert.equal(report.mutation.before, 'node ./scripts/hello.mjs');
  assert.equal(report.mutation.after, 'node ./scripts/hello-typo.mjs');
  assert.deepEqual(report.phases.map(phase => phase.name), ['baseline', 'readme-only-typo', 'restored']);
  assert.deepEqual(report.phases.map(phase => phase.changedFiles), [[], ['README.md'], []]);
  assert.deepEqual(report.phases.map(phase => phase.control), Array(3).fill({exitCode: 0, testsPassed: 1}));
  assert.deepEqual(report.phases.map(phase => phase.qsg.exitCode), [0, 1, 0]);
  assert.deepEqual(report.phases.map(phase => phase.qsg.status), ['pass', 'fail', 'pass']);
  const expectedLine = process.platform === 'linux' ? 8 : 14;
  assert.equal(report.mutation.line, expectedLine);
  for (const phase of report.phases) {
    assert.equal(phase.qsg.file, 'README.md');
    assert.equal(phase.qsg.startLine, expectedLine);
    assert.equal(phase.qsg.endLine, expectedLine);
    assert.equal(phase.qsg.checksExecuted, 1);
    assert.equal(phase.qsg.errors, 0);
    assert.equal(phase.qsg.skipped.length, 1, 'Other host must be explicitly skipped, not simulated');
  }
  assert.equal(report.phases[1].qsg.reason, 'assertion_failed');
  assert.equal(report.phases[1].qsg.failed, 1);
  assert.equal(report.phases[1].qsg.passed, 0);
});

test('README drift demo can be repeated and explains its expected failure without raw output', async t => {
  const result = await run(t, ['--execute']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Synthetic README-only drift experiment/);
  assert.match(result.stdout, /baseline: fixed-command test PASS \(exit 0\); QSG PASS \(exit 0\)/);
  assert.match(result.stdout, /readme-only-typo: fixed-command test PASS \(exit 0\); QSG FAIL \(exit 1\) at README.md:\d+-\d+; changed inputs: README.md/);
  assert.match(result.stdout, /restored: fixed-command test PASS \(exit 0\); QSG PASS \(exit 0\)/);
  assert.match(result.stdout, /not that the broken README passed/);
  assert.doesNotMatch(result.stdout, /MODULE_NOT_FOUND|node:internal|::error/);
});
