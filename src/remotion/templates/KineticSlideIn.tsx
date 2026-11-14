import React from 'react';
import { useVideoConfig, spring, interpolate } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const KineticSlideIn: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { fps, width, height } = useVideoConfig();
  const easing = getEasing(props.easingStyle);

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: `"${props.fontFamily}", sans-serif`,
        fontWeight: props.fontWeight || 'bold',
        textAlign: 'center',
        lineHeight: props.lineHeight || 1.2,
      }}
    >
      {lines.map((words, lineIndex) => {
        return (
          <div key={lineIndex} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `${props.fontSize * 0.3}px` }}>
            {words.map((word, wordIndex) => {
              const currentWordIndex = globalWordIndex;
              const delay = currentWordIndex * 4;
              const wordRange = wordRanges[currentWordIndex];
              const scopedRanges = wordRange
                ? getRangesForWord(wordRange.start, wordRange.end)
                : [];
              globalWordIndex += 1;
              
              const ySpringRaw = spring({
                fps,
                frame: frame - delay,
                config: { damping: 12, mass: 0.5, stiffness: 100 },
                durationInFrames: 30,
              });
              const ySpring = interpolate(ySpringRaw, [0, 1], [0, 1], {
                easing,
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              
              const distanceY = height / 3;
              const distanceX = width / 3;
              let xPath = 0;
              let yPath = 0;

              switch (props.slideDirection) {
                case 'top': yPath = -distanceY; break;
                case 'left': xPath = -distanceX; break;
                case 'right': xPath = distanceX; break;
                case 'bottom':
                default: yPath = distanceY; break;
              }

              const offsetX = (1 - ySpring) * xPath;
              const offsetY = (1 - ySpring) * yPath;
              
              const opacityRaw = spring({
                 fps,
                 frame: frame - delay,
                 config: { damping: 100, stiffness: 200 }
              });
              const opacity = interpolate(opacityRaw, [0, 1], [0, 1], {
                easing,
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });

              return (
                <span
                  key={`${lineIndex}-${wordIndex}-${currentWordIndex}`}
                  style={{
                    fontSize: `${props.fontSize}px`,
      letterSpacing: `${props.letterSpacing}px`,
                    color: props.enableFill ? props.color : 'transparent',
                    WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
                    textShadow: props.enableShadow && props.shadowBlur > 0 ? `0px 0px ${props.shadowBlur}px ${props.shadowColor}` : 'none',
                    transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`,
                    opacity: opacity,
                    display: 'inline-block',
                    willChange: 'transform, opacity',
                  }}
                >
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
