import test from 'node:test';
import assert from 'node:assert/strict';
import {extractBlocks} from '../dist/markdown.js';
const block=(lang='bash',id='demo',code='echo ready')=>`\`\`\`${lang} qsg=${id}\n${code}\n\`\`\`\n`;
test('marked fence extracted with exact source lines',()=>{
 const [b]=extractBlocks('# Demo\n\n'+block());assert.equal(b.fenceLine,3);assert.equal(b.startLine,4);assert.equal(b.endLine,4);assert.equal(b.code,'echo ready');
});
test('unmarked block not selected',()=>assert.equal(extractBlocks('```bash\necho no\n```\n').length,0));
test('inline qsg text ignored',()=>assert.equal(extractBlocks('Use `bash qsg=demo` in a fenced block.').length,0));
test('HTML-commented fake block ignored',()=>assert.equal(extractBlocks('<!--\n'+block()+'-->\n').length,0));
test('literal block inside a longer fence ignored',()=>assert.equal(extractBlocks('````markdown\n'+block()+'````\n').length,0));
test('CRLF line numbers preserved',()=>{const b=extractBlocks(('# Title\n\n'+block()).replace(/\n/g,'\r\n'))[0];assert.equal(b.startLine,4);});
test('BOM removed without changing line numbers',()=>assert.equal(extractBlocks('\uFEFF'+block())[0].startLine,2));
test('tilde fence supported',()=>assert.equal(extractBlocks('~~~bash qsg=demo\necho ready\n~~~\n')[0].id,'demo'));
test('longer closing fence supported',()=>assert.equal(extractBlocks('```bash qsg=demo\necho ready\n````\n').length,1));
test('multiple blocks retain correct line positions',()=>{const b=extractBlocks(block()+'\nParagraph\n\n'+block('powershell','win','Write-Output ready'));assert.equal(b[1].startLine,8);});
test('metadata unrelated to qsg can coexist',()=>assert.equal(extractBlocks('```bash title="demo" qsg=demo\necho ready\n```\n').length,1));
for(const [name,source] of [
 ['duplicate IDs',block()+block()],['two markers','```bash qsg=a qsg=b\necho x\n```\n'],
 ['invalid ID',block('bash','bad!')],['unclosed block','```bash qsg=demo\necho x\n'],
 ['empty block','```bash qsg=demo\n\n```\n'],['unsupported language',block('javascript')],
 ['quoted block',block().split('\n').map(l=>'> '+l).join('\n')],
 ['listed block','- Item\n\n'+block().split('\n').map(l=>'  '+l).join('\n')],
 ['illegal controls','\x09\x0b\n'],['oversize document','x'.repeat(524289)],
 ['oversize script',block('bash','big','x'.repeat(65537))],
]) test(`reject ${name}`,()=>assert.throws(()=>extractBlocks(source)));
test('four-space indented imitation does not execute',()=>assert.equal(extractBlocks('    ```bash qsg=demo\n    echo ready\n    ```\n').length,0));
