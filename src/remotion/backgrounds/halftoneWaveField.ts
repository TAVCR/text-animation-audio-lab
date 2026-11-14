export type HalftonePoint = { x: number; y: number };

export const getHalftoneRadiusRange = (globalSizeMin: number, globalSizeMax: number, localRadiusMin: number, localRadiusMax: number): { min: number; max: number } => ({
  min: localRadiusMin * Math.max(0, globalSizeMin) / 1.5,
  max: localRadiusMax * Math.max(0, globalSizeMax) / 26,
});

export const getHalftonePoint = (column: number, row: number, spacing: number, angleDegrees: number): HalftonePoint => {
  const angle = angleDegrees * Math.PI / 180;
  const x = column * spacing;
  const y = row * spacing;
  return { x: x * Math.cos(angle) - y * Math.sin(angle), y: x * Math.sin(angle) + y * Math.cos(angle) };
};

export const getHalftoneRadius = (time: number, radiusMin: number, radiusMax: number, waveLength: number, directionDegrees: number, x: number, y: number): number => {
  const direction = directionDegrees * Math.PI / 180;
  const phase = (x * Math.cos(direction) + y * Math.sin(direction)) / Math.max(1, waveLength) - time * 0.25;
  const wave = 0.5 + 0.5 * Math.sin(Math.PI * 2 * phase);
  return radiusMin + (radiusMax - radiusMin) * wave;
};
