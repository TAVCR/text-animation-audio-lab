export type StillExportRequest = {
  frame: number;
  transparent: true;
};

export const normalizeStillFrame = (frame: number, durationInFrames: number): number => {
  const lastFrame = Math.max(0, Math.floor(durationInFrames) - 1);
  if (!Number.isFinite(frame)) return lastFrame;
  return Math.max(0, Math.min(lastFrame, Math.round(frame)));
};
