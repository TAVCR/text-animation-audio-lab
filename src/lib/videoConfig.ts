export type AspectRatio = '16:9' | '9:16' | '1:1';
export type ResolutionPreset = '1080p' | '1440p' | '4k' | '8k';

export const REMOTION_FPS = 30;
export const DEFAULT_DURATION_IN_FRAMES = 150;
export const MIN_DURATION_IN_FRAMES = 15;
export const MAX_DURATION_IN_FRAMES = 3600;
export const MIN_SPEED_MULTIPLIER = 0.2;
export const MAX_SPEED_MULTIPLIER = 3;

export const RESOLUTION_PRESETS: Array<{ value: ResolutionPreset; label: string; scale: number }> = [
  { value: '1080p', label: '1080p (FHD)', scale: 1 },
  { value: '1440p', label: '1440p (QHD)', scale: 4 / 3 },
  { value: '4k', label: '4K (UHD)', scale: 2 },
  { value: '8k', label: '8K (Experimental)', scale: 4 },
];

const getBaseDimensions = (aspectRatio: AspectRatio): { width: number; height: number } => {
  switch (aspectRatio) {
    case '9:16':
      return { width: 1080, height: 1920 };
    case '1:1':
      return { width: 1080, height: 1080 };
    case '16:9':
    default:
      return { width: 1920, height: 1080 };
  }
};

const getResolutionScale = (preset: ResolutionPreset): number => {
  return RESOLUTION_PRESETS.find((item) => item.value === preset)?.scale ?? 1;
};

export const sanitizeDurationInFrames = (value: unknown): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_DURATION_IN_FRAMES;
  return Math.max(MIN_DURATION_IN_FRAMES, Math.min(MAX_DURATION_IN_FRAMES, Math.round(numeric)));
};

export const sanitizeSpeedMultiplier = (value: unknown): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 1;
  return Math.max(MIN_SPEED_MULTIPLIER, Math.min(MAX_SPEED_MULTIPLIER, numeric));
};

export const getEffectiveDurationInFrames = (
  baseDurationInFrames: unknown,
  speedMultiplier: unknown,
  speedControlsDuration: boolean
): number => {
  const base = sanitizeDurationInFrames(baseDurationInFrames);
  // Kept in the signature for legacy preset compatibility. Effect speed is
  // applied to local animation progress; it must never change clip length.
  void speedMultiplier;
  void speedControlsDuration;
  return base;
};

export type DisplayedDurationInput = {
  motionDurationFrames: number;
  speed: number;
  speedControlsDuration: boolean;
};

export type DisplayedDurationEdit = {
  motionDurationFrames: number;
  effectiveDurationInFrames: number;
  error: string | null;
};

export const setDisplayedDurationSeconds = (
  previous: DisplayedDurationInput,
  seconds: number,
  fps: number = REMOTION_FPS,
): DisplayedDurationEdit => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return {
      motionDurationFrames: sanitizeDurationInFrames(previous.motionDurationFrames),
      effectiveDurationInFrames: getEffectiveDurationInFrames(
        previous.motionDurationFrames,
        previous.speed,
        previous.speedControlsDuration,
      ),
      error: 'Duration must be a positive finite number.',
    };
  }

  const requestedFrames = Math.round(seconds * fps);
  const motionDurationFrames = sanitizeDurationInFrames(requestedFrames);
  const effectiveDurationInFrames = getEffectiveDurationInFrames(
    motionDurationFrames,
    previous.speed,
    previous.speedControlsDuration,
  );
  const wasClamped = motionDurationFrames !== requestedFrames;

  return {
    motionDurationFrames,
    effectiveDurationInFrames,
    error: wasClamped ? 'Requested duration exceeds the supported range.' : null,
  };
};

const parseDurationList = (value: unknown): number[] => {
  if (typeof value !== 'string' || value.trim().length === 0) return [];
  return value
    .split(/[\n,]+/)
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
};

const getKineticFallbackDurationSeconds = (value: unknown, fallback: number): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return Math.max(0.15, fallback);
  return Math.max(0.15, numeric);
};

export const getKineticBoxCountFromText = (text: unknown): number => {
  if (typeof text !== 'string') return 1;
  const words = text.match(/\S+/g) ?? [];
  return Math.max(1, words.length);
};

