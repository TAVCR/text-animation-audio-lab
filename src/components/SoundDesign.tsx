import React from 'react';
import {Audio} from 'remotion';
import {REMOTION_FPS} from '@/lib/videoConfig';
import {MainComposition} from '@/remotion/MainComposition';
import {useAnimation,type AnimationProps} from '@/lib/AnimationContext';
import {analyze} from '@/lib/sound/analyze';
import {classifyMotion} from '@/lib/sound/capabilities';
import {mixDesign,type Design,type Layer} from '@/lib/sound/proceduralMix';
import {LegacySoundDesign} from './LegacySoundDesign';

export function SoundPreview({soundUrl,...props}:AnimationProps & {soundUrl?:string}){
  return <><MainComposition {...props}/>{soundUrl && <Audio src={soundUrl} pauseWhenBuffering acceptableTimeShiftInSeconds={1/REMOTION_FPS}/>}</>;
}
type Props={props:AnimationProps;frames:number;onSound:(s:string)=>void;onPreview:()=>void};
const styles=['Minimal','Cinematic','Experimental'];
const button='rounded border border-neutral-500 bg-neutral-800 px-3 py-1 text-white disabled:opacity-50';
export function SoundDesign(input:Props){
  const {props,frames,onSound,onPreview}=input;
  const {setProps}=useAnimation();
  const saved=props.soundDesign?.procedural;
  const [replace,setReplace]=React.useState<AnimationProps['soundDesign']>();
  const legacy=!!props.soundDesign && !saved && replace!==props.soundDesign && props.soundDesign.template===props.animationStyle;
  const analysis=React.useMemo(()=>analyze(props,frames,30),[props,frames]);
  const classification=classifyMotion(props.animationStyle,analysis.events,30);
  const signature=JSON.stringify([props.animationStyle,props.text,props.speed,frames,analysis.events,analysis.stops,analysis.peaks,analysis.rebounds]);
  const [plans,setPlans]=React.useState<Record<string,Design>>({});
  const [active,setActive]=React.useState('Minimal'),[bound,setBound]=React.useState('');
  const [busy,setBusy]=React.useState(''),[status,setStatus]=React.useState('');
  const [provider,setProvider]=React.useState(0);
  const [url,setUrl]=React.useState('');
  const cancel=React.useRef<AbortController|null>(null);
  const panel=React.useRef<HTMLDetailsElement>(null);
  const plan=plans[active];
  React.useEffect(()=>{if(panel.current && new URLSearchParams(location.search).has('sound'))panel.current.open=true},[legacy]);
  React.useEffect(()=>{setBusy('');return ()=>cancel.current?.abort()},[signature]);
  const previousSaved=React.useRef(saved);
  React.useEffect(()=>{
    if(saved){
      setPlans(old=>old[saved.design.style]===saved.design?old:{[saved.design.style]:saved.design});
      setActive(saved.design.style);setBound(saved.signature);
    }else if(previousSaved.current){
      setPlans({});setBound('');
    }
    previousSaved.current=saved;
  },[saved]);
  React.useEffect(()=>{
    let current=true,object='';
    setUrl('');
    if(plan && bound===signature && !legacy)mixDesign(plan).then(blob=>{
      if(current){object=URL.createObjectURL(blob);setUrl(object)}
    }).catch(e=>{if(current)setStatus(e.message)});
    return ()=>{current=false;if(object)URL.revokeObjectURL(object)};
  },[plan,bound,signature,legacy]);
  React.useEffect(()=>{
    if(legacy)return;
    onSound(url);
    return ()=>onSound('');
  },[url,onSound,legacy]);
  React.useEffect(()=>{
    if(legacy)return;
    if(url && bound===signature)window.audioLabTake={url,props};
    return ()=>{delete window.audioLabTake};
  },[url,bound,signature,props,legacy]);
  async function generate(names:string[],regenerate=false){
    cancel.current?.abort();
    const controller=new AbortController();cancel.current=controller;
    setStatus('');setBusy('Analizando movimiento');
    try{
      let director;
      if(provider){
        try{
          const result=await fetch('/api/sound-director',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({template:props.animationStyle,text:props.text,words:analysis.words,frames:analysis.events,heads:analysis.heads,motion:analysis,port:provider})}).then(r=>r.json());
          if(result.events)director=result;else setStatus('Proveedor sin respuesta · reglas locales');
        }catch{if(controller.signal.aborted)return;setStatus('Proveedor sin respuesta · reglas locales')}
      }
      if(bound!==signature)setPlans({});
      for(const style of names){
        setBusy(style);
        const response=await fetch('/api/procedural',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({template:props.animationStyle,text:props.text,speed:props.speed,analysis,frames,voices:classification.ranked,style,variant:regenerate?(plans[style]?.variant??0)+1:plans[style]?.variant??0,director})});
        const result=await response.json();if(!result.plan)throw Error(result.error||'Error de generación');
        if(controller.signal.aborted)return;
        setPlans(old=>({...old,[style]:result.plan}));setBound(signature);
        if(style===names[0])setActive(style);
      }
    }catch(e){if(!controller.signal.aborted)setStatus(e instanceof Error?e.message:'Síntesis no disponible')}
    finally{if(cancel.current===controller)setBusy('')}
  }
  function edit(i:number,patch:Partial<Layer>){
    setPlans(old=>({...old,[active]:{...plan,layers:plan.layers.map((layer,j)=>j===i?{...layer,...patch}:layer)}}));
  }
  async function revise(index:number,form:HTMLFormElement){
    const fields=new FormData(form);
    const controller=new AbortController();cancel.current=controller;setBusy('Capa');setStatus('');
    try{
      const response=await fetch('/api/procedural',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({revise:{takes:plan.layers[index].takes,scale:Number(fields.get('scale')||1),transpose:Number(fields.get('transpose')||0)}})});
      const result=await response.json();if(!result.takes)throw Error(result.error);
      if(!controller.signal.aborted)edit(index,{takes:result.takes});
    }catch(e){if(!controller.signal.aborted)setStatus(e instanceof Error?e.message:'No se pudo ajustar la capa')}
    finally{if(cancel.current===controller)setBusy('')}
  }
  if(legacy)return <><LegacySoundDesign {...input}/><button className={button} onClick={()=>setReplace(props.soundDesign)}>Preparar una interpretación procedural nueva</button></>;
  return <details ref={panel} className="shrink-0 max-h-[46%] overflow-auto border-b border-neutral-600 bg-neutral-900 p-2 text-sm text-white">
    <summary className="cursor-pointer rounded bg-emerald-300 px-3 py-2 font-semibold text-black">Sound Design · {props.animationStyle}</summary>
    <div className="my-2 flex flex-wrap items-center gap-2"><span>{analysis.events.length} eventos · {(frames/30).toFixed(2)} s</span>
    <select aria-label="Director" className={button} value={provider} onChange={e=>setProvider(+e.target.value)}><option value={0}>Reglas locales</option><option value={3218}>Qwen local</option><option value={8080}>Mistral local</option></select>
    <button className={button} disabled={!!busy||!analysis.events.length} onClick={()=>generate(styles)}>Auto Sound Design</button>
    {busy && <button className={button} onClick={()=>cancel.current?.abort()}>Cancelar · {busy}</button>}</div>
    {styles.map(style=>{
      const ready=!!plans[style] && bound===signature;
      return <button key={style} className={button} aria-pressed={active===style && ready}
        disabled={!ready && (!!busy || !analysis.events.length)}
        title={ready?'Seleccionar '+style:'Generar '+style}
        onClick={()=>ready?setActive(style):void generate([style])}>{style}</button>;
    })}
    {busy && <span role="status">{styles.includes(busy)?'Generando '+busy+'…':busy}</span>}
    {plan && <div><p>{active} · {plan.method} · {plan.layers.reduce((n,l)=>n+l.takes.length,0)} acentos · {(plan.frames/30).toFixed(2)} s</p>
    {plan.syncVersion!==2 && plan.layers.some(layer=>layer.takes.some(take=>take.visualEvent!==undefined)) &&
      <button className={button} disabled={!!busy || bound!==signature} onClick={()=>setPlans(old=>({...old,[active]:{...old[active],syncVersion:2}}))}>Ajustar sincronización de esta mezcla</button>}
    {plan.layers.map((layer,i)=><div className="my-2 flex flex-wrap items-center gap-3" key={i}>
    <strong>{layer.role}</strong><span>{Array.from(new Set(layer.takes.map(t=>t.recipe))).join(', ')}</span>
    <label><input type="checkbox" checked={layer.mute} onChange={e=>edit(i,{mute:e.target.checked})}/> Silenciar</label>
    {([['Aire','air'],['Reverberación','room']] as const).map(([name,key])=>layer[key]!==undefined &&
      <label key={key}>{name} {Math.round((layer[key]??0)*100)}% <input aria-label={layer.role+' '+name} type="range" min="0" max="1" step=".01" value={layer[key]} onChange={e=>edit(i,{[key]:Number(e.target.value)})}/></label>)}
    <label>Velocidad del efecto {(layer.rate??1).toFixed(2)}× <input aria-label={layer.role+' Velocidad del efecto'} type="range" min=".5" max="2" step=".05" value={layer.rate??1} onChange={e=>edit(i,{rate:Number(e.target.value)})}/></label>
    {([['Ganancia','gain',0,1,.01],['Desfase ms','offset',-250,250,1],['Ataque ms','fadeIn',0,40,1],['Salida ms','fadeOut',1,100,1]] as const).map(([name,key,min,max,step])=><label key={key}>{name} {layer[key]} <input aria-label={layer.role+' '+name} type="range" min={min} max={max} step={step} value={layer[key]} onChange={e=>edit(i,{[key]:+e.target.value})}/></label>)}
    <form onSubmit={e=>{e.preventDefault();void revise(i,e.currentTarget)}} className="flex flex-wrap gap-2">
    {layer.takes.some(t=>t.params.dur) && <label>Duración × <input className={button} name="scale" type="number" defaultValue="1" step=".1" min=".5" max="2"/></label>}
    {layer.takes.some(t=>t.params.pitch) && <label>Tono (semitonos) <input className={button} name="transpose" type="number" defaultValue="0" min="-6" max="6"/></label>}
    {layer.takes.some(t=>t.params.dur || t.params.pitch) && <button disabled={!!busy} className={button}>Aplicar a la capa</button>}</form></div>)}
    <button className={button} disabled={!!busy} onClick={()=>generate([active],true)}>Regenerar {active}</button>
    <button className={button} disabled={!url} onClick={onPreview}>Probar animación con sonido</button>
    <button className={button} disabled={!url} onClick={()=>setProps(p=>({...p,soundDesign:{version:1,template:p.animationStyle,mode:'Procedural',family:classification.ranked[0],seed:plan.variant,density:1,gain:1,offset:0,trim:0,tail:0,procedural:{signature,design:plan}}}))}>Guardar diseño en proyecto</button>
    {url && bound===signature && <a className={button} href={url} download={props.animationStyle+'-'+active+'.wav'}>Guardar WAV de esta vista previa</a>}
    {bound!==signature && <p>Los eventos cambiaron. Genera las interpretaciones para el nuevo movimiento.</p>}</div>}
    <span role="status">{status}</span></details>;
}
