'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Easing } from 'remotion';
import { getLegacyDurationInFrames } from './videoConfig';
import type { AnimationProps, AnimationStyle, ParticlePreset } from './types/animation';
import { migrateV1ToV2, serializeEditorStorage } from './editor/persistence';
import { createHistory, pushHistory, redoHistory, undoHistory, replaceCurrentHistory, type EditorHistory } from './editor/history';
import { normalizeTextTemplateId, selectBackgroundPreset as selectBackgroundState, selectTextTemplate as selectTextState } from './editor/selection';

export type {
  AnimationProps,
  AnimationStyle,
  ParticlePreset,
  TextRangeStyle,
  TextRangeStyleMode,
} from './types/animation';

export const LAST_PROPS_STORAGE_KEY = 'remotion-fx:last-props:v1';
export const TEMPLATE_PROPS_STORAGE_KEY = 'remotion-fx:template-props:v1';
export const PARTICLE_PRESET_PROPS_STORAGE_KEY = 'remotion-fx:particle-preset-props:v1';
export const USER_PRESETS_STORAGE_KEY = 'remotion-fx:user-presets';
export const EDITOR_SELECTION_STORAGE_KEY = 'remotion-fx:editor-selection:v2';

export interface UserPresetMeta {
  name: string;
  updatedAt: number;
}

type UserPresetEntry = {
  updatedAt: number;
  props: AnimationProps;
};

type UserPresetMap = Record<string, UserPresetEntry>;

const normalizePresetName = (value: string): string => value.trim().replace(/\s+/g, ' ').slice(0, 80);

const hydrateAnimationProps = (value: Partial<AnimationProps>): AnimationProps => {
  const merged = { ...defaultAnimationProps, ...value };
  if (value.timingVersion !== 1) {
    merged.motionDurationFrames = getLegacyDurationInFrames({
      ...merged,
      speedControlsDuration: value.speedControlsDuration ?? true,
    });
  }
  merged.timingVersion = 1;
  merged.speedControlsDuration = false;
  if (merged.paperCutoutFloatAmplitudePx === 3 || merged.paperCutoutFloatAmplitudePx === 12) {
    merged.paperCutoutFloatAmplitudePx = 48;
  }
  if (!Array.isArray(merged.textRangeStyles)) {
    merged.textRangeStyles = [];
  }
  return merged;
};

const readUserPresetMapFromStorage = (): UserPresetMap => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(USER_PRESETS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const next: UserPresetMap = {};
    for (const [rawName, rawEntry] of Object.entries(parsed as Record<string, unknown>)) {
      const name = normalizePresetName(rawName);
      if (!name || !rawEntry || typeof rawEntry !== 'object') continue;

      const entry = rawEntry as { updatedAt?: unknown; props?: unknown };
      const maybeProps =
        entry.props && typeof entry.props === 'object' && !Array.isArray(entry.props)
          ? (entry.props as Partial<AnimationProps>)
          : (rawEntry as Partial<AnimationProps>);

      next[name] = {
        updatedAt: typeof entry.updatedAt === 'number' ? entry.updatedAt : Date.now(),
        props: hydrateAnimationProps(maybeProps),
      };
    }
    return next;
  } catch {
    return {};
  }
};

const writeUserPresetMapToStorage = (map: UserPresetMap): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(USER_PRESETS_STORAGE_KEY, JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
};

export const loadNamedPresetFromStorage = (name: string): AnimationProps | null => {
  const normalized = normalizePresetName(name);
  if (!normalized) return null;
  const map = readUserPresetMapFromStorage();
  const hit = map[normalized];
  return hit ? hydrateAnimationProps(hit.props) : null;
};

export const saveNamedPresetToStorage = (name: string, props: AnimationProps): (UserPresetMeta & { replaced?: boolean }) | { error: 'storage' } | null => {
  const normalized = normalizePresetName(name);
  if (!normalized) return null;
  const map = readUserPresetMapFromStorage();
  const replaced = Boolean(map[normalized]);
  const snapshot = JSON.parse(JSON.stringify(props)) as AnimationProps;
  map[normalized] = {
    props: hydrateAnimationProps(snapshot),
    updatedAt: Date.now(),
  };
  if (!writeUserPresetMapToStorage(map)) return { error: 'storage' };
  return { name: normalized, updatedAt: map[normalized].updatedAt, replaced };
};

