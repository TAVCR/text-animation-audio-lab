import React from 'react';
import { AbsoluteFill, interpolate, useVideoConfig } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { StyledRangeText } from '@/remotion/text/StyledRangeText';

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const parseList = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseTextLines = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseWords = (value: string | undefined): string[] => {
  if (!value) return [];
  return value.match(/\S+/g) ?? [];
};

const parseWordRanges = (value: string | undefined): Array<{ start: number; end: number; word: string }> => {
  if (!value) return [];
  const ranges: Array<{ start: number; end: number; word: string }> = [];
  const regex = /\S+/g;
  let match = regex.exec(value);
  while (match) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
      word: match[0],
    });
    match = regex.exec(value);
  }
  return ranges;
};

const parseDurationList = (value: string | undefined): number[] => {
  return parseList(value)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
};

const isHexColor = (value: string): boolean => /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value);

const fitDurationsToTotal = (requested: number[], totalFrames: number): number[] => {
  if (requested.length === 0) return [];
  if (requested.length === 1) return [Math.max(1, totalFrames)];

  const sum = requested.reduce((acc, value) => acc + value, 0);
  if (sum <= totalFrames) {
    const result = [...requested];
    result[result.length - 1] += totalFrames - sum;
    return result;
  }

  const scaled = requested.map((value) => Math.max(2, Math.floor((value / sum) * totalFrames)));
  let allocated = scaled.reduce((acc, value) => acc + value, 0);

  while (allocated > totalFrames) {
    let changed = false;
    for (let i = scaled.length - 1; i >= 0 && allocated > totalFrames; i -= 1) {
      if (scaled[i] > 2) {
        scaled[i] -= 1;
        allocated -= 1;
        changed = true;
      }
    }
    if (!changed) break;
  }

  if (allocated < totalFrames) {
    scaled[scaled.length - 1] += totalFrames - allocated;
  }

  return scaled;
};

