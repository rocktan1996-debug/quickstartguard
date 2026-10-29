import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../vendor/',import.meta.url);
// Keep this required set independent of the manifest: deleting an entry must
// never silently reduce verification coverage, including third-party notices.
const required=['js-yaml.cjs','marked.cjs','licenses/js-yaml-MIT.txt','licenses/marked-MIT.txt'];
const expected=JSON.parse(await readFile(new URL('checksums.json',root),'utf8'));
if(expected===null || typeof expected!=='object' || Array.isArray(expected)
 || Object.keys(expected).length!==required.length
 || !required.every(file=>Object.hasOwn(expected,file)
  && typeof expected[file]==='string' && /^[a-f0-9]{64}$/.test(expected[file]))) {
 throw new Error('Invalid vendor checksum manifest: expected SHA-256 entries for exactly the shipped parsers and licenses');
}
for(const file of required) {
 const actual=createHash('sha256').update(await readFile(new URL(file,root))).digest('hex');
 if(actual!==expected[file]) throw new Error(`Vendor integrity mismatch: ${file}`);
 console.log(`Verified ${file}`);
}
