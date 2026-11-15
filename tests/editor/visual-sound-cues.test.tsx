import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
import {defaultAnimationProps} from '@/lib/AnimationContext';
import {analyze} from '@/lib/sound/analyze';
import {templateRegistry} from '@/remotion/templates/registry';

let frame=0;
const frames=48;
vi.mock('remotion',async()=>{
  const actual=await vi.importActual<typeof import('remotion')>('remotion');
  return {...actual,useCurrentFrame:()=>frame,useVideoConfig:()=>({fps:30,width:1920,height:1080,durationInFrames:frames})};
});

const templates=['smooth-sliding','rotation','follower','apple-style','blur-cascade','clean-modern','follower-grow'] as const;
const cases=[
  {motionPhase:'in',speed:1,easingStyle:'cubic'},
  {motionPhase:'out',speed:.75,easingStyle:'linear'},
  {motionPhase:'in-out',speed:1.5,easingStyle:'bezier'},
] as const;

for(const settings of cases){
  it.each(templates)('aligns %s with rendered opacity in '+settings.motionPhase,(animationStyle)=>{
    const props={...defaultAnimationProps,...settings,reverseOutAnimation:true,animationStyle,text:'uno dos'};
    const Component=templateRegistry[animationStyle]!;
    const container=document.createElement('div');
    const observed:number[]=[];
    let previous=0;
    for(frame=0;frame<frames;frame++){
      container.innerHTML=renderToStaticMarkup(<Component {...props}/>);
      const visible=Array.from(container.querySelectorAll('span')).filter(span=>
        span.textContent?.trim() && span.style.opacity!=='' && Number(span.style.opacity)>=.5).length;
      if(frame>0 && visible!==previous)observed.push(frame);
      previous=visible;
    }
    expect(observed.length).toBeGreaterThan(0);
    expect(analyze(props,frames,30).events).toEqual(observed);
  });
}
