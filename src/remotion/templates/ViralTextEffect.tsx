import React from 'react';
import { interpolate } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
export const ViralTextEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const staggerFrames = Math.max(0, Number.isFinite(props.viralWordStagger) ? props.viralWordStagger : 8);
  const calibratedSpeed = interpolate(speed, [0.2, 1, 3], [0.12, 0.38, 1.35], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const frame = baseFrame * calibratedSpeed;
  const easing = getEasing(props.easingStyle);
  const getWordGradient = (wordIndex: 1 | 2 | 3) =>
    (props.textRangeStyles ?? []).find((style) => style.id === `word-gradient-${wordIndex}`);

  const wordsData = [
    {
      word: props.text, 
      font: props.fontFamily,
      weight: props.fontWeight || 'bold',
      size: props.fontSize,
      color: props.enableFill ? props.color : 'transparent',
      borderColor: props.borderColor,
      borderWidth: props.borderWidth,
      enableBorder: props.enableBorder,
      letterSpacing: props.letterSpacing ?? 0,
      lineHeight: props.lineHeight ?? 1.2,
      enableShadow: props.enableShadow,
      shadowColor: props.shadowColor,
      shadowBlur: props.shadowBlur,
      entrySpeed: props.wordSpeedOne ?? 1,
      gradientStart: getWordGradient(1)?.strokeGradientStart,
      gradientEnd: getWordGradient(1)?.strokeGradientEnd,
      gradientMode: getWordGradient(1)?.mode,
    },
  ];

  if (props.showWordTwo) {
    wordsData.push({
      word: props.wordTwo, 
      font: props.fontFamilyTwo || props.fontFamily,
      weight: props.fontWeightTwo || props.fontWeight || 'bold',
      size: props.fontSizeTwo || props.fontSize,
      color: props.enableFillTwo ? (props.colorTwo || props.color) : 'transparent',
      borderColor: props.borderColorTwo || props.borderColor,
      borderWidth: props.borderWidthTwo || props.borderWidth,
      enableBorder: props.enableBorderTwo || props.enableBorder,
      letterSpacing: props.letterSpacingTwo ?? props.letterSpacing,
      lineHeight: props.lineHeightTwo ?? props.lineHeight,
      enableShadow: props.enableShadowTwo,
      shadowColor: props.shadowColorTwo,
      shadowBlur: props.shadowBlurTwo,
      entrySpeed: props.wordSpeedTwo ?? 1,
      gradientStart: getWordGradient(2)?.strokeGradientStart,
      gradientEnd: getWordGradient(2)?.strokeGradientEnd,
      gradientMode: getWordGradient(2)?.mode,
    });
  }

  if (props.showWordThree) {
    wordsData.push({
      word: props.wordThree, 
      font: props.fontFamilyThree || props.fontFamily,
      weight: props.fontWeightThree || props.fontWeight || 'bold',
      size: props.fontSizeThree || props.fontSize,
      color: props.enableFillThree ? (props.colorThree || props.color) : 'transparent',
      borderColor: props.borderColorThree || props.borderColor,
      borderWidth: props.borderWidthThree || props.borderWidth,
      enableBorder: props.enableBorderThree || props.enableBorder,
      letterSpacing: props.letterSpacingThree ?? props.letterSpacing,
      lineHeight: props.lineHeightThree ?? props.lineHeight,
      enableShadow: props.enableShadowThree,
      shadowColor: props.shadowColorThree,
      shadowBlur: props.shadowBlurThree,
      entrySpeed: props.wordSpeedThree ?? 1,
      gradientStart: getWordGradient(3)?.strokeGradientStart,
      gradientEnd: getWordGradient(3)?.strokeGradientEnd,
      gradientMode: getWordGradient(3)?.mode,
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {wordsData.map((item, index) => {
        const delay = index * staggerFrames;
        const entrySpeed = Number.isFinite(item.entrySpeed) ? Math.max(0.2, item.entrySpeed) : 1;
        const localFrame = Math.max(0, frame * entrySpeed - delay);
        const opacityDuration = 26;
        
        const opacity = interpolate(localFrame, [0, opacityDuration], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing
        });

        // Glowing effect via drop-shadow
        const glow = `drop-shadow(0px 0px ${Math.max(0, item.shadowBlur)}px ${item.shadowColor})`;

        const useGradient = Boolean(item.gradientStart && item.gradientEnd);
        const useStrokeGradient = useGradient && item.gradientMode === 'stroke-gradient';
        const strokeGradientWidth = Math.max(1, Number.isFinite(item.borderWidth) ? item.borderWidth : 3);
        return (
          <span key={index} style={{
            display: 'block',
            position: 'relative',
            whiteSpace: 'pre-wrap',
            textAlign: 'center',
            fontFamily: `"${item.font}", sans-serif`,
            fontWeight: item.weight,
            fontSize: `${item.size}px`,
            letterSpacing: `${Number.isFinite(item.letterSpacing) ? item.letterSpacing : 0}px`,
            lineHeight: Number.isFinite(item.lineHeight) ? item.lineHeight : (props.lineHeight ?? 1.2),
            color: useStrokeGradient ? 'transparent' : useGradient ? 'transparent' : item.color,
            WebkitTextFillColor: useStrokeGradient ? 'transparent' : undefined,
            backgroundImage: useGradient && !useStrokeGradient
              ? `linear-gradient(180deg, ${item.gradientStart} 0%, ${item.gradientEnd} 100%)`
              : 'none',
            WebkitBackgroundClip: useGradient && !useStrokeGradient ? 'text' : 'border-box',
            backgroundClip: useGradient && !useStrokeGradient ? 'text' : 'border-box',
            WebkitTextStroke: useStrokeGradient
              ? `${strokeGradientWidth}px ${item.gradientStart}`
              : item.enableBorder
              ? `${item.borderWidth}px ${item.borderColor}`
              : '0px transparent',
            filter: item.enableShadow ? glow : 'none',
            opacity: opacity,
            mixBlendMode: 'normal', // Optionally implement difference
            willChange: 'opacity, filter',
          }}>
            {item.word}
            {useStrokeGradient ? (
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  color: 'transparent',
                  WebkitTextFillColor: 'transparent',
                  WebkitTextStroke: `${strokeGradientWidth}px ${item.gradientEnd}`,
                  WebkitMaskImage:
                    'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,1) 82%)',
                  maskImage:
                    'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,1) 82%)',
                }}
              >
                {item.word}
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
};
