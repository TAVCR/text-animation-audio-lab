import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { sanitizeSpeedMultiplier } from '@/lib/videoConfig';
import type { AnimationProps } from '@/lib/AnimationContext';
import { getInkStampCoverage, getInkStampDepthProgress, getInkStampDepthZ, getInkStampProgress, getInkStampScale, getInkStampStartsFromFront } from './inkStampUtils';

const grain = (text: string, seed: string, roughness: number): string => {
  let hash = 0;
  for (const char of `${seed}:${text}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  const alpha = Math.min(0.8, 0.08 + roughness * 0.24);
  const width = Math.max(1, Math.round(1 + roughness * 3));
  return `repeating-linear-gradient(${hash % 180}deg, transparent 0 ${width}px, rgba(255,255,255,${alpha}) ${width}px ${width + 1}px, transparent ${width + 1}px ${width + 4}px)`;
};

export const InkStampPrint: React.FC<AnimationProps> = (props) => {
  const frame = useCurrentFrame() * sanitizeSpeedMultiplier(props.speed);
  const { fps } = useVideoConfig();
  const progress = getInkStampProgress(frame, props.inkStampFrames ?? 6);
  const text = props.text || '';
  const intensity = Math.min(6, Math.max(0, props.inkStampPressure ?? 1.5));
  const coverage = Math.min(1, Math.max(0, props.inkStampCoverage ?? 0.9));
  const roughness = Math.min(3, Math.max(0, props.inkStampRoughness ?? 0.35));
  const initialAngle = Math.min(90, Math.max(0, props.inkStampInitialAngle ?? 18));
  const startScale = Math.min(6, Math.max(0.05, props.inkStampStartScale ?? 0.45));
  const endScale = Math.min(6, Math.max(0.05, props.inkStampEndScale ?? 1));
  const fromFront = getInkStampStartsFromFront(startScale, endScale);
  const scale = getInkStampScale(progress, startScale, endScale, fromFront);
  const floatAmplitude = Math.max(0, props.inkStampFloatAmplitude ?? props.inkStampFloatAmplitudePx ?? 24);
  const floatSpeed = Math.max(0, props.inkStampFloatSpeed ?? 1);
  const floatY = progress >= 1 ? floatAmplitude * Math.sin((frame - (props.inkStampFrames ?? 6)) / fps * floatSpeed * Math.PI / 2) : 0;
  const depthProgress = getInkStampDepthProgress(progress, fromFront);
  const depthZ = getInkStampDepthZ(progress, intensity, fromFront);
  const visualProgress = depthProgress;
  const depthBlur = (1 - visualProgress) * intensity * 3;
  const inkColor = props.inkStampColor ?? '#ff593c';
  const fillColor = props.enableFill === false ? 'transparent' : inkColor;
  const stroke = props.enableBorder ? `${Math.max(1, Math.round(props.borderWidth ?? intensity * 1.5))}px ${props.borderColor ?? inkColor}` : 'none';
  const shadow = props.enableShadow ? `0 0 ${props.shadowBlur ?? Math.round(2 + intensity * 5 + roughness * 2)}px ${props.shadowColor ?? '#000000'}` : 'none';
  return <div style={{ width: '100%', perspective: '2800px', transformStyle: 'preserve-3d' }}><div style={{ width: '100%', textAlign: 'center', fontFamily: `"${props.fontFamily}", sans-serif`, fontSize: props.fontSize, fontWeight: props.fontWeight, color: fillColor, opacity: getInkStampCoverage(visualProgress * (1.1 + intensity * 0.65), coverage), filter: `blur(${depthBlur}px)`, transform: `translateY(${floatY}px) translateZ(${depthZ}px) scale(${scale}) rotate(${(1 - progress) * initialAngle}deg)`, textShadow: shadow, WebkitTextStroke: stroke, backgroundImage: props.enableFill === false ? 'none' : grain(text, props.inkStampSeed ?? 'ink-stamp-print-1', roughness), WebkitBackgroundClip: props.enableFill === false ? 'initial' : 'text', backgroundClip: props.enableFill === false ? 'initial' : 'text' }}>{text}</div></div>;
};