type KineticDurationInput = {
  text?: unknown;
  boxSequenceDurationsRaw?: unknown;
  boxSequenceDurationOne?: unknown;
  boxSequenceDurationTwo?: unknown;
  boxSequenceDurationThree?: unknown;
  boxSequenceDurationFour?: unknown;
};

export const getKineticRequestedDurationInFrames = (
  input: KineticDurationInput,
  fps: number = REMOTION_FPS
): number => {
  const count = getKineticBoxCountFromText(input.text);
  const durationList = parseDurationList(input.boxSequenceDurationsRaw);
  const fallbackDurations = [
    getKineticFallbackDurationSeconds(input.boxSequenceDurationOne, 1),
    getKineticFallbackDurationSeconds(
      input.boxSequenceDurationTwo,
      getKineticFallbackDurationSeconds(input.boxSequenceDurationOne, 1)
    ),
    getKineticFallbackDurationSeconds(
      input.boxSequenceDurationThree,
      getKineticFallbackDurationSeconds(
        input.boxSequenceDurationTwo,
        getKineticFallbackDurationSeconds(input.boxSequenceDurationOne, 1)
      )
    ),
    getKineticFallbackDurationSeconds(
      input.boxSequenceDurationFour,
      getKineticFallbackDurationSeconds(
        input.boxSequenceDurationThree,
        getKineticFallbackDurationSeconds(
          input.boxSequenceDurationTwo,
          getKineticFallbackDurationSeconds(input.boxSequenceDurationOne, 1)
        )
      )
    ),
  ];

  const requestedFrames = Array.from({ length: count }, (_, index) => {
    const seconds = durationList[index] ?? fallbackDurations[index] ?? fallbackDurations[fallbackDurations.length - 1];
    return Math.max(2, Math.round(seconds * fps));
  });

  return Math.max(2, requestedFrames.reduce((acc, value) => acc + value, 0));
};

type ResolvedDurationInput = KineticDurationInput & {
  animationStyle?: unknown;
  speed?: unknown;
  speedControlsDuration?: unknown;
  motionDurationFrames?: unknown;
  text?: unknown;
  typewriterCharactersPerSecond?: unknown;
};

export const getResolvedDurationInFrames = (
  input: ResolvedDurationInput,
  fps: number = REMOTION_FPS
): number => {
  void fps;
  return sanitizeDurationInFrames(input.motionDurationFrames);
};

// Frozen legacy semantics, used only while loading an unversioned document.
// Keep this separate from the resolver shared by Player, Root and export.
export const getLegacyDurationInFrames = (
  input: ResolvedDurationInput,
  fps: number = REMOTION_FPS,
): number => {
  if (input.animationStyle === 'kinetic-box-sequence') {
    return getKineticRequestedDurationInFrames(input, fps);
  }
  const base = sanitizeDurationInFrames(input.motionDurationFrames);
  const baseDuration = input.speedControlsDuration === false
    ? base
    : sanitizeDurationInFrames(base / sanitizeSpeedMultiplier(input.speed));
  if (input.animationStyle !== 'typewriter' || typeof input.text !== 'string') return baseDuration;
  const graphemeCount = typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(input.text)).length
    : Array.from(input.text).length;
  const cpsValue = typeof input.typewriterCharactersPerSecond === 'number' ? input.typewriterCharactersPerSecond : Number(input.typewriterCharactersPerSecond);
  const cps = Number.isFinite(cpsValue) ? Math.max(1, Math.min(60, cpsValue)) : 15;
  const required = Math.max(1, Math.ceil((Math.max(0, graphemeCount) / cps) * (Number.isFinite(fps) && fps > 0 ? fps : 30)));
  return Math.max(baseDuration, required);
};

export const getCompositionDimensions = (
  aspectRatio: AspectRatio,
  resolutionPreset: ResolutionPreset
): { width: number; height: number } => {
  const base = getBaseDimensions(aspectRatio);
  const scale = getResolutionScale(resolutionPreset);

  return {
    width: Math.max(2, Math.round(base.width * scale)),
    height: Math.max(2, Math.round(base.height * scale)),
  };
};
