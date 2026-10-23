/**
 * Download sixteen independent, user-selected stock MP4 files into public/stock.
 * Sources must be licensed for your intended use. No copyrighted assets are bundled.
 * Run: node scripts/install-videos.mjs scripts/video-sources.json
 */
import {readFile, mkdir, writeFile, rename, rm} from 'node:fs/promises';
import {join, dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const manifest=process.argv[2]||'scripts/video-sources.json';
const entries=JSON.parse(await readFile(resolve(manifest),'utf8'));
if(!Array.isArray(entries)||entries.length!==16||new Set(entries.map(e=>e.id)).size!==16)throw Error('Provide exactly 16 unique camera IDs');
const urls=entries.map(e=>e.url);
if(urls.some(u=>!/^https:\/\//.test(u))||new Set(urls).size!==16)throw Error('Each camera needs a distinct HTTPS MP4 URL');
await mkdir(join(root,'public','stock'),{recursive:true});
for(const {id,url} of entries){
 const dest=join(root,'public','stock',`camera-${String(id).padStart(2,'0')}.mp4`);
 const temp=dest+'.part';
 console.log(`Downloading camera ${id}...`);
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(120000)});
  if(!response.ok)throw Error(`HTTP ${response.status}`);
  const chunks=[];let bytes=0;
  for await(const chunk of response.body){bytes+=chunk.length;if(bytes>150*1024*1024)throw Error('File exceeds 150MB');chunks.push(chunk);}
  const data=Buffer.concat(chunks);
  if(data.length<12||data.toString('ascii',4,8)!=='ftyp')throw Error('Not a valid MP4 container');
  await writeFile(temp,data);await rename(temp,dest);
 }catch(error){await rm(temp,{force:true});throw Error(`Camera ${id}: ${error.message}`);}
}
console.log('16 videos downloaded. Run npm run dev; new databases use these local files.');
