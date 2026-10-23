/**
 * Event validation, normalization and insertion.
 * Keep the event origin ('ai', 'demo', 'manual') to distinguish evidence from samples.
 */
import {randomUUID} from 'node:crypto';
import {db} from '../db/database.js';
let broadcast=()=>{};
export function setBroadcaster(fn){broadcast=fn;}
const validSeverity=new Set(['low','medium','high']);
function normalizeEvent(body,origin='manual'){const camera_id=Number(body.camera_id);if(!Number.isInteger(camera_id)||!db.prepare('SELECT id FROM cameras WHERE id=?').get(camera_id))throw Error('Valid camera_id required');const type=String(body.type||'Object detected').trim().slice(0,100);const severity=String(body.severity||'low');if(!validSeverity.has(severity))throw Error('Invalid severity');const confidence=Number(body.confidence??0);if(!Number.isFinite(confidence)||confidence<0||confidence>100)throw Error('Confidence must be 0..100');return {id:randomUUID(),camera_id,type,severity,confidence,created_at:Date.now(),origin};}
function insertEvent(event){db.prepare('INSERT INTO events(id,camera_id,type,severity,confidence,created_at,origin) VALUES(@id,@camera_id,@type,@severity,@confidence,@created_at,@origin)').run(event);broadcast({kind:'event',event});return event;}

export {validSeverity,normalizeEvent,insertEvent};
