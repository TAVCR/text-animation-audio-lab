import React from 'react';
import { useVideoConfig, spring, interpolate } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const SlideRevealEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { fps } = useVideoConfig();
  const easing = getEasing(props.easingStyle);

  // Box expands from left to right
  const expandSpring = spring({
    fps,
    frame: frame - 5,
    config: { damping: 100, mass: 1, stiffness: 150 },
    durationInFrames: 30,
  });
  const expand = interpolate(expandSpring, [0, 1], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Box shrinks to the right, revealing text
  const shrinkSpring = spring({
    fps,
    frame: frame - 35,
    config: { damping: 100, mass: 1, stiffness: 150 },
    durationInFrames: 30,
  });
  const shrink = interpolate(shrinkSpring, [0, 1], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const boxScaleX = clamp01(expand - shrink);
  const boxLeft = interpolate(shrink, [0, 1], [0, 100]);

  const boxTranslate = `translate3d(${boxLeft}%, 0, 0) scaleX(${boxScaleX})`;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* The Text (revealed when shrink starts) */}
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
        clipPath: `polygon(0% 0%, ${boxLeft}% 0%, ${boxLeft}% 100%, 0% 100%)`,
        opacity: shrink > 0.01 ? 1 : 0,
        willChange: 'clip-path, opacity, transform',
      }}>
        <StyledRangeText text={props.text} props={props} />
      </div>

      {/* The Solid Box */}
      {expand > 0 && shrink < 1 && (
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: '100%',
          backgroundColor: props.boxColor || '#ff0055',
          zIndex: 10,
          transformOrigin: '0% 50%',
          transform: boxTranslate,
          willChange: 'transform, opacity',
        }} />
      )}
    </div>
  );
};

const clamp01 = (value: number): number => {
  return Math.min(1, Math.max(0, value));
};
