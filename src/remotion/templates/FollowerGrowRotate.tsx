import React from 'react';
import { interpolate } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const FollowerGrowRotate: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const easing = getEasing(props.easingStyle);

  const chars = Array.from(props.text ?? '');
  const getRangesForIndex = (index: number) =>
    (props.textRangeStyles ?? [])
      .filter((style) => index >= style.start && index < style.end)
      .map((style) => ({ ...style, start: 0, end: 1 }));
  const centerIndex = Math.floor(chars.length / 2);

  return (
    <div style={{ display: 'inline-block', textAlign: 'center', whiteSpace: 'pre-wrap', lineHeight: props.lineHeight || 1.2 }}>
      {chars.map((char, index) => {
        if (char === '\n') return <br key={`follower-grow-br-${index}`} />;

        // Drop propagation from the center outwards (Inside Out Wave)
        const distanceToCenter = Math.abs(index - centerIndex);
        const delay = distanceToCenter * 2;
        const localFrame = Math.max(0, frame - delay);

        let scaleY = 0;
        let rotateZ = -45;
        let opacity = 0;

        if (localFrame < 10) {
           // Growth expansion (0 to 1.3 scale) Master Doc curve
           const p1 = interpolate(localFrame, [0, 10], [0, 1], { easing });
           scaleY = interpolate(p1, [0, 1], [0, 1.3]);
           rotateZ = interpolate(p1, [0, 1], [-45, 15]);
           opacity = p1;
        } else {
           // Smooth landing back to 1.0 (Wavy recoil)
           const p2 = interpolate(localFrame, [10, 20], [0, 1], { extrapolateRight: 'clamp', easing });
           scaleY = interpolate(p2, [0, 1], [1.3, 1]);
           rotateZ = interpolate(p2, [0, 1], [15, 0]);
           opacity = 1;
        }

        return (
          <span key={index} style={{
            display: 'inline-block',
            fontFamily: `"${props.fontFamily}", sans-serif`,
            fontSize: `${props.fontSize}px`,
            fontWeight: props.fontWeight || 'bold',
            letterSpacing: `${props.letterSpacing}px`,
            color: props.enableFill ? props.color : 'transparent',
            WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
            textShadow: props.enableShadow && props.shadowBlur > 0 ? `0px 0px ${props.shadowBlur}px ${props.shadowColor}` : 'none',
            transform: `scaleY(${scaleY}) rotateZ(${rotateZ}deg)`,
            transformOrigin: 'bottom center',
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
