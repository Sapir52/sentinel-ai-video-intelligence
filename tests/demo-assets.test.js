import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';

test('16 bundled simulated demo MP4 files exist and are unique',()=>{
 const hashes=new Set();
 for(let i=1;i<=16;i++){
  const f=join(process.cwd(),'public','demo',`feed-${String(i).padStart(2,'0')}.mp4`);
  assert.ok(existsSync(f),`Missing demo clip ${f}`);
  const data=readFileSync(f);
  assert.equal(data.toString('ascii',4,8),'ftyp');
  hashes.add(data.toString('base64'));
 }
 assert.equal(hashes.size,16);
});

test('MP4 upload route exists',()=>{
 const code=readFileSync(join(process.cwd(),'server','index.js'),'utf8');
 assert.match(code,/\/api\/cameras\/:id\/video/);
});
