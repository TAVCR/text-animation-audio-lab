import React from 'react';
import { random, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const GlitchEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { fps } = useVideoConfig();
  const easing = getEasing(props.easingStyle);
  const glitchRamp = interpolate(frame, [0, fps * 0.8], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  
  // Create a glitchy offset every few frames
  const isGlitching = Math.floor(frame / 20) % 2 === 0 && frame % 4 < 2;
  const glitchStrength = props.fontSize * 0.2 * glitchRamp;
  const rx = isGlitching ? (random(frame) - 0.5) * glitchStrength : 0;
  const ry = isGlitching ? (random(frame + 1) - 0.5) * glitchStrength : 0;
  
  return (
    <div
      style={{
        position: 'relative',
        fontFamily: `"${props.fontFamily}", sans-serif`,
        fontSize: `${props.fontSize}px`,
      letterSpacing: `${props.letterSpacing}px`,
        fontWeight: props.fontWeight || 'bold',
        textAlign: 'center',
        whiteSpace: 'pre-wrap',
        lineHeight: props.lineHeight || 1.2,
        willChange: 'transform, opacity',
      }}
    >
      {isGlitching && (
        <>
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              color: 'red',
              opacity: 0.8,
              mixBlendMode: 'screen',
              textShadow: 'none',
              zIndex: 1,
              transform: `translate3d(${rx}px, ${ry}px, 0)`,
              willChange: 'transform, opacity',
            }}
          >
            <StyledRangeText text={props.text} props={props} />
          </span>
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              color: 'cyan',
              opacity: 0.8,
              mixBlendMode: 'screen',
              textShadow: 'none',
              zIndex: 1,
              transform: `translate3d(${-rx}px, ${-ry}px, 0)`,
              willChange: 'transform, opacity',
            }}
          >
            <StyledRangeText text={props.text} props={props} />
          </span>
        </>
      )}
      <span
        style={{
          color: props.enableFill ? props.color : 'transparent',
          WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
          position: 'relative',
          zIndex: 10,
          textShadow: props.enableShadow && props.shadowBlur > 0 ? `0px 0px ${props.shadowBlur}px ${props.shadowColor}` : 'none',
          willChange: 'transform, opacity',
        }}
      >
        <StyledRangeText text={props.text} props={props} />
      </span>
    </div>
  );
};
