import type {AnimationProps} from '@/lib/AnimationContext';
import {mapMotionFrame} from '@/remotion/useMotionFrame';
import {segmentGraphemes} from '@/remotion/templates/typewriterUtils';
import {visibleCount} from '@/remotion/templates/visibleCount';
import {getWordHighlightIndex} from '@/remotion/templates/wordHighlightUtils';

export function analyze(p:AnimationProps,frames:number,fps:number){
  const chars=segmentGraphemes(p.text), words=p.text.match(/\S+/g)?.length??0;
  const letters=Array.from(p.text), events:number[]=[],heads:number[]=[];
  let before=0,maxShown=0;
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
    }
    if(state>before && audible){
      if(p.animationStyle==='typewriter' && chars.slice(before,state).some((c,j)=>c.trim() && (before+j===0 || !chars[before+j-1].trim())))heads.push(events.length);
      events.push(f);
    }
    before=state;maxShown=Math.max(state,maxShown);
  }
  return {words,events,heads,truncated:p.animationStyle==='typewriter' && maxShown<chars.length};
}
export const styles=[
  {name:'Minimal',gain:.35,tail:45,density:12,variant:0},
  {name:'Cinematic',gain:.7,tail:220,density:8,variant:2},
  {name:'Rhythmic',gain:.52,tail:75,density:2,variant:3}
] as const;

