export type NeonPoint = { x: number; y: number };
export type NeonGrid = { rows: number; columns: number; spacing: number; points: NeonPoint[] };
export type NeonBulbState = { phase: number; frequency: number; intensityBias: number; colorMix: number; intensity: number };
export type NeonBulbPattern = 'organic' | 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up' | 'radial' | 'spiral' | 'angular';
export type NeonPatternOptions = {
  pattern: NeonBulbPattern;
  secondaryPattern?: NeonBulbPattern;
  combine?: boolean;
  patternMix?: number;
  homogeneity?: number;
  frame: number;
  fps: number;
  speed: number;
  waveLength: number;
  angleDegrees: number;
  centerX: number;
  centerY: number;
  reverse: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const hash = (value: number) => {
  const sine = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
  return sine - Math.floor(sine);
};

const spatialCoordinate = (point: NeonPoint, pattern: NeonBulbPattern, options: NeonPatternOptions): number => {
  const dx = point.x - options.centerX;
  const dy = point.y - options.centerY;
  if (pattern === 'horizontal') return point.x;
  if (pattern === 'vertical') return point.y;
  if (pattern === 'diagonal-down') return (point.x + point.y) / Math.SQRT2;
  if (pattern === 'diagonal-up') return (point.x - point.y) / Math.SQRT2;
  if (pattern === 'radial') return Math.hypot(dx, dy);
  if (pattern === 'spiral') return Math.hypot(dx, dy) + Math.atan2(dy, dx) / (Math.PI * 4);
  if (pattern === 'angular') {
    const angle = options.angleDegrees * Math.PI / 180;
    return point.x * Math.cos(angle) + point.y * Math.sin(angle);
  }
  return 0;
};

const organicSignal = (cellIndex: number, options: NeonPatternOptions): number => {
  const phase = hash(cellIndex + 11) * Math.PI * 2;
  const frequency = 0.65 + hash(cellIndex + 97) * 0.7;
  const direction = options.reverse ? -1 : 1;
  const time = options.frame / Math.max(1, options.fps);
  return (Math.sin(direction * time * Math.PI * 2 * frequency * Math.max(0, options.speed) + phase) + 1) / 2;
};

const patternSignal = (point: NeonPoint, cellIndex: number, pattern: NeonBulbPattern, options: NeonPatternOptions): number => {
  if (pattern === 'organic') return organicSignal(cellIndex, options);
  const wavelength = Math.max(0.05, options.waveLength);
  const direction = options.reverse ? -1 : 1;
  const time = options.frame / Math.max(1, options.fps);
  const phase = (spatialCoordinate(point, pattern, options) / wavelength - direction * time * Math.max(0, options.speed)) * Math.PI * 2;
  return (Math.sin(phase) + 1) / 2;
};

export const getNeonPatternSignal = (point: NeonPoint, cellIndex: number, options: NeonPatternOptions): number => {
  const primary = patternSignal(point, cellIndex, options.pattern, options);
  const secondary = options.combine && options.secondaryPattern
    ? patternSignal(point, cellIndex, options.secondaryPattern, options)
    : primary;
  const spatial = primary + (secondary - primary) * clamp(options.patternMix ?? 0.5, 0, 1);
  const organic = organicSignal(cellIndex, options);
  return clamp(organic + (spatial - organic) * clamp(options.homogeneity ?? 1, 0, 1), 0, 1);
};

export const getNeonGridLayout = (width: number, height: number, density: number): NeonGrid => {
  const spacing = clamp(180 - density * 2.5, 18, 150);
  const columns = Math.max(2, Math.floor(width / spacing));
  const rows = Math.max(2, Math.floor(height / spacing));
  const xStep = width / columns;
  const yStep = height / rows;
  const points = Array.from({ length: rows * columns }, (_, index) => ({
    x: (index % columns + 0.5) * xStep,
    y: (Math.floor(index / columns) + 0.5) * yStep,
  }));
  return { rows, columns, spacing: Math.min(xStep, yStep), points };
};

export const getNeonBulbState = (cellIndex: number, frame: number, fps: number, speed: number): NeonBulbState => {
  const phase = hash(cellIndex + 11) * Math.PI * 2;
  const frequency = 0.65 + hash(cellIndex + 97) * 0.7;
  const intensityBias = 0.75 + hash(cellIndex + 211) * 0.25;
  const time = frame / Math.max(1, fps);
  const wave = (Math.sin(time * Math.PI * 2 * frequency * Math.max(0, speed) + phase) + 1) / 2;
  return { phase, frequency, intensityBias, colorMix: wave, intensity: clamp((0.55 + wave * 0.45) * intensityBias, 0, 1) };
};
