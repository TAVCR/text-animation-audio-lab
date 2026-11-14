import React from 'react';
import { useVideoConfig, interpolate, random } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';

const hexToRgba = (hexColor: string, alpha: number): string => {
  const alphaSafe = Math.max(0, Math.min(1, alpha));
  const raw = hexColor.trim().replace('#', '');

  if (raw.length !== 3 && raw.length !== 6) {
    return hexColor;
  }

  const full = raw.length === 3
    ? raw.split('').map((c) => `${c}${c}`).join('')
    : raw;

  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);

  if ([r, g, b].some((v) => Number.isNaN(v))) {
    return hexColor;
  }

  return `rgba(${r}, ${g}, ${b}, ${alphaSafe})`;
};

export const FlickerOutlineFillEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { fps } = useVideoConfig();
  const easing = getEasing(props.easingStyle);

  const chars = Array.from(props.text ?? '');
  const strokeWidth = Math.max(1, props.borderWidth || 0);
  const strokeColor = props.borderColor || props.color;
  const shadowStyle =
    props.enableShadow && props.shadowBlur > 0
      ? `0px 0px ${props.shadowBlur}px ${props.shadowColor}`
      : 'none';
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
      }}
    >
      {chars.map((char, index) => {
        if (char === '\n') return <br key={`flicker-outline-br-${index}`} />;

        const startFrame = random(`flicker-outline-fill-${index}`) * fps * 1.5;
        const localFrame = Math.max(0, frame - startFrame);

        const cycleDuration = 12;
        const flickerCycles = 3;
        const totalFlickerDuration = cycleDuration * flickerCycles;

        let opacity = 0;
        if (frame < startFrame) {
          opacity = 0;
        } else if (localFrame >= totalFlickerDuration) {
          opacity = 1;
        } else {
          const cycleFrame = localFrame % cycleDuration;
          opacity = interpolate(cycleFrame, [0, 4, 8, 12], [0, 1, 0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing,
          });
        }

        const fillProgress = frame < startFrame
          ? 0
          : localFrame >= totalFlickerDuration
            ? 1
            : interpolate(localFrame, [0, totalFlickerDuration], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing,
              });

        const fillColor = hexToRgba(props.color, fillProgress);
        const strokeWidthDynamic = fillProgress >= 0.995 ? 0 : strokeWidth;

        return (
          <span
            key={index}
            style={{
              display: 'inline-block',
              fontFamily: `"${props.fontFamily}", sans-serif`,
              fontSize: `${props.fontSize}px`,
              fontWeight: props.fontWeight || 'bold',
              letterSpacing: `${props.letterSpacing}px`,
              color: fillColor,
              WebkitTextStroke: `${strokeWidthDynamic}px ${strokeColor}`,
              textShadow: shadowStyle,
              opacity,
              willChange: 'opacity',
            }}
          >
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
