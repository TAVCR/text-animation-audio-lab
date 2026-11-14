import React from 'react';
import type { AnimationProps, TextRangeStyle } from '@/lib/AnimationContext';

type StyledRangeTextProps = {
  text: string;
  props: AnimationProps;
};

type NormalizedRange = TextRangeStyle & {
  start: number;
  end: number;
};

type GradientStrokeParts = {
  outer: React.CSSProperties;
  inner: React.CSSProperties;
};

const clampStrokeWidth = (value: number | undefined, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(20, value));
};

const clampGlowOpacity = (value: number | undefined): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

const getStyleForIndex = (styles: TextRangeStyle[], index: number): TextRangeStyle | null => {
  for (let i = styles.length - 1; i >= 0; i -= 1) {
    const style = styles[i];
    if (index >= style.start && index < style.end) return style;
  }
  return null;
};

const normalizeRanges = (styles: TextRangeStyle[], textLength: number): NormalizedRange[] => {
  if (textLength <= 0) return [];
  return styles
    .map((style) => {
      const safeStart = Math.max(0, Math.min(textLength, Math.floor(style.start)));
      const safeEnd = Math.max(0, Math.min(textLength, Math.floor(style.end)));
      return {
        ...style,
        start: Math.min(safeStart, safeEnd),
        end: Math.max(safeStart, safeEnd),
      };
    })
    .filter((style) => style.end > style.start);
};

const buildTextShadow = (rangeStyle: TextRangeStyle): string | undefined => {
  const glowOpacity = clampGlowOpacity(rangeStyle.glowOpacity);
  const glowBlur = rangeStyle.glowBlur ?? 0;
  if (!rangeStyle.glowColor || glowBlur <= 0 || glowOpacity <= 0) return undefined;
  return `0 0 ${Math.max(0, glowBlur)}px ${rangeStyle.glowColor}${Math.round(glowOpacity * 255)
    .toString(16)
    .padStart(2, '0')}`;
};

const buildCharStyle = (rangeStyle: TextRangeStyle | null): React.CSSProperties | undefined => {
  if (!rangeStyle) return undefined;

  const strokeWidth = clampStrokeWidth(rangeStyle.strokeWidth, 3);
  const strokeColor = rangeStyle.strokeColor ?? '#66ccff';
  const fillColor = rangeStyle.fillColor ?? '#ffffff';
  const glowShadow = buildTextShadow(rangeStyle);
  const typographyStyle: React.CSSProperties = {
    fontFamily: rangeStyle.fontFamily ? `"${rangeStyle.fontFamily}", sans-serif` : undefined,
    fontSize: typeof rangeStyle.fontSize === 'number' ? `${rangeStyle.fontSize}px` : undefined,
    fontWeight: rangeStyle.fontWeight,
    fontStyle: rangeStyle.fontStyle,
    textDecoration: rangeStyle.textDecoration,
    letterSpacing: typeof rangeStyle.letterSpacing === 'number' ? `${rangeStyle.letterSpacing}px` : undefined,
    lineHeight: rangeStyle.lineHeight,
    opacity: typeof rangeStyle.opacity === 'number' ? Math.max(0, Math.min(1, rangeStyle.opacity)) : undefined,
  };

  switch (rangeStyle.mode) {
    case 'fill':
      return {
        ...typographyStyle,
        color: fillColor,
        WebkitTextStroke: '0px transparent',
        textShadow: glowShadow,
      };
    case 'fill-gradient': {
      const start = rangeStyle.strokeGradientStart ?? '#00e5ff';
      const end = rangeStyle.strokeGradientEnd ?? '#ff4fd8';
      return {
        ...typographyStyle,
        color: 'transparent',
        backgroundImage: `linear-gradient(180deg, ${start} 0%, ${end} 100%)`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        WebkitTextStroke: '0px transparent',
        textShadow: glowShadow,
      };
    }
    case 'fill-stroke':
      return {
        ...typographyStyle,
        color: fillColor,
        WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
        textShadow: glowShadow,
      };
    case 'stroke':
      return {
        ...typographyStyle,
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
        textShadow: glowShadow,
      };
    case 'stroke-gradient': {
      return {
        ...typographyStyle,
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        WebkitTextStroke: `${strokeWidth}px ${rangeStyle.strokeGradientStart ?? '#00e5ff'}`,
        textShadow: glowShadow,
      };
    }
    default:
      return undefined;
  }
};

const buildGradientStrokeParts = (rangeStyle: TextRangeStyle): GradientStrokeParts => {
  const strokeWidth = clampStrokeWidth(rangeStyle.strokeWidth, 3);
  const start = rangeStyle.strokeGradientStart ?? '#00e5ff';
  const end = rangeStyle.strokeGradientEnd ?? '#ff4fd8';
  const glowShadow = buildTextShadow(rangeStyle);
  const typographyStyle: React.CSSProperties = {
    fontFamily: rangeStyle.fontFamily ? `"${rangeStyle.fontFamily}", sans-serif` : undefined,
    fontSize: typeof rangeStyle.fontSize === 'number' ? `${rangeStyle.fontSize}px` : undefined,
    fontWeight: rangeStyle.fontWeight,
    fontStyle: rangeStyle.fontStyle,
    textDecoration: rangeStyle.textDecoration,
    letterSpacing: typeof rangeStyle.letterSpacing === 'number' ? `${rangeStyle.letterSpacing}px` : undefined,
    lineHeight: rangeStyle.lineHeight,
    opacity: typeof rangeStyle.opacity === 'number' ? Math.max(0, Math.min(1, rangeStyle.opacity)) : undefined,
  };

  return {
    outer: {
      ...typographyStyle,
      position: 'relative',
      display: 'inline-block',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
      WebkitTextStroke: `${strokeWidth}px ${start}`,
      textShadow: glowShadow,
    },
    inner: {
      ...typographyStyle,
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
      WebkitTextStroke: `${strokeWidth}px ${end}`,
      // Smoothly blend lower color into upper stroke instead of a hard 50/50 split.
      WebkitMaskImage:
        'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,1) 82%)',
      maskImage:
        'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,1) 82%)',
    },
  };
};

export const StyledRangeText: React.FC<StyledRangeTextProps> = ({ text, props }) => {
  const source = text ?? '';
  const chars = Array.from(source);
  const styles = normalizeRanges(props.textRangeStyles ?? [], chars.length);
  if (source.length === 0) return null;
  if (styles.length === 0) return <>{source}</>;

  return (
    <>
      {chars.map((char, index) => {
        if (char === '\n') return <br key={`char-${index}`} />;
        const rangeStyle = getStyleForIndex(styles, index);
        if (rangeStyle?.mode === 'stroke-gradient') {
          const parts = buildGradientStrokeParts(rangeStyle);
          return (
            <span key={`char-${index}`} style={parts.outer} aria-hidden={false}>
              {char}
              <span style={parts.inner}>{char}</span>
            </span>
          );
        }
        const charStyle = buildCharStyle(rangeStyle);
        return (
          <span key={`char-${index}`} style={charStyle}>
            {char}
          </span>
        );
      })}
    </>
  );
};
