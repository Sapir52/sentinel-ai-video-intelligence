/**
 * Lightweight validation and local-development request safeguards.
 * This does not replace user authentication, authorization or TLS in production.
 */
export function requireLocalOrToken(req,res,next){
 const token=process.env.SENTINEL_API_TOKEN;
 if(token && req.get('authorization')!==`Bearer ${token}`) return res.status(401).json({error:'Unauthorized'});
 next();
}
export function createLimiter({windowMs=60000,max=120}={}){
 const hits=new Map();
 return (req,res,next)=>{
  const now=Date.now(),key=req.ip||'unknown',entry=hits.get(key);
  if(hits.size>10000)for(const [k,v] of hits)if(v.until<now)hits.delete(k);
  if(!entry||entry.until<now){hits.set(key,{count:1,until:now+windowMs});return next();}
  if(++entry.count>max){res.set('Retry-After',String(Math.ceil((entry.until-now)/1000)));return res.status(429).json({error:'Too many requests'});}
  next();
 };
}
export function validateId(raw){const id=Number(raw);return Number.isSafeInteger(id)&&id>0?id:null;}
export function safeSearch(value){return String(value??'').slice(0,100).replace(/[\\%_]/g,'\\$&').toLowerCase();}
