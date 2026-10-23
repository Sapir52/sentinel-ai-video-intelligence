/**
 * Shared API client for same-origin /api endpoints (Vite proxies in development).
 * Errors are propagated to the UI rather than silently treated as empty results.
 */
export const API='/api';
export async function request(path,options={}) {const res=await fetch(API+path,{headers:{'Content-Type':'application/json'},...options});const data=await res.json();if(!res.ok)throw Error(data.error||'Request failed');return data;}
export const fmt=t=>new Date(t).toLocaleTimeString('en-US',{hour12:false});
