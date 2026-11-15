import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
import path from 'node:path';
import {voices,compatibleVoices} from '@/lib/sound/capabilities';
export async function POST(req:Request){
 if(req.headers.get('origin')!=='http://'+req.headers.get('host'))return new Response(null,{status:403});
 try {
  const input=await req.json();
  const family=input.family ?? compatibleVoices(input.template)[0];
  if(!Object.prototype.hasOwnProperty.call(voices,family))return new Response(null,{status:400});
  const {stdout}=await promisify(execFile)(path.resolve('.audio-lab/venv/Scripts/python.exe'),['scripts/select-sfx.py',family,String(Number.isFinite(input.duration)?Math.max(.08,Math.min(2,input.duration)):.35)],{timeout:60000,maxBuffer:1000000});
  return Response.json(JSON.parse(stdout));
 }catch{return Response.json({error:'No se encontró un candidato compatible. Puedes utilizar Procedural.'},{status:422})}
}
