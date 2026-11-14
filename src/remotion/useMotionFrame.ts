import { useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimationProps } from '@/lib/AnimationContext';

const clampNumber = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

type MotionProps = Pick<AnimationProps, 'motionPhase' | 'reverseOutAnimation'>;

export const mapMotionFrame = (
  baseFrame: number,
  durationInFrames: number,
  { motionPhase, reverseOutAnimation }: MotionProps
): number => {
  const lastFrame = Math.max(1, durationInFrames - 1);
  const clampedFrame = clampNumber(baseFrame, 0, lastFrame);

  if (motionPhase === 'in') {
    return clampedFrame;
  }

  if (motionPhase === 'out') {
    return reverseOutAnimation ? lastFrame - clampedFrame : clampedFrame;
  }

  const splitFrame = Math.max(1, Math.floor(lastFrame / 2));

  if (clampedFrame <= splitFrame) {
    const progressIn = splitFrame <= 1 ? 1 : clampedFrame / splitFrame;
    return progressIn * lastFrame;
  }

  const outDenominator = Math.max(1, lastFrame - splitFrame);
  const progressOut = (clampedFrame - splitFrame) / outDenominator;

  return reverseOutAnimation ? (1 - progressOut) * lastFrame : progressOut * lastFrame;
};

export const useMotionFrame = (props: MotionProps): number => {
  const baseFrame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return mapMotionFrame(baseFrame, durationInFrames, props);
};
