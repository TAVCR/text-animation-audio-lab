'use client';
import React from 'react';
import type { SubtitleCue, SubtitleStyle } from '@/lib/subtitles/types';
export function SubtitlePreview({ cues, time = 0, style }: { cues: SubtitleCue[]; time?: number; style?: Partial<SubtitleStyle> }) {
  const cue = cues.find((item) => time >= item.start && time < item.end);
  return <div aria-label="Previsualización de subtítulos" style={{ fontFamily: style?.fontFamily ?? 'Arial', fontSize: style?.fontSize ?? 32, color: style?.color ?? '#fff', textAlign: 'center', textShadow: '0 2px 4px #000' }}>{cue?.text ?? ''}</div>;
}
