// A controlled, synthetic experiment, not a claim about an upstream project's tests.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cp, mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {childEnvironment} from '../../dist/environment.js';
import {safeConsole} from '../../dist/reporters.js';

const fixture = fileURLToPath(new URL('./project/', import.meta.url));
const cli = fileURLToPath(new URL('../../dist/cli.js', import.meta.url));
const command = 'node ./scripts/hello.mjs';
const typo = 'node ./scripts/hello-typo.mjs';
const controlArgs = ['--test', '--test-reporter=tap', 'test/smoke.test.mjs'];

// Exclude only QSG's generated reports; compare every other file, including the
// control test, program and configuration, rather than asserting a handpicked list.
async function snapshot(root, relative = '') {
  const files = {};
  for (const entry of (await readdir(path.join(root, relative), {withFileTypes: true})).sort((a,b) => a.name.localeCompare(b.name))) {
    if (!relative && entry.name === '.qsg') continue;
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) Object.assign(files, await snapshot(root, name));
    else {
      assert.ok(entry.isFile(), `Unexpected non-file fixture input: ${name}`);
      files[name] = createHash('sha256').update(await readFile(path.join(root, name))).digest('hex');
    }
  }
  return files;
}

function changedFiles(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter(name => before[name] !== after[name]).sort();
}

function invoke(root, args) {
  // Filter both arms identically. No GitHub control channels or parent secrets.
  const result = spawnSync(process.execPath, args, {
    cwd: root, env: childEnvironment(process.env), encoding: 'utf8',
    timeout: 20000, maxBuffer: 128 * 1024,
  });
  assert.ifError(result.error);
  assert.equal(result.signal, null, 'Child process did not complete normally');
  return result;
}

async function experiment() {
  assert.ok(['linux', 'win32'].includes(process.platform), 'Demo requires Linux/Bash or Windows/PowerShell 7.4+; no platform simulation.');
  const id = process.platform === 'linux' ? 'greeting-linux' : 'greeting-windows';
  const sourceBefore = await snapshot(fixture);
  const root = await mkdtemp(path.join(os.tmpdir(), 'qsg readme drift 中文-'));
  let result;
  try {
    await cp(fixture, root, {recursive: true});
    const original = await readFile(path.join(root, 'README.md'), 'utf8');
    const lines = original.split('\n');
    const fenceIndex = lines.findIndex(line => line.endsWith(` qsg=${id}`));
    assert.ok(fenceIndex >= 0, 'Selected README fence is missing');
    const line = fenceIndex + 2; // 1-based command line, independently checked below.
    assert.equal(lines[line - 1], command);
    lines[line - 1] = typo;
    const broken = lines.join('\n');
    const baseline = await snapshot(root);
    assert.deepEqual(baseline, sourceBefore, 'Temporary copy differs from fixture');
    const phases = [];

    for (const [name, markdown, qsgExit] of [
      ['baseline', original, 0], ['readme-only-typo', broken, 1], ['restored', original, 0],
    ]) {
      await writeFile(path.join(root, 'README.md'), markdown);
      const changes = changedFiles(baseline, await snapshot(root));
      assert.deepEqual(changes, qsgExit === 1 ? ['README.md'] : [], `${name}: unexpected changed inputs`);
      const control = invoke(root, controlArgs);
      assert.equal(control.status, 0, `${name}: fixed-command smoke test failed`);
      const tap = control.stdout.replace(/\r\n?/g, '\n');
      assert.match(tap, /^# tests 1$/m);
      assert.match(tap, /^# pass 1$/m);
      const reportPath = `.qsg/${name}.json`;
      const qsg = invoke(root, [cli, 'run', '--execute', '--json-out', reportPath]);
      assert.equal(qsg.status, qsgExit, `${name}: unexpected QSG exit; ${safeConsole(qsg.stderr)}`);
      const report = JSON.parse(await readFile(path.join(root, reportPath), 'utf8'));
      assert.equal(report.checksExecuted, 1);
      assert.equal(report.checks.length, 1);
      assert.equal(report.passed, qsgExit === 0 ? 1 : 0);
      assert.equal(report.failed, qsgExit);
      assert.equal(report.errors, 0);
      const check = report.checks[0];
      assert.equal(check.id, id);
      assert.equal(check.file, 'README.md');
      assert.equal(check.startLine, line);
      assert.equal(check.endLine, line);
      assert.equal(check.status, qsgExit === 0 ? 'pass' : 'fail');
      assert.equal(check.reason, qsgExit === 0 ? 'passed' : 'assertion_failed');
      assert.equal(check.exitCode, qsgExit);
      assert.ok(check.assertions.some(item => item.kind === 'exitCode' && item.pass === (qsgExit === 0)));
      assert.ok(qsg.stdout.includes(`${check.status.toUpperCase()} README.md:${line}-${line}`));
      assert.equal(report.outputIncluded, false);
      assert.equal(check.stdout.text, undefined);
      assert.equal(check.stderr.text, undefined);
      assert.deepEqual(changedFiles(baseline, await snapshot(root)), changes, `${name}: checks changed fixture inputs`);
      phases.push({
        name, changedFiles: changes,
        control: {exitCode: control.status, testsPassed: 1},
        qsg: {exitCode: qsg.status, checksExecuted: report.checksExecuted,
          passed: report.passed, failed: report.failed, errors: report.errors,
          skipped: report.skipped, file: check.file, startLine: check.startLine,
          endLine: check.endLine, status: check.status, reason: check.reason},
      });
      result = {experiment: 'synthetic-readme-only-drift', platform: process.platform,
        nodeVersion: process.version, shellVersion: safeConsole(report.shellVersion),
        mutation: {file: 'README.md', line, before: command, after: typo}, phases};
    }
    assert.deepEqual(await snapshot(root), baseline, 'Restoration was not byte-for-byte');
    assert.deepEqual(await snapshot(fixture), sourceBefore, 'Source fixture was changed');
  } finally {
    await rm(root, {recursive: true, force: true});
  }
  return {...result, sourceFixtureUnchanged: true, restoredInputsIdentical: true, temporaryCopyRemoved: true};
}

try {
  const args = process.argv.slice(2);
  assert.ok(args.includes('--execute'), 'No commands executed. Review examples/readme-drift/project, then add --execute. This is not a sandbox.');
  assert.ok(args.every(arg => ['--execute', '--json'].includes(arg)), 'Only --execute and --json are supported.');
  const result = await experiment();
  if (args.includes('--json')) console.log(JSON.stringify(result, null, 2));
  else {
    console.log('Synthetic README-only drift experiment (not an upstream bug or full upstream CI run).');
    console.log(safeConsole(`Host: ${result.platform}; ${result.nodeVersion}; ${result.shellVersion}`));
    for (const phase of result.phases) console.log(`${phase.name}: fixed-command test PASS (exit 0); QSG ${phase.qsg.status.toUpperCase()} (exit ${phase.qsg.exitCode}) at README.md:${phase.qsg.startLine}-${phase.qsg.endLine}; changed inputs: ${phase.changedFiles.join(', ') || 'none'}`);
    console.log('Contrast verified; inputs restored; temporary copy removed; source fixture unchanged.');
    console.log('Demo exit 0 means the expected pass/fail/pass contrast was verified, not that the broken README passed.');
  }
} catch (error) {
  console.error(safeConsole(`README drift demo failed: ${error.message}`));
  process.exitCode = 2;
}
