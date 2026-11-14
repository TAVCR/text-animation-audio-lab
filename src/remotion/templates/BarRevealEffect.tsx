import React from 'react';
import { useVideoConfig, interpolate } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';
export const BarRevealEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { durationInFrames } = useVideoConfig();
  const easing = getEasing(props.easingStyle);

  // Phase timing
  const phase1End = durationInFrames * 0.38;   // Bar sweeps right, reveals Word 1
  const pauseEnd  = durationInFrames * 0.50;   // Bar holds
  const phase2End = durationInFrames * 0.88;   // Bar sweeps left, reveals Word 2

  // Single progress variable: 0 → 1 (sweep right), hold at 1, 1 → 0 (sweep left), hold at 0
  let progress = 0;
  if (frame <= phase1End) {
    progress = interpolate(frame, [0, phase1End], [0, 1], {
      easing,
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
  } else if (frame <= pauseEnd) {
    progress = 1;
  } else if (frame <= phase2End) {
    progress = interpolate(frame, [pauseEnd, phase2End], [1, 0], {
      easing,
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    });
  } else {
    progress = 0;
  }

  // barPos 0–100% for clip paths (exact text boundary)
  const barPos = progress * 100;

  // Small visual over-travel so start/end are not too tight to the text.
  const edgeOvertravel = 1.8;
  const barVisualPos = interpolate(progress, [0, 1], [-edgeOvertravel, 100 + edgeOvertravel], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Word 1: visible only to the LEFT of the bar
  const w1Clip = `inset(0 ${100 - barPos}% 0 0)`;
  // Word 2: visible only to the RIGHT of the bar  
  const w2Clip = `inset(0 0 0 ${barPos}%)`;

  const barWidth = props.borderWidth > 0 ? props.borderWidth : 4;
  const barTransform = 'translate3d(-50%, 0, 0)';
  const dominantFontSize = Math.max(props.fontSize || 1, props.fontSizeTwo || 1);
  const wordTwoGradient = (props.textRangeStyles ?? []).find((style) => style.id === 'word-gradient-2');
  const wordTwoGradientStart = wordTwoGradient?.strokeGradientStart ?? '';
  const wordTwoGradientEnd = wordTwoGradient?.strokeGradientEnd ?? '';
  const isWordTwoFillGradient = Boolean(
    wordTwoGradient?.mode === 'fill-gradient' &&
      wordTwoGradientStart &&
      wordTwoGradientEnd
  );
  const isWordTwoStrokeGradient = Boolean(
    wordTwoGradient?.mode === 'stroke-gradient' &&
      wordTwoGradientStart &&
      wordTwoGradientEnd
  );
  const wordTwoStrokeWidth = Math.max(
    1,
    Number.isFinite(props.borderWidthTwo) ? props.borderWidthTwo : Number.isFinite(props.borderWidth) ? props.borderWidth : 3
  );

  const textLayer: React.CSSProperties = {
    gridArea: '1 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    height: '100%',
    whiteSpace: 'pre-wrap',
    textAlign: 'left',
    willChange: 'clip-path, opacity',
  };

  const wordOneStyle: React.CSSProperties = {
    fontFamily: `"${props.fontFamily}", sans-serif`,
    fontSize: `${props.fontSize}px`,
    fontWeight: props.fontWeight || 'bold',
    letterSpacing: `${props.letterSpacing}px`,
    lineHeight: props.lineHeight || 1.2,
    color: props.enableFill ? props.color : 'transparent',
    WebkitTextStroke: props.enableBorder ? `${props.borderWidth}px ${props.borderColor}` : '0px transparent',
    textShadow: props.enableShadow && props.shadowBlur > 0 ? `0px 0px ${props.shadowBlur}px ${props.shadowColor}` : 'none',
  };

  const wordTwoStyle: React.CSSProperties = {
    position: 'relative',
    fontFamily: `"${props.fontFamilyTwo || props.fontFamily}", sans-serif`,
    fontSize: `${props.fontSizeTwo || props.fontSize}px`,
    fontWeight: props.fontWeightTwo || props.fontWeight || 'bold',
    letterSpacing: `${props.letterSpacingTwo ?? props.letterSpacing}px`,
    lineHeight: props.lineHeightTwo ?? props.lineHeight ?? 1.2,
    WebkitTextStroke: isWordTwoStrokeGradient
      ? `${wordTwoStrokeWidth}px ${wordTwoGradientStart}`
      : props.enableBorderTwo
      ? `${props.borderWidthTwo}px ${props.borderColorTwo}`
      : props.enableBorder
      ? `${props.borderWidth}px ${props.borderColor}`
      : '0px transparent',
    backgroundImage:
      isWordTwoFillGradient
        ? `linear-gradient(180deg, ${wordTwoGradientStart} 0%, ${wordTwoGradientEnd} 100%)`
        : 'none',
    WebkitBackgroundClip:
      isWordTwoFillGradient ? 'text' : 'border-box',
    backgroundClip:
      isWordTwoFillGradient ? 'text' : 'border-box',
    WebkitTextFillColor: isWordTwoStrokeGradient ? 'transparent' : undefined,
    color:
      isWordTwoFillGradient || isWordTwoStrokeGradient
        ? 'transparent'
        : props.enableFillTwo
        ? (props.colorTwo || props.color)
        : 'transparent',
    textShadow: props.enableShadowTwo && props.shadowBlurTwo > 0
      ? `0px 0px ${props.shadowBlurTwo}px ${props.shadowColorTwo}`
      : props.enableShadow && props.shadowBlur > 0
      ? `0px 0px ${props.shadowBlur}px ${props.shadowColor}`
      : 'none',
  };

  const wordTwoContent = (
    <>
      {props.wordTwo}
      {isWordTwoStrokeGradient ? (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
            WebkitTextStroke: `${wordTwoStrokeWidth}px ${wordTwoGradientEnd}`,
            WebkitMaskImage:
              'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,1) 82%)',
            maskImage:
              'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,1) 82%)',
          }}
        >
          {props.wordTwo}
        </span>
      ) : null}
    </>
  );

  return (
    // Outer fill — centers the inner text wrapper
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* 📐 INNER WRAPPER — hidden layers keep full box for both text options */}
      <div style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 'max-content' }}>
        <div style={{ ...wordOneStyle, gridArea: '1 / 1', visibility: 'hidden' }}>
          {props.text}
        </div>
        <div style={{ ...wordTwoStyle, gridArea: '1 / 1', visibility: 'hidden' }}>
          {wordTwoContent}
        </div>

        {/* WORD ONE */}
        <div style={{
          ...textLayer,
          ...wordOneStyle,
          clipPath: w1Clip,
          WebkitClipPath: w1Clip,
        }}>
          <StyledRangeText text={props.text} props={props} />
        </div>

        {/* WORD TWO — always in DOM, controlled only by clip */}
        <div style={{
          ...textLayer,
          ...wordTwoStyle,
          clipPath: w2Clip,
          WebkitClipPath: w2Clip,
        }}>
          {wordTwoContent}
        </div>

        {/* THE BAR — always visible, thickness via borderWidth */}
        <div style={{
            position: 'absolute',
            top: `-${dominantFontSize * 0.2}px`,
            bottom: `-${dominantFontSize * 0.2}px`,
            width: `${barWidth}px`,
            left: `${barVisualPos}%`,
            transform: barTransform,
            backgroundColor: props.boxColor || '#ff0055',
            zIndex: 10,
            willChange: 'transform, opacity',
          }} />

      </div>
    </div>
  );
};
