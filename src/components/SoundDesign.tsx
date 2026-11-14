import React from 'react';
import {Audio} from 'remotion';
import {MainComposition} from '@/remotion/MainComposition';
import type {AnimationProps} from '@/lib/AnimationContext';
import {visibleCount} from '@/remotion/templates/visibleCount';
import {mapMotionFrame} from '@/remotion/useMotionFrame';
import {segmentGraphemes} from '@/remotion/templates/typewriterUtils';
import {REMOTION_FPS as fps} from '@/lib/videoConfig';

export function SoundPreview({soundUrl,...props}:AnimationProps & {soundUrl?:string}) {
  return <><MainComposition {...props}/>{soundUrl && <Audio src={soundUrl}/>}</>;
}
function wave(samples:Float32Array) {
  const data=new ArrayBuffer(44+samples.length*3), v=new DataView(data);
  const tag=(pos:number,s:string)=>Array.from(s).forEach((c,i)=>v.setUint8(pos+i,c.charCodeAt(0)));
  tag(0,'RIFF');v.setUint32(4,data.byteLength-8,true);tag(8,'WAVE');tag(12,'fmt ');
  v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,48000,true);v.setUint32(28,144000,true);v.setUint16(32,3,true);v.setUint16(34,24,true);
  tag(36,'data');v.setUint32(40,samples.length*3,true);
  let peak=1;samples.forEach(x=>{peak=Math.max(peak,Math.abs(x))});
  samples.forEach((x,i)=>{const n=Math.round(x/peak*8388606);for(let k=0;k<3;k++)v.setUint8(44+i*3+k,n>>(8*k));});
  return new Blob([data],{type:'audio/wav'});
}
const cache=new Map<string,Promise<AudioBuffer>>();
async function decode(bytes:ArrayBuffer) {
  return new OfflineAudioContext(2,1,48000).decodeAudioData(bytes);
}
export function SoundDesign({props,frames,onSound}:{props:AnimationProps;frames:number;onSound:(s:string)=>void}) {
  const [enabled,setEnabled]=React.useState(false),[mode,setMode]=React.useState('Procedural');
  const [library,setLibrary]=React.useState<AudioBuffer>(),[seed,setSeed]=React.useState(0);
  const [density,setDensity]=React.useState(1),[gain,setGain]=React.useState(.6),[offset,setOffset]=React.useState(0);
  const [trim,setTrim]=React.useState(0),[tail,setTail]=React.useState(100);
  const [url,setUrl]=React.useState(''),[status,setStatus]=React.useState('');
  React.useEffect(()=>{
    let active=true,object='';
    onSound('');setUrl('');
    if(enabled && props.animationStyle==='typewriter' && props.showTextLayer!==false){
      (async()=>{
        let buf=library;
        if(mode==='Procedural'){
          const key='/audio-lab/key'+seed%4+'.wav';
          if(!cache.has(key)) cache.set(key,fetch(key).then(r=>{if(!r.ok)throw Error('Error al cargar Earshot');return r.arrayBuffer()}).then(decode).catch(e=>{cache.delete(key);throw e}));
          buf=await cache.get(key);
        }
        if(!buf)throw Error('Selecciona un archivo SFX');
        if(!active)return;
        const src=buf.getChannelData(0),start=Math.floor(trim/100*(src.length-1));
        let peak=0,hit=start;
        for(let i=start;i<src.length;i++)if(Math.abs(src[i])>peak){peak=Math.abs(src[i]);hit=i;}
        if(peak<.0001)throw Error('Segmento silencioso');
        const left=Math.max(start,hit-240),right=Math.min(src.length,hit+tail*48);
        const mix=new Float32Array(Math.round(frames*48000/fps)), chars=segmentGraphemes(props.text);
        let previous=0,last=-100,events=0;
        for(let f=0;f<frames;f++){
          const n=visibleCount(mapMotionFrame(f,frames,props)*(props.speed||1),chars.length,props,fps);
          const revealed=n>previous && chars.slice(previous,n).some(c=>c.trim());previous=n;
          if(!revealed || f-last<density)continue;
          last=f;events++;
          const target=Math.round((f+offset)*48000/fps);
          for(let i=left;i<right;i++){
            const j=target+i-hit;
            if(j>=0 && j<mix.length)mix[j]+=src[i]/peak*gain*Math.min(1,(i-left)/48,(right-i)/240);
          }
        }
        object=URL.createObjectURL(wave(mix));setUrl(object);onSound(object);setStatus(events+' eventos');
      })().catch(e=>{if(active)setStatus(String(e.message))});
    }
    return ()=>{active=false;if(object)URL.revokeObjectURL(object);onSound('')};
  },[props,frames,enabled,mode,library,seed,gain,offset,density,trim,tail,onSound]);
  if(props.animationStyle!=='typewriter')return null;
  return <details className="p-2 text-xs"><summary>Sound Design · Typewriter</summary>
    <label><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Audio</label>
    <select value={mode} onChange={e=>setMode(e.target.value)}><option>Procedural</option><option>Library</option></select>
    <input type="file" accept="audio/*" onChange={async e=>{const file=e.target.files?.[0];if(file)try{setLibrary(await decode(await file.arrayBuffer()));setMode('Library')}catch{setStatus('Archivo incompatible')}}}/>
    <button onClick={()=>setSeed(s=>s+1)}>Variar Earshot</button>
    {([[ 'Intervalo (frames)',density,setDensity,1,15,1],['Ganancia',gain,setGain,0,1,.05],['Desfase (frames)',offset,setOffset,-10,10,1],['Buscar desde (%)',trim,setTrim,0,99,1],['Cola (ms)',tail,setTail,10,500,1]] as const).map(([name,value,set,min,max,step])=><label key={name}>{name} {value}<input type="range" value={value} min={min} max={max} step={step} onChange={e=>set(Number(e.target.value))}/></label>)}
    {enabled && <span>{status}</span>} {url && <a href={url} download="typewriter.wav">Guardar WAV</a>}
  </details>;
}

