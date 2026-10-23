import test from 'node:test';
import assert from 'node:assert/strict';
import {parseConfig,validateConfig} from '../dist/config.js';
import {yaml} from '../dist/vendor.js';
import {check} from './helpers.mjs';
const config=(overrides={})=>({schemaVersion:1,checks:[check()],...overrides});
test('YAML config loads with defaults and assertions',()=>{
 const c=parseConfig('schemaVersion: 1\nchecks:\n  - id: demo\n    file: README.md\n    platform: linux\n    shell: bash\n    expect:\n      stdoutContains: ["Usage:", "中文"]\n');
 assert.equal(c.checks[0].cwd,'.');assert.equal(c.checks[0].timeoutSeconds,120);assert.equal(c.checks[0].expect.exitCode,0);
});
test('JSON is accepted as valid YAML',()=>assert.equal(parseConfig(JSON.stringify(config())).checks.length,1));
test('UTF-8 BOM and CRLF configuration accepted',()=>assert.equal(parseConfig('\uFEFF'+JSON.stringify(config()).replace(/\n/g,'\r\n')).schemaVersion,1));
for(const [name,value] of [
 ['empty config',null], ['array config',[]], ['unknown root',{...config(),steps:[]}],
 ['unsupported version',config({schemaVersion:2})],['zero checks',config({checks:[]})],
 ['duplicate IDs',config({checks:[check(),check()]})],['invalid ID',config({checks:[check({id:'bad ID'})]})],
 ['invalid platform',config({checks:[check({platform:'darwin'})]})],
 ['shell mismatch',config({checks:[check({platform:'linux',shell:'pwsh'})]})],
 ['unknown check field',config({checks:[check({command:'evil'})]})],
 ['absolute path',config({checks:[check({file:'/tmp/README.md'})]})],
 ['Windows absolute path',config({checks:[check({file:'C:\\README.md'})]})],
 ['Windows drive relative path',config({checks:[check({file:'C:README.md'})]})],
 ['parent path',config({checks:[check({file:'../README.md'})]})],
 ['backslash path',config({checks:[check({file:'docs\\README.md'})]})],
 ['non-markdown file',config({checks:[check({file:'package.json'})]})],
 ['cwd escape',config({checks:[check({cwd:'../'})]})],
 ['zero timeout',config({checks:[check({timeoutSeconds:0})]})],
 ['timeout beyond cap',config({checks:[check({timeoutSeconds:301})]})],
 ['fraction timeout',config({checks:[check({timeoutSeconds:1.5})]})],
 ['string timeout',config({checks:[check({timeoutSeconds:'10'})]})],
 ['bad exit code',config({checks:[check({expect:{exitCode:256}})]})],
 ['empty assertion list',config({checks:[check({expect:{stdoutContains:[]}})]})],
 ['non-string assertion',config({checks:[check({expect:{stdoutContains:[7]}})]})],
 ['unknown assertion',config({checks:[check({expect:{stdoutRegex:'.*'}})]})],
]) test(`reject ${name}`,()=>assert.throws(()=>validateConfig(value)));
test('duplicate YAML keys rejected',()=>assert.throws(()=>parseConfig('schemaVersion: 1\nschemaVersion: 1\nchecks: []'),/duplicated/));
test('unknown YAML type tags rejected',()=>assert.throws(()=>parseConfig('!!js/function function(){}'),/unknown tag/));
test('anchors and aliases rejected',()=>assert.throws(()=>parseConfig('schemaVersion: 1\nchecks: &foo []'),/anchors/));
test('prototype keys rejected by schema',()=>assert.throws(()=>parseConfig('schemaVersion: 1\n__proto__: {polluted: true}\nchecks: []'),/Unknown field/));
test('YAML merge keys disabled by restricted schema',()=>assert.throws(()=>parseConfig('<<: {schemaVersion: 1}\nchecks: []'),/Unknown field/));
test('YAML nesting bounded',()=>assert.throws(()=>parseConfig('['.repeat(80)+'0'+']'.repeat(80)),/nesting/));
test('config size bounded',()=>assert.throws(()=>parseConfig(' '.repeat(65537)),/64 KiB/));
test('upstream merge-prototype regression fixed in vendored parser',()=>{
 const obj=yaml.load('payload: &ref\n  polluted: bar\nfoo:\n  <<:\n    __proto__: *ref\n');
 assert.equal(obj.foo.polluted,undefined);assert.equal(Object.hasOwn(obj.foo,'__proto__'),true);assert.equal({}.polluted,undefined);
});
