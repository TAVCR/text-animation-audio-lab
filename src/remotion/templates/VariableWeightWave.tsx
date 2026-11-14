import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { sanitizeSpeedMultiplier } from '@/lib/videoConfig';
import type { AnimationProps } from '@/lib/AnimationContext';

export const VariableWeightWave: React.FC<AnimationProps> = (props) => {
  const count = Math.max(1, props.text.length);
  const cycle = Math.max(1, props.variableWeightCycleSeconds ?? 2.4);
  const { fps } = useVideoConfig();
  const elapsed = useCurrentFrame() * sanitizeSpeedMultiplier(props.speed) / fps;
  const phase = ((elapsed / cycle) % 1 + 1) % 1;
  const center = phase * (count + 6) - 3;
  const width = Math.max(1, props.variableWeightWaveWidth ?? 3);
  return <div style={{ width: '100%', textAlign: 'center', fontFamily: `"${props.fontFamily}", sans-serif`, fontSize: props.fontSize, color: props.color, lineHeight: props.lineHeight }}>{Array.from(props.text).map((char, index) => { const influence = Math.exp(-0.5 * ((index - center) / width) ** 2); const weight = Math.round((props.variableWeightBaseWeight ?? 400) + ((props.variableWeightPeakWeight ?? 850) - (props.variableWeightBaseWeight ?? 400)) * influence); return <span key={`${char}-${index}`} style={{ display: 'inline-block', fontVariationSettings: `'wght' ${weight}` }}>{char}</span>; })}</div>;
};
