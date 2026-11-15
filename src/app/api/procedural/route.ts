import {statSync} from 'node:fs';
import {execFile,spawn,type ChildProcessWithoutNullStreams} from 'node:child_process';
import {createInterface} from 'node:readline';
import path from 'node:path';
import {compatibleVoices} from '@/lib/sound/capabilities';

type Pending={resolve:(v:unknown)=>void;reject:(e:Error)=>void};
type Service={revision?:number;child?:ChildProcessWithoutNullStreams;pending?:Pending;tail:Promise<unknown>;count:number};
const scope=globalThis as typeof globalThis & {earshotService?:Service};
const service=scope.earshotService??=( {tail:Promise.resolve(),count:0} as Service );
function worker(){
  const revision=statSync('scripts/procedural-engine.py').mtimeMs;
  if(service.child && !service.child.killed && service.revision===revision)return service.child;
  service.child?.stdin.end();
  service.revision=revision;
  const child=spawn(path.resolve('.audio-lab/venv/Scripts/python.exe'),['-u','scripts/procedural-engine.py'],{windowsHide:true,stdio:'pipe'});
  service.child=child;
  child.stderr.resume();
  const fail=()=>{if(service.child===child){service.child=undefined;service.pending?.reject(Error('Worker interrumpido'));service.pending=undefined}};
  child.on('error',fail);child.on('exit',fail);child.stdin.on('error',fail);
  createInterface({input:child.stdout}).on('line',line=>{
    if(service.child!==child)return;
    try{const data=JSON.parse(line);if(data.error)service.pending?.reject(Error(data.error));else if(data.plan || data.restored || data.takes)service.pending?.resolve(data)}catch{}
  });
  return child;
}
export async function POST(req:Request){
  if(req.headers.get('origin')!=='http://'+req.headers.get('host'))return new Response(null,{status:403});
  if(service.count>=12)return Response.json({error:'Cola ocupada. Vuelve a intentarlo.'},{status:429});
  try{
    const q=await req.json();
    if(q.revise){
      if(!Array.isArray(q.revise.takes) || q.revise.takes.length>16)throw Error('Capa inválida');
    }else if(q.restore){
      if(!/^\/audio-lab\/synthesis\/[a-f0-9]{64}\.wav$/.test(q.restore.url))throw Error('Referencia inválida');
    }else{
    const allowed=compatibleVoices(q.template);
    if(!allowed.length || !['Minimal','Cinematic','Experimental'].includes(q.style) || !Array.isArray(q.analysis?.events) || q.analysis.events.length>3600 || !Number.isInteger(q.variant))throw Error('Plan inválido');
    q.voices=Array.isArray(q.voices)?q.voices.filter((v:string)=>allowed.includes(v as typeof allowed[number])):allowed;
    if(!q.voices.length)q.voices=allowed;
    }
    service.count++;
    const job=service.tail.catch(()=>{}).then(async()=>{
      req.signal.throwIfAborted();
      const child=worker();
      const cancel=()=>{
        if(process.platform==='win32' && child.pid)execFile('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true},()=>{});
        else child.kill();
      };
      const timeout=setTimeout(cancel,180000);
      req.signal.addEventListener('abort',cancel,{once:true});
      try{return await new Promise((resolve,reject)=>{service.pending={resolve,reject};child.stdin.write(JSON.stringify(q)+'\n')})}
      finally{clearTimeout(timeout);req.signal.removeEventListener('abort',cancel);service.pending=undefined}
    }).finally(()=>{service.count--});
    service.tail=job;
    return Response.json(await job);
  }catch(e){return Response.json({error:e instanceof Error?e.message:'Error de síntesis'},{status:422})}
}
