import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../vendor/',import.meta.url);
const expected=JSON.parse(await readFile(new URL('checksums.json',root),'utf8'));
for(const [file,hash] of Object.entries(expected)) {
 const actual=createHash('sha256').update(await readFile(new URL(file,root))).digest('hex');
 if(actual!==hash) throw new Error(`Vendor integrity mismatch: ${file}`);
 console.log(`Verified ${file}`);
}
