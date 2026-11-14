import React from 'react';
import {Audio} from 'remotion';
import {MainComposition} from '@/remotion/MainComposition';
import type {AnimationProps} from '@/lib/AnimationContext';
import {visibleCount} from '@/remotion/templates/visibleCount';
import {mapMotionFrame} from '@/remotion/useMotionFrame';
import {segmentGraphemes} from '@/remotion/templates/typewriterUtils';
import {REMOTION_FPS as fps} from '@/lib/videoConfig';

import {analyze,styles} from '@/lib/sound/analyze';
const labels:Record<string,string>={typewriter:"Typewriter",glitch:"Cyberpunk Glitch",rotation:"Rotation",follower:"Follower","apple-style":"Apple Style","smooth-sliding":"Smooth Sliding","glyph-tile-assemble":"Glyph Tile Assemble","word-highlight-tracker":"Word Highlight Tracker","slide-in":"Slide In"};
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
export function SoundDesign({props,frames,onSound,onPreview}:{props:AnimationProps;frames:number;onSound:(s:string)=>void;onPreview:()=>void}) {
  const [enabled,setEnabled]=React.useState(false),[mode,setMode]=React.useState('Procedural');
  const [library,setLibrary]=React.useState<AudioBuffer>(),[seed,setSeed]=React.useState(0);
  const [density,setDensity]=React.useState(1),[gain,setGain]=React.useState(.6),[offset,setOffset]=React.useState(0);
  const [trim,setTrim]=React.useState(0),[tail,setTail]=React.useState(100);

  const analysis=React.useMemo(()=>analyze(props,frames,fps),[props,frames]);
  const signature=JSON.stringify([props.animationStyle,props.text,frames,analysis.events]);
  const [ai,setAi]=React.useState<{signature:string;events:number[];model:string}|null>(null);
  const [chosen,setChosen]=React.useState('');
  const [directorStatus,setDirectorStatus]=React.useState('');
  const request=React.useRef<AbortController|null>(null);
  React.useEffect(()=>{setDirectorStatus('');return ()=>request.current?.abort()},[signature]);
  async function suggest(){
    request.current?.abort();
    const controller=new AbortController();request.current=controller;
    setDirectorStatus('Consultando el modelo local…');
    try{
      const res=await fetch('/api/sound-director',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({template:props.animationStyle,words:analysis.words,count:analysis.events.length})});
      const data=await res.json();
      if(!controller.signal.aborted){
        if(data.events)setAi({...data,signature});
        setDirectorStatus(data.events?'Propuesta disponible':'Modelo no disponible. Puedes usar las propuestas locales.');
      }
    }catch{if(!controller.signal.aborted)setDirectorStatus('Director local no disponible')}
  }
  const [heard,setHeard]=React.useState('');
  const [url,setUrl]=React.useState(''),[status,setStatus]=React.useState('');
  React.useEffect(()=>{
    let active=true,object='';
    setUrl('');setStatus('Preparando mezcla…');
    if(labels[props.animationStyle] && props.showTextLayer!==false){
      (async()=>{
        let buf=library;
        if(mode==='Procedural'){
          const prefix=props.animationStyle==='glitch'?'glitch':props.animationStyle==='slide-in'?'slide':'key';
          const key='/audio-lab/'+prefix+seed%4+'.wav';
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
        const mix=new Float32Array(Math.round(frames*48000/fps));
        let last=-100,events=0;
        for(const [index,f] of analysis.events.entries()){
          if(chosen===signature && ai?.signature===signature && !ai.events.includes(index))continue;
          if(f-last<density || events>=256)continue;
          last=f;events++;
          const target=Math.round((f+offset)*48000/fps);
          for(let i=left;i<right;i++){
            const j=target+i-hit;
            if(j>=0 && j<mix.length)mix[j]+=src[i]/peak*gain*Math.min(1,(i-left)/48,(right-i)/240);
          }
        }
        object=URL.createObjectURL(wave(mix));setUrl(object);setStatus(events+' eventos');
      })().catch(e=>{if(active)setStatus(String(e.message))});
    }
    return ()=>{active=false;if(object)URL.revokeObjectURL(object)};
  },[props,frames,mode,library,seed,gain,offset,density,trim,tail,onSound,chosen,signature,ai]);
  React.useEffect(()=>{onSound(enabled ? url : '');return ()=>onSound('')},[enabled,url,onSound]);

  React.useEffect(()=>{if(enabled && url && heard===url) window.audioLabTake={url,props};return ()=>{delete window.audioLabTake}},[enabled,url,heard,props]);
  if(!labels[props.animationStyle])return null;
  const button="rounded border border-neutral-500 px-3 py-1 font-medium";
  return <details className="shrink-0 max-h-[45%] overflow-auto border-b border-neutral-600 bg-neutral-900 p-2 text-sm text-white">
    <summary className="cursor-pointer font-semibold">Sound Design · {labels[props.animationStyle]}</summary>
    <section className="my-2"><strong>Animation Analysis</strong><p>{analysis.words} palabras · {analysis.events.length} eventos visuales · clip de {(frames/fps).toFixed(2)} s</p>{analysis.truncated && <p>El texto no termina de aparecer dentro del clip.</p>}</section>
    <section><strong>Sugerencias por reglas locales</strong><div className="flex gap-2">{styles.map(s=><button key={s.name} className={button} onClick={()=>{setChosen('');setDensity(s.density);setGain(s.gain);setTail(s.tail);setSeed(s.variant)}}>{s.name}</button>)}</div></section>
    <section><strong>AI Sound Suggestions</strong> <button className={button} disabled={!analysis.events.length} onClick={suggest}>Consultar IA local</button> {directorStatus} {ai?.signature===signature && <button className={button} onClick={()=>setChosen(signature)}>Aplicar {ai.events.length} acentos · {ai.model}</button>}</section>
    <div className="my-2 flex flex-wrap items-center gap-2">
      <label><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Audio</label>
      {['Procedural','Library'].map(m=><button key={m} aria-pressed={mode===m} onClick={()=>setMode(m)} className={button+(mode===m?' bg-white text-black':' bg-neutral-800 text-white')}>{m}</button>)}
      <button className={button+" bg-emerald-300 text-black"} disabled={!url} onClick={()=>{
        setEnabled(true);onPreview();setHeard(url)
      }}>Probar animación con sonido</button>
      <span role="status">{status}</span>
      {enabled && url && heard===url && <a className="underline" href={url} download={props.animationStyle+".wav"}>Guardar WAV de esta vista previa</a>}    {enabled && url && heard===url && <span>Esta mezcla se incluirá al exportar el video individual.</span>}</div>
    {mode==='Procedural' ? <div className="flex flex-wrap items-center gap-2">Earshot
      {[0,1,2,3].map(i=><button key={i} onClick={()=>setSeed(i)} aria-pressed={seed===i} className={button+(seed===i?' bg-white text-black':' bg-neutral-800 text-white')}>Variante {i+1}</button>)}</div>
      : <input aria-label="Elegir SFX" type="file" accept="audio/*" onChange={async e=>{const file=e.target.files?.[0];if(file)try{setLibrary(await decode(await file.arrayBuffer()))}catch{setStatus('Archivo incompatible')}}}/>}
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">    {([[ 'Intervalo (frames)',density,setDensity,1,15,1],['Ganancia',gain,setGain,0,1,.05],['Desfase (frames)',offset,setOffset,-10,10,1],['Buscar desde (%)',trim,setTrim,0,99,1],['Cola (ms)',tail,setTail,10,500,1]] as const).map(([name,value,set,min,max,step])=><label key={name}>{name} {value}<input type="range" value={value} min={min} max={max} step={step} onChange={e=>set(Number(e.target.value))}/></label>)}
    </div>
  </details>;
}







