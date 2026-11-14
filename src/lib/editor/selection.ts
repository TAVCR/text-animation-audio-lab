import type { AnimationProps } from '../types/animation';
import { textTemplateCatalog } from './catalog';

export const normalizeTextTemplateId = (id: unknown): AnimationProps['animationStyle'] =>
  typeof id === 'string' && id in textTemplateCatalog ? id as AnimationProps['animationStyle'] : 'typewriter';

export const normalizeBackgroundPresetId = (id: unknown): AnimationProps['particlePreset'] => {
  if (id === 'bg3d-dna-helix') return 'light-orbs';
  if (id === 'falling-particles') return 'floating-dust';
  if (id === 'paper-confetti-settle') return 'neon-bulb-alternation';
  return typeof id === 'string' ? id as AnimationProps['particlePreset'] : 'light-orbs';
};

const TEXT_KEYS: readonly (keyof AnimationProps)[] = [
  // Shared content, typography, appearance, motion speed/easing and range styles
  // stay on the document. Only effect-specific direction settings are restored.
  'animationStyle', 'slideDirection', 'followerDirection', 'smoothCascadeDirection', 'cinematicDirection',
];
const BACKGROUND_KEYS: readonly (keyof AnimationProps)[] = [
  'particlePreset', 'enableParticles', 'particleFlowDirection',
  'particleSizeMin', 'particleSizeMax', 'particleLineThickness', 'particleGridAngle', 'particleBlur', 'particleColorA',
  'particleColorB', 'particleBackdropColor', 'particleBackdropOpacity', 'particleLightIntensityA', 'particleLightIntensityB',
  'particleLightIntensityC', 'particleMetalness', 'particleRoughness', 'lowpolyLightA', 'lowpolyLightB', 'lowpolyLightC',
  'lowpolyDustA', 'lowpolyDustB', 'lowpolyShowMirror',
  'neonBulbColorA', 'neonBulbColorB', 'neonBulbDensity', 'neonBulbSizePx', 'neonBulbBrightness', 'neonBulbSpeed',
  'neonBulbPattern', 'neonBulbCombinePattern', 'neonBulbSecondaryPattern', 'neonBulbPatternMix',
  'neonBulbHomogeneity', 'neonBulbWaveLength', 'neonBulbPatternSpeed', 'neonBulbContrast', 'neonBulbSoftness',
  'neonBulbReverse', 'neonBulbPatternAngle', 'neonBulbCenterX', 'neonBulbCenterY',
  'stellarDensity', 'stellarDistribution', 'stellarSize', 'stellarSizeVariation', 'stellarDepth', 'stellarPerspective',
  'stellarMotionMode', 'stellarSpeed', 'stellarDriftAngle', 'stellarParallax', 'stellarCameraMotion', 'stellarSway',
  'stellarRotation', 'stellarZSpeed', 'stellarStreaks', 'stellarBrightness', 'stellarGlow', 'stellarTwinkle',
  'stellarColorMode', 'stellarColorA', 'stellarColorB', 'stellarTemperatureVariation', 'stellarDof', 'stellarFocusPlane',
  'stellarDepthFog', 'stellarDust', 'stellarNebula', 'stellarNebulaScale', 'stellarNebulaSpeed', 'stellarNebulaIntensity',
  'stellarNebulaColor', 'stellarSeed',
];


const applyDomain = (current: AnimationProps, saved: Partial<AnimationProps> | undefined, keys: readonly (keyof AnimationProps)[]): AnimationProps => {
  const next = { ...current };
  for (const key of keys) if (saved && saved[key] !== undefined) next[key] = saved[key] as never;
  return next;
};

export const selectTextTemplate = (current: AnimationProps, id: string, saved: Record<string, Partial<AnimationProps>>): AnimationProps =>
  applyDomain({ ...current, animationStyle: normalizeTextTemplateId(id), ...(normalizeTextTemplateId(id) === 'dual-text-layers' && !current.secondaryTextLayer ? { dualPrimaryDelayFrames: 0, secondaryTextLayer: { enabled: true, text: 'DEPTH', animationStyle: 'ink-stamp-print', fontFamily: 'Montserrat', fontWeight: '400', fontSize: 120, positionX: 0, positionY: 0, color: '#8b5cf6', opacity: 0.45, enableFill: true, enableBorder: false, borderColor: '#ffffff', borderWidth: 4, enableShadow: false, shadowColor: '#000000', shadowBlur: 12, motionDurationFrames: current.motionDurationFrames, speed: current.speed, delayFrames: 0, templateOptions: {} } } : {}) }, saved[id], TEXT_KEYS);

export const selectBackgroundPreset = (current: AnimationProps, id: string, saved: Record<string, Partial<AnimationProps>>): AnimationProps =>
  applyDomain({ ...current, particlePreset: normalizeBackgroundPresetId(id) }, saved[id], BACKGROUND_KEYS);
