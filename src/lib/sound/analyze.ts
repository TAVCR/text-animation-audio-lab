import {boxLandmarks} from './boxLandmarks';
import {interpolate,random,spring} from 'remotion';
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
  // Thresholds are expressed on the visual component's clock. Crossing a
  // threshold in either direction also covers mirrored motion phases.
  const landmarks = ():number[] => {
    const easing=getEasing(p.easingStyle);
    const strongestReveal=(delay:number,duration:number,damping:number,stiffness:number)=>{
      let best=0,anchor=delay+1,previous=0;
      for(let t=1;t<=duration;t++){
        const progress=easing(spring({frame:t,fps,durationInFrames:duration,config:{damping,stiffness,mass:1}}));
        if(progress-previous>best){best=progress-previous;anchor=delay+t}
        previous=progress;
      }
      return anchor;
    };
    switch(p.animationStyle){
      case 'wipe-reveal': return [strongestReveal(10,Math.floor(fps*1.5),200,50)];
      case 'blur-reveal': return [strongestReveal(10,45,100,50)];
      case 'slide-reveal': return [strongestReveal(5,30,100,150),strongestReveal(35,30,100,150)];
      case 'shape-reveal': return [1,40,Math.max(41,frames-40)];
      case 'bar-reveal': return [frames*.19,frames*.69]; // Midpoints of the outward and return sweeps.
      case 'cinematic': return [1,frames*.14,frames*.8];
      case 'fly-through': return [1,15];
      case 'extruded-3d': return [1,frames*.1/.72,frames*.548/.72,frames*.9/.72];
      case 'clean-modern': return letters.flatMap((c,i)=>c.trim()?[i*2+1]:[]);
      case 'follower-grow': return letters.flatMap((c,i)=>c.trim()?[Math.abs(i-Math.floor(letters.length/2))*2+1]:[]);
      case 'flicker': case 'flicker-outline-fill':
        return letters.flatMap((c,i)=>c.trim()?[4,16,28,36].map(n=>random(p.animationStyle+'-'+i)*fps*1.5+n):[]);
      case 'viral-text': {
        const speeds=[p.wordSpeedOne,...(p.showWordTwo?[p.wordSpeedTwo]:[]),...(p.showWordThree?[p.wordSpeedThree]:[])];
        const rate=interpolate(p.speed,[.2,1,3],[.12,.38,1.35],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
        return speeds.map((v,i)=>(1+i*(p.viralWordStagger??8))*p.speed/rate/Math.max(.2,v??1));
      }
      case 'kinetic-box-sequence':return boxLandmarks(p,words,frames,fps);
      default:return [];
    }
  };
  // Bubble Pop scales and fades each word in. Anchor the pop when the word
  // crosses half opacity, using the exact spring and easing of the text layer.
  const bubbleVisible=(local:number)=>local>0 && getEasing(p.easingStyle)(Math.min(1,spring({
    frame:local,fps,durationInFrames:16,config:{damping:130,stiffness:130}
  })))>=.5;
  const marks=landmarks().sort((a,b)=>a-b);
  const crossed=(clock:number)=>{
    let lo=0,hi=marks.length;
    while(lo<hi){const mid=(lo+hi)>>>1;if(marks[mid]<=clock)lo=mid+1;else hi=mid}
    return lo;
  };
  const secondary=p.secondaryTextLayer;
  const secondaryVisible=p.animationStyle==='dual-text-layers' && secondary?.enabled && secondary.opacity>0 && secondary.text.trim();
  const otherWordVisible=p.animationStyle==='viral-text' && ((p.showWordTwo && p.wordTwo?.trim()) || (p.showWordThree && p.wordThree?.trim()));
  const hasContent=words || secondaryVisible || otherWordVisible || p.animationStyle==='kinetic-box-sequence';
  for(let f=0;hasContent && p.showTextLayer!==false && f<frames;f++){
    const raw=f*(p.speed||1), clock=mapMotionFrame(f,frames,p)*(p.speed||1);
    let state=0, audible=true;
    switch(p.animationStyle){
      case 'dual-text-layers':{
        const layer=p.secondaryTextLayer,stamp=Math.max(1,p.inkStampFrames??6);
        state=Number(words>0 && p.opacity>0 && f>=(p.dualPrimaryDelayFrames??0)+stamp/p.speed)+Number(!!layer && !!secondaryVisible && f>=layer.delayFrames+stamp/layer.speed);
        break;
      }
      case 'variable-weight-wave':{
        const period=Math.max(1,p.variableWeightCycleSeconds??2.4)*fps;
        state=p.variableWeightBaseWeight===p.variableWeightPeakWeight && p.variableWeightBaseWeight!==undefined?0:Math.floor(raw/period+.5);break;
      }
      case 'neon-pulse':{
        if(p.enableShadow){state=Math.floor(clock/(2*Math.PI*fps/8)+.75);break}
        const tick=Math.floor(clock);
        const wave=Math.sin(clock/(fps/8));
        const intensity=interpolate(wave,[-1,1],[.85,1],{easing:getEasing(p.easingStyle)});
        state=Number(tick%13===0 && intensity*(.3+random('neon-pulse-erratic-'+tick)*.4)<.4);
        break;
      }
      case 'scramble':{
        // Scramble uses composition time even during its exit blur.
        const end=Math.max(1,Math.floor(Math.max(1,frames-1)*(p.motionPhase==='in'?1:.55)));
        const progress=interpolate(raw,[0,end],[0,1],{easing:getEasing(p.easingStyle),extrapolateRight:'clamp'});
        state=before;
        while(state<letters.length && (progress>=1 || progress>=state/letters.length+.1))state++;
        audible=letters.slice(before,state).some(c=>c.trim());
        break;
      }
      case 'shake-flicker':{
        const exit=clock>frames-fps*1.5,local=exit?frames-clock:clock;
        state=local>=fps*1.5?1:Number(random((exit?'shake-out-':'shake-in-')+Math.floor(local/2))>interpolate(local,[0,fps*1.5],[.75,.4],{easing:getEasing(p.easingStyle),extrapolateLeft:'clamp',extrapolateRight:'clamp'}));break;
      }
      default:state=crossed(clock);break;
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
      case 'bubble-pop':{
        const position=clock*.62;
        const latest=Math.min(words-1,Math.floor(position/8));
        state=Math.max(0,latest-1);
        for(let i=state;i<=latest;i++)if(bubbleVisible(position-i*8))state++;
        break;
      }
      case 'blur-cascade':state=Math.min(letters.length,Math.ceil(clock/2));audible=letters.slice(before,state).some(c=>c.trim());break;
      case 'paper-cutout-assemble':{
        // Per-word delays use composition frames; only the settling ramp is speed-scaled.
        const delay=Math.max(0,p.paperCutoutWordDelayFrames??4);
        const settle=Math.ceil(Math.max(1,p.paperCutoutSettleFrames??12)/(p.speed||1));
        const countAt=(frame:number)=>frame<0?0:delay===0?words:Math.min(words,1+Math.floor(frame/delay));
        state=countAt(f)+countAt(f-settle);
        break;
      }
    }
    if(state>before)visibleChanges++;
    if((state>before || ((marks.length || p.animationStyle==='bubble-pop') && f>0 && state<before)) && audible){
      if(p.animationStyle==='typewriter' && chars.slice(before,state).some((c,j)=>c.trim() && (before+j===0 || !chars[before+j-1].trim())))heads.push(events.length);
      events.push(f);
    }
    before=state;maxShown=Math.max(state,maxShown);
  }
  const precision=marks.length?'Hitos de la trayectoria':p.animationStyle==='slide-in'?'Trayectoria y asentamiento':'Eventos temporales';
  return {precision,words,events,heads,stops,peaks,starts,decelerations,rebounds,visibleChanges,maxShown,graphemes:chars.length,truncated:p.animationStyle==='typewriter' && maxShown<chars.length};
}
export const styles=[
  {name:'Minimal',gain:.35,tail:45,density:12,variant:0},
  {name:'Cinematic',gain:.7,tail:220,density:8,variant:2},
  {name:'Rhythmic',gain:.52,tail:75,density:2,variant:3}
] as const;



