import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimationProps } from '@/lib/AnimationContext';
import { getWordHighlightIndex } from './wordHighlightUtils';

export const WordHighlightTracker: React.FC<AnimationProps> = (props) => {
  const frame = useCurrentFrame() * (props.speed || 1);
  const { fps } = useVideoConfig();
  const words = props.text.trim() ? props.text.trim().split(/\s+/) : [];
  const activeIndex = getWordHighlightIndex(frame, words.length, props.wordHighlightSeconds ?? 0.4, fps);
  return <div style={{ width: '100%', textAlign: 'center', color: props.color, fontFamily: `"${props.fontFamily}", sans-serif`, fontSize: props.fontSize, fontWeight: props.fontWeight, lineHeight: props.lineHeight }}>{words.map((word, index) => <span key={`${word}-${index}`} style={{ display: 'inline-block', margin: '0 0.12em', padding: `${props.wordHighlightPaddingPx ?? 8}px`, borderRadius: props.wordHighlightCornerRadiusPx ?? 12, backgroundColor: index === activeIndex ? (props.wordHighlightColor ?? '#d7ff3f') : 'transparent', color: index === activeIndex ? (props.wordHighlightActiveTextColor ?? '#111111') : (props.wordHighlightInactiveTextColor ?? props.color) }}>{word}</span>)}</div>;
};
