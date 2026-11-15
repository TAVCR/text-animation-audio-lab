import {slidePosition} from '@/remotion/templates/slidePosition';
import {getEasing,type AnimationProps} from '@/lib/AnimationContext';
import {mapMotionFrame} from '@/remotion/useMotionFrame';
import {segmentGraphemes} from '@/remotion/templates/typewriterUtils';
import {visibleCount} from '@/remotion/templates/visibleCount';
import {getWordHighlightIndex} from '@/remotion/templates/wordHighlightUtils';

export function analyze(p:AnimationProps,frames:number,fps:number){
  const chars=segmentGraphemes(p.text), words=p.text.match(/\S+/g)?.length??0;
  const letters=Array.from(p.text), events:number[]=[],heads:number[]=[];
  let before=0,maxShown=0,visibleChanges=0;
  const stops:number[]=[],peaks:number[]=[],starts:number[]=[],decelerations:number[]=[],rebounds:number[]=[];
  if(p.animationStyle==="slide-in" && p.showTextLayer && p.motionPhase==="in"){
    for(let w=0;w<Math.min(words,Math.ceil(frames*p.speed/4));w++){
      let prev=0,fast=0,peak=-1,lastOutside=-1,started=false;const velocities:number[]=[];const first=Math.max(0,Math.floor(w*4/p.speed));
      for(let f=Math.max(0,Math.floor(w*4/p.speed));f<frames;f++){
        const clock=f*p.speed-w*4, pos=slidePosition(clock,fps,getEasing(p.easingStyle)),v=pos-prev;
        velocities.push(Math.abs(v));
        if(!started && pos>0){starts.push(f);started=true}
        if(Math.abs(v)>fast){fast=Math.abs(v);peak=f}
        if(v < -.001 && rebounds[rebounds.length-1]!==f)rebounds.push(f);
        if(pos<.99)lastOutside=f;prev=pos;
        if(clock>=30){if(lastOutside>=0 && lastOutside+1<=f)stops.push(lastOutside+1);break}
      }
      if(peak>=0){peaks.push(peak);const slowing=velocities.findIndex((v,i)=>first+i>peak && v<fast);if(slowing>=0)decelerations.push(first+slowing)}
    }
  }
  for(let f=0;words && p.showTextLayer!==false && f<frames;f++){
    const raw=f*(p.speed||1), clock=mapMotionFrame(f,frames,p)*(p.speed||1);
    let state=0, audible=true;
    switch(p.animationStyle){
      case 'typewriter':state=visibleCount(clock,chars.length,p,fps);audible=chars.slice(before,state).some(c=>c.trim());break;
      case 'glitch':state=Number(Math.floor(clock/20)%2===0 && clock%4<2);break;
      case 'slide-in':case 'smooth-sliding':state=Math.min(words,Math.ceil(clock/(p.animationStyle==='slide-in'?4:3)));break;
      case 'rotation':case 'follower':case 'apple-style':{
        const stagger=p.animationStyle==='rotation'?3:p.animationStyle==='follower'?2:2.5;
        state=Math.min(letters.length,Math.ceil(clock/stagger));audible=letters.slice(before,state).some(c=>c.trim());break;
      }
      case 'glyph-tile-assemble':state=raw>=Math.max(1,(p.glyphTileAssemblySeconds??.8)*fps)?2:raw>0?1:0;break;
      case 'word-highlight-tracker':state=1+getWordHighlightIndex(raw,words,p.wordHighlightSeconds??.4,fps);break;
      case 'ink-stamp-print':state=raw>=Math.max(1,p.inkStampFrames??6)?1:0;break;
      case 'bubble-pop':state=Math.min(words,Math.ceil(clock*.62/8));break;
      case 'blur-cascade':state=Math.min(letters.length,Math.ceil(clock/2));audible=letters.slice(before,state).some(c=>c.trim());break;
      case 'paper-cutout-assemble':state=Math.min(words,Math.floor(Math.max(0,f-1)/Math.max(1,p.paperCutoutWordDelayFrames??4))+1);break;
    }
    if(state>before)visibleChanges++;
    if(state>before && audible){
      if(p.animationStyle==='typewriter' && chars.slice(before,state).some((c,j)=>c.trim() && (before+j===0 || !chars[before+j-1].trim())))heads.push(events.length);
      events.push(f);
    }
    before=state;maxShown=Math.max(state,maxShown);
  }
  return {words,events,heads,stops,peaks,starts,decelerations,rebounds,visibleChanges,maxShown,graphemes:chars.length,truncated:p.animationStyle==='typewriter' && maxShown<chars.length};
}
export const styles=[
  {name:'Minimal',gain:.35,tail:45,density:12,variant:0},
  {name:'Cinematic',gain:.7,tail:220,density:8,variant:2},
  {name:'Rhythmic',gain:.52,tail:75,density:2,variant:3}
] as const;



