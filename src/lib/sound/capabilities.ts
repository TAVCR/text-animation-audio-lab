import registry from './capabilities.json';
export type Voice = keyof typeof registry.voices;
export const voices = registry.voices;
export function motionFor(template: string) {
  return Object.entries(registry.motions).find(([, motion]) => motion.templates.includes(template));
}
export function compatibleVoices(template: string): Voice[] {
  return (motionFor(template)?.[1].voices ?? []) as Voice[];
}
export function soundAsset(voice: Voice, seed: number) {
  return '/audio-lab/' + voices[voice].asset.replace('#', String(seed % 4)) + '.wav';
}

// Penalize long approaches when the visible movement leaves little room before
// successive accents. The first compatible voice retains a small artistic bias.
export function classifyMotion(template:string, events:number[], fps:number) {
  const compatible=compatibleVoices(template);
  const gaps=events.slice(1).map((frame,i)=>(frame-events[i])/fps).sort((a,b)=>a-b);
  const interval=gaps.length?gaps[Math.floor(gaps.length/2)]:.5;
  const effectiveSeconds=events.length?(events[events.length-1]-events[0])/fps:0;
  const score=(voice:Voice,index:number)=>{
    const attack=voices[voice].peakMs/1000;
    return Math.min(1,interval/Math.max(.001,attack))-.30*index;
  };
  const ranked=compatible.map((voice,index)=>({voice,score:score(voice,index)}))
    .sort((a,b)=>b.score-a.score).map(option=>option.voice);
  return {ranked,interval,effectiveSeconds};
}
