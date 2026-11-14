import {NextResponse} from 'next/server';
const base='http://127.0.0.1:11434';
export async function POST(req:Request){
  if(req.headers.get('origin')!=='http://'+req.headers.get('host'))return new Response(null,{status:403});
  try{
    const {count,template,words}=await req.json();
    if(!Number.isInteger(count)||count<1||count>3600||typeof template!=='string'||template.length>64||!Number.isInteger(words))return new Response(null,{status:400});
    const running=await fetch(base+'/api/ps',{signal:AbortSignal.timeout(1500),cache:'no-store'}).then(r=>r.json());
    const model=running.models?.[0]?.name;
    if(!model)throw Error('Sin modelo cargado');
    const schema={type:'object',required:['events'],properties:{events:{type:'array',minItems:1,maxItems:32,items:{type:'integer',minimum:0,maximum:count-1}}}};
    const result=await fetch(base+'/api/generate',{method:'POST',signal:AbortSignal.any([req.signal,AbortSignal.timeout(20000)]),body:JSON.stringify({model,stream:false,format:schema,prompt:JSON.stringify({task:'Select perceptually meaningful event indices to accent in this text animation. Use sparse accents for dense text.',template,words,eventCount:count})})}).then(r=>r.json());
    const {events}=JSON.parse(result.response);
    if(!Array.isArray(events)||!events.length||events.length>32||!events.every(i=>Number.isInteger(i)&&i>=0&&i<count))throw Error('Plan inválido');
    return NextResponse.json({model,events:Array.from(new Set(events))});
  }catch{return NextResponse.json({available:false})}
}
