import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { ParticlePreset } from '@/lib/AnimationContext';
import { SphereParticleBackground3D } from './SphereParticleBackground3D';
import { RetroGridForward3D } from './RetroGridForward3D';
import { BG3D_LowPolyTerrain } from '../../../NEW APPROACH/bg3d-lowpoly-terrain';
import { BG3D_CrystalShards } from '../../../NEW APPROACH/bg3d-crystal-shards';
import { getHalftonePoint, getHalftoneRadius, getHalftoneRadiusRange } from './halftoneWaveField';
import { getNeonBulbState, getNeonGridLayout, getNeonPatternSignal, type NeonBulbPattern } from './neonBulbAlternation';
import { StellarDepthField } from './StellarDepthFieldCanvas';
import type { StellarColorMode, StellarDistribution, StellarMotionMode } from './stellarDepthField';
import { ImportedVideoBackground, isImportedVideoPreset } from './ImportedVideoBackground';

type ParticleShape = 'circle' | 'ring' | 'square' | 'triangle';

type ParticleDatum = {
  baseX: number;
  baseY: number;
  ampX: number;
  ampY: number;
  driftX: number;
  driftY: number;
  phase: number;
  twinkle: number;
  size: number;
  rotation: number;
  spin: number;
  colorMixSeed: number;
  opacitySeed: number;
  shape: ParticleShape;
};

type RibbonDatum = {
  ySeed: number;
  c1Seed: number;
  c2Seed: number;
  drift: number;
  phase: number;
  widthSeed: number;
  colorSeed: number;
  opacitySeed: number;
};

type ParticleBackgroundProps = {
  enabled: boolean;
  preset: ParticlePreset;
  count: number;
  opacity: number;
  speed: number;
  flowDirection: 'forward' | 'backward';
  sizeMin: number;
  sizeMax: number;
  lineThickness: number;
  gridAngle: number;
  blur: number;
  colorA: string;
  colorB: string;
  backdropColor: string;
  backdropOpacity: number;
  lightIntensityA: number;
  lightIntensityB: number;
  lightIntensityC: number;
  metalness: number;
  roughness: number;
  transparentBackground: boolean;
  lowpolyLightA?: string;
  lowpolyLightB?: string;
  lowpolyLightC?: string;
  lowpolyDustA?: string;
  lowpolyDustB?: string;
  lowpolyShowMirror?: boolean;
  halftoneSpacingPx?: number;
  halftoneRadiusMinPx?: number;
  halftoneRadiusMaxPx?: number;
  halftoneWaveLengthPx?: number;
  halftoneDirectionDegrees?: number;
  halftoneCenterClearPercent?: number;
  neonBulbColorA?: string;
  neonBulbColorB?: string;
  neonBulbDensity?: number;
  neonBulbSizePx?: number;
  neonBulbBrightness?: number;
  neonBulbSpeed?: number;
  neonBulbPattern?: NeonBulbPattern;
  neonBulbCombinePattern?: boolean;
  neonBulbSecondaryPattern?: NeonBulbPattern;
  neonBulbPatternMix?: number;
  neonBulbHomogeneity?: number;
  neonBulbWaveLength?: number;
  neonBulbPatternSpeed?: number;
  neonBulbContrast?: number;
  neonBulbSoftness?: number;
  neonBulbReverse?: boolean;
  neonBulbPatternAngle?: number;
  neonBulbCenterX?: number;
  neonBulbCenterY?: number;
  stellarDensity?: number;
  stellarDistribution?: StellarDistribution;
  stellarSize?: number;
  stellarSizeVariation?: number;
  stellarDepth?: number;
  stellarPerspective?: number;
  stellarMotionMode?: StellarMotionMode;
  stellarSpeed?: number;
  stellarDriftAngle?: number;
  stellarParallax?: number;
  stellarCameraMotion?: number;
  stellarSway?: number;
  stellarRotation?: number;
  stellarZSpeed?: number;
  stellarStreaks?: number;
  stellarBrightness?: number;
  stellarGlow?: number;
  stellarTwinkle?: number;
  stellarColorMode?: StellarColorMode;
  stellarColorA?: string;
  stellarColorB?: string;
  stellarTemperatureVariation?: number;
  stellarDof?: number;
  stellarFocusPlane?: number;
  stellarDepthFog?: number;
  stellarDust?: number;
  stellarNebula?: number;
  stellarNebulaScale?: number;
  stellarNebulaSpeed?: number;
  stellarNebulaIntensity?: number;
  stellarNebulaColor?: string;
  stellarSeed?: number;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const seeded = (seed: number): number => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const normalize01 = (value: number): number => {
  return ((value % 1) + 1) % 1;
};

const inPreset = (preset: ParticlePreset, list: ParticlePreset[]): boolean => {
  return list.includes(preset);
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    return { r, g, b };
  }

  const safe = normalized.padEnd(6, '0').slice(0, 6);
  const r = parseInt(safe.slice(0, 2), 16);
  const g = parseInt(safe.slice(2, 4), 16);
  const b = parseInt(safe.slice(4, 6), 16);
  return { r, g, b };
};

const toRgba = (hex: string, alpha: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
};

