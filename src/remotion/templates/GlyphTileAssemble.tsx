import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { AnimationProps } from '@/lib/AnimationContext';

export const GlyphTileAssemble: React.FC<AnimationProps> = (props) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame() * (props.speed || 1);
  const progress = Math.min(1, Math.max(0, frame / Math.max(1, (props.glyphTileAssemblySeconds ?? 0.8) * fps)));
  const scatter = props.glyphTileScatterPx ?? 100;
  return <div style={{ width: '100%', textAlign: 'center', fontFamily: `"${props.fontFamily}", sans-serif`, fontSize: props.fontSize, fontWeight: props.fontWeight, color: props.color, letterSpacing: props.letterSpacing }}>{Array.from(props.text || '').map((char, index) => <span key={`${char}-${index}`} style={{ display: 'inline-block', minWidth: (props.glyphTileSizePx ?? 20) * 0.45, transform: `translate(${(1 - progress) * ((index % 3) - 1) * scatter}px, ${(1 - progress) * (((index + 1) % 3) - 1) * scatter}px)`, opacity: progress }}>{char}</span>)}</div>;
};
