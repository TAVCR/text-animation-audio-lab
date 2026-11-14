import {interpolate} from 'remotion';
import {getEasing, type AnimationProps} from '@/lib/AnimationContext';
import {getTypewriterRevealFrames} from './typewriterUtils';

export function visibleCount(frame:number, count:number, props:AnimationProps, fps:number) {
  const end=getTypewriterRevealFrames(count,props.typewriterCharactersPerSecond,fps);
  return Math.min(count,Math.round(count*interpolate(frame,[0,end],[0,1],{
    easing:getEasing(props.easingStyle),extrapolateLeft:'clamp',extrapolateRight:'clamp'
  })));
}
