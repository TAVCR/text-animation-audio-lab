// Component PCM excludes layer gain, offset and fades, so mixing edits reuse it.
import type {ComponentInput} from './composition';
const cache=new Map<string,Promise<Float32Array[]>>();
let worker:Worker|undefined;
const pending:Array<{resolve:(data:Float32Array[])=>void;reject:(e:Error)=>void}>=[];
export function componentPCM(key:string,input:Omit<ComponentInput,'channels'>,audio:AudioBuffer){
  const id=JSON.stringify([key,input]);
  const found=cache.get(id);
  if(found)return found;
  if(!worker){
    worker=new Worker(new URL('./composition.worker.ts',import.meta.url));
    worker.onmessage=e=>pending.shift()?.resolve(e.data);
    worker.onerror=e=>{
      worker?.terminate();worker=undefined;
      for(const job of pending.splice(0))job.reject(new Error(e.message));
      cache.clear();
    };
  }
  const channels=Array.from({length:audio.numberOfChannels},(_,i)=>audio.getChannelData(i).slice());
  const promise=new Promise<Float32Array[]>((resolve,reject)=>{
    pending.push({resolve,reject});
    worker!.postMessage({...input,channels},channels.map(c=>c.buffer));
  });
  if(cache.size>=64)cache.delete(cache.keys().next().value!);
  cache.set(id,promise);
  return promise;
}
