/**
 * SQLite schema, initial camera records and upgrade migrations.
 * Preserve user-configured sources; never silently replace uploaded footage.
 * WAL mode permits responsive reads during writes in this local deployment.
 */
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
// Resolve the repository root (server/db -> server -> project).
const root=dirname(dirname(dirname(fileURLToPath(import.meta.url))));
// Keep the original server/data location so upgrades preserve existing events.
const dataDir=process.env.DATA_DIR||join(root,'server','data');mkdirSync(dataDir,{recursive:true});
const db=new DatabaseSync(join(dataDir,'sentinel.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS cameras(id INTEGER PRIMARY KEY, name TEXT NOT NULL, zone TEXT NOT NULL, source TEXT NOT NULL DEFAULT '', enabled INTEGER NOT NULL DEFAULT 1); CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,camera_id INTEGER NOT NULL,type TEXT NOT NULL,severity TEXT NOT NULL,confidence REAL NOT NULL,created_at INTEGER NOT NULL,origin TEXT NOT NULL DEFAULT 'demo'); CREATE INDEX IF NOT EXISTS idx_events_time ON events(created_at DESC); CREATE INDEX IF NOT EXISTS idx_events_camera ON events(camera_id);`);
// Do not pretend synthetic animations are CCTV footage. New cameras start without video.
// Never overwrite uploaded files or custom URLs during an upgrade.
const zones=['North Entrance','Loading Dock','Parking Level B','Main Lobby','East Corridor','Warehouse 02','South Gate','Rooftop','Elevator Hall','City Intersection','Reception Desk','Office Floor','Stairwell','Garden Walkway','Garage Exit','Service Entrance'];
if(db.prepare('SELECT count(*) n FROM cameras').get().n===0){
  const add=db.prepare('INSERT INTO cameras(id,name,zone,source) VALUES(?,?,?,?)');
  for(let i=1;i<=16;i++) {
    // A local stock clip is used only when it has actually been downloaded.
    const filename=`camera-${String(i).padStart(2,'0')}.mp4`;
    const source=existsSync(join(root,'public','stock',filename))?`/stock/${filename}`:`/demo/feed-${String(i).padStart(2,'0')}.mp4`;
    add.run(i,`Camera ${String(i).padStart(2,'0')}`,zones[i-1],source);
  }
}
// Clear only legacy synthetic demo feeds (including feed-XX and camera-XX paths).
// User-provided uploads and URLs are never changed.
const upgrade=db.prepare("UPDATE cameras SET source=?,zone=? WHERE id=? AND (source='' OR source LIKE '/demo/feed-%.mp4' OR source LIKE '/demo/camera-%.mp4')");
for(let i=1;i<=16;i++){
  const filename=`camera-${String(i).padStart(2,'0')}.mp4`;
  const source=existsSync(join(root,'public','stock',filename))?`/stock/${filename}`:`/demo/feed-${String(i).padStart(2,'0')}.mp4`;
  upgrade.run(source,zones[i-1],i);
}
export {db,root};
