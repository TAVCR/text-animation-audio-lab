import React from 'react';
import { interpolate, useVideoConfig } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const SmoothSlidingText: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { width } = useVideoConfig();

  const lines = React.useMemo(() => (props.text ?? '').split('\n').map((line) => line.match(/\S+/g) ?? []), [props.text]);
  const wordRanges = React.useMemo(
    () =>
      Array.from((props.text ?? '').matchAll(/\S+/g)).map((match) => {
        const start = match.index ?? 0;
        const text = match[0];
        return { start, end: start + text.length };
      }),
    [props.text]
  );
  const getRangesForWord = React.useCallback(
    (wordStart: number, wordEnd: number) =>
      (props.textRangeStyles ?? [])
        .filter((style) => style.end > wordStart && style.start < wordEnd)
        .map((style) => ({
          ...style,
          start: Math.max(0, style.start - wordStart),
          end: Math.min(wordEnd - wordStart, style.end - wordStart),
        }))
        .filter((style) => style.end > style.start),
    [props.textRangeStyles]
  );
  let globalWordIndex = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: `"${props.fontFamily}", sans-serif`, fontWeight: props.fontWeight || 'bold', textAlign: 'center', lineHeight: props.lineHeight || 1.2 }}>
      {lines.map((words, lineIndex) => {
        return (
          <div key={lineIndex} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `${props.fontSize * 0.3}px`, overflow: 'hidden' }}>
            {words.map((word, wordIndex) => {
              const currentWordIndex = globalWordIndex;
              const delay = currentWordIndex * 3;
              const wordRange = wordRanges[currentWordIndex];
              const scopedRanges = wordRange
                ? getRangesForWord(wordRange.start, wordRange.end)
                : [];
              globalWordIndex += 1;
              
              const localFrame = Math.max(0, frame - delay);
              const progress = interpolate(localFrame, [0, 20], [0, 1], {
                extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
                easing: getEasing(props.easingStyle)
              });

              const verticalDistance = props.fontSize;
              const horizontalDistance = Math.max(props.fontSize * 2, width * 0.18);

              let startX = 0;
              let startY = verticalDistance;
              switch (props.smoothCascadeDirection) {
                case 'top-down':
                  startY = -verticalDistance;
                  break;
                case 'left-right':
                  startY = 0;
                  startX = -horizontalDistance;
                  break;
                case 'right-left':
                  startY = 0;
                  startX = horizontalDistance;
                  break;
                case 'bottom-up':
                default:
                  startY = verticalDistance;
                  break;
              }

              const translateX = interpolate(progress, [0, 1], [startX, 0]);
              const translateY = interpolate(progress, [0, 1], [startY, 0]);
              const opacity = interpolate(progress, [0, 0.4, 1], [0, 1, 1]);

              return (
                <span key={`${lineIndex}-${wordIndex}-${currentWordIndex}`} style={{
                  fontSize: `${props.fontSize}px`, letterSpacing: `${props.letterSpacing}px`,
                  color: props.enableFill ? props.color : 'transparent',
                  WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
                  textShadow: props.enableShadow && props.shadowBlur > 0 ? `0px 0px ${props.shadowBlur}px ${props.shadowColor}` : 'none',
                  transform: `translate3d(${translateX}px, ${translateY}px, 0)`, display: 'inline-block',
                  opacity: opacity,
                  willChange: 'transform, opacity',
                }}>
                  <StyledRangeText
                    text={word}
                    props={{ ...props, textRangeStyles: scopedRanges }}
                  />
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
