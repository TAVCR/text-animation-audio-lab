import {promisify} from 'node:util';
import {execFile} from 'node:child_process';
import path from 'node:path';
export async function POST(req:Request){
 if(req.headers.get('origin')!=='http://'+req.headers.get('host'))return new Response(null,{status:403});
 try {
  const {template}=await req.json();
  if(!['slide-in','glitch','bubble-pop'].includes(template))return new Response(null,{status:400});
  const {stdout}=await promisify(execFile)(path.resolve('.audio-lab/venv/Scripts/python.exe'),['scripts/select-sfx.py',template],{timeout:60000,maxBuffer:1000000});
  return Response.json(JSON.parse(stdout));
 }catch{return Response.json({error:'No se encontró un candidato compatible. Puedes utilizar Procedural.'},{status:422})}
}
