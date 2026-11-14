import React from 'react';
import { AbsoluteFill, OffthreadVideo, useCurrentFrame, useVideoConfig } from 'remotion';
import type { SubtitleCue, SubtitleStyle } from '@/lib/subtitles/types';

export type CaptionedVideoProps = { src: string; cues: SubtitleCue[]; style?: Partial<SubtitleStyle> };

export const CaptionedVideo: React.FC<CaptionedVideoProps> = ({ src, cues, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps;
  const cue = cues.find((item) => seconds >= item.start && seconds < item.end);
  return <AbsoluteFill><OffthreadVideo src={src} /><div style={{ position: 'absolute', left: '5%', right: '5%', top: `${style?.positionY ?? 88}%`, transform: 'translateY(-50%)', textAlign: 'center', fontFamily: style?.fontFamily ?? 'Arial', fontSize: style?.fontSize ?? 48, color: style?.color ?? '#fff', textShadow: '0 2px 4px #000', whiteSpace: 'pre-wrap' }}>{cue?.text ?? ''}</div></AbsoluteFill>;
};
