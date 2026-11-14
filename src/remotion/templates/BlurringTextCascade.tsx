import React from 'react';
import { interpolate } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const BlurringTextCascade: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;

  const characters = Array.from(props.text ?? '');
  const useGradientFill = props.enableFill && props.enableGradient;
  const gradientFill = `linear-gradient(135deg, ${props.gradientStart}, ${props.gradientEnd})`;
  const showShadow = props.enableShadow && props.shadowBlur > 0;
  const getRangesForIndex = (index: number) =>
    (props.textRangeStyles ?? [])
      .filter((style) => index >= style.start && index < style.end)
      .map((style) => ({ ...style, start: 0, end: 1 }));
  
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', fontFamily: `"${props.fontFamily}", sans-serif`, fontWeight: props.fontWeight || 'bold' }}>
      {characters.map((char, index) => {
        if (char === '\n') {
          return <span key={`blur-cascade-br-${index}`} style={{ flexBasis: '100%', width: '100%', height: 0 }} />;
        }

        const delay = index * 2;
        const localFrame = Math.max(0, frame - delay);

        const progress = interpolate(localFrame, [0, 15], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          easing: getEasing(props.easingStyle)
        });

        const blurPx = interpolate(progress, [0, 1], [30, 0]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);
        const scale = interpolate(progress, [0, 1], [1.5, 1]);
        const shadowFilter = showShadow
          ? ` drop-shadow(0 0 ${props.shadowBlur}px ${props.shadowColor}) drop-shadow(0 0 ${Math.max(1, props.shadowBlur * 0.45)}px ${props.shadowColor})`
          : '';

        return (
          <span key={index} style={{
            fontSize: `${props.fontSize}px`, letterSpacing: `${props.letterSpacing}px`,
            lineHeight: props.lineHeight || 1.2,
            color: props.enableFill ? (useGradientFill ? 'transparent' : props.color) : 'transparent',
            backgroundImage: useGradientFill ? gradientFill : 'none',
            WebkitBackgroundClip: useGradientFill ? 'text' : 'border-box',
            backgroundClip: useGradientFill ? 'text' : 'border-box',
            WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
            filter: `blur(${blurPx}px)${shadowFilter}`,
            opacity: opacity,
            transform: `scale(${scale})`,
            display: 'inline-block',
            whiteSpace: char === ' ' ? 'pre' : 'normal',
            willChange: 'transform, opacity, filter'
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
