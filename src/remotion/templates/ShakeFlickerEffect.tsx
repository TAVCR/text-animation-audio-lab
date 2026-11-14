import React from 'react';
import { useVideoConfig, random, interpolate } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const ShakeFlickerEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { fps, durationInFrames } = useVideoConfig();
  const easing = getEasing(props.easingStyle);

  // Defines procedural noise domains (1 sec bounds)
  const flickerDur = fps * 1.5; 
  let opacity = 1;

  if (frame < flickerDur) {
    // Erratic flicker mathematically locked to 2-frame blocks to simulate erratic AC currents
    const block = Math.floor(frame / 2);
    const noise = random(`shake-in-${block}`);
    const threshold = interpolate(frame, [0, flickerDur], [0.75, 0.4], {
      easing,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    opacity = noise > threshold ? 1 : 0;
  } else if (frame > durationInFrames - flickerDur) {
    // Shutting off sequence
    const block = Math.floor((durationInFrames - frame) / 2);
    const noise = random(`shake-out-${block}`);
    const threshold = interpolate(durationInFrames - frame, [0, flickerDur], [0.75, 0.4], {
      easing,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    opacity = noise > threshold ? 1 : 0;
  } else {
    // Stability zone
    opacity = 1;
  }

  return (
    <div style={{
      display: 'inline-block',
      textAlign: 'center',
      whiteSpace: 'pre-wrap',
      lineHeight: props.lineHeight || 1.2,
      fontFamily: `"${props.fontFamily}", sans-serif`,
      fontSize: `${props.fontSize}px`,
      fontWeight: props.fontWeight || 'bold',
      letterSpacing: `${props.letterSpacing}px`,
      color: props.enableFill ? props.color : 'transparent',
      WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
      textShadow: props.enableShadow && props.shadowBlur > 0 ? `0px 0px ${props.shadowBlur}px ${props.shadowColor}` : 'none',
      opacity: opacity,
      willChange: 'opacity'
    }}>
      <StyledRangeText text={props.text} props={props} />
    </div>
  );
};