export const KineticBoxSequenceEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { width, durationInFrames, fps } = useVideoConfig();
  const easing = getEasing(props.easingStyle);

  const wordsFromMainText = parseWords(props.text);
  const wordRanges = parseWordRanges(props.text);
  const extraTexts = parseTextLines(props.boxSequenceTextsRaw);
  const fallbackSeed = [
    props.boxSequenceTextTwo || 'MOTION',
    props.boxSequenceTextThree || 'IMPACT',
    props.boxSequenceTextFour || 'STUDIO',
  ].filter((text) => text.trim().length > 0);
  const sourceTexts = wordsFromMainText.length > 0
    ? wordsFromMainText
    : ([props.text || '', ...extraTexts].filter((text) => text.trim().length > 0).length > 0
      ? [props.text || '', ...extraTexts].filter((text) => text.trim().length > 0)
      : fallbackSeed);
  const count = Math.max(1, sourceTexts.length || 1);
  const texts = Array.from({ length: count }, (_, index) => {
    return sourceTexts[index] ?? sourceTexts[sourceTexts.length - 1] ?? `TEXTO ${index + 1}`;
  });

  const durationList = parseDurationList(props.boxSequenceDurationsRaw);
  const fallbackDurations = [
    Math.max(0.15, props.boxSequenceDurationOne || 1),
    Math.max(0.15, props.boxSequenceDurationTwo || props.boxSequenceDurationOne || 1),
    Math.max(0.15, props.boxSequenceDurationThree || props.boxSequenceDurationTwo || props.boxSequenceDurationOne || 1),
    Math.max(0.15, props.boxSequenceDurationFour || props.boxSequenceDurationThree || props.boxSequenceDurationTwo || props.boxSequenceDurationOne || 1),
  ];
  const requestedDurations = Array.from({ length: count }, (_, index) => {
    const seconds = durationList[index] ?? fallbackDurations[index] ?? fallbackDurations[fallbackDurations.length - 1];
    return Math.max(2, Math.round(seconds * fps));
  });

  const rawColors = parseList(props.boxSequenceColorsRaw).filter(isHexColor);
  const fallbackColors = [
    props.boxSequenceColorOne || '#ff0055',
    props.boxSequenceColorTwo || '#00d4ff',
    props.boxSequenceColorThree || '#ffd400',
    props.boxSequenceColorFour || '#8b5cf6',
  ];
  const colors = Array.from({ length: count }, (_, index) => {
    return rawColors[index] ?? fallbackColors[index] ?? fallbackColors[index % fallbackColors.length];
  });

  const rawTextColors = parseList(props.boxSequenceTextColorsRaw).filter(isHexColor);
  const fallbackTextColors = [
    props.color || '#ffffff',
    props.colorTwo || props.color || '#ffffff',
    props.colorThree || props.color || '#ffffff',
  ];
  const textColors = Array.from({ length: count }, (_, index) => {
    return rawTextColors[index]
      ?? fallbackTextColors[index]
      ?? fallbackTextColors[index % fallbackTextColors.length]
      ?? '#ffffff';
  });

  const rawFontFamilies = parseList(props.boxSequenceFontFamiliesRaw);
  const fallbackFontFamilies = [
    props.fontFamily || 'Poppins',
    props.fontFamilyTwo || props.fontFamily || 'Poppins',
    props.fontFamilyThree || props.fontFamily || 'Poppins',
  ];
  const fontFamilies = Array.from({ length: count }, (_, index) => {
    return rawFontFamilies[index]
      ?? fallbackFontFamilies[index]
      ?? fallbackFontFamilies[index % fallbackFontFamilies.length]
      ?? 'Poppins';
  });

  const rawFontWeights = parseList(props.boxSequenceFontWeightsRaw);
  const fallbackFontWeights = [
    props.fontWeight || '700',
    props.fontWeightTwo || props.fontWeight || '700',
    props.fontWeightThree || props.fontWeight || '700',
  ];
  const fontWeights = Array.from({ length: count }, (_, index) => {
    return rawFontWeights[index]
      ?? fallbackFontWeights[index]
      ?? fallbackFontWeights[index % fallbackFontWeights.length]
      ?? '700';
  });

  const rawFontSizes = parseList(props.boxSequenceFontSizesRaw)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
  const fallbackFontSizes = [
    Math.max(8, props.fontSize || 120),
    Math.max(8, props.fontSizeTwo || props.fontSize || 120),
    Math.max(8, props.fontSizeThree || props.fontSize || 120),
  ];
  const fontSizes = Array.from({ length: count }, (_, index) => {
    return rawFontSizes[index]
      ?? fallbackFontSizes[index]
      ?? fallbackFontSizes[index % fallbackFontSizes.length]
      ?? 120;
  });

  const fallbackFillEnabled = [
    props.enableFill,
    props.enableFillTwo,
    props.enableFillThree,
  ];
  const fillEnabled = Array.from({ length: count }, (_, index) => {
    return fallbackFillEnabled[index]
      ?? fallbackFillEnabled[index % fallbackFillEnabled.length]
      ?? props.enableFill;
  });

  const fallbackBorderEnabled = [
    props.enableBorder,
    props.enableBorderTwo,
    props.enableBorderThree,
  ];
  const borderEnabled = Array.from({ length: count }, (_, index) => {
    return fallbackBorderEnabled[index]
      ?? fallbackBorderEnabled[index % fallbackBorderEnabled.length]
      ?? props.enableBorder;
  });

  const fallbackBorderColors = [
    props.borderColor || '#000000',
    props.borderColorTwo || props.borderColor || '#000000',
    props.borderColorThree || props.borderColor || '#000000',
  ];
  const borderColors = Array.from({ length: count }, (_, index) => {
    return fallbackBorderColors[index]
      ?? fallbackBorderColors[index % fallbackBorderColors.length]
      ?? '#000000';
  });

  const fallbackBorderWidths = [
    Math.max(0, props.borderWidth || 0),
    Math.max(0, props.borderWidthTwo || props.borderWidth || 0),
    Math.max(0, props.borderWidthThree || props.borderWidth || 0),
  ];
  const borderWidths = Array.from({ length: count }, (_, index) => {
    return fallbackBorderWidths[index]
      ?? fallbackBorderWidths[index % fallbackBorderWidths.length]
      ?? 0;
  });

  const fallbackLetterSpacings = [
    props.letterSpacing || 0,
    props.letterSpacingTwo || props.letterSpacing || 0,
    props.letterSpacingThree || props.letterSpacing || 0,
  ];
  const letterSpacings = Array.from({ length: count }, (_, index) => {
    return fallbackLetterSpacings[index]
      ?? fallbackLetterSpacings[index % fallbackLetterSpacings.length]
      ?? 0;
  });

  const fallbackLineHeights = [
    props.lineHeight || 1.2,
    props.lineHeightTwo || props.lineHeight || 1.2,
    props.lineHeightThree || props.lineHeight || 1.2,
  ];
  const lineHeights = Array.from({ length: count }, (_, index) => {
    return fallbackLineHeights[index]
      ?? fallbackLineHeights[index % fallbackLineHeights.length]
      ?? 1.2;
  });

  const segmentDurations = fitDurationsToTotal(requestedDurations, durationInFrames);

  const segmentEnds: number[] = [];
  segmentDurations.reduce((acc, value) => {
    const next = acc + value;
    segmentEnds.push(next);
    return next;
  }, 0);

  const safeFrame = clamp(frame, 0, Math.max(0, durationInFrames - 1));
  const boxWidth = '100%';
  const travelY = Math.max(72, props.fontSize * 1.15);
  const travelX = Math.max(72, width + 24);
  let entryStartX = 0;
  let entryStartY = travelY;

  switch (props.boxSequenceDirection) {
    case 'from-top':
      entryStartY = -travelY;
      break;
    case 'from-left':
      entryStartX = -travelX;
      entryStartY = 0;
      break;
    case 'from-right':
      entryStartX = travelX;
      entryStartY = 0;
      break;
    case 'from-bottom':
    default:
      entryStartY = travelY;
      break;
  }

  const boxHeight = props.boxSequenceMode === 'bar'
    ? Math.max(28, props.fontSize * 0.95 * (props.boxSequenceHeightScale || 1.25))
    : Math.max(58, props.fontSize * 1.45 * (props.boxSequenceHeightScale || 1.25));
  const horizontalTransitionShift = Math.max(96, Math.min(width * 0.34, 520));
  const verticalTransitionShift = Math.max(44, boxHeight * 0.46);
  let incomingShiftX = 0;
  let incomingShiftY = verticalTransitionShift;
  switch (props.boxSequenceDirection) {
    case 'from-top':
      incomingShiftY = -verticalTransitionShift;
      break;
    case 'from-left':
      incomingShiftX = -horizontalTransitionShift;
      incomingShiftY = 0;
      break;
    case 'from-right':
      incomingShiftX = horizontalTransitionShift;
      incomingShiftY = 0;
      break;
    case 'from-bottom':
    default:
      incomingShiftY = verticalTransitionShift;
      break;
  }
  const outgoingShiftX = -incomingShiftX;
  const outgoingShiftY = -incomingShiftY;
  const boxRadius = clamp(props.boxSequenceBorderRadius || 12, 0, 120);
  const entryFrames = Math.max(2, Math.min(28, Math.floor((segmentDurations[0] || 10) * 0.4)));
  const finalExitFrames = Math.max(6, Math.min(28, Math.floor((segmentDurations[count - 1] || 12) * 0.4)));
  const finalExitStart = Math.max(0, durationInFrames - finalExitFrames);

  let activeIndex = segmentEnds.findIndex((end) => safeFrame < end);
  if (activeIndex < 0) activeIndex = count - 1;

  let transitionIndex = -1;
  let transitionStart = 0;
  let transitionEnd = 0;
  for (let i = 0; i < count - 1; i += 1) {
    const transitionFrames = Math.max(
      6,
      Math.min(24, Math.floor(Math.min(segmentDurations[i], segmentDurations[i + 1]) * 0.32))
    );
    const start = segmentEnds[i] - transitionFrames;
    const end = segmentEnds[i];
    if (safeFrame >= start && safeFrame < end) {
      transitionIndex = i;
      transitionStart = start;
      transitionEnd = end;
      break;
    }
  }

  const inTransition = transitionIndex >= 0;
  const inFinalExit = !inTransition && safeFrame >= finalExitStart;
  const inFirstEntry = !inTransition && !inFinalExit && safeFrame < entryFrames;

  const entryProgress = inFirstEntry
    ? interpolate(safeFrame, [0, entryFrames], [0, 1], {
      easing,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
    : 1;

  const transitionProgress = inTransition
    ? interpolate(safeFrame, [transitionStart, transitionEnd], [0, 1], {
      easing,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
    : 0;

  const finalExitProgress = inFinalExit
    ? interpolate(safeFrame, [finalExitStart, durationInFrames - 1], [0, 1], {
      easing,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
    : 0;
  const finalExitBlur = interpolate(finalExitProgress, [0, 1], [0, 18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const finalExitOpacity = 1 - finalExitProgress;

  let displayIndex = inFirstEntry ? 0 : activeIndex;
  let textTransform = 'translate3d(0, 0, 0)';
  let textOpacity = 1;

  if (inFirstEntry) {
    const offsetX = (1 - entryProgress) * entryStartX;
    const offsetY = (1 - entryProgress) * entryStartY;
    textTransform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
    textOpacity = entryProgress;
  } else if (inTransition) {
    const outgoing = transitionIndex;
    const incoming = transitionIndex + 1;
    const phaseProgress = transitionProgress < 0.5
      ? transitionProgress / 0.5
      : (transitionProgress - 0.5) / 0.5;

    if (transitionProgress < 0.5) {
      displayIndex = outgoing;
      const offsetX = phaseProgress * outgoingShiftX;
      const offsetY = phaseProgress * outgoingShiftY;
      textTransform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
      textOpacity = 1 - phaseProgress;
    } else {
      displayIndex = incoming;
      const offsetX = (1 - phaseProgress) * incomingShiftX;
      const offsetY = (1 - phaseProgress) * incomingShiftY;
      textTransform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
      textOpacity = phaseProgress;
    }
  } else if (inFinalExit) {
    displayIndex = count - 1;
    const offsetX = finalExitProgress * outgoingShiftX;
    const offsetY = finalExitProgress * outgoingShiftY;
    textTransform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
    textOpacity = 1;
  }

  const backgroundIndex = props.boxSequenceUseGradient
    ? 0
    : inTransition
      ? (transitionProgress < 0.5 ? transitionIndex : transitionIndex + 1)
      : (inFirstEntry ? 0 : (inFinalExit ? count - 1 : activeIndex));
  const background = props.boxSequenceUseGradient
    ? `linear-gradient(90deg, ${props.boxSequenceGradientStart}, ${props.boxSequenceGradientEnd})`
    : colors[backgroundIndex];
  const styleIndex = clamp(displayIndex, 0, count - 1);
  const activeFontFamily = fontFamilies[styleIndex] ?? props.fontFamily ?? 'Poppins';
  const activeFontWeight = fontWeights[styleIndex] ?? props.fontWeight ?? '700';
  const activeFontSize = fontSizes[styleIndex] ?? props.fontSize ?? 120;
  const activeTextColor = textColors[styleIndex] ?? props.color ?? '#ffffff';
  const activeLetterSpacing = letterSpacings[styleIndex] ?? props.letterSpacing ?? 0;
  const activeLineHeight = lineHeights[styleIndex] ?? props.lineHeight ?? 1.2;
  const activeFillEnabled = fillEnabled[styleIndex] ?? props.enableFill;
  const activeBorderEnabled = borderEnabled[styleIndex] ?? props.enableBorder;
  const activeBorderColor = borderColors[styleIndex] ?? props.borderColor ?? '#000000';
  const activeBorderWidth = borderWidths[styleIndex] ?? props.borderWidth ?? 0;
  const displayText = texts[displayIndex] || '';
  const activeWordRange = wordsFromMainText.length > 0 ? wordRanges[styleIndex] : undefined;
  const scopedWordStyles = activeWordRange
    ? (props.textRangeStyles ?? [])
      .map((style) => {
        const overlapStart = Math.max(style.start, activeWordRange.start);
        const overlapEnd = Math.min(style.end, activeWordRange.end);
        if (overlapEnd <= overlapStart) return null;
        return {
          ...style,
          start: overlapStart - activeWordRange.start,
          end: overlapEnd - activeWordRange.start,
        };
      })
      .filter(
        (
          style
        ): style is NonNullable<typeof style> => Boolean(style && style.end > style.start)
      )
    : [];

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: boxWidth,
          height: `${boxHeight}px`,
          position: 'relative',
          borderRadius: `${boxRadius}px`,
          background,
          perspective: '1400px',
          transformStyle: 'preserve-3d',
          overflow: 'hidden',
          opacity: finalExitOpacity,
          filter: finalExitBlur > 0 ? `blur(${finalExitBlur.toFixed(2)}px)` : 'none',
          willChange: 'opacity, filter',
          boxShadow: props.enableShadow && props.shadowBlur > 0
            ? `0 0 ${props.shadowBlur}px ${props.shadowColor}`
            : 'none',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: boxWidth,
            padding: '0 20px',
            boxSizing: 'border-box',
            fontFamily: `"${activeFontFamily}", sans-serif`,
            fontWeight: activeFontWeight,
            fontSize: `${activeFontSize}px`,
            letterSpacing: `${activeLetterSpacing}px`,
            lineHeight: activeLineHeight,
            color: activeFillEnabled ? activeTextColor : 'transparent',
            WebkitTextStroke: activeBorderEnabled ? `${activeBorderWidth}px ${activeBorderColor}` : '0px transparent',
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
            transform: `translate3d(-50%, -50%, 0) ${textTransform}`,
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            opacity: textOpacity,
            willChange: 'transform, opacity',
          }}
        >
          {scopedWordStyles.length > 0 ? (
            <StyledRangeText
              text={displayText}
              props={{
                ...props,
                textRangeStyles: scopedWordStyles,
              }}
            />
          ) : (
            displayText
          )}
        </span>
      </div>
    </AbsoluteFill>
  );
};
