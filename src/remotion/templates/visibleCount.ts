import type {AnimationProps} from '@/lib/AnimationContext';
import {getTypewriterRevealFrames} from './typewriterUtils';

export function visibleCount(frame:number, count:number, props:AnimationProps, fps:number) {
  const end=getTypewriterRevealFrames(count,props.typewriterCharactersPerSecond,fps);
  return Math.max(0, Math.min(count, Math.round(count * frame / end)));
}
