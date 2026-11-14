import React from 'react';
import { useVideoConfig, spring, interpolate } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const BubblePopEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  // Calibrate this style so 1x is less aggressive than other effects.
  const calibratedSpeed = speed * 0.62;
  const frame = baseFrame * calibratedSpeed;
  const { fps } = useVideoConfig();
  const easing = getEasing(props.easingStyle);
  const words = Array.from((props.text ?? '').matchAll(/\S+/g)).map((match) => {
    const start = match.index ?? 0;
    const text = match[0];
    return { text, start, end: start + text.length };
  });
  const getRangesForWord = (wordStart: number, wordEnd: number) =>
    (props.textRangeStyles ?? [])
      .filter((style) => style.end > wordStart && style.start < wordEnd)
      .map((style) => ({
        ...style,
        start: Math.max(0, style.start - wordStart),
        end: Math.min(wordEnd - wordStart, style.end - wordStart),
      }))
      .filter((style) => style.end > style.start);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: `${props.fontSize * 0.3}px`,
        fontFamily: `"${props.fontFamily}", sans-serif`,
        fontWeight: props.fontWeight || 'bold',
        textAlign: 'center',
      }}
    >
      {words.map((word, i) => {
        const delay = i * 8;
        const scaleSpring = spring({
          fps,
          frame: frame - delay,
          config: { damping: 16, mass: 0.8, stiffness: 90 },
          durationInFrames: 26,
        });
        const scale = interpolate(scaleSpring, [0, 1], [0, 1], {
          easing,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        // Simple opacity fade-in coupled with the scale
        const opacitySpring = spring({
          fps,
          frame: frame - delay,
          config: { damping: 130, stiffness: 130 },
          durationInFrames: 16,
        });
        const opacity = interpolate(opacitySpring, [0, 1], [0, 1], {
          easing,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        return (
          <span
            key={i}
            style={{
              fontSize: `${props.fontSize}px`,
      letterSpacing: `${props.letterSpacing}px`,
        lineHeight: props.lineHeight || 1.2,
              color: props.enableFill ? props.color : 'transparent',
              WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
              textShadow: props.enableShadow && props.shadowBlur > 0 ? `0px 0px ${props.shadowBlur}px ${props.shadowColor}` : 'none',
              transform: `scale(${scale})`,
              opacity: opacity,
              display: 'inline-block',
              willChange: 'transform, opacity',
            }}
          >
            <StyledRangeText
              text={word.text}
              props={{ ...props, textRangeStyles: getRangesForWord(word.start, word.end) }}
            />
          </span>
        );
      })}
    </div>
  );
};
