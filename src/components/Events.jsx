/**
 * Search and results presentation for events stored by the backend.
 * Search inputs are debounced by the parent App to reduce REST traffic.
 */
import React from 'react';
import {Search,Activity} from 'lucide-react';
import {fmt} from '../lib/api.js';
function EventSearch({query,setQuery,severity,setSeverity}){return <><div className="search"><Search size={16}/><input placeholder="Search types, zones and cameras..." value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="filters">{['all','high','medium','low'].map(s=><button key={s} className={severity===s?'chosen':''} onClick={()=>setSeverity(s)}>{s==='all'?'All events':s}</button>)}</div></>}
function EventList({events,onChoose}){return <div className="event-list">{events.length?events.map(e=><button className="event" key={e.id} onClick={()=>onChoose(e)}><span className={'event-icon '+e.severity}><Activity size={16}/></span><span className="event-info"><strong>{e.type}</strong><small>CAM {e.camera_id} · {e.zone||'Deleted camera'}</small><small>{e.confidence}% confidence · {e.origin}</small></span><span className="event-right"><small>{fmt(e.created_at)}</small><span className={'priority '+e.severity}>{e.severity}</span></span></button>):<p className="empty">No matching events yet. Start AI detection or enable demo simulation.</p>}</div>}

export {EventSearch,EventList};
