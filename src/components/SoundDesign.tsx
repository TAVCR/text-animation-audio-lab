import React from 'react';
import {Audio} from 'remotion';
import {MainComposition} from '@/remotion/MainComposition';
import type {AnimationProps} from '@/lib/AnimationContext';
import {useAnimation} from '@/lib/AnimationContext';
import {visibleCount} from '@/remotion/templates/visibleCount';
import {mapMotionFrame} from '@/remotion/useMotionFrame';
import {segmentGraphemes} from '@/remotion/templates/typewriterUtils';
import {REMOTION_FPS as fps} from '@/lib/videoConfig';

import {analyze,styles} from '@/lib/sound/analyze';
const labels:Record<string,string>={typewriter:"Typewriter",glitch:"Cyberpunk Glitch",rotation:"Rotation",follower:"Follower","apple-style":"Apple Style","smooth-sliding":"Smooth Sliding","glyph-tile-assemble":"Glyph Tile Assemble","word-highlight-tracker":"Word Highlight Tracker","slide-in":"Slide In","ink-stamp-print":"Ink Stamp Print","bubble-pop":"Bubble Pop","blur-cascade":"Blur Cascade","paper-cutout-assemble":"Paper Cutout Assemble"};
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
  const {setProps,selectTextTemplate}=useAnimation();
  const [enabled,setEnabled]=React.useState(false),[mode,setMode]=React.useState('Procedural');
  const [library,setLibrary]=React.useState<AudioBuffer>(),[seed,setSeed]=React.useState(0);
  const [sourceName,setSourceName]=React.useState('');
  const [autoBusy,setAutoBusy]=React.useState(false);
  async function autoSound(){
    setAutoBusy(true);setDirectorStatus('Buscando sonidos reales en SOUND FX…');
    setSoundFamily(props.animationStyle==='slide-in'?'whoosh':props.animationStyle==='glitch'?'digital':'pop');
    try{
      const response=await fetch('/api/library-auto',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({template:props.animationStyle})});
      const candidate=await response.json();if(!response.ok)throw Error(candidate.error);
      const buffer=await decode(await (await fetch(candidate.url)).arrayBuffer());
      setLibrary(buffer);setSourceName(candidate.name);setMode('Library');setDirectorStatus(candidate.name+' · '+candidate.method);
    }catch(error){setDirectorStatus(error instanceof Error?error.message:'Búsqueda no disponible');setMode('Procedural')}
    finally{setAutoBusy(false)}
  }
  const [soundFamily,setSoundFamily]=React.useState('automatic');
  const [density,setDensity]=React.useState(1),[gain,setGain]=React.useState(.6),[offset,setOffset]=React.useState(0);
  const [trim,setTrim]=React.useState(0),[tail,setTail]=React.useState(100);

  const analysis=React.useMemo(()=>analyze(props,frames,fps),[props,frames]);
  const signature=JSON.stringify([props.animationStyle,props.text,frames,analysis.events]);
  const [ai,setAi]=React.useState<{strategy:{voice:string;landing:string};signature:string;events:number[];model:string;variant:number;gain:number;tail:number;offset:number;reason:string}|null>(null);
  const [port,setPort]=React.useState(3218),[model,setModel]=React.useState(''),[models,setModels]=React.useState<string[]>([]);
  const [approved,setApproved]=React.useState<typeof ai>(null);
  const [chosen,setChosen]=React.useState('');
  const [directorStatus,setDirectorStatus]=React.useState('');
  React.useEffect(()=>{
    const saved=props.soundDesign;
    if(!saved || saved.version!==1 || saved.template!==props.animationStyle)return;
    setMode(saved.mode);setSoundFamily(saved.family);setSeed(saved.seed);setDensity(saved.density);setGain(saved.gain);setOffset(saved.offset);setTrim(saved.trim);setTail(saved.tail);setSourceName(saved.sourceName??'');
    if(saved.plan && typeof saved.plan==='object' && 'signature' in saved.plan){const plan=saved.plan as NonNullable<typeof ai>;setApproved(plan);setChosen(plan.signature)}
    if(saved.mode==='Library')setDirectorStatus('Vuelve a seleccionar el archivo '+(saved.sourceName??'de biblioteca'));
  },[props.soundDesign,props.animationStyle]);
  const request=React.useRef<AbortController|null>(null);
  React.useEffect(()=>{setDirectorStatus('');return ()=>request.current?.abort()},[signature]);
  async function suggest(){
    request.current?.abort();
    const controller=new AbortController();request.current=controller;
    setDirectorStatus('Consultando el modelo local…');
    try{
      const res=await fetch('/api/sound-director',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({template:props.animationStyle,text:props.text,words:analysis.words,frames:analysis.events,heads:analysis.heads,motion:{decelerationFrames:analysis.decelerations.slice(0,12),peakFrames:analysis.peaks.slice(0,12),settleFrames:analysis.stops.slice(-12),backwardSamples:analysis.rebounds.length,visibleChanges:analysis.visibleChanges},port,model})});
      const data=await res.json();
      if(!controller.signal.aborted){
        if(data.events)setAi({...data,signature});
        setDirectorStatus(data.events?data.reason:(data.error || 'Proveedor no disponible'));
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
        const plan=chosen===signature && approved?.signature===signature?approved:null;
        let buf=library;
        if(mode==='Procedural'){
          const prefix=props.animationStyle==='glitch'?'glitch':props.animationStyle==='slide-in'?'slide':'key';
          const directed=plan && ({click:'click',sweep:'whoosh',pulse:'digital'}[plan.strategy.voice]);
          const key=soundFamily!=='automatic' ? '/audio-lab/'+soundFamily+'.wav' : directed ? '/audio-lab/'+directed+'.wav' : plan?.strategy.voice==='texture' ? '/audio-lab/texture'+seed%4+'.wav' : '/audio-lab/'+prefix+seed%4+'.wav';
          if(!cache.has(key)) cache.set(key,fetch(key).then(r=>{if(!r.ok)throw Error('Error al cargar Earshot');return r.arrayBuffer()}).then(decode).catch(e=>{cache.delete(key);throw e}));
          buf=await cache.get(key);
        }
        if(!buf)throw Error('Selecciona un archivo SFX');
        if(!active)return;
        const src=buf.getChannelData(0),start=Math.floor(trim/100*(src.length-1));
        let peak=0,hit=start;
        for(let i=start;i<src.length;i++)if(Math.abs(src[i])>peak){peak=Math.abs(src[i]);hit=i;}
        if(peak<.0001)throw Error('Segmento silencioso');
        const lead=plan?.strategy.voice==="sweep" ? Math.min(hit-start,4800) : 240;
        const left=Math.max(start,hit-lead),right=Math.min(src.length,hit+tail*48);
        const mix=new Float32Array(Math.round(frames*48000/fps));
        let last=-100,events=0,shortened=0,adjusted=0;
        for(let index=0;index<analysis.events.length;index++){
          const f=analysis.events[index];
          if(plan && !plan.events.includes(index))continue;
          if(f-last<density || events>=256)continue;
          const requestedTarget=Math.round((f+offset)*48000/fps);
          // Reserve one millisecond for a fade when the requested peak is at the clip boundary.
          const target=Math.max(48,requestedTarget);
          if(target!==requestedTarget)adjusted++;
          last=f;events++;
          const boundedLeft=Math.max(left,hit-target);
          if(boundedLeft>left)shortened++;
          for(let i=boundedLeft;i<right;i++){
            const j=target+i-hit;
            if(j>=0 && j<mix.length)mix[j]+=src[i]/peak*gain*Math.min(1,(i-boundedLeft)/48,(right-i)/240);
          }
        }
        if(plan?.strategy.landing==='last' && analysis.stops.length){
          const at=Math.round(analysis.stops[analysis.stops.length-1]*48000/fps);
          for(let i=0;i<3600 && at+i<mix.length;i++)mix[at+i]+=.35*gain*Math.sin(i*.025)*Math.exp(-i/650);
        }
        object=URL.createObjectURL(wave(mix));setUrl(object);setStatus(events+' eventos'+(shortened ? ` · ${shortened} ataques acortados al inicio del clip` : '')+(adjusted ? ` · ${adjusted} picos ajustados al primer milisegundo` : ''));
      })().catch(e=>{if(active)setStatus(String(e.message))});
    }
    return ()=>{active=false;if(object)URL.revokeObjectURL(object)};
  },[props,frames,mode,library,seed,gain,offset,density,trim,tail,onSound,chosen,signature,approved,soundFamily]);
  React.useEffect(()=>{onSound(enabled ? url : '');return ()=>onSound('')},[enabled,url,onSound]);

  React.useEffect(()=>{if(enabled && url && heard===url) window.audioLabTake={url,props};return ()=>{delete window.audioLabTake}},[enabled,url,heard,props]);
  if(!labels[props.animationStyle]) return <div className="shrink-0 flex flex-wrap items-center gap-3 border-b border-neutral-600 bg-neutral-900 px-4 py-3 text-sm text-white" role="status">
    <strong>Sound Design</strong>
    <span>El sonido aún no está disponible para esta plantilla.</span>
    <button type="button" className="rounded border border-emerald-400 bg-emerald-300 px-3 py-1 font-semibold text-black" onClick={()=>selectTextTemplate('typewriter')}>Probar Typewriter con sonido</button>
  </div>;
  const button="rounded border border-neutral-500 px-3 py-1 font-medium";
  return <details className="shrink-0 max-h-[45%] overflow-auto border-b border-neutral-600 bg-neutral-900 p-2 text-sm text-white">
    <summary className="cursor-pointer rounded bg-emerald-300 px-3 py-2 font-semibold text-black">🔊 Sound Design · {labels[props.animationStyle]} — abrir opciones de sonido</summary>
    {['slide-in','glitch','bubble-pop'].includes(props.animationStyle) && <div className="my-2"><button type="button" className={button} disabled={autoBusy} onClick={autoSound}>{autoBusy?'Buscando…':'Auto Sound Design'}</button><span className="ml-2">{sourceName && 'Library: '+sourceName} · Procedural: {soundFamily}</span></div>}
    {approved && approved.signature!==signature && <p role="status">La animación cambió. Los controles se conservan; consulta y aplica una propuesta nueva para adaptar los eventos.</p>}
    <section className="my-2"><strong>Animation Analysis</strong><p>{analysis.words} palabras · {analysis.events.length} eventos visuales · clip de {(frames/fps).toFixed(2)} s</p>{analysis.stops.length>0 && <p>Asentamiento al 1 % · último fotograma {analysis.stops[analysis.stops.length-1]}</p>}{analysis.truncated && <p>El texto no termina de aparecer dentro del clip.</p>}</section>
    <section><strong>Sugerencias por reglas locales</strong><div className="flex gap-2">{styles.map(s=><button key={s.name} className={button} onClick={()=>{setChosen('');setDensity(s.density);setGain(s.gain);setTail(s.tail);setSeed(s.variant)}}>{s.name}</button>)}</div></section>
    <section><strong>AI Sound Suggestions</strong> <select aria-label="Proveedor local" value={port} onChange={e=>{setPort(+e.target.value);setModel('');setModels([])}}>{[[3218,"Audio Lab · llama.cpp"],[11434,"Ollama"],[1234,"API local 1234"],[8080,"API local 8080"]].map(([v,n])=><option key={v} value={v}>{n}</option>)}</select> <button className={button} onClick={async()=>{try{const r=await fetch("/api/sound-director",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({probe:true,port})});const d=await r.json();setModels(d.models||[]);setDirectorStatus(d.models?.length?"Conectado":d.error)}catch{setDirectorStatus("Sin conexión")}}}>Comprobar conexión</button> {models.length>0 && <select aria-label="Modelo" value={model||models[0]} onChange={e=>setModel(e.target.value)}>{models.map(m=><option key={m}>{m}</option>)}</select>} <button className={button} disabled={!analysis.events.length} onClick={suggest}>Consultar IA local</button> {directorStatus} {ai?.signature===signature && <button className={button} title={ai.reason} onClick={()=>{setApproved(ai);setChosen(signature);setDensity(1);setSeed(ai.variant);setGain(ai.gain);setTail(ai.tail);setOffset(ai.offset)}}>Aplicar {ai.events.length} acentos · {ai.model}</button>}</section>
    <div className="my-2 flex flex-wrap items-center gap-2">
      <button className={button} onClick={()=>setProps(prev=>({...prev,soundDesign:{version:1,template:props.animationStyle,mode:mode==='Library'?'Library':'Procedural',sourceName,family:soundFamily,seed,density,gain,offset,trim,tail,plan:chosen===signature?approved:undefined}}))}>Guardar diseño en proyecto</button>
      <label><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Audio</label>
      {['Procedural','Library'].map(m=><button key={m} aria-pressed={mode===m} onClick={()=>setMode(m)} className={button+(mode===m?' bg-white text-black':' bg-neutral-800 text-white')}>{m}</button>)}
      <button className={button+" bg-emerald-300 text-black"} disabled={!url} onClick={()=>{
        setEnabled(true);onPreview();setHeard(url)
      }}>Probar animación con sonido</button>
      <span role="status">{status}</span>
      {enabled && url && heard===url && <a className="underline" href={url} download={props.animationStyle+".wav"}>Guardar WAV de esta vista previa</a>}    {enabled && url && heard===url && <span>Esta mezcla se incluirá al exportar el video individual.</span>}</div>
    {mode==='Procedural' ? <div className="flex flex-wrap items-center gap-2">Earshot
      <select aria-label="Familia sonora" value={soundFamily} onChange={e=>setSoundFamily(e.target.value)} className="bg-neutral-800 text-white"><option value="automatic">Automática</option><option value="whoosh">Whoosh · crisp</option><option value="impact">Impacto · punch</option><option value="riser">Riser · air</option><option value="swish">Transición suave</option><option value="click">Click suave</option><option value="digital">Interferencia digital</option><option value="pop">Pop · Earshot pop/0</option></select>
      {[0,1,2,3].map(i=><button key={i} onClick={()=>setSeed(i)} aria-pressed={seed===i} className={button+(seed===i?' bg-white text-black':' bg-neutral-800 text-white')}>Variante {i+1}</button>)}</div>
      : <input aria-label="Elegir SFX" type="file" accept="audio/*" onChange={async e=>{const file=e.target.files?.[0];if(file)try{setLibrary(await decode(await file.arrayBuffer()));setSourceName(file.name)}catch{setStatus('Archivo incompatible')}}}/>}
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">    {([[ 'Intervalo (frames)',density,setDensity,1,15,1],['Ganancia',gain,setGain,0,1,.05],['Desfase (frames)',offset,setOffset,-10,10,1],['Buscar desde (%)',trim,setTrim,0,99,1],['Cola (ms)',tail,setTail,10,500,1]] as const).map(([name,value,set,min,max,step])=><label key={name}>{name} {value}<input type="range" value={value} min={min} max={max} step={step} onChange={e=>set(Number(e.target.value))}/></label>)}
    </div>
  </details>;
}