const mixHex = (a: string, b: string, t: number): string => {
  const c1 = hexToRgb(a);
  const c2 = hexToRgb(b);
  const blend = clamp(t, 0, 1);
  const r = Math.round(c1.r + (c2.r - c1.r) * blend);
  const g = Math.round(c1.g + (c2.g - c1.g) * blend);
  const bCh = Math.round(c1.b + (c2.b - c1.b) * blend);
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(bCh)}`;
};

const getShapeForPreset = (preset: ParticlePreset, sample: number): ParticleShape => {
  if (preset === 'crystal-shard-drift') {
    if (sample < 0.5) return 'triangle';
    if (sample < 0.85) return 'square';
    return 'ring';
  }

  if (inPreset(preset, ['wireframe-constellation', 'radar-sweep-grid'])) {
    if (sample < 0.68) return 'ring';
    return 'circle';
  }

  if (inPreset(preset, ['matrix-code-rain', 'matrix-tunnel-flow'])) {
    if (sample < 0.76) return 'square';
    if (sample < 0.94) return 'circle';
    return 'ring';
  }

  if (inPreset(preset, ['geometric-flow', 'quantum-lattice-flow'])) {
    if (sample < 0.35) return 'square';
    if (sample < 0.72) return 'triangle';
    return 'ring';
  }

  if (inPreset(preset, ['tech-network', 'hud-command-center', 'cyan-system-matrix', 'neural-circuit-core'])) {
    if (sample < 0.52) return 'ring';
    if (sample < 0.84) return 'square';
    return 'circle';
  }

  if (inPreset(preset, ['inferno-tracer-burst', 'ember-spark-rain'])) {
    if (sample < 0.8) return 'circle';
    if (sample < 0.95) return 'ring';
    return 'square';
  }

  if (sample < 0.88) return 'circle';
  return 'ring';
};

const getPresetDensityMultiplier = (preset: ParticlePreset): number => {
  if (preset === 'floating-dust') return 1.15;
  if (preset === 'light-orbs') return 0.55;
  if (preset === 'starfield') return 1.45;
  if (preset === 'geometric-flow') return 0.8;
  if (preset === 'nebula-cinematic') return 0.6;
  if (preset === 'fluid-ribbons') return 0.7;
  if (preset === 'tech-network') return 0.65;
  if (preset === 'inferno-tracer-burst') return 1.3;
  if (preset === 'neon-data-vortex') return 1.15;
  if (preset === 'hud-command-center') return 0.62;
  if (preset === 'cyan-system-matrix') return 0.72;
  if (preset === 'neural-circuit-core') return 0.8;
  if (preset === 'quantum-lattice-flow') return 1.05;
  if (preset === 'aurora-silk-waves') return 0.75;
  if (preset === 'ember-spark-rain') return 1.28;
  if (preset === 'plasma-ring-tunnel') return 1.2;
  if (preset === 'obsidian-gold-luxe') return 0.52;
  if (preset === 'bio-lumina-veins') return 0.84;
  if (preset === 'radar-sweep-grid') return 0.68;
  if (preset === 'matrix-code-rain') return 1.36;
  if (preset === 'matrix-tunnel-flow') return 1.36;
  if (preset === 'metaball-reactor') return 0.92;
  if (preset === 'wireframe-constellation') return 0.7;
  if (preset === 'prism-noise-shimmer') return 1.12;
  if (preset === 'prism-sphere-shimmer-3d') return 1.12;
  if (preset === 'solar-wind-streaks') return 1.26;
  if (preset === 'crystal-shard-drift') return 0.86;
  if (preset === 'monochrome-moire') return 0.76;
  if (preset === 'electro-silk-tendrils') return 0.88;
  if (preset === 'retro-grid-forward') return 0.6;
  return 1;
};

const drawCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
};

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  enabled,
  preset,
  count,
  opacity,
  speed,
  flowDirection,
  sizeMin,
  sizeMax,
  lineThickness,
  gridAngle,
  blur,
  colorA,
  colorB,
  backdropColor,
  backdropOpacity,
  metalness,
  roughness,
  transparentBackground,
  lowpolyLightA,
  lowpolyLightB,
  lowpolyLightC,
  lowpolyDustA,
  lowpolyDustB,
  lowpolyShowMirror,
  halftoneSpacingPx = 28,
  halftoneRadiusMinPx = 1,
  halftoneRadiusMaxPx = 6,
  halftoneWaveLengthPx = 240,
  halftoneDirectionDegrees = 30,
  halftoneCenterClearPercent = 25,
  neonBulbColorA = '#22d3ee',
  neonBulbColorB = '#8b5cf6',
  neonBulbDensity = 40,
  neonBulbSizePx = 4,
  neonBulbBrightness = 1,
  neonBulbSpeed = 1,
  neonBulbPattern = 'organic',
  neonBulbCombinePattern = false,
  neonBulbSecondaryPattern = 'horizontal',
  neonBulbPatternMix = 0.5,
  neonBulbHomogeneity = 0.75,
  neonBulbWaveLength = 0.45,
  neonBulbPatternSpeed = 1,
  neonBulbContrast = 1.35,
  neonBulbSoftness = 0.65,
  neonBulbReverse = false,
  neonBulbPatternAngle = 45,
  neonBulbCenterX = 0.5,
  neonBulbCenterY = 0.5,
  stellarDensity = 320,
  stellarDistribution = 'balanced',
  stellarSize = 2.2,
  stellarSizeVariation = 0.62,
  stellarDepth = 1.7,
  stellarPerspective = 1.25,
  stellarMotionMode = 'drift-advance',
  stellarSpeed = 0.55,
  stellarDriftAngle = 18,
  stellarParallax = 0.62,
  stellarCameraMotion = 0.28,
  stellarSway = 0.35,
  stellarRotation = 0.12,
  stellarZSpeed = 0.42,
  stellarStreaks = 0.08,
  stellarBrightness = 1.05,
  stellarGlow = 0.55,
  stellarTwinkle = 0.18,
  stellarColorMode = 'temperature',
  stellarColorA = '#dcecff',
  stellarColorB = '#8fb8ff',
  stellarTemperatureVariation = 0.52,
  stellarDof = 0.28,
  stellarFocusPlane = 0.58,
  stellarDepthFog = 0.34,
  stellarDust = 0.28,
  stellarNebula = 0.2,
  stellarNebulaScale = 1.15,
  stellarNebulaSpeed = 0.18,
  stellarNebulaIntensity = 0.22,
  stellarNebulaColor = '#394b91',
  stellarSeed = 731,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const isNebulaPreset = inPreset(preset, ['nebula-cinematic', 'obsidian-gold-luxe']);
  const isFlowPreset = inPreset(preset, ['fluid-ribbons', 'aurora-silk-waves', 'quantum-lattice-flow', 'electro-silk-tendrils', 'bio-lumina-veins']);
  const isTechPreset = inPreset(preset, ['tech-network', 'hud-command-center', 'cyan-system-matrix', 'neural-circuit-core', 'radar-sweep-grid', 'wireframe-constellation']);
  const isBurstPreset = inPreset(preset, ['inferno-tracer-burst', 'ember-spark-rain']);
  const isVortexPreset = inPreset(preset, ['neon-data-vortex', 'plasma-ring-tunnel', 'quantum-lattice-flow', 'metaball-reactor']);
  const isBrainPreset = preset === 'neural-circuit-core';
  const isHudHeavy = inPreset(preset, ['hud-command-center', 'cyan-system-matrix']);
  const isLuxePreset = preset === 'obsidian-gold-luxe';
  const isInfernoPreset = preset === 'inferno-tracer-burst';
  const isEmberPreset = preset === 'ember-spark-rain';
  const isNeonVortexPreset = preset === 'neon-data-vortex';
  const isPlasmaPreset = preset === 'plasma-ring-tunnel';
  const isBioVeinsPreset = preset === 'bio-lumina-veins';
  const isRadarPreset = preset === 'radar-sweep-grid';
  const isClassicCodeRainPreset = preset === 'matrix-code-rain';
  const isMatrixTunnelPreset = preset === 'matrix-tunnel-flow';
  const isCodeRainPreset = isClassicCodeRainPreset || isMatrixTunnelPreset;
  const isMetaballPreset = preset === 'metaball-reactor';
  const isConstellationPreset = preset === 'wireframe-constellation';
  const isPrismPreset = preset === 'prism-noise-shimmer';
  const isSphere3DPreset = preset === 'prism-sphere-shimmer-3d';
  const isSolarWindPreset = preset === 'solar-wind-streaks';
  const isCrystalPreset = preset === 'crystal-shard-drift';
  const isMoirePreset = preset === 'monochrome-moire';
  const isSilkTendrilsPreset = preset === 'electro-silk-tendrils';
  const isBg3DLowpolyPreset = preset === 'bg3d-lowpoly-terrain';
  const isBg3DCrystalPreset = preset === 'bg3d-crystal-shards';
  const isRetroGridForwardPreset = preset === 'retro-grid-forward';
  const isHalftonePreset = preset === 'halftone-wave-field';
  const isNeonBulbPreset = preset === 'neon-bulb-alternation';
  const isStellarPreset = preset === 'stellar-depth-field';

  const safeCount = Math.max(1, Math.min(560, Math.floor(count * getPresetDensityMultiplier(preset))));
  const safeMin = Math.max(0.2, Math.min(sizeMin, sizeMax));
  const safeMax = Math.max(safeMin + 0.2, Math.max(sizeMin, sizeMax));
  const safeOpacity = clamp(opacity, 0, 1);
  const safeSpeed = Math.max(0.05, speed);
  const safeBlur = Math.max(0, blur);
  const backdropAlpha = clamp(backdropOpacity, 0, 1);

  const particles = React.useMemo<ParticleDatum[]>(() => {
    return Array.from({ length: safeCount }, (_, index) => {
      const p = index + 1;
      const ampBase = isBurstPreset
        ? 0.02
        : isVortexPreset
          ? 0.05
          : isCodeRainPreset
            ? 0.012
            : isConstellationPreset
              ? 0.02
              : isSolarWindPreset
                ? 0.014
                : isMoirePreset
                  ? 0.032
            : preset === 'starfield'
              ? 0.03
              : isTechPreset
                ? 0.06
                : 0.08;

      return {
        baseX: seeded(p * 1.01),
        baseY: seeded(p * 2.03),
        ampX: ampBase + seeded(p * 3.11) * (inPreset(preset, ['geometric-flow', 'quantum-lattice-flow']) ? 0.1 : 0.2),
        ampY: ampBase + seeded(p * 4.37) * (isEmberPreset || isCodeRainPreset ? 0.56 : isSolarWindPreset ? 0.34 : 0.22),
        driftX: 0.25 + seeded(p * 5.73) * (isVortexPreset ? 2.2 : isBurstPreset ? 2.6 : 1.4),
        driftY: 0.2 + seeded(p * 6.91) * (isEmberPreset || isCodeRainPreset ? 1.8 : isSolarWindPreset ? 1.5 : 1.3),
        phase: seeded(p * 7.33) * Math.PI * 2,
        twinkle: 0.7 + seeded(p * 8.17) * 4.2,
        size: safeMin + seeded(p * 9.19) * (safeMax - safeMin),
        rotation: seeded(p * 10.31) * Math.PI * 2,
        spin: (seeded(p * 11.53) - 0.5) * 1.6,
        colorMixSeed: seeded(p * 13.97),
        opacitySeed: 0.45 + seeded(p * 14.83) * 0.55,
        shape: getShapeForPreset(preset, seeded(p * 15.71)),
      };
    });
  }, [isBurstPreset, isCodeRainPreset, isConstellationPreset, isEmberPreset, isMoirePreset, isSolarWindPreset, isTechPreset, isVortexPreset, preset, safeCount, safeMax, safeMin]);

  const ribbons = React.useMemo<RibbonDatum[]>(() => {
    const bands = preset === 'aurora-silk-waves' || preset === 'electro-silk-tendrils' ? 10 : preset === 'bio-lumina-veins' ? 8 : 7;
    return Array.from({ length: bands }, (_, index) => {
      const seed = index + 1;
      return {
        ySeed: seeded(seed * 2.9),
        c1Seed: seeded(seed * 3.4),
        c2Seed: seeded(seed * 4.8),
        drift: 0.3 + seeded(seed * 5.5) * 1.4,
        phase: seeded(seed * 6.2) * Math.PI * 2,
        widthSeed: 2.4 + seeded(seed * 7.6) * 14,
        colorSeed: seeded(seed * 8.9),
        opacitySeed: 0.2 + seeded(seed * 9.7) * 0.56,
      };
    });
  }, [preset]);

  const getParticlePosition = React.useCallback((particle: ParticleDatum, t: number): { x: number; y: number } => {
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const minSide = Math.min(width, height);

    if (isInfernoPreset) {
      const originX = centerX;
      const originY = height * 0.54;
      const angle = particle.phase + Math.sin(t * 0.22 + particle.phase) * 0.22;
      const progress = normalize01(t * (0.52 + particle.driftX * 0.4) + particle.baseY);
      const radius = progress * minSide * 0.78;
      const jitter = Math.sin(t * 4.2 + particle.phase * 3) * 10;
      return {
        x: originX + Math.cos(angle) * radius + Math.sin(angle * 2.2 + t) * jitter,
        y: originY + Math.sin(angle) * radius + Math.cos(angle * 1.9 + t * 0.7) * jitter * 0.7,
      };
    }

    if (isEmberPreset) {
      const xNorm = particle.baseX + Math.sin(t * 1.6 + particle.phase) * 0.06;
      const yNorm = particle.baseY + t * (0.22 + particle.driftY * 0.05) + Math.sin(t * 2 + particle.phase) * 0.015;
      return {
        x: normalize01(xNorm) * width,
        y: normalize01(yNorm) * height,
      };
    }

    if (isNeonVortexPreset) {
      const orbit = (0.12 + particle.baseY * 0.86) * minSide * 0.55;
      const spiral = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.65 + particle.phase));
      const radius = orbit * spiral;
      const angle = t * (1.4 + particle.driftX * 0.6) + particle.phase + particle.baseX * Math.PI * 2;
      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    }

    if (isPlasmaPreset) {
      const progress = normalize01(t * (0.45 + particle.driftX * 0.2) + particle.baseY);
      const radius = (1 - progress) * minSide * 0.62;
      const angle = particle.phase + progress * 13 + t * 1.45;
      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    }

    if (isMetaballPreset) {
      const anchors = [
        { x: width * 0.32, y: height * 0.38 },
        { x: width * 0.68, y: height * 0.44 },
        { x: width * 0.48, y: height * 0.68 },
      ];
      const anchorIndex = Math.min(anchors.length - 1, Math.floor(particle.baseX * anchors.length));
      const anchor = anchors[anchorIndex];
      const orbit = minSide * (0.05 + particle.baseY * 0.14);
      const angle = t * (0.6 + particle.driftX * 0.35) + particle.phase;
      return {
        x: anchor.x + Math.cos(angle) * orbit,
        y: anchor.y + Math.sin(angle * 0.92) * orbit,
      };
    }

    if (isCodeRainPreset) {
      const xNorm = particle.baseX + Math.sin(t * (0.6 + particle.driftX * 0.2) + particle.phase) * 0.012;
      const yNorm = particle.baseY + t * (0.22 + particle.driftY * 0.05);
      return {
        x: normalize01(xNorm) * width,
        y: normalize01(yNorm) * height,
      };
    }

    if (isSolarWindPreset) {
      const travel = normalize01(t * (0.14 + particle.driftX * 0.04) + particle.baseY);
      const xNorm = travel + particle.baseX * 0.35 + Math.sin(t * 1.4 + particle.phase) * 0.02;
      const yNorm = travel * 0.58 + particle.baseY * 0.7 + Math.cos(t * 0.9 + particle.phase) * 0.015;
      return {
        x: normalize01(xNorm) * width,
        y: normalize01(yNorm) * height,
      };
    }

    if (isConstellationPreset) {
      const xNorm = particle.baseX + Math.sin(t * 0.45 + particle.phase) * 0.03;
      const yNorm = particle.baseY + Math.cos(t * 0.37 + particle.phase * 1.2) * 0.025;
      return {
        x: normalize01(xNorm) * width,
        y: normalize01(yNorm) * height,
      };
    }

    if (isMoirePreset) {
      const xNorm = particle.baseX + Math.sin(particle.baseY * 12 + t * 0.9 + particle.phase) * 0.08;
      const yNorm = particle.baseY + Math.cos(particle.baseX * 12 - t * 0.8 + particle.phase) * 0.08;
      return {
        x: normalize01(xNorm) * width,
        y: normalize01(yNorm) * height,
      };
    }

    if (preset === 'quantum-lattice-flow') {
      const xNorm = particle.baseX + Math.sin(t * particle.driftX + particle.phase) * particle.ampX * 0.65;
      const yNorm = particle.baseY + Math.cos(t * particle.driftY + particle.phase) * particle.ampY * 0.65;
      const x = normalize01(xNorm);
      const y = normalize01(yNorm + Math.sin(x * 8 + t * 1.6 + particle.phase) * 0.03);
      return {
        x: x * width,
        y: y * height,
      };
    }

    const xNorm = particle.baseX + Math.sin(t * particle.driftX + particle.phase) * particle.ampX;
    const yDriftBase = Math.cos(t * particle.driftY + particle.phase * 1.13) * particle.ampY;
    const fallingOffset = particle.baseY + yDriftBase;

    return {
      x: normalize01(xNorm) * width,
      y: normalize01(fallingOffset) * height,
    };
  }, [height, isCodeRainPreset, isConstellationPreset, isEmberPreset, isInfernoPreset, isMetaballPreset, isMoirePreset, isNeonVortexPreset, isPlasmaPreset, isSolarWindPreset, preset, width]);

  React.useLayoutEffect(() => {
    if (!enabled || isSphere3DPreset || isStellarPreset) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const timeSec = frame / fps;
    const t = timeSec * safeSpeed;
    const minSide = Math.min(width, height);
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    ctx.clearRect(0, 0, width, height);
    if (backdropAlpha > 0) {
      const grad = ctx.createRadialGradient(centerX, centerY, minSide * 0.08, centerX, centerY, minSide * 0.72);
      grad.addColorStop(0, toRgba(backdropColor, backdropAlpha));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    if (isLuxePreset) {
      const luxeGrad = ctx.createLinearGradient(0, 0, width, height);
      luxeGrad.addColorStop(0, toRgba('#000000', 0.45));
      luxeGrad.addColorStop(0.35, toRgba(colorA, 0.16));
      luxeGrad.addColorStop(1, toRgba(colorB, 0.1));
      ctx.fillStyle = luxeGrad;
      ctx.fillRect(0, 0, width, height);
    }

    if (isHalftonePreset) {
      const spacing = clamp(halftoneSpacingPx, 12, 60);
      const densityFactor = Math.sqrt(clamp(safeCount / 90, 0.25, 3));
      const gridSpacing = spacing / densityFactor;
      const halftoneRange = getHalftoneRadiusRange(sizeMin, sizeMax, clamp(halftoneRadiusMinPx, 0.5, 4), clamp(halftoneRadiusMaxPx, 2, 12));
      const minRadius = halftoneRange.min;
      const maxRadius = Math.min(Math.max(minRadius, halftoneRange.max), gridSpacing * 0.45);
      const clearRadius = minSide * clamp(halftoneCenterClearPercent, 0, 60) / 100;
      ctx.save();
      for (let row = -2; row <= Math.ceil(height / gridSpacing) + 2; row += 1) {
        for (let column = -2; column <= Math.ceil(width / gridSpacing) + 2; column += 1) {
          const point = getHalftonePoint(column, row, gridSpacing, halftoneDirectionDegrees);
          const x = point.x + centerX;
          const y = point.y + centerY;
          if (x < -gridSpacing || x > width + gridSpacing || y < -gridSpacing || y > height + gridSpacing) continue;
          const centerDistance = Math.hypot(x - centerX, y - centerY);
          const clearFactor = clearRadius > 0 ? clamp((centerDistance - clearRadius * 0.2) / (clearRadius * 0.8), 0, 1) : 1;
          const radius = getHalftoneRadius(t, minRadius, maxRadius, halftoneWaveLengthPx, halftoneDirectionDegrees, x, y) * clearFactor;
          const colorMix = clamp((radius - minRadius) / Math.max(0.1, maxRadius - minRadius), 0, 1);
          ctx.fillStyle = toRgba(mixHex(colorA, colorB, colorMix), safeOpacity * (0.25 + clearFactor * 0.75));
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      return;
    }

    if (isNeonBulbPreset) {
      const grid = getNeonGridLayout(width, height, neonBulbDensity);
      const bulbA = neonBulbColorA || colorA;
      const bulbB = neonBulbColorB || colorB;
      for (let index = 0; index < grid.points.length; index += 1) {
        const point = grid.points[index];
        const state = getNeonBulbState(index, frame, fps, neonBulbSpeed);
        const normalizedPoint = { x: point.x / Math.max(1, width), y: point.y / Math.max(1, height) };
        const rawSignal = getNeonPatternSignal(normalizedPoint, index, {
          pattern: neonBulbPattern, secondaryPattern: neonBulbSecondaryPattern, combine: neonBulbCombinePattern,
          patternMix: neonBulbPatternMix, homogeneity: neonBulbHomogeneity, frame, fps,
          speed: neonBulbPatternSpeed, waveLength: neonBulbWaveLength, angleDegrees: neonBulbPatternAngle,
          centerX: neonBulbCenterX, centerY: neonBulbCenterY, reverse: neonBulbReverse,
        });
        const contrasted = clamp(0.5 + (rawSignal - 0.5) * neonBulbContrast, 0, 1);
        const edge = contrasted * contrasted * (3 - 2 * contrasted);
        const signal = contrasted + (edge - contrasted) * clamp(1 - neonBulbSoftness, 0, 1);
        const intensity = clamp((0.18 + signal * 0.82) * state.intensityBias, 0, 1);
        const color = mixHex(bulbA, bulbB, signal);
        const radius = Math.max(1, Math.min(12, neonBulbSizePx)) * (0.72 + intensity * 0.28);
        const glow = radius * (2.2 + intensity * 4.8);
        ctx.save();
        ctx.globalAlpha = safeOpacity * Math.max(0.1, neonBulbBrightness) * intensity;
        ctx.shadowBlur = glow;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = safeOpacity * intensity;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, Math.max(0.75, radius * 0.35), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    if (isNebulaPreset) {
      const blobs = isLuxePreset ? 5 : 7;
      for (let i = 0; i < blobs; i += 1) {
        const seed = i + 1;
        const cx = (0.15 + seeded(seed * 2.1) * 0.7 + Math.sin(t * (0.3 + seeded(seed * 5.3)) + seeded(seed * 7.1) * Math.PI * 2) * 0.08) * width;
        const cy = (0.18 + seeded(seed * 3.7) * 0.64 + Math.cos(t * (0.24 + seeded(seed * 5.9)) + seeded(seed * 7.9) * Math.PI * 2) * 0.08) * height;
        const radius = ((isLuxePreset ? 0.12 : 0.18) + seeded(seed * 4.9) * (isLuxePreset ? 0.16 : 0.27)) * minSide;
        const color = isLuxePreset
          ? mixHex('#8b6b24', '#ffe3a8', seeded(seed * 8.7))
          : mixHex(colorA, colorB, seeded(seed * 8.7));
        const alpha = clamp(safeOpacity * (0.24 + seeded(seed * 10.3) * 0.55) * (isLuxePreset ? 0.38 : 0.55), 0.07, 0.62);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, toRgba(color, alpha));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      }
    }

    if (isFlowPreset) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < ribbons.length; i += 1) {
        const band = ribbons[i];
        const y = (0.08 + band.ySeed * 0.82 + Math.sin(t * band.drift + band.phase) * 0.14) * height;
        const endY = y + Math.sin(t * (band.drift * 0.6) + band.phase * 1.2) * height * 0.16;
        const c1y = y + (band.c1Seed - 0.5) * height * 0.44;
        const c2y = y - (band.c2Seed - 0.5) * height * 0.44;
        const strokeColor = mixHex(colorA, colorB, 0.5 + 0.5 * Math.sin(t * 0.28 + band.colorSeed * Math.PI * 2));
        const alpha = clamp(safeOpacity * band.opacitySeed * 0.82, 0.08, 0.72);
        ctx.strokeStyle = toRgba(strokeColor, alpha);
        ctx.lineWidth = Math.max(2.4, band.widthSeed + Math.sin(t * 0.7 + band.phase) * 2.2);
        ctx.beginPath();
        ctx.moveTo(-width * 0.2, y);
        ctx.bezierCurveTo(width * 0.18, c1y, width * 0.54, c2y, width * 1.2, endY);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (isBioVeinsPreset || isSilkTendrilsPreset) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const branches = isBioVeinsPreset ? 14 : 10;
      for (let i = 0; i < branches; i += 1) {
        const seed = i + 1;
        const startX = centerX + Math.cos((Math.PI * 2 * i) / branches + t * 0.12) * minSide * 0.07;
        const startY = centerY + Math.sin((Math.PI * 2 * i) / branches + t * 0.1) * minSide * 0.07;
        const endX = (0.08 + seeded(seed * 2.7) * 0.84) * width;
        const endY = (0.1 + seeded(seed * 3.9) * 0.8) * height;
        const c1x = startX + (seeded(seed * 4.3) - 0.5) * width * 0.22;
        const c1y = startY + (seeded(seed * 5.6) - 0.5) * height * 0.22;
        const c2x = endX + (seeded(seed * 6.1) - 0.5) * width * 0.18;
        const c2y = endY + (seeded(seed * 7.7) - 0.5) * height * 0.18;
        const alpha = clamp(safeOpacity * (0.22 + seeded(seed * 8.1) * 0.48), 0.08, 0.58);
        ctx.strokeStyle = toRgba(mixHex(colorA, colorB, seeded(seed * 9.4)), alpha);
        ctx.lineWidth = Math.max(1.2, 2.2 + Math.sin(t * 0.9 + seed) * 0.9);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, endX, endY);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (isRadarPreset) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const radarRadius = minSide * 0.46;
      ctx.strokeStyle = toRgba(colorB, safeOpacity * 0.26);
      ctx.lineWidth = 1;
      for (let i = 1; i <= 6; i += 1) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radarRadius * i) / 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      const sweepAngle = normalize01(t * 0.08) * Math.PI * 2;
      const sweepSpan = Math.PI * 0.18;
      const beam = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radarRadius);
      beam.addColorStop(0, toRgba(colorA, safeOpacity * 0.42));
      beam.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radarRadius, sweepAngle - sweepSpan, sweepAngle + sweepSpan);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (isClassicCodeRainPreset) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const glyphSizeControl = clamp((safeMin + safeMax) * 0.5, 1, 80);
      const glyphHeight = Math.round(clamp(glyphSizeControl, 8, Math.max(12, minSide * 0.09)));
      const densityBoost = clamp(safeCount / 150, 0.35, 2.8);
      const matrixSpeedFine = Math.pow(safeSpeed, 1.45);
      const glyphs = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      const glyphCount = glyphs.length;
      const glyphFrame = Math.floor(t * 24);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.max(8, Math.round(glyphHeight * 0.9))}px "Courier New", monospace`;

      const columns = Math.max(18, Math.floor((width / Math.max(7, glyphHeight * 0.6)) * (0.75 + densityBoost * 0.78)));
      for (let i = 0; i < columns; i += 1) {
        const seed = i + 1;
        const x = ((i + 0.5) / columns) * width;
        const stream = Math.max(9, Math.floor(10 + densityBoost * 8 + seeded(seed * 3.1) * 12));
        const fallRate = 0.03 + matrixSpeedFine * 0.24 + seeded(seed * 4.7) * 0.12;
        const offset = normalize01(timeSec * fallRate + seeded(seed * 5.2));

        for (let j = 0; j < stream; j += 1) {
          const yNorm = normalize01(offset + j / stream);
          const y = yNorm * height;
          const tail = 1 - j / stream;
          const alpha = clamp(safeOpacity * (0.1 + tail * 0.78), 0.03, 0.96);
          const mix = seeded(seed * 6.9 + j * 1.13 + glyphFrame * 0.09);
          const charIndex = Math.floor(seeded(seed * 41.7 + j * 17.3 + glyphFrame * 0.618) * glyphCount);
          const glyph = glyphs[charIndex] ?? '0';
          ctx.fillStyle = j === 0
            ? toRgba('#f3ffff', clamp(alpha * 1.26, 0.08, 0.98))
            : toRgba(mixHex(colorA, colorB, mix), alpha);
          ctx.fillText(glyph, x, y);
        }
      }
      ctx.restore();
    }

    if (isMatrixTunnelPreset) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      const glyphSizeControl = clamp((safeMin + safeMax) * 0.5, 1, 80);
      const glyphHeight = Math.round(clamp(glyphSizeControl, 8, Math.max(12, minSide * 0.09)));
      const densityBoostWalls = clamp(safeCount / 150, 0.35, 2.8);
      const densityBoostBack = 0.35;
      const matrixSpeedFine = Math.pow(safeSpeed, 1.45);
      const glyphs = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      const glyphCount = glyphs.length;
      const glyphFrame = Math.floor(t * 24);

      const setFont = (px: number) => {
        const size = Math.max(7, Math.round(px));
        ctx.font = `700 ${size}px "Courier New", monospace`;
      };

      type Point2 = { x: number; y: number };
      const lerp = (a: number, b: number, p: number): number => a + (b - a) * p;
      const lerpPoint = (a: Point2, b: Point2, p: number): Point2 => ({
        x: lerp(a.x, b.x, p),
        y: lerp(a.y, b.y, p),
      });

      const vanishY = height * 0.5;
      const nearWidth = width * 1.22;
      const nearHeight = height * 1.14;
      const farScale = 0.23;
      const farWidth = nearWidth * farScale;
      const farHeight = nearHeight * farScale;

      const leftFrontX = centerX - nearWidth * 0.5;
      const rightFrontX = centerX + nearWidth * 0.5;
      const topFrontY = vanishY - nearHeight * 0.5;
      const bottomFrontY = vanishY + nearHeight * 0.5;

      const leftBackX = centerX - farWidth * 0.5;
      const rightBackX = centerX + farWidth * 0.5;
      const topBackY = vanishY - farHeight * 0.5;
      const bottomBackY = vanishY + farHeight * 0.5;

      const backTopLeft: Point2 = { x: leftBackX, y: topBackY };
      const backTopRight: Point2 = { x: rightBackX, y: topBackY };
      const backBottomLeft: Point2 = { x: leftBackX, y: bottomBackY };
      const backBottomRight: Point2 = { x: rightBackX, y: bottomBackY };
      const frontTopLeft: Point2 = { x: leftFrontX, y: topFrontY };
      const frontTopRight: Point2 = { x: rightFrontX, y: topFrontY };
      const frontBottomLeft: Point2 = { x: leftFrontX, y: bottomFrontY };
      const frontBottomRight: Point2 = { x: rightFrontX, y: bottomFrontY };

      const clipPolygon = (points: Point2[], draw: () => void) => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i += 1) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.clip();
        draw();
        ctx.restore();
      };

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Pared de fondo: lluvia vertical menos densa, fija en densidad mínima.
      clipPolygon([backTopLeft, backTopRight, backBottomRight, backBottomLeft], () => {
        const backColumns = Math.max(7, Math.floor((farWidth / Math.max(6, glyphHeight * 0.56)) * (0.85 + densityBoostBack * 0.65)));
        setFont(glyphHeight * 0.58);
        for (let i = 0; i < backColumns; i += 1) {
          const seed = i + 1;
          const x = leftBackX + ((i + 0.5) / backColumns) * farWidth;
          const stream = Math.max(5, Math.floor(6 + densityBoostBack * 6 + seeded(seed * 3.1) * 7));
          const fallRate = 0.03 + matrixSpeedFine * 0.2 + seeded(seed * 4.7) * 0.11;
          const offset = normalize01(timeSec * fallRate + seeded(seed * 5.2));

          for (let j = 0; j < stream; j += 1) {
            const yNorm = normalize01(offset + j / stream);
            const y = topBackY + yNorm * farHeight;
            const tail = 1 - j / stream;
            const alpha = clamp(safeOpacity * (0.13 + tail * 0.52), 0.04, 0.7);
            const mix = seeded(seed * 6.9 + j * 1.13 + glyphFrame * 0.11);
            const charIndex = Math.floor(seeded(seed * 41.7 + j * 17.3 + glyphFrame * 0.618) * glyphCount);
            const glyph = glyphs[charIndex] ?? '0';

            ctx.fillStyle = j === 0
              ? toRgba('#f3ffff', clamp(alpha * 1.1, 0.08, 0.85))
              : toRgba(mixHex(colorA, colorB, mix), alpha);
            ctx.fillText(glyph, x, y);
          }
        }
      });

      const drawForwardSurface = (
        polygon: Point2[],
        backA: Point2,
        backB: Point2,
        frontA: Point2,
        frontB: Point2,
        laneCount: number,
        seedBase: number,
        colorBias: number
      ) => {
        clipPolygon(polygon, () => {
          for (let lane = 0; lane < laneCount; lane += 1) {
            const laneSeed = seedBase + lane;
            const laneJitter = (seeded(laneSeed * 1.37) - 0.5) * (1 / Math.max(12, laneCount * 2));
            const u = clamp((lane + 1) / (laneCount + 2) + laneJitter, 0.02, 0.98);
            const farLanePoint = lerpPoint(backA, backB, u);
            const nearLanePoint = lerpPoint(frontA, frontB, u);
            const streamLen = Math.max(6, Math.floor(8 + densityBoostWalls * 9 + seeded(laneSeed * 4.1) * 8));
            const travelRate = 0.04 + matrixSpeedFine * 0.34 + seeded(laneSeed * 3.3) * 0.16;
            const offset = normalize01(timeSec * travelRate + seeded(laneSeed * 8.7));

            for (let j = 0; j < streamLen; j += 1) {
              const depthRaw = normalize01(offset + j / streamLen);
              const depth = Math.pow(depthRaw, 0.88);
              const p = lerpPoint(farLanePoint, nearLanePoint, depth);
              const size = glyphHeight * (0.28 + depth * 1.36);
              setFont(size);

              const tail = 1 - j / streamLen;
              const alpha = clamp(safeOpacity * (0.08 + depth * 0.7) * (0.32 + tail * 0.68), 0.04, 0.95);
              const mix = clamp(
                colorBias + (seeded(laneSeed * 6.1 + j * 0.97 + glyphFrame * 0.19) - 0.5) * 0.3,
                0,
                1
              );
              const charIndex = Math.floor(seeded(laneSeed * 34.1 + j * 11.7 + glyphFrame * 0.43) * glyphCount);
              const glyph = glyphs[charIndex] ?? '0';

              ctx.fillStyle = j === 0
                ? toRgba('#f3ffff', clamp(alpha * 1.22, 0.08, 0.99))
                : toRgba(mixHex(colorA, colorB, mix), alpha);
              ctx.fillText(glyph, p.x, p.y);
            }
          }
        });
      };

      const sideLaneCount = Math.max(11, Math.floor(10 + densityBoostWalls * 7));
      const floorLaneCount = Math.max(15, Math.floor(14 + densityBoostWalls * 9));
      const ceilLaneCount = Math.max(13, Math.floor(12 + densityBoostWalls * 8));

      drawForwardSurface(
        [frontTopLeft, backTopLeft, backBottomLeft, frontBottomLeft],
        backTopLeft,
        backBottomLeft,
        frontTopLeft,
        frontBottomLeft,
        sideLaneCount,
        1200,
        0.2
      );

      drawForwardSurface(
        [frontTopRight, backTopRight, backBottomRight, frontBottomRight],
        backTopRight,
        backBottomRight,
        frontTopRight,
        frontBottomRight,
        sideLaneCount,
        1700,
        0.84
      );

      drawForwardSurface(
        [frontBottomLeft, frontBottomRight, backBottomRight, backBottomLeft],
        backBottomLeft,
        backBottomRight,
        frontBottomLeft,
        frontBottomRight,
        floorLaneCount,
        2200,
        0.34
      );

      drawForwardSurface(
        [frontTopLeft, frontTopRight, backTopRight, backTopLeft],
        backTopLeft,
        backTopRight,
        frontTopLeft,
        frontTopRight,
        ceilLaneCount,
        2800,
        0.68
      );

      ctx.restore();
    }

    if (isMetaballPreset) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const blobs = 7;
      for (let i = 0; i < blobs; i += 1) {
        const seed = i + 1;
        const cx = (0.2 + seeded(seed * 1.7) * 0.6 + Math.sin(t * (0.35 + seeded(seed * 2.3)) + seeded(seed * 4.1) * Math.PI * 2) * 0.14) * width;
        const cy = (0.2 + seeded(seed * 2.9) * 0.6 + Math.cos(t * (0.31 + seeded(seed * 3.7)) + seeded(seed * 5.8) * Math.PI * 2) * 0.14) * height;
        const radius = (0.08 + seeded(seed * 6.1) * 0.13) * minSide;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, toRgba(mixHex(colorA, colorB, seeded(seed * 7.4)), safeOpacity * 0.42));
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      }
      ctx.restore();
    }

    if (isConstellationPreset) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const nodes = particles.slice(0, Math.min(52, particles.length)).map((p) => getParticlePosition(p, t));
      const threshold = minSide * 0.23;
      for (let i = 0; i < nodes.length; i += 1) {
        const from = nodes[i];
        for (let j = i + 1; j < Math.min(nodes.length, i + 8); j += 1) {
          const to = nodes[j];
          const dist = Math.hypot(from.x - to.x, from.y - to.y);
          if (dist > threshold) continue;
          const alpha = clamp(safeOpacity * (1 - dist / threshold) * 0.5, 0.04, 0.42);
          ctx.strokeStyle = toRgba(mixHex(colorA, colorB, 0.55), alpha);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    if (isPrismPreset) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const specks = 280;
      for (let i = 0; i < specks; i += 1) {
        const seed = i + 1;
        const x = seeded(seed * 1.9) * width;
        const y = seeded(seed * 2.7) * height;
        const blink = 0.5 + 0.5 * Math.sin(t * (1.4 + seeded(seed * 3.8)) + seeded(seed * 4.6) * Math.PI * 2);
        const alpha = clamp(safeOpacity * blink * 0.48, 0.03, 0.52);
        drawCircle(ctx, x, y, 0.7 + seeded(seed * 5.4) * 1.8);
        ctx.fillStyle = toRgba(mixHex(colorA, colorB, seeded(seed * 6.2)), alpha);
        ctx.fill();
      }
      ctx.restore();
    }

    if (isSolarWindPreset) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const streaks = 60;
      for (let i = 0; i < streaks; i += 1) {
        const seed = i + 1;
        const x = normalize01(seeded(seed * 2.3) + t * (0.06 + seeded(seed * 3.7) * 0.08)) * width;
        const y = normalize01(seeded(seed * 4.1) + t * (0.03 + seeded(seed * 5.9) * 0.04)) * height;
        const len = minSide * (0.015 + seeded(seed * 6.4) * 0.05);
        const alpha = clamp(safeOpacity * (0.2 + seeded(seed * 7.1) * 0.5), 0.06, 0.64);
        ctx.strokeStyle = toRgba(mixHex(colorA, colorB, seeded(seed * 8.6)), alpha);
        ctx.lineWidth = Math.max(0.6, 1.2 + seeded(seed * 9.2) * 1.8);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + len, y - len * 0.45);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (isMoirePreset) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = toRgba(colorB, safeOpacity * 0.22);
      ctx.lineWidth = 1;
      const rings = 36;
      for (let i = 0; i < rings; i += 1) {
        const radius = minSide * (0.03 + (i / rings) * 0.58);
        const wobble = Math.sin(t * 0.9 + i * 0.35) * minSide * 0.006;
        ctx.beginPath();
        ctx.arc(centerX - minSide * 0.06, centerY, radius + wobble, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX + minSide * 0.06, centerY, radius - wobble, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (isCrystalPreset) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const glints = 28;
      for (let i = 0; i < glints; i += 1) {
        const seed = i + 1;
        const x = seeded(seed * 2.7) * width;
        const y = seeded(seed * 3.9) * height;
        const pulse = 0.5 + 0.5 * Math.sin(t * (1 + seeded(seed * 5.3) * 2) + seed);
        const len = minSide * (0.008 + seeded(seed * 6.6) * 0.022) * pulse;
        const alpha = clamp(safeOpacity * (0.22 + pulse * 0.44), 0.08, 0.72);
        ctx.strokeStyle = toRgba(mixHex(colorA, colorB, seeded(seed * 7.1)), alpha);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - len, y);
        ctx.lineTo(x + len, y);
        ctx.moveTo(x, y - len);
        ctx.lineTo(x, y + len);
        ctx.stroke();
      }
      ctx.restore();
    }

    const drawParticleShape = (particle: ParticleDatum) => {
      const { x, y } = getParticlePosition(particle, t);
      const pulse = 0.58 + 0.42 * Math.sin(t * particle.twinkle + particle.phase);
      const alphaBase = isLuxePreset ? 0.7 : 1;
      const alpha = clamp(safeOpacity * particle.opacitySeed * pulse * alphaBase, 0, 1);
      const colorMixFreq = isLuxePreset ? 0.2 : isBurstPreset ? 0.9 : 0.42;
      const colorMix = 0.5 + 0.5 * Math.sin(t * colorMixFreq + particle.colorMixSeed * Math.PI * 2);
      const color = mixHex(colorA, colorB, colorMix);
      const rotation = particle.rotation + t * particle.spin * 30;
      const size = particle.size;

      if (safeBlur > 0) {
        ctx.shadowBlur = safeBlur * (0.8 + particle.opacitySeed * 0.9);
        ctx.shadowColor = toRgba(color, alpha * 0.8);
      } else {
        ctx.shadowBlur = 0;
      }

      if (particle.shape === 'circle') {
        drawCircle(ctx, x, y, size);
        ctx.fillStyle = toRgba(color, alpha);
        ctx.fill();
        return;
      }

      if (particle.shape === 'ring') {
        drawCircle(ctx, x, y, Math.max(0.6, size * 0.9));
        ctx.strokeStyle = toRgba(color, alpha * 0.95);
        ctx.lineWidth = Math.max(0.6, size * 0.16);
        ctx.stroke();
        return;
      }

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      if (particle.shape === 'square') {
        const s = Math.max(1.2, size * 1.7);
        ctx.fillStyle = toRgba(color, alpha * 0.72);
        ctx.strokeStyle = toRgba(mixHex(colorA, colorB, 0.5), alpha * 0.64);
        ctx.lineWidth = Math.max(0.5, s * 0.06);
        ctx.beginPath();
        ctx.roundRect(-s / 2, -s / 2, s, s, Math.max(0.5, s * 0.12));
        ctx.fill();
        ctx.stroke();
      } else {
        const tri = Math.max(1.2, size * 2);
        ctx.fillStyle = toRgba(color, alpha * 0.56);
        ctx.strokeStyle = toRgba(mixHex(colorA, colorB, 0.65), alpha * 0.7);
        ctx.lineWidth = Math.max(0.45, size * 0.06);
        ctx.beginPath();
        ctx.moveTo(0, -tri / 1.15);
        ctx.lineTo(-tri / 1.05, tri / 1.2);
        ctx.lineTo(tri / 1.05, tri / 1.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    };

    if (isBurstPreset) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const totalRays = 48;
      for (let i = 0; i < totalRays; i += 1) {
        const seed = i + 1;
        const angle = seeded(seed * 1.9) * Math.PI * 2;
        const phase = seeded(seed * 2.7);
        const speedSeed = 0.25 + seeded(seed * 3.3) * 0.75;
        const lengthSeed = 0.1 + seeded(seed * 4.6) * 0.9;
        const widthSeed = 0.4 + seeded(seed * 5.1) * 2.8;
        const colorSeed = seeded(seed * 6.7);
        const opacitySeed = 0.26 + seeded(seed * 7.2) * 0.7;

        if (isEmberPreset) {
          const x = normalize01(phase + t * (0.08 + speedSeed * 0.04)) * width;
          const y = normalize01(phase * 1.7 + t * (0.22 + speedSeed * 0.1)) * height;
          const len = minSide * (0.01 + lengthSeed * 0.035);
          const tilt = -Math.PI / 2 + (seeded(i * 1.8) - 0.5) * 0.7;
          const x2 = x + Math.cos(tilt) * len;
          const y2 = y + Math.sin(tilt) * len;
          const alpha = clamp(safeOpacity * opacitySeed * (0.7 + 0.3 * Math.sin(t * 7 + phase * 11)), 0.08, 0.8);

          ctx.strokeStyle = toRgba(mixHex(colorA, colorB, colorSeed), alpha);
          ctx.lineWidth = Math.max(0.5, widthSeed);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          continue;
        }

        const progress = normalize01(t * (0.8 + speedSeed * 0.8) + phase);
        const dist = progress * minSide * 0.84;
        const len = minSide * (0.04 + lengthSeed * 0.1);
        const ang = angle + Math.sin(t * 0.9 + phase * 8) * 0.05;
        const x2 = centerX + Math.cos(ang) * dist;
        const y2 = centerY + Math.sin(ang) * dist;
        const x1 = centerX + Math.cos(ang) * Math.max(0, dist - len);
        const y1 = centerY + Math.sin(ang) * Math.max(0, dist - len);
        const alpha = clamp(safeOpacity * opacitySeed * (0.55 + 0.45 * Math.sin(progress * Math.PI)), 0.08, 0.9);

        ctx.strokeStyle = toRgba(mixHex(colorA, colorB, colorSeed), alpha);
        ctx.lineWidth = Math.max(0.6, widthSeed);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (isVortexPreset) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const total = Math.max(96, Math.min(260, Math.floor(safeCount * 1.6)));
      for (let i = 0; i < total; i += 1) {
        const seed = i + 1;
        const arm = i % 3;
        const radiusSeed = seeded(seed * 1.8);
        const angleSeed = seeded(seed * 2.3);
        const speedSeed = 0.35 + seeded(seed * 3.6) * 1.45;
        const sizeSeed = 0.6 + seeded(seed * 4.9) * 2.8;
        const colorSeed = seeded(seed * 5.7);
        const opacitySeed = 0.2 + seeded(seed * 6.4) * 0.78;

        const armOffset = (Math.PI * 2 * arm) / 3;
        const radialPulse = 0.32 + 0.68 * (0.5 + 0.5 * Math.sin(t * 0.8 + radiusSeed * Math.PI * 2));
        const radiusBase = minSide * (isPlasmaPreset ? 0.58 : 0.42) * radiusSeed;
        const radius = radiusBase * radialPulse;
        const swirlBoost = isPlasmaPreset ? 2.4 : 1.6;
        const angle = t * (swirlBoost + speedSeed) + armOffset + angleSeed * Math.PI * 2 + radiusSeed * 5.2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const alpha = clamp(safeOpacity * opacitySeed * (isPlasmaPreset ? 0.9 : 0.72), 0.05, 0.86);
        const size = Math.max(0.7, sizeSeed * (isPlasmaPreset ? 1.35 : 1));

        drawCircle(ctx, x, y, size);
        ctx.fillStyle = toRgba(mixHex(colorA, colorB, colorSeed), alpha);
        ctx.fill();
      }
      ctx.restore();
    }

    if (isTechPreset) {
      const gridStep = Math.max(38, Math.round(minSide * 0.08));
      const vLines = Math.ceil(width / gridStep) + 3;
      const hLines = Math.ceil(height / gridStep) + 3;
      const gridOffsetX = (t * 55) % gridStep;
      const gridOffsetY = (t * 28) % gridStep;

      ctx.save();
      ctx.lineWidth = 1;
      ctx.strokeStyle = toRgba(colorB, safeOpacity * 0.09);
      for (let i = 0; i < vLines; i += 1) {
        const x = i * gridStep - gridStep + gridOffsetX;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      ctx.strokeStyle = toRgba(colorA, safeOpacity * 0.08);
      for (let i = 0; i < hLines; i += 1) {
        const y = i * gridStep - gridStep + gridOffsetY;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const nodeCount = Math.min(44, particles.length);
      const nodes = particles.slice(0, nodeCount).map((p) => getParticlePosition(p, t));
      const threshold = minSide * 0.3;
      const offsets = isHudHeavy ? [1, 2, 4, 7] : [1, 2, 6];

      const links: Array<{ fromX: number; fromY: number; toX: number; toY: number; alpha: number; speed: number; phase: number }> = [];

      for (let i = 0; i < nodes.length; i += 1) {
        for (const offset of offsets) {
          const j = (i + offset) % nodes.length;
          if (j === i) continue;
          const a = nodes[i];
          const b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist > threshold) continue;

          const alpha = clamp(safeOpacity * (1 - dist / threshold) * 0.75, 0.03, 0.68);
          links.push({
            fromX: a.x,
            fromY: a.y,
            toX: b.x,
            toY: b.y,
            alpha,
            speed: 0.22 + ((i + j) % 7) * 0.09,
            phase: normalize01((i * 0.13 + j * 0.07) % 1),
          });
        }
      }

      for (let i = 0; i < links.length; i += 1) {
        const link = links[i];
        ctx.strokeStyle = toRgba(mixHex(colorA, colorB, 0.45), link.alpha);
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(link.fromX, link.fromY);
        ctx.lineTo(link.toX, link.toY);
        ctx.stroke();

        const pulseP = normalize01(t * link.speed + link.phase);
        const px = link.fromX + (link.toX - link.fromX) * pulseP;
        const py = link.fromY + (link.toY - link.fromY) * pulseP;
        drawCircle(ctx, px, py, 1.6);
        ctx.fillStyle = toRgba(mixHex(colorA, colorB, 0.8), clamp(link.alpha * 1.35, 0.1, 0.92));
        ctx.fill();
      }

      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        drawCircle(ctx, node.x, node.y, 2.6);
        ctx.fillStyle = toRgba(colorB, safeOpacity * 0.84);
        ctx.fill();

        drawCircle(ctx, node.x, node.y, 7.6);
        ctx.strokeStyle = toRgba(colorA, safeOpacity * 0.33);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (isHudHeavy) {
        for (let i = 0; i < 10; i += 1) {
          const seed = i + 1;
          const radiusSeed = 0.14 + seeded(seed * 1.9) * 0.62;
          const startSeed = seeded(seed * 2.8);
          const spanSeed = 0.08 + seeded(seed * 3.7) * 0.34;
          const speedSeed = 0.1 + seeded(seed * 4.6) * 0.6;
          const widthSeed = 1 + seeded(seed * 5.5) * 3.6;
          const colorSeed = seeded(seed * 6.8);
          const opacitySeed = 0.25 + seeded(seed * 7.4) * 0.62;

          const radius = minSide * radiusSeed * (0.55 + 0.45 * Math.sin(t * speedSeed + startSeed * Math.PI * 2));
          const start = startSeed * Math.PI * 2 + t * speedSeed;
          const span = (0.06 + spanSeed) * Math.PI * 2;
          const end = start + span;

          ctx.strokeStyle = toRgba(mixHex(colorA, colorB, colorSeed), clamp(safeOpacity * opacitySeed, 0.06, 0.72));
          ctx.lineWidth = Math.max(1, widthSeed);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, start, end);
          ctx.stroke();
        }

        for (let i = 0; i < 18; i += 1) {
          const seed = i + 1;
          const widthSeed = 0.06 + seeded(seed * 3.1) * 0.18;
          const x = seeded(seed * 1.6) * (width - width * widthSeed);
          const y = seeded(seed * 2.2) * height;
          const pulse = 0.45 + 0.55 * Math.sin(t * (0.3 + seeded(seed * 5.5) * 1.4) * 3 + seeded(seed * 4.7) * Math.PI * 2);
          const alpha = clamp(safeOpacity * (0.2 + seeded(seed * 6.4) * 0.66) * pulse, 0.06, 0.68);
          const w = width * widthSeed;

          ctx.fillStyle = toRgba(mixHex(colorA, colorB, seeded(seed * 7.3)), alpha);
          ctx.beginPath();
          ctx.roundRect(x, y, w, 2, 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    if (isBrainPreset) {
      const chipSize = minSide * 0.17;
      const chipX = centerX - chipSize * 0.5;
      const chipY = centerY - chipSize * 0.5;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      drawCircle(ctx, centerX, centerY, minSide * 0.13);
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, minSide * 0.13);
      coreGrad.addColorStop(0, toRgba(mixHex(colorA, colorB, 0.5), 0.24));
      coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coreGrad;
      ctx.fill();

      ctx.fillStyle = toRgba(mixHex(colorA, colorB, 0.5), 0.24);
      ctx.strokeStyle = toRgba('#ffffff', 0.6);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, chipSize, chipSize, minSide * 0.012);
      ctx.fill();
      ctx.stroke();

      const routeCount = 18;
      for (let i = 0; i < routeCount; i += 1) {
        const seed = i + 1;
        const fromLeft = i % 2 === 0;
        const anchorX = fromLeft ? chipX : chipX + chipSize;
        const anchorY = chipY + ((i % 6) + 1) * (chipSize / 7);
        const nodeX = (0.18 + seeded(seed * 2.1) * 0.64) * width;
        const nodeY = (0.18 + seeded(seed * 2.9) * 0.64) * height;
        const midX = fromLeft
          ? Math.min(nodeX - minSide * 0.04, anchorX - minSide * 0.03)
          : Math.max(nodeX + minSide * 0.04, anchorX + minSide * 0.03);

        const alpha = clamp(0.12 + 0.14 * Math.sin(t * 1.4 + i), 0.08, 0.32);
        ctx.strokeStyle = toRgba(mixHex(colorA, colorB, 0.5), alpha);
        ctx.lineWidth = 1.2;
        ctx.setLineDash([6, 6]);
        ctx.lineDashOffset = -((t * 36 + i * 9) % 120);
        ctx.beginPath();
        ctx.moveTo(anchorX, anchorY);
        ctx.lineTo(midX, anchorY);
        ctx.lineTo(midX, nodeY);
        ctx.lineTo(nodeX, nodeY);
        ctx.stroke();

        ctx.setLineDash([]);
        const pulse = normalize01(t * (0.65 + seeded(seed * 3.5) * 0.2) + seeded(seed * 4.3));
        const pulseX = anchorX + (nodeX - anchorX) * pulse;
        const pulseY = anchorY + (nodeY - anchorY) * pulse;
        drawCircle(ctx, pulseX, pulseY, 1.8);
        ctx.fillStyle = toRgba(mixHex(colorA, colorB, 0.78), 0.95);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.save();
    if (isTechPreset || isFlowPreset || isVortexPreset || isBurstPreset || isBrainPreset || isPrismPreset || isSolarWindPreset || isCrystalPreset || isMoirePreset) {
      ctx.globalCompositeOperation = 'lighter';
    }

    if (!isCodeRainPreset) {
      for (let i = 0; i < particles.length; i += 1) {
        drawParticleShape(particles[i]);
      }
    }

    ctx.restore();
  }, [
    backdropAlpha,
    backdropColor,
    colorA,
    colorB,
    enabled,
    frame,
    fps,
    getParticlePosition,
    halftoneCenterClearPercent,
    halftoneDirectionDegrees,
    halftoneRadiusMaxPx,
    halftoneRadiusMinPx,
    halftoneSpacingPx,
    halftoneWaveLengthPx,
    height,
    isBrainPreset,
    isBurstPreset,
    isClassicCodeRainPreset,
    isCodeRainPreset,
    isConstellationPreset,
    isCrystalPreset,
    isEmberPreset,
    isFlowPreset,
    isBioVeinsPreset,
    isHudHeavy,
    isInfernoPreset,
    isLuxePreset,
    isMetaballPreset,
    isMoirePreset,
    isMatrixTunnelPreset,
    isNebulaPreset,
    isHalftonePreset,
    isNeonBulbPreset,
    isNeonVortexPreset,
    isPlasmaPreset,
    isPrismPreset,
    isRadarPreset,
    isSilkTendrilsPreset,
    isSolarWindPreset,
    isSphere3DPreset,
    isStellarPreset,
    isRetroGridForwardPreset,
    isTechPreset,
    isVortexPreset,
    particles,
    neonBulbBrightness,
    neonBulbCenterX,
    neonBulbCenterY,
    neonBulbColorA,
    neonBulbColorB,
    neonBulbCombinePattern,
    neonBulbContrast,
    neonBulbDensity,
    neonBulbHomogeneity,
    neonBulbPattern,
    neonBulbPatternAngle,
    neonBulbPatternMix,
    neonBulbPatternSpeed,
    neonBulbReverse,
    neonBulbSecondaryPattern,
    neonBulbSizePx,
    neonBulbSoftness,
    neonBulbSpeed,
    neonBulbWaveLength,
    preset,
    ribbons,
    safeBlur,
    safeCount,
    safeOpacity,
    safeSpeed,
    safeMin,
    safeMax,
    sizeMax,
    sizeMin,
    width,
  ]);

  if (!enabled) return null;

  if (isImportedVideoPreset(preset)) {
    return <ImportedVideoBackground preset={preset} width={width} height={height} />;
  }

  if (isStellarPreset) {
    return (
      <StellarDepthField
        density={stellarDensity}
        distribution={stellarDistribution}
        size={stellarSize}
        sizeVariation={stellarSizeVariation}
        depth={stellarDepth}
        perspective={stellarPerspective}
        motionMode={stellarMotionMode}
        speed={stellarSpeed}
        driftAngle={stellarDriftAngle}
        parallax={stellarParallax}
        cameraMotion={stellarCameraMotion}
        sway={stellarSway}
        rotation={stellarRotation}
        zSpeed={stellarZSpeed}
        streaks={stellarStreaks}
        brightness={stellarBrightness}
        glow={stellarGlow}
        twinkle={stellarTwinkle}
        colorMode={stellarColorMode}
        colorA={stellarColorA}
        colorB={stellarColorB}
        temperatureVariation={stellarTemperatureVariation}
        dof={stellarDof}
        focusPlane={stellarFocusPlane}
        depthFog={stellarDepthFog}
        dust={stellarDust}
        nebula={stellarNebula}
        nebulaScale={stellarNebulaScale}
        nebulaSpeed={stellarNebulaSpeed}
        nebulaIntensity={stellarNebulaIntensity}
        nebulaColor={stellarNebulaColor}
        seed={stellarSeed}
      />
    );
  }

  if (isSphere3DPreset) {
    return (
      <SphereParticleBackground3D
        count={safeCount}
        opacity={safeOpacity}
        speed={safeSpeed}
        sizeMin={safeMin}
        sizeMax={safeMax}
        blur={safeBlur}
        colorA={colorA}
        colorB={colorB}
        backdropColor={backdropColor}
        backdropOpacity={backdropAlpha}
      />
    );
  }

  if (isRetroGridForwardPreset) {
    return (
      <RetroGridForward3D
        color={colorA}
        speed={safeSpeed}
        flowDirection={flowDirection}
        sizeMin={safeMin}
        sizeMax={safeMax}
        lineThickness={lineThickness}
        angle={gridAngle}
        opacity={safeOpacity}
      />
    );
  }

  if (isBg3DLowpolyPreset) {
    return (
      <BG3D_LowPolyTerrain
        colorTerrain1={colorA}
        colorTerrain2={colorB} 
        colorLightA={lowpolyLightA || '#0066ff'}
        colorLightB={lowpolyLightB || '#ff4400'}
        colorLightC={lowpolyLightC || '#00ffcc'}
        speed={safeSpeed}
        amplitude={clamp((safeMin + safeMax) * 0.065, 0.35, 3.2)}
        metalness={clamp(metalness, 0.05, 1)}
        roughness={clamp(roughness, 0.05, 1)}
        showMirror={lowpolyShowMirror ?? true}
        dustColorA={lowpolyDustA || '#4488ff'}
        dustColorB={lowpolyDustB || '#aaddff'}
        dustColorC={'#ffffff'}
        dustCount={Math.max(500, Math.min(2500, Math.round(safeCount * 20)))}
        dustSize={clamp((safeMin + safeMax) * 0.015, 0.1, 0.8)}
        dustSpeed={clamp(safeSpeed * 0.4, 0.05, 2)}
        dustTurbulence={clamp(safeBlur * 0.08, 0.08, 2)}
        dustOpacity={clamp(0.2 + safeOpacity * 0.75, 0.12, 0.98)}
        dustZSpread={clamp(safeMax * 0.6, 4, 24)}
        bloomStrength={clamp(0.65 + safeBlur * 0.22, 0, 3)}
        transparentBackground={transparentBackground}
      />
    );
  }

  if (isBg3DCrystalPreset) {
    return (
      <BG3D_CrystalShards
        lightColorA={colorA}
        lightColorB={colorB}
        lightColorC={backdropColor}
        shardCount={Math.max(18, Math.min(140, Math.round(safeCount * 0.7)))}
        metalness={clamp(metalness, 0.02, 1)}
        roughness={clamp(roughness, 0.02, 1)}
        speed={safeSpeed}
        bloomStrength={clamp(0.9 + safeBlur * 0.3, 0, 4)}
        opacity={safeOpacity}
        sizeMin={safeMin}
        sizeMax={safeMax}
        transparentBackground={transparentBackground}
      />
    );
  }

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          willChange: 'transform, opacity',
          transform: 'translateZ(0)',
        }}
      />
    </AbsoluteFill>
  );
};
