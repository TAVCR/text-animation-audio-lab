import React from 'react';
import { useVideoConfig, spring, interpolate } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const RotationRevealEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { fps } = useVideoConfig();
  const easing = getEasing(props.easingStyle);

  const chars = Array.from(props.text ?? '');
  const getRangesForIndex = (index: number) =>
    (props.textRangeStyles ?? [])
      .filter((style) => index >= style.start && index < style.end)
      .map((style) => ({ ...style, start: 0, end: 1 }));

  return (
    <div style={{
      display: 'inline-block',
      justifyContent: 'center',
      gap: `${props.fontSize * 0.3}px`,
      fontFamily: `"${props.fontFamily}", sans-serif`,
      fontWeight: props.fontWeight || 'bold',
      textAlign: 'center',
      lineHeight: 1.2,
      perspective: '1000px',
    }}>
      {chars.map((char, index) => {
        const delay = index * 3;
        
        const rotationRaw = spring({
          fps,
          frame: frame - delay,
          config: { damping: 12, mass: 0.5, stiffness: 80 },
        });
        const rotation = interpolate(rotationRaw, [0, 1], [0, 1], {
          easing,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        const rotateY = (1 - rotation) * -90; // From -90 deg to 0
        const opacity = interpolate(frame - delay, [0, 10], [0, 1], {
          easing,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        return (
          <span key={index} style={{
            display: 'inline-block',
            fontSize: `${props.fontSize}px`,
            letterSpacing: `${props.letterSpacing}px`,
            color: props.enableFill ? props.color : 'transparent',
            WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
            textShadow: props.enableShadow && props.shadowBlur > 0 ? `0px 0px ${props.shadowBlur}px ${props.shadowColor}` : 'none',
            transform: `rotateY(${rotateY}deg)`,
            transformOrigin: 'left center',
            opacity: opacity,
            willChange: 'transform, opacity'
          }}>
            <StyledRangeText
              text={char === ' ' ? '\u00A0' : char}
              props={{ ...props, textRangeStyles: getRangesForIndex(index) }}
            />
          </span>
        );
      })}
    </div>
  );
};
