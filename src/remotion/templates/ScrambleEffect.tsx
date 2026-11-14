import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

export const ScrambleEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useCurrentFrame();
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { durationInFrames } = useVideoConfig();
  const easing = getEasing(props.easingStyle);

  // Exception rule for Hacker Scramble:
  // - Entry scramble is always mandatory.
  // - Exit can use blur instead of reverse scramble.
  const lastFrame = Math.max(1, durationInFrames - 1);
  const inEnd = Math.max(1, Math.floor(lastFrame * (props.motionPhase === 'in' ? 1 : 0.55)));
  const outStart = Math.max(1, Math.floor(lastFrame * 0.72));

  const progress = interpolate(frame, [0, inEnd], [0, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const blurOutProgress = props.motionPhase === 'in'
    ? 0
    : interpolate(frame, [outStart, lastFrame], [0, 1], {
        easing,
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });

  const originalChars = Array.from(props.text ?? '');
  const getRangesForIndex = (index: number) =>
    (props.textRangeStyles ?? [])
      .filter((style) => index >= style.start && index < style.end)
      .map((style) => ({ ...style, start: 0, end: 1 }));

  const scrambledChars = originalChars.map((char, index) => {
    const settleProgress = index / Math.max(1, originalChars.length);

    // If it's space or newline, never scramble.
    if (char === ' ' || char === '\n') return char;

    // Smooth settling from left to right during the mandatory IN phase.
    if (progress < settleProgress + 0.1 && progress < 1) {
      const seed = Math.sin(frame * index + index) * 10000;
      const randomChar = chars[Math.floor(Math.abs(seed) % chars.length)];
      return randomChar;
    }

    return char;
  });

  const blurAmount = blurOutProgress * 28;
  const exitOpacity = props.motionPhase === 'in' ? 1 : 1 - blurOutProgress;
  const shadowStyle = props.enableShadow && props.shadowBlur > 0
    ? `0px 0px ${props.shadowBlur}px ${props.shadowColor}`
    : 'none';

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', height: '100%',
      fontFamily: `"${props.fontFamily}", monospace`,
      fontSize: `${props.fontSize}px`,
      letterSpacing: `${props.letterSpacing}px`,
      fontWeight: props.fontWeight || 'bold',
      textAlign: 'center',
      whiteSpace: 'pre-wrap',
      lineHeight: 1.2,
      color: props.enableFill ? props.color : 'transparent',
      WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
      textShadow: shadowStyle,
      filter: `blur(${blurAmount}px)`,
      opacity: exitOpacity,
      willChange: 'opacity, filter',
    }}>
      {scrambledChars.map((char, index) => {
        if (char === '\n') return <br key={`scramble-br-${index}`} />;
        return (
          <span key={`scramble-char-${index}`} style={{ display: 'inline-block' }}>
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
