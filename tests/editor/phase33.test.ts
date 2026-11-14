import {expect,it} from 'vitest';
import {analyze} from '../../src/lib/sound/analyze';
import {defaultAnimationProps} from '../../src/lib/AnimationContext';
it('counts simultaneous visible graphemes once on the sound timeline',()=>{
 const text='Una idea empieza con una palabra y va tomando forma con cada nuevo movimiento en pantalla';
 for(const [speed,count] of [[1,70],[2,52]]){
 const a=analyze({...defaultAnimationProps,text,animationStyle:'typewriter',speed},150,30);
 console.log(speed,a.graphemes,a.maxShown,a.visibleChanges,a.events.length);
 expect(a.events.length).toBe(count);
 expect(a.graphemes).toBe(89);expect(a.maxShown).toBe(89);expect(a.visibleChanges).toBe(speed===1?81:55);
 }
});