export const deleteNamedPresetFromStorage = (name: string): boolean => {
  const normalized = normalizePresetName(name);
  if (!normalized) return false;
  const map = readUserPresetMapFromStorage();
  if (!map[normalized]) return false;
  delete map[normalized];
  return writeUserPresetMapToStorage(map);
};

export const listNamedPresetsFromStorage = (): UserPresetMeta[] => {
  const map = readUserPresetMapFromStorage();
  return Object.entries(map)
    .map(([name, entry]) => ({ name, updatedAt: entry.updatedAt }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
};

export const defaultAnimationProps: AnimationProps = {
  text: 'TEXT',
  titleText: 'AI',
  subtitleText: 'artificial intelligence',
  circuitBaseImage: '/assets/circuito_limpio.png',
  showCircuitBaseImage: true,
  wordTwo: 'MOTION',
  wordThree: 'IMPACT',
  textRangeStyles: [],
  fontFamily: 'Poppins',
  fontFamilyTwo: 'Montserrat',
  fontFamilyThree: 'Oswald',
  fontWeight: '800',
  fontWeightTwo: 'bold',
  fontWeightThree: 'bold',
  fontSize: 120,
  fontSizeTwo: 120,
  fontSizeThree: 120,
  color: '#ffffff',
  opacity: 1,
  colorTwo: '#ff0055',
  colorThree: '#00ffcc',
  enableBorder: false,
  enableBorderTwo: false,
  enableBorderThree: false,
  borderColor: '#000000',
  borderColorTwo: '#ffffff',
  borderColorThree: '#000000',
  borderWidth: 4,
  borderWidthTwo: 4,
  borderWidthThree: 4,
  slideDirection: 'bottom',
  followerDirection: 'bottom-up',
  smoothCascadeDirection: 'bottom-up',
  cinematicDirection: 'zoom-out',
  metalPreset: 'silver',
  metalTone: 'classic',
  metalBrightness: 1,
  metalContrast: 1,
  font3dPreset: 'auto',
  useFont3dOverride: false,
  aspectRatio: '16:9',
  resolutionPreset: '1080p',
  easingStyle: 'cubic',
  backgroundColor: '#000000',
  boxColor: '#ff0055',
  gradientStart: '#ff00cc',
  gradientEnd: '#3333ff',
  enableGradient: true,
  speed: 1,
  speedControlsDuration: false,
  timingVersion: 1,
  wordSpeedOne: 1,
  wordSpeedTwo: 1,
  wordSpeedThree: 1,
  viralWordStagger: 8,
  animationStyle: 'typewriter',
  isTransparent: true,
  motionPhase: 'in',
  motionDurationFrames: 150,
  textPositionX: 0,
  textPositionY: 0,
  startZ: 0,
  endZ: 0,
  reverseOutAnimation: true,
  showWordTwo: true,
  showWordThree: true,
  letterSpacing: 2,
  letterSpacingTwo: 2,
  letterSpacingThree: 2,
  lineHeight: 1.2,
  lineHeightTwo: 1.2,
  lineHeightThree: 1.2,
  letterSpacing3d: 2,
  lineHeight3d: 1.2,
  extrudeDepth3d: 2.4,
  enableShadow: false,
  enableShadowTwo: false,
  enableShadowThree: false,
  shadowColor: '#ff0000',
  shadowColorTwo: '#ff0000',
  shadowColorThree: '#ff0000',
  shadowBlur: 20,
  shadowBlurTwo: 20,
  shadowBlurThree: 20,
  enableFill: true,
  enableFillTwo: true,
  enableFillThree: true,
  shapeGradientWidth: 100,
  shapeBorderRadius: 10,
  boxSequenceCount: 2,
  boxSequenceMode: 'box',
  boxSequenceDirection: 'from-bottom',
  boxSequenceTextsRaw: 'MOTION\nIMPACT\nSTUDIO',
  boxSequenceDurationsRaw: '',
  boxSequenceColorsRaw: '',
  boxSequenceTextColorsRaw: '',
  boxSequenceFontFamiliesRaw: '',
  boxSequenceFontWeightsRaw: '',
  boxSequenceFontSizesRaw: '',
  boxSequenceTextTwo: 'MOTION',
  boxSequenceTextThree: 'IMPACT',
  boxSequenceTextFour: 'STUDIO',
  boxSequenceDurationOne: 1,
  boxSequenceDurationTwo: 1,
  boxSequenceDurationThree: 1,
  boxSequenceDurationFour: 1,
  boxSequenceUseGradient: false,
  boxSequenceGradientStart: '#ff0055',
  boxSequenceGradientEnd: '#00d4ff',
  boxSequenceColorOne: '#ff0055',
  boxSequenceColorTwo: '#00d4ff',
  boxSequenceColorThree: '#ffd400',
  boxSequenceColorFour: '#8b5cf6',
  boxSequenceWidth: 62,
  boxSequenceBorderRadius: 12,
  boxSequenceHeightScale: 1.25,
  enableParticles: true,
  halftoneSpacingPx: 28,
  halftoneRadiusMinPx: 1,
  halftoneRadiusMaxPx: 6,
  halftoneWaveLengthPx: 240,
  halftoneDirectionDegrees: 30,
  halftoneCenterClearPercent: 25,
  neonBulbColorA: '#22d3ee',
  neonBulbColorB: '#8b5cf6',
  neonBulbDensity: 40,
  neonBulbSizePx: 4,
  neonBulbBrightness: 1,
  neonBulbSpeed: 1,
  neonBulbPattern: 'organic',
  neonBulbCombinePattern: false,
  neonBulbSecondaryPattern: 'horizontal',
  neonBulbPatternMix: 0.5,
  neonBulbHomogeneity: 0.75,
  neonBulbWaveLength: 0.45,
  neonBulbPatternSpeed: 1,
  neonBulbContrast: 1.35,
  neonBulbSoftness: 0.65,
  neonBulbReverse: false,
  neonBulbPatternAngle: 45,
  neonBulbCenterX: 0.5,
  neonBulbCenterY: 0.5,
  stellarDensity: 320,
  stellarDistribution: 'balanced',
  stellarSize: 2.2,
  stellarSizeVariation: 0.62,
  stellarDepth: 1.7,
  stellarPerspective: 1.25,
  stellarMotionMode: 'drift-advance',
  stellarSpeed: 0.55,
  stellarDriftAngle: 18,
  stellarParallax: 0.62,
  stellarCameraMotion: 0.28,
  stellarSway: 0.35,
  stellarRotation: 0.12,
  stellarZSpeed: 0.42,
  stellarStreaks: 0.08,
  stellarBrightness: 1.05,
  stellarGlow: 0.55,
  stellarTwinkle: 0.18,
  stellarColorMode: 'temperature',
  stellarColorA: '#dcecff',
  stellarColorB: '#8fb8ff',
  stellarTemperatureVariation: 0.52,
  stellarDof: 0.28,
  stellarFocusPlane: 0.58,
  stellarDepthFog: 0.34,
  stellarDust: 0.28,
  stellarNebula: 0.2,
  stellarNebulaScale: 1.15,
  stellarNebulaSpeed: 0.18,
  stellarNebulaIntensity: 0.22,
  stellarNebulaColor: '#394b91',
  stellarSeed: 731,
  particlePreset: 'light-orbs',
  particleCount: 90,
  particleOpacity: 0.5,
  particleSpeed: 1,
  particleFlowDirection: 'forward',
  particleSizeMin: 1.5,
  particleSizeMax: 26,
  particleLineThickness: 1,
  particleGridAngle: 82,
  particleBlur: 5,
  particleColorA: '#8cf3ff',
  particleColorB: '#ffffff',
  particleBackdropColor: '#2c7be5',
  particleBackdropOpacity: 0.15,
  particleLightIntensityA: 6.2,
  particleLightIntensityB: 1.2,
  particleLightIntensityC: 4.6,
  particleMetalness: 0.82,
  particleRoughness: 0.16,
  lowpolyLightA: '#ffffff',
  lowpolyLightB: '#00ccff',
  lowpolyLightC: '#00ffcc',
  lowpolyDustA: '#4488ff',
  lowpolyDustB: '#ffffff',
  lowpolyShowMirror: true,
  typewriterCursorFollowTextStyle: true,
  typewriterShowCursor: true,
  typewriterCharactersPerSecond: 15,
  wordHighlightSeconds: 0.4,
  wordHighlightColor: '#d7ff3f',
  wordHighlightActiveTextColor: '#111111',
  wordHighlightInactiveTextColor: '#ffffff',
  wordHighlightCornerRadiusPx: 12,
  wordHighlightPaddingPx: 8,
  paperCutoutColor: '#fff1cf',
  paperCutoutInkColor: '#202020',
  paperCutoutWordDelayFrames: 4,
  paperCutoutSettleFrames: 12,
  paperCutoutPaddingPx: 12,
  paperCutoutShadowOpacity: 0.18,
  paperCutoutSeed: 'paper-cutout-assemble-1',
  paperCutoutFloatAmplitudePx: 48,
  paperCutoutFloatSpeed: 1,
  inkStampFrames: 6,
  inkStampColor: '#ff593c',
  inkStampCoverage: 0.9,
  inkStampPressure: 1.5,
  inkStampRoughness: 0.35,
  inkStampRegistrationOffsetPx: 1.5,
  inkStampRegistrationColor: '#202020',
  inkStampFromFront: false,
  inkStampInitialAngle: 18,
  inkStampStartScale: 0.45,
  inkStampEndScale: 1,
  inkStampFloatAmplitudePx: 24,
  inkStampFloatSpeed: 1,
  inkStampDepthDirection: 0,
  inkStampSeed: 'ink-stamp-print-1',
  variableWeightBaseWeight: 400,
  variableWeightPeakWeight: 850,
  variableWeightWaveWidth: 3,
  variableWeightCycleSeconds: 2.4,
  glyphTileSizePx: 20,
  glyphTileScatterPx: 100,
  glyphTileAssemblySeconds: 0.8,
  typewriterCursorStyle: 'bar',
  typewriterCursorAfterEnd: 'blink',
  showTextLayer: true,
};

interface AnimationContextType {
  props: AnimationProps;
  setProps: React.Dispatch<React.SetStateAction<AnimationProps>>;
  userPresets: UserPresetMeta[];
  saveNamedPreset: (name: string) => { ok: boolean; name?: string; error?: string };
  loadNamedPreset: (name: string) => boolean;
  deleteNamedPreset: (name: string) => boolean;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  selectTextTemplate: (id: string) => void;
  selectBackgroundPreset: (id: string) => void;
  setPreviewFrame: (frame: number) => void;
  getPreviewFrame: () => number;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const AnimationProvider = ({ children, initialProps }: { children: React.ReactNode, initialProps?: Partial<AnimationProps> }) => {
  const [props, setProps] = useState<AnimationProps>(() => {
    if (typeof window === 'undefined') {
      return { ...defaultAnimationProps, ...initialProps };
    }

    try {
      migrateV1ToV2(window.localStorage, LAST_PROPS_STORAGE_KEY, EDITOR_SELECTION_STORAGE_KEY);
      const raw = window.localStorage.getItem(LAST_PROPS_STORAGE_KEY);
      if (!raw) return { ...defaultAnimationProps, ...initialProps };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { ...defaultAnimationProps, ...initialProps };
      }
      const loaded = { ...hydrateAnimationProps(parsed as Partial<AnimationProps>), ...initialProps };
      return { ...loaded, animationStyle: normalizeTextTemplateId(loaded.animationStyle) };
    } catch {
      return { ...defaultAnimationProps, ...initialProps };
    }
  });
  const previewFrameRef = useRef(0);
  const setPreviewFrame = React.useCallback((frame: number) => {
    if (Number.isFinite(frame)) previewFrameRef.current = Math.max(0, Math.round(frame));
  }, []);
  const getPreviewFrame = React.useCallback(() => previewFrameRef.current, []);
  const [userPresets, setUserPresets] = useState<UserPresetMeta[]>([]);
  const historyRef = useRef<EditorHistory<AnimationProps> | null>(null);
  const lastDocumentEditAtRef = useRef(0);
  const sliderTransactionRef = useRef(false);
  React.useEffect(() => {
    const begin = (event: PointerEvent) => {
      if (!(event.target instanceof HTMLInputElement) || event.target.type !== 'range') return;
      const history = historyRef.current;
      if (!history || sliderTransactionRef.current) return;
      historyRef.current = pushHistory(history, history.current);
      sliderTransactionRef.current = true;
    };
    const cancel = () => {
      if (!sliderTransactionRef.current || !historyRef.current) return;
      const restored = undoHistory(historyRef.current);
      historyRef.current = restored;
      setProps(restored.current);
      sliderTransactionRef.current = false;
      lastDocumentEditAtRef.current = 0;
    };
    const finish = () => { sliderTransactionRef.current = false; lastDocumentEditAtRef.current = 0; };
    document.addEventListener('pointerdown', begin, true);
    document.addEventListener('pointerup', finish, true);
    document.addEventListener('pointercancel', cancel, true);
    return () => {
      document.removeEventListener('pointerdown', begin, true);
      document.removeEventListener('pointerup', finish, true);
      document.removeEventListener('pointercancel', cancel, true);
      sliderTransactionRef.current = false;
    };
  }, []);
  if (!historyRef.current) historyRef.current = createHistory(props);
  const [historyVersion, setHistoryVersion] = useState(0);
  const setDocumentProps = React.useCallback<React.Dispatch<React.SetStateAction<AnimationProps>>>((update) => {
    setProps((previous) => {
      const next = typeof update === 'function' ? (update as (value: AnimationProps) => AnimationProps)(previous) : update;
      if (JSON.stringify(next) !== JSON.stringify(previous)) {
        const history = historyRef.current ?? createHistory(previous);
        const now = Date.now();
        historyRef.current = sliderTransactionRef.current || now - lastDocumentEditAtRef.current <= 300
          ? replaceCurrentHistory(history, next)
          : pushHistory(history, next);
        lastDocumentEditAtRef.current = now;
        setHistoryVersion((version) => version + 1);
      }
      return next;
    });
  }, []);
  const undo = React.useCallback(() => {
    const history = historyRef.current;
    if (!history?.past.length) return;
    const next = undoHistory(history);
    historyRef.current = next;
    setProps(next.current);
    setHistoryVersion((version) => version + 1);
  }, []);
  const redo = React.useCallback(() => {
    const history = historyRef.current;
    if (!history?.future.length) return;
    const next = redoHistory(history);
    historyRef.current = next;
    setProps(next.current);
    setHistoryVersion((version) => version + 1);
  }, []);
  const readSavedDomain = React.useCallback((key: string): Record<string, Partial<AnimationProps>> => {
    if (typeof window === 'undefined') return {};
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) ?? '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch { return {}; }
  }, []);
  const selectTextTemplate = React.useCallback((id: string) => {
    setDocumentProps((current) => selectTextState(current, id, readSavedDomain(TEMPLATE_PROPS_STORAGE_KEY)));
  }, [readSavedDomain, setDocumentProps]);
  const selectBackgroundPreset = React.useCallback((id: string) => {
    setDocumentProps((current) => selectBackgroundState(current, id, readSavedDomain(PARTICLE_PRESET_PROPS_STORAGE_KEY)));
  }, [readSavedDomain, setDocumentProps]);

  const refreshUserPresets = React.useCallback(() => {
    setUserPresets(listNamedPresetsFromStorage());
  }, []);

  const saveNamedPreset = React.useCallback(
    (name: string): { ok: boolean; name?: string; error?: string } => {
      const saved = saveNamedPresetToStorage(name, props);
      if (!saved) {
        return { ok: false, error: 'Preset name is required' };
      }
      if ('error' in saved) return { ok: false, error: 'No se pudo guardar el preset por un error de almacenamiento.' };
      refreshUserPresets();
      return { ok: true, name: saved.name, ...(saved.replaced ? { error: 'replaced' } : {}) };
    },
    [props, refreshUserPresets]
  );

  const loadNamedPreset = React.useCallback(
    (name: string): boolean => {
      const loaded = loadNamedPresetFromStorage(name);
      if (!loaded) return false;
      setProps(loaded);
      return true;
    },
    [setProps]
  );

  const deleteNamedPreset = React.useCallback(
    (name: string): boolean => {
      const deleted = deleteNamedPresetFromStorage(name);
      if (deleted) refreshUserPresets();
      return deleted;
    },
    [refreshUserPresets]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(LAST_PROPS_STORAGE_KEY, JSON.stringify(props));
      window.localStorage.setItem(
        EDITOR_SELECTION_STORAGE_KEY,
        serializeEditorStorage({ textTemplateId: props.animationStyle, backgroundId: props.particlePreset }),
      );
    } catch {
      // Ignore localStorage write failures.
    }

    try {
      const raw = window.localStorage.getItem(TEMPLATE_PROPS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const map =
        parsed && typeof parsed === 'object' && !Array.isArray(parsed)
          ? (parsed as Partial<Record<AnimationStyle, Partial<AnimationProps>>>)
          : {};

      map[props.animationStyle] = props;
      window.localStorage.setItem(TEMPLATE_PROPS_STORAGE_KEY, JSON.stringify(map));
    } catch {
      // Ignore localStorage write failures.
    }

    try {
      const raw = window.localStorage.getItem(PARTICLE_PRESET_PROPS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const map =
        parsed && typeof parsed === 'object' && !Array.isArray(parsed)
          ? (parsed as Partial<Record<ParticlePreset, Partial<AnimationProps>>>)
          : {};

      map[props.particlePreset] = {
        enableParticles: props.enableParticles,
        particleFlowDirection: props.particleFlowDirection,
        particleSizeMin: props.particleSizeMin,
        particleSizeMax: props.particleSizeMax,
        particleLineThickness: props.particleLineThickness,
        particleGridAngle: props.particleGridAngle,
        particleBlur: props.particleBlur,
        particleColorA: props.particleColorA,
        particleColorB: props.particleColorB,
        particleBackdropColor: props.particleBackdropColor,
        particleBackdropOpacity: props.particleBackdropOpacity,
        particleLightIntensityA: props.particleLightIntensityA,
        particleLightIntensityB: props.particleLightIntensityB,
        particleLightIntensityC: props.particleLightIntensityC,
        particleMetalness: props.particleMetalness,
        particleRoughness: props.particleRoughness,
        lowpolyLightA: props.lowpolyLightA,
        lowpolyLightB: props.lowpolyLightB,
        lowpolyLightC: props.lowpolyLightC,
        lowpolyDustA: props.lowpolyDustA,
        lowpolyDustB: props.lowpolyDustB,
        lowpolyShowMirror: props.lowpolyShowMirror,
        neonBulbColorA: props.neonBulbColorA,
        neonBulbColorB: props.neonBulbColorB,
        neonBulbDensity: props.neonBulbDensity,
        neonBulbSizePx: props.neonBulbSizePx,
        neonBulbBrightness: props.neonBulbBrightness,
        neonBulbSpeed: props.neonBulbSpeed,
        neonBulbPattern: props.neonBulbPattern,
        neonBulbCombinePattern: props.neonBulbCombinePattern,
        neonBulbSecondaryPattern: props.neonBulbSecondaryPattern,
        neonBulbPatternMix: props.neonBulbPatternMix,
        neonBulbHomogeneity: props.neonBulbHomogeneity,
        neonBulbWaveLength: props.neonBulbWaveLength,
        neonBulbPatternSpeed: props.neonBulbPatternSpeed,
        neonBulbContrast: props.neonBulbContrast,
        neonBulbSoftness: props.neonBulbSoftness,
        neonBulbReverse: props.neonBulbReverse,
        neonBulbPatternAngle: props.neonBulbPatternAngle,
        neonBulbCenterX: props.neonBulbCenterX,
        neonBulbCenterY: props.neonBulbCenterY,
        stellarDensity: props.stellarDensity,
        stellarDistribution: props.stellarDistribution,
        stellarSize: props.stellarSize,
        stellarSizeVariation: props.stellarSizeVariation,
        stellarDepth: props.stellarDepth,
        stellarPerspective: props.stellarPerspective,
        stellarMotionMode: props.stellarMotionMode,
        stellarSpeed: props.stellarSpeed,
        stellarDriftAngle: props.stellarDriftAngle,
        stellarParallax: props.stellarParallax,
        stellarCameraMotion: props.stellarCameraMotion,
        stellarSway: props.stellarSway,
        stellarRotation: props.stellarRotation,
        stellarZSpeed: props.stellarZSpeed,
        stellarStreaks: props.stellarStreaks,
        stellarBrightness: props.stellarBrightness,
        stellarGlow: props.stellarGlow,
        stellarTwinkle: props.stellarTwinkle,
        stellarColorMode: props.stellarColorMode,
        stellarColorA: props.stellarColorA,
        stellarColorB: props.stellarColorB,
        stellarTemperatureVariation: props.stellarTemperatureVariation,
        stellarDof: props.stellarDof,
        stellarFocusPlane: props.stellarFocusPlane,
        stellarDepthFog: props.stellarDepthFog,
        stellarDust: props.stellarDust,
        stellarNebula: props.stellarNebula,
        stellarNebulaScale: props.stellarNebulaScale,
        stellarNebulaSpeed: props.stellarNebulaSpeed,
        stellarNebulaIntensity: props.stellarNebulaIntensity,
        stellarNebulaColor: props.stellarNebulaColor,
        stellarSeed: props.stellarSeed,
      };
      window.localStorage.setItem(PARTICLE_PRESET_PROPS_STORAGE_KEY, JSON.stringify(map));
    } catch {
      // Ignore localStorage write failures.
    }
  }, [props]);

  useEffect(() => {
    refreshUserPresets();
  }, [refreshUserPresets]);

  return (
    <AnimationContext.Provider
      value={{
        props,
        setProps: setDocumentProps,
        userPresets,
    saveNamedPreset,
    loadNamedPreset,
    deleteNamedPreset,
        canUndo: Boolean(historyRef.current?.past.length) && historyVersion >= 0,
        canRedo: Boolean(historyRef.current?.future.length) && historyVersion >= 0,
        undo,
        redo,
        selectTextTemplate,
        selectBackgroundPreset,
        setPreviewFrame,
        getPreviewFrame,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};

export function useAnimation() {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within AnimationProvider');
  }
  return context;
}

export const getEasing = (style: string) => {
  switch (style) {
    case 'quad': return Easing.inOut(Easing.quad);
    case 'ease': return Easing.inOut(Easing.ease);
    case 'linear': return Easing.linear;
    case 'bezier': return Easing.bezier(0.8, 0, 0.2, 1);
    case 'cubic':
    default: return Easing.out(Easing.cubic);
  }
};

export const getAdaptiveBorderWidth = (borderWidth: number, fontSize: number): number => {
  if (!Number.isFinite(borderWidth) || borderWidth <= 0) return 0;
  const safeWidth = Math.max(0, borderWidth);
  const safeFontSize = Number.isFinite(fontSize) ? Math.max(1, fontSize) : 120;
  const referenceFont = 120;
  const scale = safeFontSize <= referenceFont ? 1 : Math.pow(referenceFont / safeFontSize, 0.78);
  const adjusted = safeWidth * scale;
  return Number(Math.max(0.1, adjusted).toFixed(2));
};
