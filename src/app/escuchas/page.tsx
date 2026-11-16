'use client';
import React from 'react';
import {Player} from '@remotion/player';
import {Audio} from 'remotion';
import {MainComposition} from '@/remotion/MainComposition';
import type {AnimationProps} from '@/lib/AnimationContext';
import type {Composition} from '@/lib/sound/composition';
import {getCompositionDimensions} from '@/lib/videoConfig';

type Version={file:string;frames:number;gain:number;lufs:number;truePeak:number;method:string;composition:Composition|null;layers:{role:string;recipes:string[];anchors:number[]}[]};
type Pair={template:AnimationProps['animationStyle'];style:string;versions:Version[]};
const root='/audio-lab/phase52/';
const names:Record<string,string>={'slide-in':'Slide In',glitch:'Glitch',cinematic:'Cinematic','bubble-pop':'Bubble Pop','ink-stamp-print':'Ink Stamp Print','extruded-3d':'Extruded 3D'};
const control='rounded border border-neutral-500 bg-neutral-800 px-3 py-2 text-white';
function Comparison({visual,pair,active}:{visual:AnimationProps;pair:Pair;active:number}){
  return <><MainComposition {...visual} animationStyle={pair.template}/>{pair.versions.map((v,i)=>
    <Audio key={v.file} src={root+v.file} volume={v.gain} muted={i!==active} pauseWhenBuffering acceptableTimeShiftInSeconds={1/30}/>)}</>;
}
export default function ListeningGallery(){
  const [data,setData]=React.useState<{pairs:Pair[];visual:AnimationProps}>();
  const [template,setTemplate]=React.useState('slide-in'),[style,setStyle]=React.useState('Cinematic'),[active,setActive]=React.useState(1);
  const [error,setError]=React.useState('');
  React.useEffect(()=>{Promise.all(['catalog.json','visual.json'].map(async file=>{
    const r=await fetch(root+file);if(!r.ok)throw Error('No se pudo abrir '+file);return r.json()
  })).then(([pairs,visual])=>setData({pairs,visual})).catch(e=>setError(e.message))},[]);
  const pair=data?.pairs.find(p=>p.template===template&&p.style===style);
  if(!pair||!data)return <main className="p-6">{error||'Cargando escuchas…'}</main>;
  const current=pair.versions[active],spec=current.composition;
  const dims=getCompositionDimensions(data.visual.aspectRatio,data.visual.resolutionPreset);
  return <main className="min-h-screen bg-neutral-950 p-6 text-neutral-100"><div className="mx-auto max-w-4xl">
    <a href="/?sound=1" className="text-emerald-300 underline">Editor de sonido</a>
    <h1 className="my-4 text-3xl font-semibold">Escuchas comparadas</h1>
    <div className="mb-3 flex flex-wrap gap-3">
      <select aria-label="Animación" className={control} value={template} onChange={e=>setTemplate(e.target.value)}>{Object.entries(names).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select>
      <select aria-label="Estilo" className={control} value={style} onChange={e=>setStyle(e.target.value)}>{['Minimal','Cinematic','Experimental'].map(s=><option key={s}>{s}</option>)}</select>
      {['Antes','Después'].map((s,i)=><button key={s} className={control} style={active===i?{background:'#075e49'}:undefined} aria-pressed={i===active} onClick={()=>setActive(i)}>{s}</button>)}</div>
    <Player key={template+style} component={Comparison} inputProps={{visual:data.visual,pair,active}} fps={30} durationInFrames={current.frames}
      compositionWidth={dims.width} compositionHeight={dims.height} controls loop style={{width:'100%'}}/>
    <p className="my-3">Alterna Antes y Después durante la reproducción. Las dos mezclas comparten imagen, reloj y sonoridad de escucha.</p>
    <h2 className="text-xl">{spec?.concept??'Diseño de fase 5'}</h2>
    {spec && <p>{spec.synthesis} · {spec.spectrum} · {spec.envelope} · {spec.space} · {spec.ending}<br/>Intensidad {spec.intensity} · Complejidad {spec.complexity} · Profundidad {spec.depth} · Respuesta {spec.response}</p>}
    <p>{current.method} · {current.layers.length} capas · {current.layers.reduce((n,l)=>n+l.anchors.length,0)} tomas</p>
    <ul>{current.layers.map(l=><li key={l.role}>{l.role} — {l.recipes.join(', ')}</li>)}</ul>
    <p className="mt-3">Original: {current.lufs} LUFS · {current.truePeak} dBTP. <a className="text-emerald-300 underline" download href={root+current.file}>Descargar WAV original</a></p>
  </div></main>
}
