import React from 'react';
import { useVideoConfig, spring, interpolate } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const FollowerEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { fps, height } = useVideoConfig();
  const easing = getEasing(props.easingStyle);

  const chars = Array.from(props.text ?? '');
  const getRangesForIndex = (index: number) =>
    (props.textRangeStyles ?? [])
      .filter((style) => index >= style.start && index < style.end)
      .map((style) => ({ ...style, start: 0, end: 1 }));
  
  return (
    <div style={{
      fontFamily: `"${props.fontFamily}", sans-serif`,
      fontWeight: props.fontWeight || 'bold',
      textAlign: 'center',
      whiteSpace: 'pre-wrap',
      lineHeight: props.lineHeight || 1.2,
    }}>
      {chars.map((char, index) => {
        // Curve delay
        const delay = index * 2;
        
        const translateYSpring = spring({
          fps,
          frame: frame - delay,
          config: { damping: 10, mass: 0.8, stiffness: 100 },
        });
        const translateY = interpolate(translateYSpring, [0, 1], [0, 1], {
          easing,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        const entrySign = props.followerDirection === 'top-down' ? -1 : 1;
        const yOffset = (1 - translateY) * (height / 2) * entrySign;
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
            transform: `translate3d(0, ${yOffset}px, 0)`,
            opacity: opacity,
            willChange: 'transform, opacity',
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
