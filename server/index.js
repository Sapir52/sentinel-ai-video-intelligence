/**
 * Sentinel/AI HTTP and WebSocket server.
 * REST endpoints own persistence; WebSocket broadcasts notify clients to refetch.
 * Uploaded MP4 files are local; this is a single-user development demo, not a VMS.
 * Security measures here are defense-in-depth, not production authentication.
 */
import express from 'express';
import {WebSocketServer,WebSocket} from 'ws';
import {createServer} from 'node:http';
import {join} from 'node:path';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {db,root} from './db/database.js';
import {requireLocalOrToken,createLimiter,validateId,safeSearch} from './security.js';
import {validSeverity,normalizeEvent,insertEvent,setBroadcaster} from './services/events.js';
const app=express();app.disable('x-powered-by');app.use(express.json({limit:'100kb'}));app.use('/api',createLimiter());app.use('/api',requireLocalOrToken);app.use((_req,res,next)=>{res.set('X-Content-Type-Options','nosniff');res.set('Referrer-Policy','no-referrer');next();});
const server=createServer(app);const wss=new WebSocketServer({server,path:'/ws',maxPayload:4096});
wss.on('connection',(ws,req)=>{if(process.env.SENTINEL_API_TOKEN){ws.close(1008,'Use unprotected localhost mode for browser demo');return;}ws.isAlive=true;ws.on('pong',()=>{ws.isAlive=true;});});
const heartbeat=setInterval(()=>{for(const client of wss.clients){if(!client.isAlive){client.terminate();continue;}client.isAlive=false;client.ping();}},30000);heartbeat.unref();
function broadcast(message){const payload=JSON.stringify(message);for(const client of wss.clients)if(client.readyState===WebSocket.OPEN)client.send(payload);}
setBroadcaster(broadcast);
app.get('/api/health',(_req,res)=>res.json({ok:true,storage:'SQLite',realtime:'WebSocket'}));
// Accept actual MP4 files from the Camera Fleet UI. Files stay on this computer.
// Explicit ID validation, MIME checks and a strict upload limit protect the local server.
const mediaDir=join(root,'public','uploads');mkdirSync(mediaDir,{recursive:true});
app.use('/uploads',express.static(mediaDir,{setHeaders(res){res.set('Cache-Control','no-store');}}));
// Serve downloaded licensed stock clips from the same origin as the app.
app.use('/stock',express.static(join(root,'public','stock')));
app.post('/api/cameras/:id/video',express.raw({type:'video/mp4',limit:'100mb'}),(req,res)=>{
  const id=Number(req.params.id);
  const camera=db.prepare('SELECT id FROM cameras WHERE id=?').get(id);
  if(!Number.isSafeInteger(id)||id<=0||!camera)return res.status(404).json({error:'Camera not found'});
  if(!Buffer.isBuffer(req.body)||req.body.length<12||req.body.toString('ascii',4,8)!=='ftyp')return res.status(400).json({error:'Upload an MP4 video file'});
  // Reject identical uploads across different cameras; each feed must have independent footage.
  const fingerprint=createHash('sha256').update(req.body).digest('hex');
  const all=db.prepare('SELECT id,source FROM cameras WHERE id<>?').all(id);
  for(const other of all){if(!other.source?.startsWith('/uploads/'))continue;const path=join(mediaDir,other.source.slice('/uploads/'.length));if(existsSync(path)&&createHash('sha256').update(readFileSync(path)).digest('hex')===fingerprint)return res.status(409).json({error:`This exact video is already used by camera ${other.id}. Choose different footage.`});}
  const filename=`camera-${id}-${Date.now()}.mp4`;
  writeFileSync(join(mediaDir,filename),req.body,{flag:'wx'});
  const source=`/uploads/${filename}`;
  db.prepare('UPDATE cameras SET source=? WHERE id=?').run(source,id);
  broadcast({kind:'cameras'});
  res.json({ok:true,source});
});
app.get('/api/cameras',(_req,res)=>res.json(db.prepare('SELECT * FROM cameras ORDER BY id').all()));
app.post('/api/cameras',(req,res)=>{const {name,zone,source=''}=req.body;if(typeof name!=='string'||!name.trim()||typeof zone!=='string'||!zone.trim()||typeof source!=='string'||source.length>1000)return res.status(400).json({error:'Name, zone and valid source required'});const result=db.prepare('INSERT INTO cameras(name,zone,source) VALUES(?,?,?)').run(name.trim().slice(0,80),zone.trim().slice(0,80),source);broadcast({kind:'cameras'});res.status(201).json({id:Number(result.lastInsertRowid)});});
app.patch('/api/cameras/:id',(req,res)=>{const id=Number(req.params.id);const current=db.prepare('SELECT * FROM cameras WHERE id=?').get(id);if(!current)return res.status(404).json({error:'Not found'});const name=typeof req.body.name==='string'?req.body.name.trim().slice(0,80):current.name;const zone=typeof req.body.zone==='string'?req.body.zone.trim().slice(0,80):current.zone;const source=typeof req.body.source==='string'?req.body.source:current.source;const enabled=typeof req.body.enabled==='boolean'?Number(req.body.enabled):current.enabled;if(!name||!zone||source.length>1000)return res.status(400).json({error:'Invalid camera fields'});db.prepare('UPDATE cameras SET name=?,zone=?,source=?,enabled=? WHERE id=?').run(name,zone,source,enabled,id);broadcast({kind:'cameras'});res.json({ok:true});});
app.delete('/api/cameras/:id',(req,res)=>{const result=db.prepare('DELETE FROM cameras WHERE id=?').run(Number(req.params.id));if(!result.changes)return res.status(404).json({error:'Not found'});broadcast({kind:'cameras'});res.json({ok:true});});
app.get('/api/events',(req,res)=>{const q=safeSearch(req.query.q);const severity=String(req.query.severity||'all');const camera=Number(req.query.camera||0);const limit=Math.min(500,Math.max(1,Number(req.query.limit)||200));const offset=Math.min(100000,Math.max(0,Number(req.query.offset)||0));if(severity!=='all'&&!validSeverity.has(severity))return res.status(400).json({error:'Invalid severity'});res.json(db.prepare(`SELECT e.*,c.name camera_name,c.zone FROM events e LEFT JOIN cameras c ON c.id=e.camera_id WHERE (?='all' OR e.severity=?) AND (?=0 OR e.camera_id=?) AND (lower(e.type) LIKE ? OR lower(COALESCE(c.zone,'')) LIKE ? OR lower(COALESCE(c.name,'')) LIKE ?) ORDER BY e.created_at DESC LIMIT ? OFFSET ?`).all(severity,severity,camera,camera,...Array(3).fill(`%${q}%`),limit,offset));});
app.post('/api/events',(req,res)=>{try{res.status(201).json(insertEvent(normalizeEvent(req.body,req.body.origin==='ai'?'ai':'manual')));}catch(err){res.status(400).json({error:err.message});}});
app.post('/api/demo-event',(req,res)=>{const cameras=db.prepare('SELECT id FROM cameras WHERE enabled=1').all();if(!cameras.length)return res.status(409).json({error:'No enabled cameras'});const types=['Person detected','Vehicle detected','Object detected','Movement detected'];const camera=cameras[Math.floor(Math.random()*cameras.length)];const event=normalizeEvent({camera_id:camera.id,type:types[Math.floor(Math.random()*types.length)],severity:['low','medium','high'][Math.floor(Math.random()*3)],confidence:Math.round(70+Math.random()*29)},'demo');res.status(201).json(insertEvent(event));});
app.get('/api/analytics',(_req,res)=>{const since=Date.now()-24*3600*1000;res.json({bySeverity:db.prepare('SELECT severity,COUNT(*) count FROM events WHERE created_at>=? GROUP BY severity').all(since),byCamera:db.prepare('SELECT camera_id,COUNT(*) count FROM events WHERE created_at>=? GROUP BY camera_id ORDER BY count DESC LIMIT 10').all(since),byHour:db.prepare("SELECT strftime('%Y-%m-%d %H:00',created_at/1000,'unixepoch') hour,COUNT(*) count FROM events WHERE created_at>=? GROUP BY hour ORDER BY hour").all(since)});});
app.get('/api/export/events.csv',(_req,res)=>{res.type('text/csv').set('Content-Disposition','attachment; filename=sentinel-events.csv');const rows=db.prepare('SELECT id,camera_id,type,severity,confidence,created_at,origin FROM events ORDER BY created_at DESC LIMIT 10000').all();const clean=v=>{let s=String(v??'');if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};res.send(['id,camera_id,type,severity,confidence,created_at,origin',...rows.map(r=>Object.values(r).map(clean).join(','))].join('\n'));});
app.get('/api/stats',(_req,res)=>res.json({events:db.prepare('SELECT count(*) n FROM events').get().n,high:db.prepare("SELECT count(*) n FROM events WHERE severity='high'").get().n,cameras:db.prepare('SELECT count(*) n FROM cameras WHERE enabled=1').get().n}));
// In production, serve the compiled React bundle from the repository root.
app.use(express.static(join(root,'dist')));
app.get('*',(req,res)=>{if(req.path.startsWith('/api/'))return res.status(404).json({error:'Not found'});res.sendFile(join(root,'dist','index.html'));});
// Fail with a useful message instead of an unhandled EADDRINUSE stack trace.
const port=Number(process.env.PORT||3001);
const host=process.env.HOST||'127.0.0.1';
server.on('error',error=>{
  if(error.code==='EADDRINUSE') console.error(`Port ${port} is already in use. Close the previous Sentinel server before starting again.`);
  else console.error('Server failed:',error);
  process.exitCode=1;
  wss.close();
});
server.listen(port,host,()=>console.log(`Sentinel API listening on http://${host}:${port}`));
