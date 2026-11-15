import {wave} from './pcm';
export type Take={recipe:string;url:string;frame:number;visualEvent?:number;peak:number;samples:number;onset:number;end:number;gain:number;params:{dur?:number;seed:number;pitch?:number;apex?:number}};
export type Layer={air?:number;room?:number;rate?:number;role:string;gain:number;offset:number;mute:boolean;fadeIn:number;fadeOut:number;takes:Take[]};
export type Design={syncVersion?:number;style:string;variant:number;frames:number;method:string;strategy:unknown;layers:Layer[]};
export type SavedDesign={signature:string;design:Design};
const cache=new Map<string,Promise<AudioBuffer>>();
function buffer(take:Take){
  const url=take.url;
  if(!/^\/audio-lab\/synthesis\/[a-f0-9]{64}\.wav$/.test(url))throw Error('Referencia de síntesis inválida');
  let pending=cache.get(url);
  if(!pending){
    pending=fetch(url).then(async r=>{
      if(r.status===404){
        const recovered=await fetch('/api/procedural',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({restore:take})});
        if(!recovered.ok)throw Error('No se pudo reconstruir la toma guardada');
        r=await fetch(url,{cache:'reload'});
      }
      if(!r.ok)throw Error('No se pudo cargar la toma');
      return new OfflineAudioContext(2,1,48000).decodeAudioData(await r.arrayBuffer());
    }).catch(e=>{cache.delete(url);throw e});
    if(cache.size>=120)cache.delete(cache.keys().next().value!);
    cache.set(url,pending);
  }
  return pending;
}
function noise(seed:number){
  let state=seed|0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)|0;return state/2147483648};
}

// A filtered breath crests at the visual accent, then disperses behind the band.
function airSweep(track:Float32Array,target:number,take:Take,layer:Layer,rate:number){
  const random=noise(take.params.seed);
  const rise=Math.round(2400/rate), fall=Math.round(14400/rate);
  let low=0,smoothed=0;
  for(let t=-rise;t<fall;t++){
    const frame=target+t;
    const envelope=t<0?((t+rise)/rise)**2:(1-t/fall)**2;
    const sample=random();
    low+=.09*(sample-low);
    smoothed+=(.26+.45*envelope)*(sample-low-smoothed);
    if(frame<0 || frame>=track.length/2)continue;
    const breath=smoothed*envelope*(layer.air??0)*layer.gain*take.gain;
    track[frame*2]+=breath*.86;
    track[frame*2+1]+=breath;
  }
}

// A deterministic, decorrelated stereo impulse gives the sweep a diffuse tail.
async function addRoom(track:Float32Array,mix:Float32Array,wet:number){
  const frames=track.length/2;
  const context=new OfflineAudioContext(2,frames,48000);
  const input=context.createBuffer(2,frames,48000);
  const impulse=context.createBuffer(2,43200,48000);
  for(let c=0;c<2;c++){
    const channel=input.getChannelData(c), tail=impulse.getChannelData(c);
    for(let i=0;i<frames;i++)channel[i]=track[2*i+c];
    const random=noise(9357+c);
    let damped=0;
    for(let i=816;i<tail.length;i++){
      damped+=.32*(random()-damped);
      tail[i]=damped*Math.exp(-7*(i-816)/tail.length);
    }
  }
  const source=context.createBufferSource(), room=context.createConvolver();
  source.buffer=input;room.buffer=impulse;source.connect(room);room.connect(context.destination);source.start();
  const rendered=await context.startRendering();
  for(let c=0;c<2;c++){
    const channel=rendered.getChannelData(c);
    for(let i=0;i<frames;i++)mix[2*i+c]+=wet*channel[i]*Math.min(1,(frames-1-i)/240);
  }
}
export async function mixDesign(plan:Design){
  const length=plan.frames*1600;
  const mix=new Float32Array(length*2);
  for(const layer of plan.layers){
    if(layer.mute)continue;
    const rate=Math.max(.5,Math.min(2,layer.rate??1));
    const track=layer.room ? new Float32Array(mix.length) : mix;
    for(const take of layer.takes){
      const src=await buffer(take);
      const target=Math.max(48,Math.round(take.frame*1600+layer.offset*48));
      if(layer.air)airSweep(track,target,take,layer,rate);
      const peak=Math.round(take.peak/rate);
      const start=target-peak;
      // Keep a short attack ramp while preventing long samples from sounding
      // before their visual cue. Manual layer offsets move both boundaries.
      const cue=plan.syncVersion===2 && take.visualEvent!==undefined
        ? Math.round(Math.min(take.visualEvent,take.frame)*1600+layer.offset*48)-192
        : 0;
      const first=Math.max(0,Math.max(0,cue)-start),last=Math.min(Math.ceil(src.length/rate),length-start);
      const attack=Math.max(1,Math.min(layer.fadeIn*48,peak-first));
      const release=Math.max(1,Math.min(layer.fadeOut*48,last-peak));
      for(let c=0;c<2;c++){
        const samples=src.getChannelData(Math.min(c,src.numberOfChannels-1));
        for(let i=first;i<last;i++){
          const fade=Math.min(1,peak===first?1:(i-first)/attack,(last-i-1)/release);
          const position=Math.min(samples.length-1,Math.max(0,take.peak+(i-peak)*rate));
          const left=Math.floor(position);
          const value=samples[left]+(samples[Math.min(left+1,samples.length-1)]-samples[left])*(position-left);
          track[(start+i)*2+c]+=value*layer.gain*take.gain*Math.max(0,fade);
        }
      }
    }
    if(track!==mix){
      for(let i=0;i<mix.length;i++)mix[i]+=track[i];
      await addRoom(track,mix,layer.room??0);
    }
  }
  return wave(mix,2);
}
