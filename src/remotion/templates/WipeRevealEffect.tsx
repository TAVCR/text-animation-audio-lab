import React from 'react';
import { useVideoConfig, spring, interpolate } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const WipeRevealEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { fps } = useVideoConfig();
  const easing = getEasing(props.easingStyle);

  // Progress from 0 to 1 smoothly
  const springProgress = spring({
    fps,
    frame: frame - 10, // Slight delay before start
    config: { damping: 200, mass: 1, stiffness: 50 },
    durationInFrames: Math.floor(fps * 1.5),
  });
  const progress = interpolate(springProgress, [0, 1], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const clipWidth = interpolate(progress, [0, 1], [0, 100]);

  return (
    <div
      style={{
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
        clipPath: `polygon(0 0, ${clipWidth}% 0, ${clipWidth}% 100%, 0 100%)`,
        willChange: 'clip-path, opacity',
      }}
    >
      <StyledRangeText text={props.text} props={props} />
    </div>
  );
};
