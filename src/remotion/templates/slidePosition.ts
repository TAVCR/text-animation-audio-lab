import {spring,interpolate} from 'remotion';
export function slidePosition(frame:number,fps:number,easing:(t:number)=>number){
  return interpolate(spring({frame,fps,config:{damping:12,mass:.5,stiffness:100},durationInFrames:30}),[0,1],[0,1],{easing,extrapolateLeft:'clamp',extrapolateRight:'clamp'});
}
