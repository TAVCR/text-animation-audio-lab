import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimationProps } from '@/lib/AnimationContext';

export const MasterMotionLayer: React.FC<Pick<
  AnimationProps,
  'motionPhase' | 'reverseOutAnimation' | 'easingStyle' | 'textPositionX' | 'textPositionY' | 'startZ' | 'endZ'
> & { children: React.ReactNode }> = ({
  children,
  textPositionX,
  textPositionY,
  startZ,
  endZ,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const offsetX = Number.isFinite(textPositionX) ? textPositionX : 0;
  const offsetY = Number.isFinite(textPositionY) ? textPositionY : 0;
  const safeStartZ = Number.isFinite(startZ) ? startZ : 0;
  const safeEndZ = Number.isFinite(endZ) ? endZ : 0;
  const currentZ = interpolate(frame, [0, durationInFrames], [safeStartZ, safeEndZ], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translate3d(${offsetX}%, ${offsetY}%, ${currentZ}px)`,
        willChange: 'transform, opacity',
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
