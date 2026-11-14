import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimationProps } from '@/lib/AnimationContext';
import { getPaperCutoutPiece } from './paperCutoutUtils';

export const PaperCutoutAssemble: React.FC<AnimationProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = props.text.trim() ? props.text.trim().split(/\s+/) : [];
  return <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, fontFamily: `"${props.fontFamily}", sans-serif`, fontSize: props.fontSize, fontWeight: props.fontWeight, color: props.color }}>
    {words.map((word, index) => { const piece = getPaperCutoutPiece(index, Math.max(0, frame - index * (props.paperCutoutWordDelayFrames ?? 4)) * (props.speed || 1), props.paperCutoutSettleFrames ?? 12, props.paperCutoutSeed ?? 'paper-cutout-assemble-1', props.paperCutoutFloatAmplitudePx ?? 48, props.paperCutoutFloatSpeed ?? 1, fps); return <span key={`${word}-${index}`} style={{ display: 'inline-block', padding: props.paperCutoutPaddingPx ?? 12, backgroundColor: props.paperCutoutColor ?? '#fff1cf', transform: `translateY(calc(${piece.y}em + ${piece.floatY}px)) rotate(${piece.rotation}deg)`, boxShadow: `0 0 12px rgba(0,0,0,${props.paperCutoutShadowOpacity ?? 0.18})`, color: props.paperCutoutInkColor ?? '#202020' }}>{word}</span>; })}
  </div>;
};
