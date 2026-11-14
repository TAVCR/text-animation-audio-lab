import React from 'react';
import { useVideoConfig, interpolate, random } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const NeonPulseEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { fps } = useVideoConfig();
  const easing = getEasing(props.easingStyle);

  // Create a flickering effect oscillating rapidly
  const wave = Math.sin(frame / (fps / 8));
  
  // Erratic glitch (flicker off briefly)
  const seededFrame = Math.floor(frame);
  const erratic =
    seededFrame % 13 === 0
      ? 0.3 + random(`neon-pulse-erratic-${seededFrame}`) * 0.4
      : 1;
  
  const intensity = interpolate(wave, [-1, 1], [0.85, 1], { easing }) * erratic;
  
  const blurBase = props.shadowBlur > 0 ? props.shadowBlur : 30;
  const colorBase = props.color;
  const glowColor = props.shadowColor || colorBase;

  return (
    <div style={{
      fontFamily: `"${props.fontFamily}", sans-serif`,
      fontSize: `${props.fontSize}px`,
      letterSpacing: `${props.letterSpacing}px`,
      fontWeight: props.fontWeight || 'bold',
      textAlign: 'center',
      whiteSpace: 'pre-wrap',
      lineHeight: 1.2,
      color: props.enableFill ? colorBase : 'transparent',
      WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
      textShadow: props.enableShadow ? `
        0 0 ${blurBase * 0.2 * intensity}px ${glowColor},
        0 0 ${blurBase * 0.5 * intensity}px ${glowColor},
        0 0 ${blurBase * intensity}px ${glowColor},
        0 0 ${blurBase * 1.5 * intensity}px ${glowColor},
        0 0 ${blurBase * 2.5 * intensity}px ${glowColor}
      ` : 'none',
      opacity: intensity < 0.4 ? 0.4 : 1,
      willChange: 'opacity'
    }}>
      <StyledRangeText text={props.text} props={props} />
    </div>
  );
};
