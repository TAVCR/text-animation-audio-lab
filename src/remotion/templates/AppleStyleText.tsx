import React from 'react';
import { interpolate } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const AppleStyleText: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const easing = getEasing(props.easingStyle);

  const chars = Array.from(props.text ?? '');
  const getRangesForIndex = (index: number) =>
    (props.textRangeStyles ?? [])
      .filter((style) => index >= style.start && index < style.end)
      .map((style) => ({ ...style, start: 0, end: 1 }));

  return (
    <div
      style={{
        display: 'inline-block',
        textAlign: 'center',
        whiteSpace: 'pre-wrap',
        lineHeight: props.lineHeight || 1.2,
        fontFamily: `"${props.fontFamily}", sans-serif`,
        fontWeight: props.fontWeight || 'bold',
      }}
    >
      {chars.map((char, index) => {
        if (char === '\n') return <br key={`apple-br-${index}`} />;

        // Asynchronous cascade delay
        const delay = index * 2.5;
        const localFrame = Math.max(0, frame - delay);

        // Spline sequence: 0->8 drop + overshoot, 8->14 squash to 0
        let translateYPercent = -60;
        let opacity = 0;
        let blurPx = 20;

        if (localFrame < 10) {
           const p1 = interpolate(localFrame, [0, 10], [0, 1], { easing });
           translateYPercent = interpolate(p1, [0, 1], [-60, 7]);
           opacity = p1;
           blurPx = interpolate(p1, [0, 1], [20, 0]);
        } else {
           const p2 = interpolate(localFrame, [10, 16], [0, 1], { extrapolateRight: 'clamp', easing });
           translateYPercent = interpolate(p2, [0, 1], [7, 0]);
           opacity = 1;
           blurPx = 0;
        }

        return (
          <span key={index} style={{
            display: 'inline-block',
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            fontSize: `${props.fontSize}px`,
            letterSpacing: `${props.letterSpacing}px`,
            color: props.enableFill ? props.color : 'transparent',
            WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
            textShadow: props.enableShadow && props.shadowBlur > 0 ? `0px 0px ${props.shadowBlur}px ${props.shadowColor}` : 'none',
            transform: `translate3d(0, ${translateYPercent}%, 0)`,
            filter: `blur(${blurPx}px)`,
            opacity: opacity,
            willChange: 'transform, opacity, filter',
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
