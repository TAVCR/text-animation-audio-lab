import React from 'react';
import {Audio} from 'remotion';
import {MainComposition} from '@/remotion/MainComposition';
import type {AnimationProps} from '@/lib/AnimationContext';
import {useAnimation} from '@/lib/AnimationContext';
import {REMOTION_FPS as fps} from '@/lib/videoConfig';

import {analyze,styles} from '@/lib/sound/analyze';
import {readSource,saveImport} from '@/lib/sound/importedSound';
import {motionFor,classifyMotion,soundTake,soundAsset,voices,type Voice} from '@/lib/sound/capabilities';
import {wave} from '@/lib/sound/pcm';
const cache=new Map<string,Promise<AudioBuffer>>();
async function decode(bytes:ArrayBuffer) {
  return new OfflineAudioContext(2,1,48000).decodeAudioData(bytes);
}
export function LegacySoundDesign({props,frames,onSound,onPreview}:{props:AnimationProps;frames:number;onSound:(s:string)=>void;onPreview:()=>void}) {
  const {setProps,selectTextTemplate}=useAnimation();
  const [opened,setOpened]=React.useState(false);
  const panelRef=React.useRef<HTMLDetailsElement>(null);
  React.useEffect(()=>{if(panelRef.current && new URLSearchParams(location.search).has("sound"))panelRef.current.open=true},[]);
  const [enabled,setEnabled]=React.useState(false),[mode,setMode]=React.useState('Procedural');
  const [library,setLibrary]=React.useState<AudioBuffer>(),[seed,setSeed]=React.useState(0);
  const motion=motionFor(props.animationStyle);
  const analysis=React.useMemo(()=>analyze(props,frames,fps),[props,frames]);
  const classification=React.useMemo(()=>classifyMotion(props.animationStyle,analysis.events,fps),[props.animationStyle,analysis]);
  const choices=classification.ranked;
  const [libraryPath,setLibraryPath]=React.useState('');
  const [sourceUrl,setSourceUrl]=React.useState('');
  const [sourceName,setSourceName]=React.useState('');
  const [soundFamily,setSoundFamily]=React.useState('automatic');
  const [density,setDensity]=React.useState(1),[gain,setGain]=React.useState(.6),[offset,setOffset]=React.useState(0);
  const [trim,setTrim]=React.useState(0),[tail,setTail]=React.useState(100);

  const signature=JSON.stringify([props.animationStyle,props.text,frames,analysis.events]);
  const [ai,setAi]=React.useState<{strategy:{voice:string;landing:string;attack?:string};signature:string;events:number[];model:string;variant:number;gain:number;tail:number;offset:number;reason:string;candidateId?:string}|null>(null);
  const [port,setPort]=React.useState(3218),[model,setModel]=React.useState(''),[models,setModels]=React.useState<string[]>([]);
  const [approved,setApproved]=React.useState<typeof ai>(null);
  const [chosen,setChosen]=React.useState('');
  const [directorStatus,setDirectorStatus]=React.useState('');
  const hadSavedDesign=React.useRef(false);
  React.useEffect(()=>{
    const saved=props.soundDesign;
    if(!saved || saved.version!==1 || saved.template!==props.animationStyle){
      if(hadSavedDesign.current){
        setApproved(null);setChosen('');setSoundFamily('automatic');setEnabled(false);
        setSourceUrl('');setSourceName('');setLibraryPath('');setLibrary(undefined);
        setMode('Procedural');setSeed(0);setDensity(1);setGain(.6);setOffset(0);setTrim(0);setTail(100);
      }
      hadSavedDesign.current=false;
      return;
    }
    hadSavedDesign.current=true;
    setSourceUrl(saved.sourceUrl??'');
    setLibrary(undefined);
    setApproved(null);setChosen('');

    setLibraryPath(saved.libraryPath??'');setMode(saved.mode);setSoundFamily(saved.family);setSeed(saved.seed);setDensity(saved.density);setGain(saved.gain);setOffset(saved.offset);setTrim(saved.trim);setTail(saved.tail);setSourceName(saved.sourceName??'');
    if(saved.plan && typeof saved.plan==='object' && 'signature' in saved.plan){const plan=saved.plan as NonNullable<typeof ai>;setApproved(plan);setChosen(plan.signature)}
    let current=true;
    if(saved.sourceUrl){
      readSource(saved.sourceUrl).then(decode).then(b=>{if(current)setLibrary(b)}).catch(()=>{if(current)setDirectorStatus('Falta el archivo local. Pulsa Auto Sound Design para buscar otra toma.')});
    }else if(saved.mode==='Library')setDirectorStatus('Vuelve a seleccionar el archivo '+(saved.sourceName??'de biblioteca'));
    return ()=>{current=false};
  },[props.soundDesign,props.animationStyle]);
  const [heard,setHeard]=React.useState('');
  const [url,setUrl]=React.useState(''),[status,setStatus]=React.useState('');
  React.useEffect(()=>{
    let active=true,object='';
    setUrl('');setStatus('Preparando mezcla…');
    if(opened && motion && props.showTextLayer!==false){
      (async()=>{
        const plan=chosen===signature && approved?.signature===signature?approved:null;
        let buf=library;
        if(mode==='Procedural'){
          const selected=soundFamily==='automatic' ? plan?.strategy.voice : soundFamily;
          const voice=selected && Object.prototype.hasOwnProperty.call(voices,selected) ? selected as Voice : choices[0];
          const key=soundAsset(voice,seed);
          if(!cache.has(key)) cache.set(key,fetch(key).then(r=>{if(!r.ok)throw Error('Error al cargar Earshot');return r.arrayBuffer()}).then(decode).catch(e=>{cache.delete(key);throw e}));
          buf=await cache.get(key);
        }
        if(!buf)throw Error('Selecciona un archivo SFX');
        if(!active)return;
        const src=buf.getChannelData(0),start=Math.floor(trim/100*(src.length-1));
        const channels=Array.from({length:Math.min(2,buf.numberOfChannels)},(_,c)=>buf!.getChannelData(c));
        let peak=0,hit=start;
        for(const channel of channels)for(let i=start;i<channel.length;i++)if(Math.abs(channel[i])>peak){peak=Math.abs(channel[i]);hit=i;}
        if(peak<.0001)throw Error('Segmento silencioso');
        const selectedVoice=soundFamily==='automatic' ? plan?.strategy.voice ?? choices[0] : soundFamily;
        const defaultLead=['sweep','whoosh','riser','texture','swish'].includes(selectedVoice) ? Math.min(hit-start,4800) : 240;
        const lead=plan?.strategy.attack==='immediate'?240:plan?.strategy.attack==='gradual'?Math.min(hit-start,7200):defaultLead;
        const left=Math.max(start,hit-lead),right=Math.min(src.length,hit+tail*48);
        const sampleFrames=Math.round(frames*48000/fps);
        const mix=new Float32Array(sampleFrames*channels.length);
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
            if(j<0 || j>=sampleFrames)continue;
            const attack=hit===boundedLeft?1:(i-boundedLeft)/Math.min(48,hit-boundedLeft);
            const release=(right-i)/Math.min(240,right-hit);
            const scale=gain/peak*Math.min(1,attack,release);
            for(let c=0;c<channels.length;c++)mix[j*channels.length+c]+=channels[c][i]*scale;
          }
        }
        if(plan?.strategy.landing==='last' && analysis.stops.length){
          const at=Math.round(analysis.stops[analysis.stops.length-1]*48000/fps);
          for(let i=0;i<3600 && at+i<sampleFrames;i++)for(let c=0;c<channels.length;c++)mix[(at+i)*channels.length+c]+=.35*gain*Math.sin(i*.025)*Math.exp(-i/650);
        }
        object=URL.createObjectURL(wave(mix,channels.length));setUrl(object);setStatus(events+' eventos'+(shortened ? ` · ${shortened} ataques acortados al inicio del clip` : '')+(adjusted ? ` · ${adjusted} picos ajustados al primer milisegundo` : ''));
      })().catch(e=>{if(active)setStatus(String(e.message))});
    }
    return ()=>{active=false;if(object)URL.revokeObjectURL(object)};
  },[opened,props,frames,mode,library,seed,gain,offset,density,trim,tail,onSound,chosen,signature,approved,soundFamily]);
  React.useEffect(()=>{onSound(enabled ? url : '');return ()=>onSound('')},[enabled,url,onSound]);

  React.useEffect(()=>{if(enabled && url && heard===url) window.audioLabTake={url,props};return ()=>{delete window.audioLabTake}},[enabled,url,heard,props]);
  if(!motion) return <div className="shrink-0 flex flex-wrap items-center gap-3 border-b border-neutral-600 bg-neutral-900 px-4 py-3 text-sm text-white" role="status">
    <strong>Sound Design</strong>
    <span>El sonido aún no está disponible para esta plantilla.</span>
    <button type="button" className="rounded border border-emerald-400 bg-emerald-300 px-3 py-1 font-semibold text-black" onClick={()=>selectTextTemplate('typewriter')}>Probar Typewriter con sonido</button>
  </div>;
  const currentVoice=Object.prototype.hasOwnProperty.call(voices,soundFamily)?soundFamily as Voice:choices[0];
  const take=soundTake(currentVoice,seed);
  const button="rounded border border-neutral-500 px-3 py-1 font-medium";
  return <details ref={panelRef} onToggle={e=>{if(e.currentTarget.open)setOpened(true)}} className="shrink-0 max-h-[45%] overflow-auto border-b border-neutral-600 bg-neutral-900 p-2 text-sm text-white">
    <summary className="cursor-pointer rounded bg-emerald-300 px-3 py-2 font-semibold text-black">🔊 Sound Design · {props.animationStyle} — abrir opciones de sonido</summary>
    <p>Diseño anterior · {sourceName || soundFamily}. {directorStatus}</p><div>
      <button className={button+" bg-emerald-300 text-black"} disabled={!url} onClick={()=>{
        setEnabled(true);onPreview();setHeard(url)
      }}>Probar animación con sonido</button>
      <span role="status">{status}</span>
      {enabled && url && heard===url && <a className="underline" href={url} download={props.animationStyle+".wav"}>Guardar WAV de esta vista previa</a>}    {enabled && url && heard===url && <span>Esta mezcla se incluirá al exportar el video individual.</span>}</div>
  </details>;
}















