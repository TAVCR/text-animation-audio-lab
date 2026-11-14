import {NextResponse} from 'next/server';
import {strategySchema,valid,distribute,type Strategy} from '@/lib/sound/strategy';
export async function POST(req:Request){
  if(req.headers.get('origin')!=='http://'+req.headers.get('host'))return new Response(null,{status:403});
  try{
    const {template,text:inputText,words,frames,port=3218,model,probe,heads=[],motion={}}=await req.json();
    if(![3218,11434,1234,8080].includes(port))throw Error('Puerto local no autorizado');
    const base='http://127.0.0.1:'+port+'/v1';
    const models=await fetch(base+'/models',{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(3000)}).then(r=>r.json());
    const ids:string[]=models.data.map((m:{id:string})=>m.id);
    if(probe)return NextResponse.json({models:ids});
    const selected=model||ids[0];
    if(!ids.includes(selected)||!Array.isArray(frames)||!frames.length||frames.length>3600||!frames.every(Number.isInteger))throw Error('Modelo o calendario inválido');
    if(!Array.isArray(heads)||heads.some(i=>!Number.isInteger(i)||i<0||i>=frames.length))throw Error('Anclas inválidas');
    const family=template==='typewriter'?'escritura por grafema':template==='slide-in'?'desplazamiento por palabra':template==='glitch'?'interferencia intermitente':template;
    const groups=Array.from({length:Math.min(6,frames.length)},(_,i)=>{
      const first=Math.floor(i*frames.length/Math.min(6,frames.length)),last=Math.ceil((i+1)*frames.length/Math.min(6,frames.length))-1;
      return {start:frames[first],end:frames[last],count:last-first+1,wordStarts:heads.filter(h=>h>=first&&h<=last).length};
    });
    const observation=template==='typewriter'?'Glyphs appear instantly without spatial travel. Spaces are silent.':template==='glitch'?'Abrupt RGB splits alternate with unchanged text in separated clusters.':template==='slide-in'?'Overlapping spring trajectories accelerate, decelerate and settle.':family;
    const prompt='Select acoustic envelope from click (discrete articulation), sweep (directional travel), pulse (digital interruption), texture (sustained fragment). Describe travel only when present. Choose landing last only for a measured settling motion meriting an extra impact. Direct sound for a 30fps animation. Choose a qualitative strategy. Evaluate overlap, pace and discontinuities. Decide deliberately whether the closing deserves silence. Vary density with event count and pace. '+JSON.stringify({family,text:String(inputText??'').slice(0,1000),words,groups,motion,observation});
    const schema=strategySchema;    const answer=await fetch(base+'/chat/completions',{method:'POST',redirect:'error',signal:AbortSignal.any([req.signal,AbortSignal.timeout(90000)]),headers:{'Content-Type':'application/json'},body:JSON.stringify({model:selected,temperature:.35,seed:33,max_tokens:350,messages:[{role:'user',content:prompt}],response_format:{type:'json_schema',json_schema:{name:'sound_plan',strict:true,schema}}})}).then(r=>r.json());
    const raw=answer.choices?.[0]?.message?.content;
    let value:unknown;try{value=JSON.parse(raw)}catch{}
    const accepted=valid(value);
    const strategy:Strategy=valid(value)?value:{voice:'click',landing:'silent',density:'moderate',grouping:template==='glitch'?'pulse':template==='slide-in'?'gesture':'phrase',closing:'accent',character:'soft',space:'short'};
    const events=distribute(frames,template,strategy,heads);
    const variant={soft:0,bright:1,rough:3}[strategy.character];
    const reason=frames.length+' eventos · '+events.length+' acentos · fotogramas '+events.map(i=>frames[i]).join(', ')+' · '+(events.includes(frames.length-1)?'cierre acentuado':'cierre libre');
    return NextResponse.json({events,variant,gain:strategy.character==='soft'?.4:.65,tail:strategy.voice==='texture'?(strategy.space==='short'?240:480):strategy.space==='short'?65:180,offset:template==='slide-in'?-1:0,model:accepted?selected:'Reglas de respaldo',strategy,raw,correction:accepted?null:'Respuesta incompatible',reason});  }catch(e){return NextResponse.json({available:false,error:e instanceof Error?e.message:'Proveedor no disponible'})}
}




