import React from 'react';
import { useVideoConfig, spring, interpolate } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const BlurRevealEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { fps } = useVideoConfig();
  const easing = getEasing(props.easingStyle);

  const springProgress = spring({
    fps,
    frame: frame - 10,
    config: { damping: 100, mass: 1, stiffness: 50 },
    durationInFrames: 45,
  });
  const progress = interpolate(springProgress, [0, 1], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const blurAmount = interpolate(progress, [0, 1], [40, 0]);
  const opacity = interpolate(progress, [0, 0.5, 1], [0, 1, 1]);
  const scale = interpolate(progress, [0, 1], [1.15, 1]);

  return (
    <div style={{
      fontFamily: `"${props.fontFamily}", sans-serif`,
      fontSize: `${props.fontSize}px`,
      letterSpacing: `${props.letterSpacing}px`,
      fontWeight: props.fontWeight || 'bold',
      textAlign: 'center',
      whiteSpace: 'pre-wrap',
      lineHeight: 1.2,
      color: props.enableFill ? props.color : 'transparent',
      WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
      textShadow: props.enableShadow && props.shadowBlur > 0 ? `0px 0px ${props.shadowBlur}px ${props.shadowColor}` : 'none',
      filter: `blur(${blurAmount}px)`,
      opacity: opacity,
      transform: `scale(${scale})`,
      willChange: 'transform, opacity, filter',
    }}>
      <StyledRangeText text={props.text} props={props} />
    </div>
  );
};
