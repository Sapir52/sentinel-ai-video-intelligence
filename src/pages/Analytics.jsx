/**
 * Analytics dashboard: reads aggregates computed by SQLite on the backend.
 * Charts summarize saved events, including simulated demo events where present.
 */
import React,{useEffect,useState} from 'react';
import {BarChart3,Download,RefreshCw} from 'lucide-react';
import {request} from '../lib/api.js';
export default function Analytics(){
 const [data,setData]=useState(null),[error,setError]=useState('');
 const refresh=()=>request('/analytics').then(setData).catch(e=>setError(e.message));
 useEffect(()=>{refresh();const timer=setInterval(refresh,15000);return()=>clearInterval(timer)},[]);
 return <section className="page-panel"><div className="section-head"><div><h2><BarChart3 size={18}/> Analytics — Last 24 hours</h2><p>Aggregated from locally stored detections</p></div><div className="actions"><button onClick={refresh}><RefreshCw size={15}/> Refresh</button><a className="export-link" href="/api/export/events.csv"><Download size={15}/> Export CSV</a></div></div>{error&&<p role="alert">{error}</p>}{!data?<p>Loading analytics…</p>:<div className="analytics-grid"><div><h3>Events by severity</h3>{data.bySeverity.length===0?<p>No events yet</p>:data.bySeverity.map(x=><Bar key={x.severity} label={x.severity} count={x.count} max={Math.max(...data.bySeverity.map(a=>a.count))}/>)}</div><div><h3>Top cameras</h3>{data.byCamera.length===0?<p>No events yet</p>:data.byCamera.map(x=><Bar key={x.camera_id} label={`Camera ${x.camera_id}`} count={x.count} max={Math.max(...data.byCamera.map(a=>a.count))}/>)}</div><div className="wide"><h3>Hourly event counts (UTC)</h3>{data.byHour.length===0?<p>No events yet</p>:<div className="hour-bars">{data.byHour.map(x=><div key={x.hour} title={`${x.hour}: ${x.count} events`} style={{height:`${Math.max(5,x.count/Math.max(...data.byHour.map(a=>a.count))*100)}%`}}/>)}</div>}</div></div>}</section>;
}
function Bar({label,count,max}){return <div className="analytic-row"><span>{label}</span><div><div style={{width:`${count/max*100}%`}}/></div><strong>{count}</strong></div>}
