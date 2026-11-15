import {voices,type Voice} from './capabilities';
export type Strategy={voice:Voice;attack:'immediate'|'natural'|'gradual'; intensity:'subtle'|'medium'|'strong'; landing:'silent'|'last';density:'sparse'|'moderate'|'busy'; grouping:'phrase'|'pulse'|'gesture'; closing:'accent'|'rest'; character:'soft'|'bright'|'rough'; space:'short'|'long'};
const options={intensity:['subtle','medium','strong'],attack:['immediate','natural','gradual'],voice:Object.keys(voices),landing:['silent','last'],density:['sparse','moderate','busy'],grouping:['phrase','pulse','gesture'],closing:['accent','rest'],character:['soft','bright','rough'],space:['short','long']};
export const strategySchema={type:'object',additionalProperties:false,required:Object.keys(options),properties:Object.fromEntries(Object.entries(options).map(([k,v])=>[k,{type:'string',enum:v}]))};
export function valid(value:unknown):value is Strategy{
  if(!value || typeof value!=='object')return false;
  return Object.entries(options).every(([k,v])=>v.includes((value as Record<string,string>)[k])) && Object.keys(value).length===Object.keys(options).length;
}
export function distribute(frames:number[],family:string,s:Strategy,heads:number[]=[]){
  const end=frames.length-1, span=frames[end]-frames[0];
  const gap=({sparse:10,moderate:6,busy:3})[s.density];
  const selected=[0];
  if(end && s.closing==='accent' && span>=gap)selected.push(end);
  const max=Math.min(12,Math.ceil(frames.length/(family==='typewriter'?4:family==='slide-in'?2:3))+(s.density==='busy'?2:0));
  while(selected.length<max){
    let winner=-1,best=0;
    frames.forEach((f,i)=>{
      if(i===end && s.closing==='rest')return;
      const distance=Math.min(...selected.map(j=>Math.abs(frames[j]-f)));
      if(distance<gap)return;
      const pause=f-(frames[i-1]??f);
      const priority=s.grouping==='phrase' && heads.includes(i)?2.4:s.grouping==='pulse'?1+Math.min(1,pause/8):1+Math.min(.8,pause/12);
      const score=distance*priority;
      if(score>best){best=score;winner=i}
    });
    if(winner<0)break;
    selected.push(winner);
  }
  return selected.sort((a,b)=>a-b);
}

