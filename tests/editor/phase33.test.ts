import {expect,it} from 'vitest';
import {analyze} from '../../src/lib/sound/analyze';
import {defaultAnimationProps} from '../../src/lib/AnimationContext';

it('counts visible typing changes once per frame at the selected character rate',()=>{
  const text='Una idea empieza con una palabra y va tomando forma con cada nuevo movimiento en pantalla';
  for(const speed of [1,2,3]){
    const props={...defaultAnimationProps,text,animationStyle:'typewriter' as const,motionPhase:'in' as const,speed,typewriterCharactersPerSecond:15};
    const analysis=analyze(props,150,30);
    const expected=new Set<number>();
    const changes=new Set<number>();
    for(let i=0;i<text.length;i++){
      const frame=Math.ceil((2*i+1)/speed);
      if(frame>=150)break;
      changes.add(frame);
      if(text[i].trim())expected.add(frame);
    }
    expect(analysis.events).toEqual(Array.from(expected));
    expect(analysis.visibleChanges).toBe(changes.size);
    expect(analysis.maxShown).toBe(speed===1?75:text.length);
  }
});
