/**
 * One camera video tile. Browser playback is muted to allow autoplay.
 * The optional COCO-SSD overlay is only enabled on a focused camera.
 * Canvas coordinates use the video's native dimensions; the CSS scales the overlay.
 * Object detection runs locally in the browser, not on the Express server.
 */
import React,{useEffect,useRef,useState} from 'react';
import {Camera,Maximize2,ScanEye} from 'lucide-react';

// AI overlays are opt-in and only run on the focused feed to avoid 16 concurrent model inferences.
// The model is loaded lazily; no API key or paid service is required.
let modelPromise;
async function getModel(){
  if(!modelPromise) modelPromise=(async()=>{
    await import('@tensorflow/tfjs');
    const coco=await import('@tensorflow-models/coco-ssd');
    return coco.load({base:'lite_mobilenet_v2'});
  })().catch(e=>{modelPromise=null;throw e});
  return modelPromise;
}
export default function CameraTile({camera,focused,onFocus,paused}){
  const video=useRef(null),canvas=useRef(null);
  const [status,setStatus]=useState('loading'),[detect,setDetect]=useState(false),[aiStatus,setAiStatus]=useState('');
  useEffect(()=>setStatus(camera.source?'loading':'missing'),[camera.source]);
  useEffect(()=>{const el=video.current;if(!el)return;
    if(paused||!camera.enabled){el.pause();setStatus(camera.enabled?'paused':'disabled');return;}
    el.play().catch(()=>setStatus('blocked'));
  },[paused,camera.enabled,camera.source]);
  useEffect(()=>{if(!focused)setDetect(false)},[focused]);
  useEffect(()=>{
    if(!detect||!focused||!camera.source||paused)return;
    let cancelled=false;let timer;let busy=false;
    async function run(){
      try{
        setAiStatus('Loading AI…');const model=await getModel();if(cancelled)return;
        setAiStatus('AI active');
        async function frame(){
          if(cancelled||busy)return;const v=video.current,c=canvas.current;
          if(!v||!c||v.readyState<2)return;
          busy=true;
          try{
            const objects=await model.detect(v);
            if(cancelled)return;
            c.width=v.videoWidth;c.height=v.videoHeight;
            const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
            for(const obj of objects.filter(o=>o.score>=.5)){
              const [x,y,w,h]=obj.bbox;
              ctx.strokeStyle='#55e4bf';ctx.lineWidth=Math.max(2,c.width/350);ctx.strokeRect(x,y,w,h);
              ctx.font=`${Math.max(16,c.width/45)}px sans-serif`;
              const label=`${obj.class} ${Math.round(obj.score*100)}%`;
              const width=ctx.measureText(label).width;
              ctx.fillStyle='#052c2b';ctx.fillRect(x,Math.max(0,y-27),width+10,27);
              ctx.fillStyle='#7fffe0';ctx.fillText(label,x+5,Math.max(20,y-7));
            }
          }catch(e){if(!cancelled)setAiStatus('AI: '+e.message)}finally{busy=false}
        }
        await frame();timer=setInterval(frame,900);
      }catch(e){if(!cancelled)setAiStatus('AI: '+e.message)}
    }
    run();return()=>{cancelled=true;clearInterval(timer);const c=canvas.current;if(c)c.getContext('2d')?.clearRect(0,0,c.width,c.height)};
  },[detect,focused,camera.source,paused]);
  return <div className={'feed '+(focused?'focused':'')}>
    <video key={camera.source||'none'} ref={video} src={camera.source||undefined} autoPlay muted loop playsInline preload="metadata" onPlaying={()=>setStatus('playing')} onError={()=>setStatus('error')}/>
    {focused&&<canvas ref={canvas} className="detection-overlay"/>}
    {status!=='playing'&&<div className="feed-placeholder" style={{zIndex:2}}><Camera size={26}/><span>{status==='missing'?'ADD A REAL VIDEO IN CAMERA FLEET':status==='error'?'VIDEO FAILED TO LOAD':status==='blocked'?'PLAYBACK BLOCKED':status==='paused'?'PAUSED':status==='disabled'?'CAMERA DISABLED':'LOADING VIDEO…'}</span></div>}
    <div className="feed-top"><span className="feed-live"><span className="dot"/> {camera.source&&status==='playing'?'PLAYING':'NO LIVE STREAM'}</span><span>CAM {String(camera.id).padStart(2,'0')}</span></div>
    <div className="feed-bottom"><span>{camera.zone}{camera.source?.startsWith('/demo/')?' · SIMULATED DEMO':''}</span><button className="focus-feed" onClick={()=>onFocus(camera.id)} title={focused?'Back to wall':'Focus camera'}><Maximize2 size={14}/></button></div>
    {focused&&<div className="feed-ai-controls"><button onClick={()=>{setDetect(x=>!x);setAiStatus('')}} disabled={status!=='playing'}><ScanEye size={16}/> {detect?'Disable AI overlay':'Enable AI overlay'}</button>{detect&&<span>{aiStatus}</span>}</div>}
  </div>;
}
