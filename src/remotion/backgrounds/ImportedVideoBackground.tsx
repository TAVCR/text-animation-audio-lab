import React from 'react';
import { AbsoluteFill, Video, staticFile } from 'remotion';
import type { ParticlePreset } from '@/lib/AnimationContext';

const VIDEO_SOURCES: Partial<Record<ParticlePreset, { horizontal: string; vertical: string }>> = {
  'imported-video-1': { horizontal: 'FONDO VIDEO 1.mp4', vertical: 'FONDO VIDEO 1 VERT.mp4' },
  'imported-video-2': { horizontal: 'FONDO VIDEO 2.mp4', vertical: 'FONDO VIDEO 2 VERT.mp4' },
  'imported-video-3': { horizontal: 'FONDO VIDEO 3.mp4', vertical: 'FONDO VIDEO 3 VERT.mp4' },
  'imported-video-4': { horizontal: 'FONDO VIDEO 4.mp4', vertical: 'FONDO VIDEO 4 VERT.mp4' },
  'imported-video-5': { horizontal: 'AI CHIP SEEDANCE 2.5 GENERATIVE HORIZ.mp4', vertical: 'AI CHIP SEEDANCE 2.5 GENERATIVE HORIZ.mp4' },
  'imported-video-6': { horizontal: 'AI CHIP SEEDANCE 2.5 GENERATIVE VERT.mp4', vertical: 'AI CHIP SEEDANCE 2.5 GENERATIVE VERT.mp4' },
};

type ImportedVideoBackgroundProps = {
  preset: ParticlePreset;
  width: number;
  height: number;
};

export const isImportedVideoPreset = (preset: ParticlePreset): boolean => preset in VIDEO_SOURCES;

export const ImportedVideoBackground: React.FC<ImportedVideoBackgroundProps> = ({ preset, width, height }) => {
  const source = VIDEO_SOURCES[preset];
  if (!source) return null;
  const fileName = width >= height ? source.horizontal : source.vertical;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden', backgroundColor: '#000' }}>
      <Video
        src={staticFile(`backgrounds/video-imports/${fileName}`)}
        muted
        loop
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </AbsoluteFill>
  );
};
