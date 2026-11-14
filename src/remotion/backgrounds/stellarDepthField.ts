export type StellarDistribution = 'uniform' | 'far' | 'balanced' | 'near';
export type StellarMotionMode = 'drift' | 'advance' | 'orbit' | 'drift-advance';
export type StellarColorMode = 'monochrome' | 'bicolor' | 'temperature' | 'custom';

export type StellarParticle = {
  x: number;
  y: number;
  z: number;
  sizeBias: number;
  brightnessBias: number;
  colorBias: number;
  twinklePhase: number;
  twinkleFrequency: number;
  driftBias: number;
  dustBias: number;
};

export type StellarProjectionOptions = {
  width: number;
  height: number;
  frame: number;
  fps: number;
  depth: number;
  perspective: number;
  parallax: number;
  motionMode: StellarMotionMode;
  speed: number;
  driftAngle: number;
  cameraMotion: number;
  sway: number;
  rotation: number;
  zSpeed: number;
  size: number;
  sizeVariation: number;
  brightness: number;
  twinkle: number;
  dof: number;
  focusPlane: number;
  depthFog: number;
};

export type ProjectedStellarParticle = {
  x: number;
  y: number;
  z: number;
  scale: number;
  radius: number;
  blur: number;
  opacity: number;
  brightness: number;
  twinkle: number;
  streakX: number;
  streakY: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const wrap01 = (value: number) => ((value % 1) + 1) % 1;

const hash = (value: number) => {
  const sine = Math.sin(value * 12.9898 + 78.233) * 43758.5453123;
  return sine - Math.floor(sine);
};

const seeded = (seed: number, index: number, channel: number) => hash(seed * 1009 + index * 131 + channel * 17.17);

export const createStellarParticle = (seed: number, index: number, distribution: StellarDistribution): StellarParticle => {
  const rawZ = seeded(seed, index, 3);
  const z = distribution === 'far'
    ? Math.sqrt(rawZ)
    : distribution === 'near'
      ? 1 - Math.sqrt(1 - rawZ)
      : distribution === 'balanced'
        ? Math.pow(rawZ, 0.72)
        : rawZ;
  return {
    x: (seeded(seed, index, 1) * 2 - 1) * 1.45,
    y: (seeded(seed, index, 2) * 2 - 1) * 1.15,
    z: clamp(z, 0.015, 0.995),
    sizeBias: seeded(seed, index, 4),
    brightnessBias: 0.55 + seeded(seed, index, 5) * 0.45,
    colorBias: seeded(seed, index, 6),
    twinklePhase: seeded(seed, index, 7) * Math.PI * 2,
    twinkleFrequency: 0.35 + seeded(seed, index, 8) * 1.65,
    driftBias: 0.45 + seeded(seed, index, 9) * 0.9,
    dustBias: seeded(seed, index, 10),
  };
};

export const getDepthBlur = (z: number, focusPlane: number, dof: number): number =>
  clamp(Math.abs(z - clamp(focusPlane, 0, 1)) * Math.max(0, dof) * 22, 0, 18);

export const projectStellarParticle = (
  particle: StellarParticle,
  options: StellarProjectionOptions,
  index: number,
): ProjectedStellarParticle => {
  const time = options.frame / Math.max(1, options.fps);
  const speed = Math.max(0, options.speed);
  const includesAdvance = options.motionMode === 'advance' || options.motionMode === 'drift-advance';
  const includesDrift = options.motionMode === 'drift' || options.motionMode === 'drift-advance';
  const cycleOffset = includesAdvance ? time * speed * options.zSpeed * 0.07 : 0;
  const rawZ = particle.z - cycleOffset;
  const cycle = Math.floor(rawZ);
  const z = wrap01(rawZ);
  const recycleX = (hash(index * 41 + cycle * 97.3) - 0.5) * 0.18;
  const recycleY = (hash(index * 59 + cycle * 71.9) - 0.5) * 0.14;

  const driftRadians = options.driftAngle * Math.PI / 180;
  const driftAmount = includesDrift ? time * speed * particle.driftBias * 0.035 : 0;
  let worldX = particle.x + recycleX + Math.cos(driftRadians) * driftAmount;
  let worldY = particle.y + recycleY + Math.sin(driftRadians) * driftAmount;

  const orbitAmount = options.motionMode === 'orbit' ? time * speed * 0.11 : time * options.rotation * 0.025;
  if (orbitAmount !== 0) {
    const cosine = Math.cos(orbitAmount);
    const sine = Math.sin(orbitAmount);
    const rotatedX = worldX * cosine - worldY * sine;
    worldY = worldX * sine + worldY * cosine;
    worldX = rotatedX;
  }

  const cameraStrength = Math.max(0, options.cameraMotion);
  const swayStrength = Math.max(0, options.sway);
  const cameraX = (Math.sin(time * 0.31) * 0.11 + Math.sin(time * 0.13 + 1.7) * 0.05) * cameraStrength;
  const cameraY = (Math.cos(time * 0.27) * 0.08 + Math.sin(time * 0.17) * 0.04) * cameraStrength * (0.4 + swayStrength);
  const depthResponse = Math.pow(1 - z, 1.25) * clamp(options.parallax, 0, 1.5);
  worldX -= cameraX * depthResponse;
  worldY -= cameraY * depthResponse;

  const perspective = clamp(options.perspective, 0.25, 3);
  const cameraDistance = 0.42 / perspective + z * Math.max(0.35, options.depth);
  const scale = clamp(1 / cameraDistance, 0.22, 5.5);
  const aspectCompensation = options.height / Math.max(1, options.width);
  const x = options.width * 0.5 + worldX * options.width * 0.36 * scale * Math.max(0.72, aspectCompensation);
  const y = options.height * 0.5 + worldY * options.height * 0.43 * scale;

  const sizeBias = 1 + (particle.sizeBias * 2 - 1) * clamp(options.sizeVariation, 0, 1) * 0.75;
  const radius = clamp(Math.max(0.2, options.size) * sizeBias * scale, 0.25, 22);
  const twinkleWave = Math.sin(time * Math.PI * 2 * particle.twinkleFrequency + particle.twinklePhase);
  const twinkle = 1 + twinkleWave * clamp(options.twinkle, 0, 1) * 0.36;
  const fog = 1 - clamp(options.depthFog, 0, 1) * z * 0.68;
  const brightness = clamp(Math.max(0, options.brightness) * particle.brightnessBias * twinkle * fog, 0.04, 2.5);
  const opacity = clamp((0.35 + brightness * 0.52) * fog, 0.04, 1);
  const projectedVelocity = includesAdvance ? Math.abs(options.zSpeed * speed) * scale * (1 - z) : speed * 0.08;

  return {
    x,
    y,
    z,
    scale,
    radius,
    blur: getDepthBlur(z, options.focusPlane, options.dof),
    opacity,
    brightness,
    twinkle,
    streakX: Math.cos(driftRadians) * projectedVelocity,
    streakY: Math.sin(driftRadians) * projectedVelocity,
  };
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '').padEnd(6, '0').slice(0, 6);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16) || 0,
    g: Number.parseInt(normalized.slice(2, 4), 16) || 0,
    b: Number.parseInt(normalized.slice(4, 6), 16) || 0,
  };
};

const toHex = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0');
const mixColor = (a: string, b: string, mix: number) => {
  const first = hexToRgb(a);
  const second = hexToRgb(b);
  const amount = clamp(mix, 0, 1);
  return `#${toHex(first.r + (second.r - first.r) * amount)}${toHex(first.g + (second.g - first.g) * amount)}${toHex(first.b + (second.b - first.b) * amount)}`;
};

export const getStellarColor = (
  mode: StellarColorMode,
  colorA: string,
  colorB: string,
  bias: number,
  temperatureVariation: number,
): string => {
  if (mode === 'monochrome') return colorA;
  if (mode === 'bicolor' || mode === 'custom') return mixColor(colorA, colorB, bias);
  const neutral = '#f7f7ff';
  const temperature = clamp(temperatureVariation, 0, 1);
  const anchors = bias < 0.33
    ? [neutral, '#9fc8ff', (0.33 - bias) / 0.33]
    : bias < 0.72
      ? [neutral, '#ffe6a8', (bias - 0.33) / 0.39]
      : [neutral, '#ffae72', (bias - 0.72) / 0.28];
  return mixColor(anchors[0] as string, anchors[1] as string, clamp(anchors[2] as number, 0, 1) * temperature);
};
