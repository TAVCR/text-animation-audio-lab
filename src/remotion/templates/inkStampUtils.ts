export const getInkStampProgress = (frame: number, stampFrames: number): number => Math.min(1, Math.max(0, frame / Math.max(1, stampFrames)));

export const getInkStampScale = (progress: number, startScale: number, endScale: number, fromFront: boolean): number => {
  const t = Math.min(1, Math.max(0, progress));
  void fromFront;
  return startScale + (endScale - startScale) * t;
};

export const getInkStampCoverage = (progress: number, coverage: number): number =>
  Math.min(1, Math.max(0, progress)) * Math.min(1, Math.max(0, coverage));

/** A shrinking stamp originates in front; a growing stamp originates behind. */
export const getInkStampStartsFromFront = (startScale: number, endScale: number): boolean =>
  startScale > endScale;

/**
 * The depth control owns the temporal direction of the Z movement.  Scale is
 * intentionally not consulted here: a neutral pair of size sliders must not
 * make the direction slider visually inert.
 */
export const getInkStampDepthProgress = (progress: number, fromFront: boolean): number => {
  const t = Math.min(1, Math.max(0, progress));
  void fromFront;
  return t;
};

export const getInkStampDepthZ = (progress: number, intensity: number, fromFront: boolean): number => {
  const t = Math.min(1, Math.max(0, progress));
  const distance = (1 - t) * Math.min(1800, Math.max(0, intensity) * 520);
  if (t === 1) return 0;
  return fromFront ? distance : -distance;
};

export const getInkStampDepthProjection = (depthZ: number): number =>
  Math.min(2.25, Math.max(0.35, 1 + depthZ / 1200));
