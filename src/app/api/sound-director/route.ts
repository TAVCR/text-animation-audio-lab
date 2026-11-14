import {NextResponse} from 'next/server';
export async function POST(req:Request){
  if(req.headers.get('origin')!=='http://'+req.headers.get('host'))return new Response(null,{status:403});
  try{
    const {template,words,frames,port=3218,model,probe}=await req.json();
    if(![3218,11434,1234,8080].includes(port))throw Error('Puerto local no autorizado');
    const base='http://127.0.0.1:'+port+'/v1';
    const models=await fetch(base+'/models',{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(3000)}).then(r=>r.json());
    const ids:string[]=models.data.map((m:{id:string})=>m.id);
    if(probe)return NextResponse.json({models:ids});
    const selected=model||ids[0];
    if(!ids.includes(selected)||!Array.isArray(frames)||!frames.length||frames.length>3600||!frames.every(Number.isInteger))throw Error('Modelo o calendario inválido');
    const cap=Math.min(12,frames.length);
    const schema={type:'object',additionalProperties:false,required:['events','variant','gain','tail','offset','reason'],properties:{events:{type:'array',minItems:1,maxItems:cap,items:{type:'integer',enum:frames.map((_:number,i:number)=>i)}},variant:{type:'integer',minimum:0,maximum:3},gain:{type:'number',minimum:0.15,maximum:.9},tail:{type:'integer',minimum:15,maximum:350},offset:{type:'integer',minimum:-2,maximum:2},reason:{type:'string'}}};
    const prompt='Diseña acentos para esta animación a 30 fps. events contiene índices base cero de los eventos seleccionados; el resto queda en silencio. En frases largas agrupa por movimiento y deja respirar. variant es la toma 0–3 de la familia del efecto, gain la intensidad, tail los ms de cola y offset la anticipación en fotogramas. Explica brevemente en español por qué. '+JSON.stringify({template,words,events:frames.map((frame:number,id:number)=>({id,frame})),limits:'Use IDs only; gain 0.15..0.9, tail 15..350 milliseconds, offset -2..2 frames, variant 0..3'});
    const answer=await fetch(base+'/chat/completions',{method:'POST',redirect:'error',signal:AbortSignal.any([req.signal,AbortSignal.timeout(90000)]),headers:{'Content-Type':'application/json'},body:JSON.stringify({model:selected,temperature:.35,max_tokens:350,messages:[{role:'user',content:prompt}],response_format:{type:'json_schema',json_schema:{name:'sound_plan',strict:true,schema}}})}).then(r=>r.json());
    const p=JSON.parse(answer.choices[0].message.content);
    if(!Array.isArray(p.events)||!p.events.length||p.events.length>cap||!p.events.every((i:number)=>Number.isInteger(i)&&i>=0&&i<frames.length)||!Number.isInteger(p.variant)||p.variant<0||p.variant>3||!Number.isFinite(p.gain)||p.gain<.15||p.gain>.9||!Number.isInteger(p.tail)||p.tail<15||p.tail>350||!Number.isInteger(p.offset)||Math.abs(p.offset)>2||typeof p.reason!=='string')throw Error('Respuesta fuera de límites');
    return NextResponse.json({...p,events:Array.from(new Set(p.events)),model:selected});
  }catch(e){return NextResponse.json({available:false,error:e instanceof Error?e.message:'Proveedor no disponible'})}
}

