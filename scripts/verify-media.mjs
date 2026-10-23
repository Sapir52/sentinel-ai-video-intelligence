/** Verify that all sixteen cameras have unique, playable MP4 container files. */
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
let ok=true;const hashes=new Map();
for(let id=1;id<=16;id++){
  const file=join('public','stock',`camera-${String(id).padStart(2,'0')}.mp4`);
  try{
    const s=await stat(file);const b=await readFile(file);
    if(s.size<1024||b.toString('ascii',4,8)!=='ftyp')throw Error('invalid or tiny MP4');
    const h=createHash('sha256').update(b).digest('hex');
    if(hashes.has(h))throw Error(`duplicate of camera ${hashes.get(h)}`);
    hashes.set(h,id);console.log(`PASS camera ${id}: ${(s.size/1024/1024).toFixed(1)} MB`);
  }catch(e){ok=false;console.error(`MISSING/INVALID camera ${id}: ${e.message}`);}
}
if(!ok){console.error('Add 16 licensed clips using Camera Fleet or scripts/install-videos.mjs');process.exitCode=1;}
