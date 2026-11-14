import path from "node:path";
import fs from "node:fs/promises";
import {randomUUID} from "node:crypto";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
const run=promisify(execFile);
export async function POST(req:Request){
  const u=new URL(req.url),name=u.searchParams.get("video")??"";
  if(req.headers.get("origin")!=="http://"+req.headers.get("host") || !/^[\w.-]+\.(mov|mp4|webm)$/i.test(name))return new Response(null,{status:400});
  const root=path.resolve("public/renders"),ext=path.extname(name).toLowerCase(),id=randomUUID();
  const wav=path.join(root,id+".wav"),out=id+ext;
  try {
    if(Number(req.headers.get("content-length"))>18000000)return new Response(null,{status:413});
    const data=Buffer.from(await req.arrayBuffer());
    if(data.length>18000000 || data.toString("ascii",0,4)!=="RIFF" || data.toString("ascii",8,12)!=="WAVE")return new Response(null,{status:400});
    await fs.writeFile(wav,data,{flag:"wx"});
    await run("ffmpeg",["-nostdin","-v","error","-i",path.join(root,name),"-f","wav","-i",wav,"-map","0:v:0","-map","1:a:0","-c:v","copy","-c:a",ext===".mov"?"pcm_s24le":ext===".webm"?"libopus":"aac",path.join(root,out)],{timeout:120000});
    return Response.json({url:"/renders/"+out});
  }catch{await fs.rm(path.join(root,out),{force:true});return new Response(null,{status:422})}
  finally{await fs.rm(wav,{force:true})}
}

