'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { defaultAnimationProps, useAnimation } from '@/lib/AnimationContext';
import {
  getKineticRequestedDurationInFrames,
  MAX_DURATION_IN_FRAMES,
  MIN_DURATION_IN_FRAMES,
  REMOTION_FPS,
  RESOLUTION_PRESETS,
  getResolvedDurationInFrames,
  setDisplayedDurationSeconds,
  sanitizeDurationInFrames,
  sanitizeSpeedMultiplier,
} from '@/lib/videoConfig';
import { useRenderExport } from '@/lib/hooks/useRenderExport';
import { Accordion, compactInputClass } from './primitives';
import ParticlesTab from './ParticlesTab';
import { WordContentSynchronizer } from './WordContentSynchronizer';
import { useDraftValue } from '@/lib/editor/useDraftValue';
import { useEditorSession } from '@/lib/editor/EditorSessionContext';
import { useExportSession } from '@/lib/editor/ExportContext';
import { runSingleExport } from '@/lib/editor/exportOrchestration';
import { runBatchExport } from '@/lib/editor/batchOrchestration';
import { sanitizeExportFileName } from '@/lib/editor/exportFilesystem';

export type InspectorTab = 'global' | 'text3d' | 'particles' | 'export';

const FONT_OPTIONS = [
  'Poppins',
  'Montserrat',
  'Oswald',
  'Roboto',
  'Inter',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Courier New',
  'Verdana',
  'Impact',
];

const ANIMATION_STYLE_OPTIONS: Array<{ value: string; labelEs: string; labelEn: string }> = [
  { value: 'typewriter', labelEs: 'Typewriter (Clásico)', labelEn: 'Typewriter (Classic)' },
  { value: 'slide-in', labelEs: 'Kinetic Slide-in', labelEn: 'Kinetic Slide-in' },
  { value: 'kinetic-box-sequence', labelEs: 'Kinetic Box Sequence', labelEn: 'Kinetic Box Sequence' },
  { value: 'apple-style', labelEs: 'Apple Style Text', labelEn: 'Apple Style Text' },
  { value: 'bubble-pop', labelEs: 'Bubble Pop', labelEn: 'Bubble Pop' },
  { value: 'glitch', labelEs: 'Cyberpunk Glitch', labelEn: 'Cyberpunk Glitch' },
  { value: 'wipe-reveal', labelEs: 'Smooth Wipe Reveal', labelEn: 'Smooth Wipe Reveal' },
  { value: 'blur-reveal', labelEs: 'Cinematic Blur Reveal', labelEn: 'Cinematic Blur Reveal' },
  { value: 'scramble', labelEs: 'Hacker Scramble', labelEn: 'Hacker Scramble' },
  { value: 'neon-pulse', labelEs: 'Neon Flicker Pulse', labelEn: 'Neon Flicker Pulse' },
  { value: 'flicker', labelEs: 'Broken Film Flicker', labelEn: 'Broken Film Flicker' },
  { value: 'flicker-outline-fill', labelEs: 'Flicker (Borde a Relleno)', labelEn: 'Flicker (Outline to Fill)' },
  { value: 'smooth-sliding', labelEs: 'Smooth Cascade Sliding', labelEn: 'Smooth Cascade Sliding' },
  { value: 'slide-reveal', labelEs: 'Solid Box Reveal', labelEn: 'Solid Box Reveal' },
  { value: 'shape-reveal', labelEs: 'Shape Reveal', labelEn: 'Shape Reveal' },
  { value: 'fly-through', labelEs: '3D Camera Fly-Through', labelEn: '3D Camera Fly-Through' },
  { value: 'clean-modern', labelEs: 'Clean Modern', labelEn: 'Clean Modern' },
  { value: 'bar-reveal', labelEs: 'Bar Reveal & Replace', labelEn: 'Bar Reveal & Replace' },
  { value: 'follower-grow', labelEs: 'Follower Grow', labelEn: 'Follower Grow' },
  { value: 'follower', labelEs: 'Character Cascade Drop', labelEn: 'Character Cascade Drop' },
  { value: 'rotation', labelEs: '3D Rotation By Word', labelEn: '3D Rotation By Word' },
  { value: 'viral-text', labelEs: 'Viral Text', labelEn: 'Viral Text' },
  { value: 'shake-flicker', labelEs: 'Shake Errático', labelEn: 'Erratic Shake' },
  { value: 'blur-cascade', labelEs: 'Blurring Text Cascade', labelEn: 'Blurring Text Cascade' },
  { value: 'cinematic', labelEs: 'Cinematic Text', labelEn: 'Cinematic Text' },
  { value: 'extruded-3d', labelEs: 'Impacto 3D Real', labelEn: 'Real 3D Impact' },
];

const FONT_3D_PRESETS = [
  'auto',
  'helvetiker-regular',
  'helvetiker-bold',
  'optimer-regular',
  'optimer-bold',
  'gentilis-regular',
  'gentilis-bold',
  'droid-serif-regular',
  'droid-serif-bold',
  'droid-mono',
] as const;

const TABS: Array<{ id: InspectorTab; label: string }> = [
  { id: 'global', label: 'Global' },
  { id: 'text3d', label: 'Text & 3D' },
  { id: 'particles', label: 'Particles' },
  { id: 'export', label: 'Export' },
];

const isHexColor = (value: string): boolean => /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value);

const GLOBAL_RESET_KEYS: Array<keyof typeof defaultAnimationProps> = [
  'aspectRatio',
  'resolutionPreset',
  'backgroundColor',
  'speed',
  'motionPhase',
  'motionDurationFrames',
  'speedControlsDuration',
  'reverseOutAnimation',
  'textPositionX',
  'textPositionY',
  'startZ',
  'endZ',
];

const TEXT3D_RESET_KEYS: Array<keyof typeof defaultAnimationProps> = [
  'animationStyle',
  'text',
  'titleText',
  'subtitleText',
  'wordTwo',
  'wordThree',
  'showWordTwo',
  'showWordThree',
  'textRangeStyles',
  'fontFamily',
  'fontFamilyTwo',
  'fontFamilyThree',
  'fontWeight',
  'fontWeightTwo',
  'fontWeightThree',
  'fontSize',
  'fontSizeTwo',
  'fontSizeThree',
  'color',
  'colorTwo',
  'colorThree',
  'enableBorder',
  'enableBorderTwo',
  'enableBorderThree',
  'borderColor',
  'borderColorTwo',
  'borderColorThree',
  'borderWidth',
  'borderWidthTwo',
  'borderWidthThree',
  'enableFill',
  'enableFillTwo',
  'enableFillThree',
  'enableShadow',
  'enableShadowTwo',
  'enableShadowThree',
  'shadowColor',
  'shadowColorTwo',
  'shadowColorThree',
  'shadowBlur',
  'shadowBlurTwo',
  'shadowBlurThree',
  'letterSpacing',
  'letterSpacingTwo',
  'letterSpacingThree',
  'lineHeight',
  'lineHeightTwo',
  'lineHeightThree',
  'slideDirection',
  'followerDirection',
  'smoothCascadeDirection',
  'cinematicDirection',
  'wordSpeedOne',
  'wordSpeedTwo',
  'wordSpeedThree',
  'viralWordStagger',
  'enableGradient',
  'gradientStart',
  'gradientEnd',
  'boxColor',
  'shapeGradientWidth',
  'shapeBorderRadius',
  'boxSequenceCount',
  'boxSequenceMode',
  'boxSequenceDirection',
  'boxSequenceTextsRaw',
  'boxSequenceDurationsRaw',
  'boxSequenceColorsRaw',
  'boxSequenceTextColorsRaw',
  'boxSequenceFontFamiliesRaw',
  'boxSequenceFontWeightsRaw',
  'boxSequenceFontSizesRaw',
  'boxSequenceTextTwo',
  'boxSequenceTextThree',
  'boxSequenceTextFour',
  'boxSequenceDurationOne',
  'boxSequenceDurationTwo',
  'boxSequenceDurationThree',
  'boxSequenceDurationFour',
  'boxSequenceUseGradient',
  'boxSequenceGradientStart',
  'boxSequenceGradientEnd',
  'boxSequenceColorOne',
  'boxSequenceColorTwo',
  'boxSequenceColorThree',
  'boxSequenceColorFour',
  'boxSequenceWidth',
  'boxSequenceBorderRadius',
  'boxSequenceHeightScale',
  'font3dPreset',
  'useFont3dOverride',
  'metalPreset',
  'metalTone',
  'metalBrightness',
  'metalContrast',
  'letterSpacing3d',
  'lineHeight3d',
  'extrudeDepth3d',
  'typewriterCursorFollowTextStyle',
  'showTextLayer',
  'circuitBaseImage',
  'showCircuitBaseImage',
];

const TEXT_PANEL_RESET_KEYS: Array<keyof typeof defaultAnimationProps> = TEXT3D_RESET_KEYS.filter(
  (key) => key !== 'animationStyle'
);

const PARTICLES_RESET_KEYS: Array<keyof typeof defaultAnimationProps> = [
  'enableParticles',
  'particlePreset',
  'particleCount',
  'particleOpacity',
  'particleSpeed',
  'particleFlowDirection',
  'particleSizeMin',
  'particleSizeMax',
  'particleLineThickness',
  'particleGridAngle',
  'particleBlur',
  'particleColorA',
  'particleColorB',
  'particleBackdropColor',
  'particleBackdropOpacity',
  'particleLightIntensityA',
  'particleLightIntensityB',
  'particleLightIntensityC',
  'particleMetalness',
  'particleRoughness',
  'lowpolyLightA',
  'lowpolyLightB',
  'lowpolyLightC',
  'lowpolyDustA',
  'lowpolyDustB',
  'lowpolyShowMirror',
];

const EXPORT_RESET_KEYS: Array<keyof typeof defaultAnimationProps> = ['isTransparent'];

const RESET_KEYS_BY_TAB: Record<InspectorTab, Array<keyof typeof defaultAnimationProps>> = {
  global: GLOBAL_RESET_KEYS,
  text3d: TEXT3D_RESET_KEYS,
  particles: PARTICLES_RESET_KEYS,
  export: EXPORT_RESET_KEYS,
};

const buildResetPatch = (keys: Array<keyof typeof defaultAnimationProps>) => {
  return Object.fromEntries(keys.map((key) => [key, defaultAnimationProps[key]])) as Partial<
    typeof defaultAnimationProps
  >;
};

type InspectorPanelLegacyProps = {
  forcedTab?: InspectorTab;
  hideHeader?: boolean;
  globalView?: 'all' | 'presets-only' | 'settings-only';
};

export default function InspectorPanelLegacy({
  forcedTab,
  hideHeader = false,
  globalView = 'all',
}: InspectorPanelLegacyProps) {
  const { props, setProps, userPresets, saveNamedPreset, loadNamedPreset, selectTextTemplate, getPreviewFrame } = useAnimation();
  const { uiLanguage, setUiLanguage, editWordByWord, setEditWordByWord } = useEditorSession();
  const {
    exportMode,
    setExportMode,
    batchTextInput,
    batchRenderResults,
    setBatchRenderResults,
    transparentCodec,
    setTransparentCodec,
    exportState,
    dispatchExport,
    batchProgress,
    setBatchProgress,
    tryAcquireExport,
    releaseExport,
  } = useExportSession();
  const [activeTab, setActiveTab] = React.useState<InspectorTab>(forcedTab ?? 'global');
  const { isRendering, renderUrl, setRenderUrl, renderDiagnostics, saveVideo, renderVideo, renderStillFrame, chooseDestination, chooseDirectory, writeVideo, handlePropChange } = useRenderExport({ props, setProps, exportSession: { tryAcquireExport, releaseExport, dispatchExport } });
  const [presetNameDraft, setPresetNameDraft] = React.useState('');
  const [selectedPresetName, setSelectedPresetName] = React.useState('');
  const [presetFeedback, setPresetFeedback] = React.useState<string | null>(null);
  const [renderPipelinePreference, setRenderPipelinePreference] = React.useState<'auto' | 'gpu' | 'cpu'>('auto');
  const exportBusy = exportState.status === 'selecting-destination' || exportState.status === 'rendering' || exportState.status === 'writing';
  const [textDraft, setTextDraft] = React.useState(props.text);
  const textDraftOriginRef = React.useRef(props.text);
  const speedDraftState = useDraftValue(props.speed, (value) => setProps((prev) => ({ ...prev, speed: sanitizeSpeedMultiplier(Number(value)) })));
  const isAiCircuitHud = false;
  const [rangeFillColor, setRangeFillColor] = React.useState('#ffffff');
  const [rangeStrokeColor, setRangeStrokeColor] = React.useState('#66ccff');
  const [rangeStrokeWidth, setRangeStrokeWidth] = React.useState(3);
  const [rangeGradientStart, setRangeGradientStart] = React.useState('#66ccff');
  const [rangeGradientEnd, setRangeGradientEnd] = React.useState('#ff55c7');
  const [wordGradient1A, setWordGradient1A] = React.useState('#66ccff');
  const [wordGradient1B, setWordGradient1B] = React.useState('#ff55c7');
  const [wordGradient2A, setWordGradient2A] = React.useState('#66ccff');
  const [wordGradient2B, setWordGradient2B] = React.useState('#ff55c7');
  const [wordGradient3A, setWordGradient3A] = React.useState('#66ccff');
  const [wordGradient3B, setWordGradient3B] = React.useState('#ff55c7');
  const [wordTypo1Enabled, setWordTypo1Enabled] = React.useState(false);
  const [wordTypo2Enabled, setWordTypo2Enabled] = React.useState(false);
  const [wordTypo3Enabled, setWordTypo3Enabled] = React.useState(false);
  const [wordFont1, setWordFont1] = React.useState(props.fontFamily);
  const [wordFont2, setWordFont2] = React.useState(props.fontFamilyTwo || props.fontFamily);
  const [wordFont3, setWordFont3] = React.useState(props.fontFamilyThree || props.fontFamily);
  const [wordSize1, setWordSize1] = React.useState(props.fontSize);
  const [wordSize2, setWordSize2] = React.useState(props.fontSizeTwo || props.fontSize);
  const [wordSize3, setWordSize3] = React.useState(props.fontSizeThree || props.fontSize);
  const [charFontFamily, setCharFontFamily] = React.useState(props.fontFamily);
  const [charFontSize, setCharFontSize] = React.useState(props.fontSize);
  const [charTransparentFill, setCharTransparentFill] = React.useState(false);
  const [charMenuState, setCharMenuState] = React.useState<{
    visible: boolean;
    x: number;
    y: number;
    index: number;
  }>({ visible: false, x: 0, y: 0, index: -1 });
  const [charMenuPosition, setCharMenuPosition] = React.useState<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });
  const charMenuRef = React.useRef<HTMLDivElement | null>(null);
  const charPreviewRef = React.useRef<HTMLDivElement | null>(null);
  const [isClient, setIsClient] = React.useState(false);
  const showGlobalPresets = globalView !== 'settings-only';
  const showGlobalSettings = globalView !== 'presets-only';

  React.useEffect(() => {
    if (forcedTab) setActiveTab(forcedTab);
  }, [forcedTab]);

  const segmentedWords = React.useMemo(() => props.text.match(/\S+/g) ?? [], [props.text]);
  const segmentedRanges = React.useMemo(() => {
    const ranges: Array<{ start: number; end: number; word: string }> = [];
    const regex = /\S+/g;
    let match = regex.exec(props.text);
    while (match) {
      ranges.push({
        start: match.index,
        end: match.index + match[0].length,
        word: match[0],
      });
      match = regex.exec(props.text);
    }
    return ranges;
  }, [props.text]);

  const totalDurationInFrames = getResolvedDurationInFrames(props, REMOTION_FPS);
  const totalDurationSeconds = totalDurationInFrames / REMOTION_FPS;
  const supportsWordTwo = segmentedWords.length >= 2;
  const supportsWordThree = segmentedWords.length >= 3;
  const supportsSecondaryWordStyling = segmentedWords.length >= 2;
  const supportsTertiaryWordStyling = segmentedWords.length >= 3;
  const isKineticBoxSequence = props.animationStyle === 'kinetic-box-sequence';
  const kineticBoxCount = Math.max(1, segmentedWords.length);
  const parseColorList = React.useCallback((value: string): string[] => {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter((item) => isHexColor(item));
  }, []);
  const kineticBackgroundFallback = React.useMemo(() => ([
    props.boxSequenceColorOne || '#ff0055',
    props.boxSequenceColorTwo || '#00d4ff',
    props.boxSequenceColorThree || '#ffd400',
    props.boxSequenceColorFour || '#8b5cf6',
  ]), [
    props.boxSequenceColorOne,
    props.boxSequenceColorTwo,
    props.boxSequenceColorThree,
    props.boxSequenceColorFour,
  ]);
  const kineticTextFallback = React.useMemo(() => ([
    props.color || '#ffffff',
    props.colorTwo || props.color || '#ffffff',
    props.colorThree || props.color || '#ffffff',
  ]), [
    props.color,
    props.colorTwo,
    props.colorThree,
  ]);
  const kineticBackgroundColors = React.useMemo(() => {
    const raw = parseColorList(props.boxSequenceColorsRaw || '');
    return Array.from({ length: kineticBoxCount }, (_, index) =>
      raw[index]
      ?? kineticBackgroundFallback[index]
      ?? kineticBackgroundFallback[index % kineticBackgroundFallback.length]
      ?? '#ff0055'
    );
  }, [kineticBackgroundFallback, kineticBoxCount, parseColorList, props.boxSequenceColorsRaw]);
  const kineticTextColors = React.useMemo(() => {
    const raw = parseColorList(props.boxSequenceTextColorsRaw || '');
    return Array.from({ length: kineticBoxCount }, (_, index) =>
      raw[index]
      ?? kineticTextFallback[index]
      ?? kineticTextFallback[index % kineticTextFallback.length]
      ?? '#ffffff'
    );
  }, [kineticBoxCount, kineticTextFallback, parseColorList, props.boxSequenceTextColorsRaw]);
  const updateKineticColorList = React.useCallback((
    field: 'boxSequenceColorsRaw' | 'boxSequenceTextColorsRaw',
    index: number,
    color: string
  ) => {
    setProps((prev) => {
      const fallback = field === 'boxSequenceColorsRaw'
        ? [
          prev.boxSequenceColorOne || '#ff0055',
          prev.boxSequenceColorTwo || '#00d4ff',
          prev.boxSequenceColorThree || '#ffd400',
          prev.boxSequenceColorFour || '#8b5cf6',
        ]
        : [
          prev.color || '#ffffff',
          prev.colorTwo || prev.color || '#ffffff',
          prev.colorThree || prev.color || '#ffffff',
        ];
      const parsed = parseColorList(prev[field] || '');
      const next = [...parsed];
      for (let i = 0; i <= index; i += 1) {
        if (next[i]) continue;
        next[i] = fallback[i] ?? fallback[fallback.length - 1] ?? (field === 'boxSequenceColorsRaw' ? '#ff0055' : '#ffffff');
      }
      next[index] = color;
      return {
        ...prev,
        [field]: next.join(', '),
      };
    });
  }, [parseColorList, setProps]);
  const parseDurationList = React.useCallback((value: string): number[] => {
    return value
      .split(/[\n,]+/)
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item) && item > 0);
  }, []);
  const kineticDurationSeconds = React.useMemo(() => {
    const parsed = parseDurationList(props.boxSequenceDurationsRaw || '');
    const fallbackOne = Math.max(0.15, props.boxSequenceDurationOne || 1);
    const fallbackTwo = Math.max(0.15, props.boxSequenceDurationTwo || fallbackOne);
    const fallbackThree = Math.max(0.15, props.boxSequenceDurationThree || fallbackTwo);
    const fallbackFour = Math.max(0.15, props.boxSequenceDurationFour || fallbackThree);
    const fallback = [fallbackOne, fallbackTwo, fallbackThree, fallbackFour];
    return Array.from({ length: kineticBoxCount }, (_, index) =>
      parsed[index] ?? fallback[index] ?? fallback[fallback.length - 1]
    );
  }, [
    kineticBoxCount,
    parseDurationList,
    props.boxSequenceDurationFour,
    props.boxSequenceDurationOne,
    props.boxSequenceDurationThree,
    props.boxSequenceDurationTwo,
    props.boxSequenceDurationsRaw,
  ]);
  const kineticRequestedSeconds = React.useMemo(
    () => getKineticRequestedDurationInFrames(props, REMOTION_FPS) / REMOTION_FPS,
    [props]
  );
  const updateKineticDurationAtIndex = React.useCallback((index: number, value: number) => {
    const safeValue = Number.isFinite(value) ? Math.max(0.15, Math.min(20, value)) : 1;
    setProps((prev) => {
      const parsed = parseDurationList(prev.boxSequenceDurationsRaw || '');
      const fallbackOne = Math.max(0.15, prev.boxSequenceDurationOne || 1);
      const fallbackTwo = Math.max(0.15, prev.boxSequenceDurationTwo || fallbackOne);
      const fallbackThree = Math.max(0.15, prev.boxSequenceDurationThree || fallbackTwo);
      const fallbackFour = Math.max(0.15, prev.boxSequenceDurationFour || fallbackThree);
      const fallback = [fallbackOne, fallbackTwo, fallbackThree, fallbackFour];
      const count = Math.max(1, (prev.text ?? '').match(/\S+/g)?.length ?? 0);
      const next = Array.from({ length: count }, (_, i) =>
        parsed[i] ?? fallback[i] ?? fallback[fallback.length - 1]
      );
      next[index] = safeValue;
      return {
        ...prev,
        boxSequenceDurationsRaw: next.map((item) => Number(item.toFixed(2))).join(', '),
      };
    });
  }, [parseDurationList, setProps]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    if (e.target.name === 'animationStyle') {
      selectTextTemplate(e.target.value);
      return;
    }
    handlePropChange(e, {
      numberSanitizers: {
        speed: sanitizeSpeedMultiplier,
        motionDurationFrames: sanitizeDurationInFrames,
      },
    });
  };

  const beginSpeedDraft = speedDraftState.begin;
  const confirmSpeedDraft = speedDraftState.confirm;
  const handleSpeedKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); speedDraftState.cancel(); event.currentTarget.blur(); }
    if (event.key === 'Enter') { event.preventDefault(); confirmSpeedDraft(); event.currentTarget.blur(); }
  };

  const updateTotalDurationSeconds = (seconds: number) => {
    const result = setDisplayedDurationSeconds(
      {
        motionDurationFrames: props.motionDurationFrames,
        speed: props.speed,
        speedControlsDuration: props.speedControlsDuration,
      },
      seconds,
      REMOTION_FPS,
    );
    if (result.error) {
      setPresetFeedback(uiLanguage === 'es' ? result.error : 'Requested duration is outside the supported range.');
    }
    setProps((prev) => ({ ...prev, motionDurationFrames: result.motionDurationFrames }));
  };

  const handleRenderVideo = async () => {
    if (!tryAcquireExport()) return;
    try {
      setPresetFeedback(null);
      let batchLines: Array<{ text: string; lineNumber: number }> | undefined;

      if (exportMode === 'batch') {
        batchLines = batchTextInput
          .split(/\r?\n/)
          .map((line, index) => ({ text: line.trim(), lineNumber: index + 1 }))
          .filter((line) => line.text.length > 0);
        if (batchLines.length === 0) {
          throw new Error(
            uiLanguage === 'es'
              ? 'Agrega al menos una línea para render por lotes.'
              : 'Add at least one line for batch render.'
          );
        }
      }

      if (exportMode === 'batch') {
        const extension = props.isTransparent ? (transparentCodec === 'vp9' ? 'webm' : 'mov') : 'mp4';
        dispatchExport({ type: 'destination-selecting' });
        const result = await runBatchExport({
          lines: batchLines || [],
          chooseDestination: chooseDirectory,
          render: async (line) => {
            dispatchExport({ type: 'rendering' });
            const rendered = await renderVideo({ transparentCodec, batchTexts: [line], publishResult: false, renderPipelinePreference });
            if (rendered.mode !== 'batch' || !rendered.renders[0]) throw new Error('Respuesta de batch inválida.');
            return { url: rendered.renders[0].url };
          },
          write: async (destination, rendered, fileName) => {
            dispatchExport({ type: 'writing' });
            return writeVideo(destination as Parameters<typeof writeVideo>[0], rendered.url, extension, fileName);
          },
          extension,
          onProgress: setBatchProgress,
        });
        if (result.cancelled) {
          dispatchExport({ type: 'destination-cancelled' });
          setBatchProgress(null);
        } else {
          setBatchRenderResults(result.items.map((item) => ({ url: item.url || '', fileName: item.fileName, lineNumber: item.lineNumber, text: item.line, status: item.status === 'completed' ? 'completed' : 'failed', delivery: item.delivery, error: item.error })));
          const allDownloaded = result.items.filter((item) => item.status === 'completed').every((item) => item.delivery === 'download-requested');
          dispatchExport(result.failed > 0 ? { type: 'failed', error: `${result.failed} elementos fallaron.` } : { type: 'completed', result: { fileName: 'batch', url: '', delivery: allDownloaded ? 'download-requested' : 'written' } });
          alert(`${result.completed} completados · ${result.failed} fallidos`);
          setBatchProgress(null);
        }
      } else {
        const extension = props.isTransparent ? (transparentCodec === 'vp9' ? 'webm' : 'mov') : 'mp4';
        const exported = await runSingleExport({
          chooseDestination: () => chooseDestination(extension, props.text || 'TextAnim'),
          render: async () => {
            const result = await renderVideo({ transparentCodec, publishResult: false, renderPipelinePreference });
            if (result.mode !== 'single') throw new Error('Respuesta de exportación inválida.');
            return { fileName: sanitizeExportFileName(props.text || 'TextAnim', extension), url: result.url };
          },
          write: async (destination, rendered) => writeVideo(destination as Parameters<typeof writeVideo>[0], rendered.url, extension, rendered.fileName),
          dispatch: dispatchExport,
        });
        if (!exported) return;
        setRenderUrl(exported.url);
        alert(exported.delivery === 'download-requested' ? 'Descarga iniciada' : 'Exportación completada');
      }
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'Error desconocido';
      dispatchExport({ type: 'failed', error: message });
      alert('Error de exportación: ' + message);
    } finally {
      releaseExport();
    }
  };

  const handleRenderStillFrame = async () => {
    if (exportMode !== 'single' || exportBusy || isRendering) return;
    try {
      setPresetFeedback(null);
      await renderStillFrame(getPreviewFrame());
    } catch (error: unknown) {
      setPresetFeedback(error instanceof Error ? error.message : 'Error al exportar el fotograma PNG.');
    }
  };

  const resetActiveTab = () => {
    const patch = buildResetPatch(RESET_KEYS_BY_TAB[activeTab]);
    setProps((prev) => ({ ...prev, ...patch }));
    if (activeTab === 'export') {
      setTransparentCodec('prores');
    }
  };

  const resetTextPanel = () => {
    const patch = buildResetPatch(TEXT_PANEL_RESET_KEYS);
    setProps((prev) => ({
      ...prev,
      ...patch,
      animationStyle: prev.animationStyle,
    }));
    setEditWordByWord(false);
    setWordTypo1Enabled(false);
    setWordTypo2Enabled(false);
    setWordTypo3Enabled(false);
    setWordFont1(defaultAnimationProps.fontFamily);
    setWordFont2(defaultAnimationProps.fontFamilyTwo || defaultAnimationProps.fontFamily);
    setWordFont3(defaultAnimationProps.fontFamilyThree || defaultAnimationProps.fontFamily);
    setWordSize1(defaultAnimationProps.fontSize);
    setWordSize2(defaultAnimationProps.fontSizeTwo || defaultAnimationProps.fontSize);
    setWordSize3(defaultAnimationProps.fontSizeThree || defaultAnimationProps.fontSize);
    setWordGradient1A('#66ccff');
    setWordGradient1B('#ff55c7');
    setWordGradient2A('#66ccff');
    setWordGradient2B('#ff55c7');
    setWordGradient3A('#66ccff');
    setWordGradient3B('#ff55c7');
    setCharFontFamily(defaultAnimationProps.fontFamily);
    setCharFontSize(defaultAnimationProps.fontSize);
    setCharTransparentFill(false);
    setCharMenuState({ visible: false, x: 0, y: 0, index: -1 });
  };

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (!charMenuState.visible) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!charMenuRef.current) return;
      if (charPreviewRef.current?.contains(event.target as Node)) return;
      if (!charMenuRef.current.contains(event.target as Node)) {
        setCharMenuState((prev) => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [charMenuState.visible]);

  const repositionCharMenu = React.useCallback(() => {
    if (!charMenuState.visible || !charMenuRef.current || typeof window === 'undefined') return;
    const rect = charMenuRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const viewportPadding = 6;
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
    const maxLeft = Math.max(viewportPadding, viewportWidth - rect.width - viewportPadding);
    const maxTop = Math.max(viewportPadding, viewportHeight - rect.height - viewportPadding);
    const nextLeft = Math.min(Math.max(charMenuState.x, viewportPadding), maxLeft);
    const nextTop = Math.min(Math.max(charMenuState.y, viewportPadding), maxTop);
    const finalLeft = Math.round(nextLeft);
    const finalTop = Math.round(nextTop);
    setCharMenuPosition((prev) => {
      if (prev.left === finalLeft && prev.top === finalTop) return prev;
      return { left: finalLeft, top: finalTop };
    });
  }, [charMenuState.visible, charMenuState.x, charMenuState.y]);

  React.useEffect(() => {
    if (!charMenuState.visible) return;
    setCharMenuPosition({ left: charMenuState.x, top: charMenuState.y });
  }, [charMenuState.visible, charMenuState.x, charMenuState.y]);

  React.useLayoutEffect(() => {
    if (!charMenuState.visible || typeof window === 'undefined') return;
    repositionCharMenu();
    const rafId = window.requestAnimationFrame(repositionCharMenu);
    return () => window.cancelAnimationFrame(rafId);
  }, [charMenuState.visible, charMenuState.x, charMenuState.y, repositionCharMenu]);

  React.useEffect(() => {
    if (!charMenuState.visible || typeof window === 'undefined') return;
    const onViewportChange = () => repositionCharMenu();
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [charMenuState.visible, repositionCharMenu]);

  React.useEffect(() => {
    if (!wordTypo1Enabled) {
      setWordFont1(props.fontFamily);
      setWordSize1(props.fontSize);
    }
  }, [wordTypo1Enabled, props.fontFamily, props.fontSize]);

  React.useEffect(() => {
    if (!wordTypo2Enabled) {
      setWordFont2(props.fontFamilyTwo || props.fontFamily);
      setWordSize2(props.fontSizeTwo || props.fontSize);
    }
  }, [wordTypo2Enabled, props.fontFamilyTwo, props.fontFamily, props.fontSizeTwo, props.fontSize]);

  React.useEffect(() => {
    if (!wordTypo3Enabled) {
      setWordFont3(props.fontFamilyThree || props.fontFamily);
      setWordSize3(props.fontSizeThree || props.fontSize);
    }
  }, [wordTypo3Enabled, props.fontFamilyThree, props.fontFamily, props.fontSizeThree, props.fontSize]);

  React.useEffect(() => {
    if (!charMenuState.visible || charMenuState.index < 0) return;
    const existing = (props.textRangeStyles ?? []).find(
      (style) =>
        (style.id.startsWith('char-') && style.id === `char-${charMenuState.index}`) ||
        (style.id.startsWith('char-') &&
          charMenuState.index >= Math.floor(style.start) &&
          charMenuState.index < Math.floor(style.end))
    );
    setCharFontFamily(existing?.fontFamily || props.fontFamily);
    setCharFontSize(existing?.fontSize || props.fontSize);
    setCharTransparentFill(existing?.fillColor === 'transparent');
  }, [charMenuState.visible, charMenuState.index, props.textRangeStyles, props.fontFamily, props.fontSize]);

  React.useEffect(() => {
    if (userPresets.length === 0) {
      setSelectedPresetName('');
      return;
    }

    const exists = userPresets.some((preset) => preset.name === selectedPresetName);
    if (!exists) {
      setSelectedPresetName(userPresets[0].name);
    }
  }, [userPresets, selectedPresetName]);

  React.useEffect(() => {
    if (exportMode === 'batch') setRenderUrl(null);
  }, [exportMode, setRenderUrl]);

  React.useEffect(() => {
    setProps((prev) => {
      const ranges = segmentedRanges;
      const next = (prev.textRangeStyles ?? []).map((style) => {
        if (style.id === 'word-gradient-1' && ranges[0]) {
          return { ...style, start: ranges[0].start, end: ranges[0].end };
        }
        if (style.id === 'word-gradient-2' && ranges[1]) {
          return { ...style, start: ranges[1].start, end: ranges[1].end };
        }
        if (style.id === 'word-gradient-3' && ranges[2]) {
          return { ...style, start: ranges[2].start, end: ranges[2].end };
        }
        return style;
      });
      const same =
        next.length === (prev.textRangeStyles ?? []).length &&
        next.every((style, idx) => JSON.stringify(style) === JSON.stringify((prev.textRangeStyles ?? [])[idx]));
      if (same) return prev;
      return { ...prev, textRangeStyles: next };
    });
  }, [segmentedRanges, setProps]);

  React.useEffect(() => {
    setProps((prev) => {
      const current = prev.textRangeStyles ?? [];
      const next = current.filter((style) => {
        if (style.id === 'word-gradient-2' && !prev.showWordTwo) return false;
        if (style.id === 'word-gradient-3' && !prev.showWordThree) return false;
        if (style.id.startsWith('word-style-2-') && !prev.showWordTwo) return false;
        if (style.id.startsWith('word-style-3-') && !prev.showWordThree) return false;
        return true;
      });
      if (next.length === current.length) return prev;
      return { ...prev, textRangeStyles: next };
    });
  }, [props.showWordTwo, props.showWordThree, setProps]);

  React.useEffect(() => {
    if (!editWordByWord) return;
    setProps((prev) => {
      const styles = prev.textRangeStyles ?? [];
      const baseWithoutWord = styles.filter((style) => !style.id.startsWith('word-style-'));
      const charStyles = baseWithoutWord.filter((style) => style.id.startsWith('char-'));
      const base = baseWithoutWord.filter((style) => !style.id.startsWith('char-'));
      const wordStyles: typeof base = [];
      const charCuts = charStyles
        .map((style) => ({ start: style.start, end: style.end }));

      const pushWordStyle = (
        idx: 1 | 2 | 3,
        enabledFill: boolean,
        enabledBorder: boolean,
        fillColor: string,
        strokeColor: string,
        strokeWidth: number,
        enabledForWord: boolean,
        typographyEnabled: boolean,
        typographyFont: string,
        typographySize: number
      ) => {
        const range = segmentedRanges[idx - 1];
        if (!enabledForWord || !range) return;
        const hasFill = Boolean(enabledFill);
        const hasStroke = Boolean(enabledBorder);
        if (!hasFill && !hasStroke && !typographyEnabled) return;
        const mode =
          hasFill && hasStroke
            ? 'fill-stroke'
            : hasFill
            ? 'fill'
            : hasStroke
            ? 'stroke'
            : 'fill';

        let segments = [{ start: range.start, end: range.end }];
        for (const cut of charCuts) {
          segments = segments.flatMap((segment) => {
            if (cut.end <= segment.start || cut.start >= segment.end) return [segment];
            const next: Array<{ start: number; end: number }> = [];
            if (cut.start > segment.start) {
              next.push({ start: segment.start, end: cut.start });
            }
            if (cut.end < segment.end) {
              next.push({ start: cut.end, end: segment.end });
            }
            return next;
          });
        }

        segments
          .filter((segment) => segment.end > segment.start)
          .forEach((segment) => {
            wordStyles.push({
              id: `word-style-${idx}-${segment.start}-${segment.end}`,
              start: segment.start,
              end: segment.end,
              mode,
              fillColor: hasFill ? fillColor : typographyEnabled ? fillColor : undefined,
              strokeColor: hasStroke ? strokeColor : undefined,
              strokeWidth: hasStroke ? strokeWidth : undefined,
              fontFamily: typographyEnabled ? typographyFont : undefined,
              fontSize: typographyEnabled ? typographySize : undefined,
            });
          });
      };

      pushWordStyle(
        1,
        prev.enableFill,
        prev.enableBorder,
        prev.color,
        prev.borderColor,
        prev.borderWidth,
        true,
        wordTypo1Enabled,
        wordFont1,
        wordSize1
      );
      pushWordStyle(
        2,
        prev.enableFillTwo,
        prev.enableBorderTwo,
        prev.colorTwo || prev.color,
        prev.borderColorTwo || prev.borderColor,
        prev.borderWidthTwo || prev.borderWidth,
        prev.showWordTwo,
        wordTypo2Enabled,
        wordFont2,
        wordSize2
      );
      pushWordStyle(
        3,
        prev.enableFillThree,
        prev.enableBorderThree,
        prev.colorThree || prev.color,
        prev.borderColorThree || prev.borderColor,
        prev.borderWidthThree || prev.borderWidth,
        prev.showWordThree,
        wordTypo3Enabled,
        wordFont3,
        wordSize3
      );

      // Order matters: StyledRangeText resolves from the end.
      // Keep per-character overrides last so they always win over word/global.
      const nextStyles = [...wordStyles, ...base, ...charStyles];
      const current = prev.textRangeStyles ?? [];
      const same =
        nextStyles.length === current.length &&
        nextStyles.every((style, idx) => JSON.stringify(style) === JSON.stringify(current[idx]));

      if (same) return prev;
      return { ...prev, textRangeStyles: nextStyles };
    });
  }, [
    editWordByWord,
    segmentedRanges,
    setProps,
    props.enableFill,
    props.enableBorder,
    props.color,
    props.borderColor,
    props.borderWidth,
    props.enableFillTwo,
    props.enableBorderTwo,
    props.colorTwo,
    props.borderColorTwo,
    props.borderWidthTwo,
    props.showWordTwo,
    props.enableFillThree,
    props.enableBorderThree,
    props.colorThree,
    props.borderColorThree,
    props.borderWidthThree,
    props.showWordThree,
    props.textRangeStyles,
    wordTypo1Enabled,
    wordTypo2Enabled,
    wordTypo3Enabled,
    wordFont1,
    wordFont2,
    wordFont3,
    wordSize1,
    wordSize2,
    wordSize3,
  ]);

  const tx = uiLanguage === 'es'
    ? {
        language: 'Idioma',
        reset: 'Reset',
        tabGlobal: 'Global',
        tabText3d: 'Texto y 3D',
        tabParticles: 'Particulas',
        tabExport: 'Exportar',
        presets: 'Presets',
        presetName: 'Nombre del Preset',
        saveCurrentLook: 'Guardar Look Actual',
        savedPresets: 'Presets Guardados',
        loadPreset: 'Cargar',
        noPresets: 'No hay presets guardados.',
        canvas: 'Canvas',
        aspectRatio: 'Relacion de Aspecto',
        resolution: 'Resolucion',
        background: 'Fondo',
        timeline: 'Timeline',
        speed: 'Velocidad',
        phase: 'Fase',
        duration: 'Duracion',
        speedRedefines: 'Velocidad redefine duracion',
        reverseExit: 'Salida Inversa',
        transform: 'Transformacion',
        resetPosition: 'Reset Posicion',
        startZ: 'Z Inicial',
        endZ: 'Z Final',
        renderOutput: 'Salida de Render',
        alphaChannel: 'Canal Alpha',
        transparentCodec: 'Codec Transparente',
        renderMode: 'Modo de Render',
        singleRender: 'Render Unico',
        batchRender: 'Render por Lotes',
        batchLines: 'Lineas para Lote',
        batchHint: 'Una linea por texto. Se renderiza en secuencia para evitar errores de memoria WebGL.',
        batchDone: 'Lote completado',
        exportWebmFast: 'Exportar WebM (VP9 - Rapido)',
        exportProresHigh: 'Exportar ProRes 4444 (Alta Calidad - .mov)',
        proresWarning: 'ProRes 4444 genera archivos muy grandes y tarda mas en renderizar. Ideal para NLEs como Premiere/Resolve.',
        opaqueMp4: 'Exportacion opaca usa MP4 (H264).',
        actions: 'Acciones',
        rendering: 'Renderizando...',
        exportWebm: 'Exportar WebM (VP9)',
        exportProres: 'Exportar ProRes 4444 (.mov)',
        exportMp4: 'Exportar MP4 (H264)',
        saveVideo: 'Guardar Video',
        resetTextPanel: 'Reset TEXT',
        words: 'Palabras',
        fullText: 'Texto Completo',
        fullTextHint: 'Las palabras se detectan automáticamente desde este texto.',
        editWordByWord: 'Editar palabra por palabra',
        rangeUnsupported: 'Este efecto no usa estilos por rango.',
        word1: 'Palabra 1',
        word2: 'Palabra 2',
        word3: 'Palabra 3',
        autoFromText: 'Auto desde texto',
        manual: 'Manual',
        typography: 'Tipografia',
        font: 'Fuente',
        size: 'Tamano',
        applyTypography: 'Aplicar Tipografia',
        resetTypography: 'Reset Tipografia',
        gradient: 'Degradado',
        gradientMode: 'Modo Degradado',
        colorA: 'Color A',
        colorB: 'Color B',
        fillBorder: 'Relleno y Borde',
        animationTemplate: 'Animacion y Plantilla',
        styleMaster: 'Estilo Master',
        slideDirection: 'Direccion Slide-In',
        followerDirection: 'Direccion Cascade',
        cinematicDirection: 'Direccion Z-Space',
        smoothDirection: 'Direccion Smooth Cascade',
        threeDMaterial: '3D y Material',
        use3dOverride: 'Usar Override de Fuente 3D',
        metalPreset: 'Acabado Metalico',
        metalTone: 'Tono Metalico',
        metalBrightness: 'Brillo Metalico',
        metalContrast: 'Contraste Metalico',
        font3dPreset: 'Fuente 3D',
        letterSpacing3d: 'Esp. Letras 3D',
        lineHeight3d: 'Alto Entrelinea 3D',
        extrudeDepth3d: 'Extrude 3D',
        showTextLayer: 'Mostrar Capa de Texto',
        rangeTitle: 'Estilo por Letras / Palabras',
        rangeHelp: 'Estilos por letra/palabra usando indices del texto principal.',
        charEditMode: 'Edicion por letra (click derecho)',
        rightClickHint: 'Click derecho sobre un caracter para abrir acciones de estilo.',
        clearStyle: 'Quitar estilo',
        transparentFill: 'Relleno transparente',
      }
    : {
        language: 'Language',
        reset: 'Reset',
        tabGlobal: 'Global',
        tabText3d: 'Text & 3D',
        tabParticles: 'Particles',
        tabExport: 'Export',
        presets: 'Presets',
        presetName: 'Preset Name',
        saveCurrentLook: 'Save Current Look',
        savedPresets: 'Saved Presets',
        loadPreset: 'Load',
        noPresets: 'No presets saved yet.',
        canvas: 'Canvas',
        aspectRatio: 'Aspect Ratio',
        resolution: 'Resolution',
        background: 'Background',
        timeline: 'Timeline',
        speed: 'Speed',
        phase: 'Phase',
        duration: 'Duration',
        speedRedefines: 'Speed Redefines Duration',
        reverseExit: 'Reverse Exit',
        transform: 'Transform',
        resetPosition: 'Reset Position',
        startZ: 'Start Z',
        endZ: 'End Z',
        renderOutput: 'Render Output',
        alphaChannel: 'Enable Alpha Channel',
        transparentCodec: 'Transparent Codec',
        renderMode: 'Render Mode',
        singleRender: 'Single Render',
        batchRender: 'Batch Render',
        batchLines: 'Batch Lines',
        batchHint: 'One line per text. Rendering runs sequentially to avoid WebGL memory/context crashes.',
        batchDone: 'Batch completed',
        exportWebmFast: 'Export WebM (VP9 - Fast)',
        exportProresHigh: 'Export ProRes 4444 (High Quality - .mov)',
        proresWarning: 'ProRes 4444 generates very large files and takes longer to render. Ideal for NLEs like Premiere/Resolve.',
        opaqueMp4: 'Opaque export uses MP4 (H264).',
        actions: 'Actions',
        rendering: 'Rendering...',
        exportWebm: 'Export WebM (VP9)',
        exportProres: 'Export ProRes 4444 (.mov)',
        exportMp4: 'Export MP4 (H264)',
        saveVideo: 'Save Video',
        resetTextPanel: 'Reset TEXT',
        words: 'Words',
        fullText: 'Full Text',
        fullTextHint: 'Words are auto-detected from this text.',
        editWordByWord: 'Edit word by word',
        rangeUnsupported: 'This effect does not use range styling.',
        word1: 'Word 1',
        word2: 'Word 2',
        word3: 'Word 3',
        autoFromText: 'Auto from text',
        manual: 'Manual',
        typography: 'Typography',
        font: 'Font',
        size: 'Size',
        applyTypography: 'Apply Typography',
        resetTypography: 'Reset Typography',
        gradient: 'Gradient',
        gradientMode: 'Gradient Mode',
        colorA: 'Color A',
        colorB: 'Color B',
        fillBorder: 'Text Fill & Border',
        animationTemplate: 'Animation & Template',
        styleMaster: 'Master Style',
        slideDirection: 'Slide-In Direction',
        followerDirection: 'Cascade Direction',
        cinematicDirection: 'Z-Space Direction',
        smoothDirection: 'Smooth Cascade Direction',
        threeDMaterial: '3D & Material',
        use3dOverride: 'Use 3D Font Override',
        metalPreset: 'Metal Finish',
        metalTone: 'Metal Tone',
        metalBrightness: 'Metal Brightness',
        metalContrast: 'Metal Contrast',
        font3dPreset: '3D Font',
        letterSpacing3d: '3D Letter Spacing',
        lineHeight3d: '3D Line Height',
        extrudeDepth3d: '3D Extrude',
        showTextLayer: 'Show Text Layer',
        rangeTitle: 'Letter / Word Range Styling',
        rangeHelp: 'Letter/word styling using indexes from primary text.',
        charEditMode: 'Per-character editing (right click)',
        rightClickHint: 'Right click any character to open style actions.',
        clearStyle: 'Clear style',
        transparentFill: 'Transparent fill',
      };

  const tabLabels: Record<InspectorTab, string> = {
    global: tx.tabGlobal,
    text3d: tx.tabText3d,
    particles: tx.tabParticles,
    export: tx.tabExport,
  };

  const textLength = props.text.length;
  const applySingleCharStyle = (
    index: number,
    mode: 'fill' | 'stroke' | 'fill-stroke' | 'fill-gradient' | 'stroke-gradient'
  ) => {
    if (textLength <= 0) return;
    const safeStart = Math.max(0, Math.min(textLength - 1, Math.floor(index)));
    const safeEnd = Math.max(safeStart + 1, Math.min(textLength, safeStart + 1));
    const payloadBase = {
      id: `char-${safeStart}`,
      start: safeStart,
      end: safeEnd,
      mode,
      fillColor:
        mode === 'fill' || mode === 'fill-stroke'
          ? charTransparentFill
            ? 'transparent'
            : rangeFillColor
          : undefined,
      strokeColor:
        mode === 'stroke' || mode === 'stroke-gradient' || mode === 'fill-stroke'
          ? rangeStrokeColor
          : undefined,
      strokeWidth:
        mode === 'stroke' || mode === 'stroke-gradient' || mode === 'fill-stroke'
          ? rangeStrokeWidth
          : undefined,
      strokeGradientStart:
        mode === 'fill-gradient' || mode === 'stroke-gradient' ? rangeGradientStart : undefined,
      strokeGradientEnd:
        mode === 'fill-gradient' || mode === 'stroke-gradient' ? rangeGradientEnd : undefined,
    };
    setProps((prev) => {
      const existing = (prev.textRangeStyles ?? []).find(
        (style) =>
          style.id.startsWith('char-') &&
          (style.id === `char-${safeStart}` || (style.start === safeStart && style.end === safeEnd))
      );
      const payload = {
        ...payloadBase,
        fontFamily: existing?.fontFamily,
        fontSize: existing?.fontSize,
      };
      return {
        ...prev,
        textRangeStyles: [
          ...(prev.textRangeStyles ?? []).filter(
            (style) =>
              !(
                style.id.startsWith('char-') &&
                (style.id === `char-${safeStart}` || (style.start === safeStart && style.end === safeEnd))
              )
          ),
          payload,
        ],
      };
    });
  };

  const applySingleCharTypography = (index: number, fontFamily: string, fontSize: number) => {
    if (textLength <= 0) return;
    const safeStart = Math.max(0, Math.min(textLength - 1, Math.floor(index)));
    const safeEnd = Math.max(safeStart + 1, Math.min(textLength, safeStart + 1));
    setProps((prev) => {
      const existing = (prev.textRangeStyles ?? []).find(
        (style) =>
          style.id.startsWith('char-') &&
          (style.id === `char-${safeStart}` || (style.start === safeStart && style.end === safeEnd))
      );
      const mode = existing?.mode ?? 'fill';
      const payload = {
        id: `char-${safeStart}`,
        start: safeStart,
        end: safeEnd,
        mode,
        fillColor: existing?.fillColor ?? props.color,
        strokeColor: existing?.strokeColor,
        strokeWidth: existing?.strokeWidth,
        strokeGradientStart: existing?.strokeGradientStart,
        strokeGradientEnd: existing?.strokeGradientEnd,
        fontFamily,
        fontSize,
      };
      return {
        ...prev,
        textRangeStyles: [
          ...(prev.textRangeStyles ?? []).filter(
            (style) =>
              !(
                style.id.startsWith('char-') &&
                (style.id === `char-${safeStart}` || (style.start === safeStart && style.end === safeEnd))
              )
          ),
          payload,
        ],
      };
    });
  };

  const resetSingleCharTypography = (index: number) => {
    if (textLength <= 0) return;
    const safeStart = Math.max(0, Math.min(textLength - 1, Math.floor(index)));
    const safeEnd = Math.max(safeStart + 1, Math.min(textLength, safeStart + 1));
    setProps((prev) => {
      const existing = (prev.textRangeStyles ?? []).find(
        (style) =>
          style.id.startsWith('char-') &&
          (style.id === `char-${safeStart}` || (style.start === safeStart && style.end === safeEnd))
      );
      if (!existing) return prev;

      const nextChar = {
        ...existing,
        fontFamily: undefined,
        fontSize: undefined,
      };

      const hasVisualStyle = Boolean(
        nextChar.fillColor ||
          nextChar.strokeColor ||
          nextChar.strokeWidth ||
          nextChar.strokeGradientStart ||
          nextChar.strokeGradientEnd
      );

      const filtered = (prev.textRangeStyles ?? []).filter(
        (style) =>
          !(
            style.id.startsWith('char-') &&
            (style.id === `char-${safeStart}` || (style.start === safeStart && style.end === safeEnd))
          )
      );

      return {
        ...prev,
        textRangeStyles: hasVisualStyle ? [...filtered, nextChar] : filtered,
      };
    });
    setCharFontFamily(props.fontFamily);
    setCharFontSize(props.fontSize);
  };

  const getWordGradient = (wordIndex: 1 | 2 | 3) =>
    (props.textRangeStyles ?? []).find((style) => style.id === `word-gradient-${wordIndex}`);

  const upsertWordGradient = (
    wordIndex: 1 | 2 | 3,
    startColor: string,
    endColor: string,
    enabled: boolean,
    mode: 'fill-gradient' | 'stroke-gradient' = 'fill-gradient'
  ) => {
    setProps((prev) => {
      const base = (prev.textRangeStyles ?? []).filter((style) => style.id !== `word-gradient-${wordIndex}`);
      if (!enabled) {
        return { ...prev, textRangeStyles: base };
      }
      const range = segmentedRanges[wordIndex - 1];
      if (!range) {
        return { ...prev, textRangeStyles: base };
      }
      return {
        ...prev,
        textRangeStyles: [
          ...base,
          {
            id: `word-gradient-${wordIndex}`,
            start: range.start,
            end: range.end,
            mode,
            strokeGradientStart: startColor,
            strokeGradientEnd: endColor,
          },
        ],
      };
    });
  };

  const gradientWord1 = getWordGradient(1);
  const gradientWord2 = getWordGradient(2);
  const gradientWord3 = getWordGradient(3);
  const showWord2Section = supportsWordTwo;
  const showWord3Section = supportsWordThree;

  const updateWordAtIndex = (wordIndex: number, value: string) => {
    if (!editWordByWord) return;
    const baseWords = [...segmentedWords];
    while (baseWords.length <= wordIndex) baseWords.push('');
    baseWords[wordIndex] = value;
    const nextWords = baseWords.filter((w) => w.length > 0);
    setProps((prev) => ({
      ...prev,
      text: nextWords.join(' ').trim(),
      wordTwo: nextWords[1] ?? '',
      wordThree: nextWords[2] ?? '',
      showWordTwo: nextWords.length >= 2,
      showWordThree: nextWords.length >= 3,
    }));
  };

  const handleFullTextChange = (nextText: string) => {
    setTextDraft(nextText);
    setProps((prev) => ({
      ...prev,
      text: nextText,
    }));
  };

  const beginTextDraft = () => { textDraftOriginRef.current = props.text; setTextDraft(props.text); };
  const cancelTextDraft = () => {
    setTextDraft(textDraftOriginRef.current);
    setProps((prev) => ({ ...prev, text: textDraftOriginRef.current }));
  };
  const handleTextDraftKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') { event.preventDefault(); cancelTextDraft(); event.currentTarget.blur(); }
    if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); }
  };

  const handleSavePreset = () => {
    const result = saveNamedPreset(presetNameDraft);
    if (!result.ok || !result.name) {
      setPresetFeedback(
        uiLanguage === 'es'
          ? 'Ingresa un nombre de preset válido.'
          : 'Enter a valid preset name.'
      );
      return;
    }
    setSelectedPresetName(result.name);
    setPresetNameDraft(result.name);
    setPresetFeedback(
      uiLanguage === 'es'
        ? `Preset guardado: ${result.name}`
        : `Preset saved: ${result.name}`
    );
  };

  const handleLoadPreset = () => {
    if (!selectedPresetName) {
      setPresetFeedback(
        uiLanguage === 'es'
          ? 'Selecciona un preset primero.'
          : 'Select a preset first.'
      );
      return;
    }
    const ok = loadNamedPreset(selectedPresetName);
    setPresetFeedback(
      ok
        ? uiLanguage === 'es'
          ? `Preset cargado: ${selectedPresetName}`
          : `Preset loaded: ${selectedPresetName}`
        : uiLanguage === 'es'
          ? 'No se pudo cargar el preset.'
          : 'Failed to load preset.'
    );
  };

  return (
    <div className="h-full flex flex-col">
      <WordContentSynchronizer text={props.text} setProps={setProps} />
      {!hideHeader ? (
        <div className="px-2 py-2 border-b border-neutral-800 bg-neutral-900/95">
          <div className="grid grid-cols-2 gap-1.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`h-7 rounded-md border text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                  activeTab === tab.id
                    ? 'border-neutral-500 bg-neutral-700 text-neutral-100'
                    : 'border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600'
                }`}
              >
                {tabLabels[tab.id]}
              </button>
            ))}
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase tracking-[0.08em] text-neutral-500">{tx.language}</span>
              <select
                value={uiLanguage}
                onChange={(e) => setUiLanguage(e.target.value === 'en' ? 'en' : 'es')}
                className="h-6 rounded-md border border-neutral-700 bg-neutral-900 px-1.5 text-[10px] text-neutral-200"
              >
                <option value="es">ES</option>
                <option value="en">EN</option>
              </select>
            </div>
            <button
              type="button"
              onClick={resetActiveTab}
              className="h-6 px-2 rounded-md border border-neutral-700 bg-neutral-900 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-300 hover:bg-neutral-800"
            >
              {tx.reset} {tabLabels[activeTab]}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {activeTab === 'global' ? (
          <>
            {showGlobalPresets ? (
            <Accordion title={tx.presets} storageKey="global-presets">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-1.5 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.presetName}</label>
                  <input
                    type="text"
                    value={presetNameDraft}
                    onChange={(e) => setPresetNameDraft(e.target.value)}
                    className={compactInputClass}
                    placeholder={uiLanguage === 'es' ? 'Ej: Promo Azul' : 'e.g. Blue Promo'}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSavePreset}
                  className="h-7 px-2 rounded-md border border-neutral-700 bg-neutral-900 text-xs text-neutral-100 hover:bg-neutral-800 whitespace-nowrap"
                >
                  {tx.saveCurrentLook}
                </button>
              </div>

              {userPresets.length > 0 ? (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-1.5 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.savedPresets}</label>
                    <select
                      value={selectedPresetName}
                      onChange={(e) => setSelectedPresetName(e.target.value)}
                      className={compactInputClass}
                    >
                      {userPresets.map((preset) => (
                        <option key={preset.name} value={preset.name}>
                          {preset.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadPreset}
                    className="h-7 px-2 rounded-md border border-neutral-700 bg-neutral-900 text-xs text-neutral-100 hover:bg-neutral-800 whitespace-nowrap"
                  >
                    {tx.loadPreset}
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-neutral-500">{tx.noPresets}</p>
              )}

              {presetFeedback ? (
                <p className="text-[10px] text-cyan-300/90">{presetFeedback}</p>
              ) : null}
            </Accordion>
            ) : null}

            {showGlobalSettings ? (
            <>
            <Accordion title={tx.canvas} storageKey="global-canvas">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.aspectRatio}</label>
                <select name="aspectRatio" value={props.aspectRatio} onChange={handleChange} className={compactInputClass}>
                  <option value="16:9">YouTube / Web (16:9)</option>
                  <option value="9:16">Reels / TikTok (9:16)</option>
                  <option value="1:1">Instagram (1:1)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.resolution}</label>
                <select
                  name="resolutionPreset"
                  value={props.resolutionPreset}
                  onChange={handleChange}
                  className={compactInputClass}
                >
                  {RESOLUTION_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.background}</label>
                <input type="color" name="backgroundColor" value={props.backgroundColor} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" />
              </div>
            </Accordion>

            <Accordion title={tx.timeline} storageKey="global-timeline">
              <div className="grid grid-cols-2 gap-1.5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.speed}</label>
                  <input type="number" step="0.05" min="0.2" max="3" name="speed" value={speedDraftState.draft} onFocus={beginSpeedDraft} onChange={(e) => speedDraftState.setDraft(e.target.value)} onBlur={confirmSpeedDraft} onKeyDown={handleSpeedKeyDown} className={compactInputClass} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.phase}</label>
                  <select name="motionPhase" value={props.motionPhase} onChange={handleChange} className={compactInputClass}>
                    <option value="in">ON ENTER</option>
                    <option value="out">ON EXIT</option>
                    <option value="in-out">BOTH</option>
                  </select>
                </div>
              </div>
              {!isKineticBoxSequence ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.duration} ({totalDurationSeconds.toFixed(2)}s / {totalDurationInFrames}f)</label>
                    <input
                      type="range"
                      min={MIN_DURATION_IN_FRAMES / REMOTION_FPS}
                      max={MAX_DURATION_IN_FRAMES / REMOTION_FPS}
                      step="0.1"
                      value={totalDurationSeconds}
                      onChange={(e) => updateTotalDurationSeconds(Number(e.target.value))}
                      className="w-full"
                    />
                    <input
                      type="number"
                      min={MIN_DURATION_IN_FRAMES / REMOTION_FPS}
                      max={MAX_DURATION_IN_FRAMES / REMOTION_FPS}
                      step="0.1"
                      value={Number(totalDurationSeconds.toFixed(2))}
                      onChange={(e) => updateTotalDurationSeconds(Number(e.target.value))}
                      className={compactInputClass}
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                    <input
                      type="checkbox"
                      checked={props.speedControlsDuration}
                      onChange={(e) => setProps((prev) => ({ ...prev, speedControlsDuration: e.target.checked }))}
                      className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                    />
                    {tx.speedRedefines}
                  </label>
                </>
              ) : (
                <p className="text-[10px] text-neutral-500">
                  {uiLanguage === 'es'
                    ? `Duración total automática por boxes: ${kineticRequestedSeconds.toFixed(2)}s (${totalDurationInFrames}f).`
                    : `Auto total duration from boxes: ${kineticRequestedSeconds.toFixed(2)}s (${totalDurationInFrames}f).`}
                </p>
              )}
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                <input
                  type="checkbox"
                  name="reverseOutAnimation"
                  checked={props.reverseOutAnimation}
                  onChange={handleChange}
                  className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                />
                {tx.reverseExit}
              </label>
            </Accordion>

            <Accordion title={tx.transform} storageKey="global-transform">
              <div className="grid grid-cols-[20px_minmax(0,1fr)_44px] gap-1.5 items-center">
                <span className="text-[10px] uppercase text-neutral-400">X</span>
                <input type="range" min="-45" max="45" step="1" name="textPositionX" value={props.textPositionX} onChange={handleChange} className="w-full" />
                <span className="text-xs text-emerald-400 text-right">{props.textPositionX.toFixed(0)}%</span>

                <span className="text-[10px] uppercase text-neutral-400">Y</span>
                <input type="range" min="-45" max="45" step="1" name="textPositionY" value={props.textPositionY} onChange={handleChange} className="w-full" />
                <span className="text-xs text-emerald-400 text-right">{props.textPositionY.toFixed(0)}%</span>

                <span className="text-[10px] uppercase text-neutral-400">ZS</span>
                <input type="range" min="-1200" max="1200" step="5" name="startZ" value={props.startZ} onChange={handleChange} className="w-full" />
                <span className="text-xs text-emerald-400 text-right">{props.startZ.toFixed(0)}</span>

                <span className="text-[10px] uppercase text-neutral-400">ZE</span>
                <input type="range" min="-1200" max="1200" step="5" name="endZ" value={props.endZ} onChange={handleChange} className="w-full" />
                <span className="text-xs text-emerald-400 text-right">{props.endZ.toFixed(0)}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-500">{tx.startZ}</label>
                <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-500 text-right">{tx.endZ}</label>
              </div>
              <button
                type="button"
                onClick={() =>
                  setProps((prev) => ({
                    ...prev,
                    textPositionX: 0,
                    textPositionY: 0,
                    startZ: 0,
                    endZ: 0,
                  }))
                }
                className="h-7 px-2 rounded-md border border-neutral-700 bg-neutral-900 text-xs text-neutral-100 hover:bg-neutral-800"
              >
                {tx.resetPosition}
              </button>
            </Accordion>
            </>
            ) : null}
          </>
        ) : null}

        {activeTab === 'text3d' ? (
          <>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetTextPanel}
                className="h-7 px-2 rounded-md border border-neutral-700 bg-neutral-900 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-300 hover:bg-neutral-800"
              >
                {tx.resetTextPanel}
              </button>
            </div>
            <Accordion title={tx.animationTemplate} storageKey="text3d-animation-template">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.styleMaster}</label>
                <select
                  name="animationStyle"
                  value={props.animationStyle}
                  onChange={handleChange}
                  className={compactInputClass}
                >
                  {ANIMATION_STYLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {uiLanguage === 'es' ? option.labelEs : option.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {props.animationStyle === 'slide-in' ? (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.slideDirection}</label>
                  <select name="slideDirection" value={props.slideDirection} onChange={handleChange} className={compactInputClass}>
                    <option value="top">{uiLanguage === 'es' ? 'Desde Arriba' : 'From Top'}</option>
                    <option value="bottom">{uiLanguage === 'es' ? 'Desde Abajo' : 'From Bottom'}</option>
                    <option value="left">{uiLanguage === 'es' ? 'Desde Izquierda' : 'From Left'}</option>
                    <option value="right">{uiLanguage === 'es' ? 'Desde Derecha' : 'From Right'}</option>
                  </select>
                </div>
              ) : null}

              {props.animationStyle === 'follower' ? (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.followerDirection}</label>
                  <select name="followerDirection" value={props.followerDirection} onChange={handleChange} className={compactInputClass}>
                    <option value="bottom-up">{uiLanguage === 'es' ? 'Subir desde Abajo' : 'Bottom Up'}</option>
                    <option value="top-down">{uiLanguage === 'es' ? 'Bajar desde Arriba' : 'Top Down'}</option>
                  </select>
                </div>
              ) : null}

              {props.animationStyle === 'smooth-sliding' ? (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.smoothDirection}</label>
                  <select
                    name="smoothCascadeDirection"
                    value={props.smoothCascadeDirection}
                    onChange={handleChange}
                    className={compactInputClass}
                  >
                    <option value="bottom-up">{uiLanguage === 'es' ? 'Abajo a Arriba' : 'Bottom Up'}</option>
                    <option value="top-down">{uiLanguage === 'es' ? 'Arriba a Abajo' : 'Top Down'}</option>
                    <option value="left-right">{uiLanguage === 'es' ? 'Izquierda a Derecha' : 'Left to Right'}</option>
                    <option value="right-left">{uiLanguage === 'es' ? 'Derecha a Izquierda' : 'Right to Left'}</option>
                  </select>
                </div>
              ) : null}

              {['cinematic', 'fly-through'].includes(props.animationStyle) ? (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.cinematicDirection}</label>
                  <select name="cinematicDirection" value={props.cinematicDirection} onChange={handleChange} className={compactInputClass}>
                    <option value="zoom-out">{uiLanguage === 'es' ? 'Aproximarse a Cámara' : 'Zoom Out (Toward Camera)'}</option>
                    <option value="zoom-in">{uiLanguage === 'es' ? 'Alejarse en Profundidad' : 'Zoom In (Away)'}</option>
                  </select>
                </div>
              ) : null}

              {isKineticBoxSequence ? (
                <div className="space-y-1.5 rounded-md border border-neutral-800 bg-neutral-950/40 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-cyan-300">
                      Kinetic Box Sequence
                    </label>
                    <span className="text-[10px] text-emerald-400">
                      {kineticBoxCount} {uiLanguage === 'es' ? 'boxes (auto)' : 'boxes (auto)'}
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    {uiLanguage === 'es'
                      ? 'Cada palabra en "Texto Completo" genera su propia box.'
                      : 'Each word in "Full Text" creates one box.'}
                  </p>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                        {uiLanguage === 'es' ? 'Modo Caja' : 'Box Mode'}
                      </label>
                      <select
                        name="boxSequenceMode"
                        value={props.boxSequenceMode}
                        onChange={handleChange}
                        className={compactInputClass}
                      >
                        <option value="box">{uiLanguage === 'es' ? 'Caja' : 'Box'}</option>
                        <option value="bar">{uiLanguage === 'es' ? 'Barra' : 'Bar'}</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                        {uiLanguage === 'es' ? 'Dirección' : 'Direction'}
                      </label>
                      <select
                        name="boxSequenceDirection"
                        value={props.boxSequenceDirection}
                        onChange={handleChange}
                        className={compactInputClass}
                      >
                        <option value="from-bottom">{uiLanguage === 'es' ? 'Desde Abajo' : 'From Bottom'}</option>
                        <option value="from-top">{uiLanguage === 'es' ? 'Desde Arriba' : 'From Top'}</option>
                        <option value="from-left">{uiLanguage === 'es' ? 'Desde Izquierda' : 'From Left'}</option>
                        <option value="from-right">{uiLanguage === 'es' ? 'Desde Derecha' : 'From Right'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                      {uiLanguage === 'es' ? 'Duraciones por Box (seg)' : 'Durations per Box (sec)'}
                    </label>
                    <div className="max-h-44 overflow-y-auto space-y-1 rounded-md border border-neutral-800 bg-neutral-950/50 p-1.5">
                      {Array.from({ length: kineticBoxCount }).map((_, index) => {
                        const labelWord = segmentedWords[index] ?? `${uiLanguage === 'es' ? 'Box' : 'Box'} ${index + 1}`;
                        return (
                          <div key={`kinetic-duration-${index}`} className="grid grid-cols-[26px_minmax(0,1fr)_70px] items-center gap-1.5">
                            <span className="text-[10px] text-neutral-400 text-right">#{index + 1}</span>
                            <span className="truncate text-[10px] text-neutral-200">{labelWord}</span>
                            <input
                              type="number"
                              min="0.15"
                              max="20"
                              step="0.05"
                              value={Number(kineticDurationSeconds[index].toFixed(2))}
                              onChange={(e) => updateKineticDurationAtIndex(index, Number(e.target.value))}
                              className={compactInputClass}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                        {uiLanguage === 'es' ? 'Redondeo' : 'Roundness'}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="120"
                        step="1"
                        name="boxSequenceBorderRadius"
                        value={props.boxSequenceBorderRadius}
                        onChange={handleChange}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                        {uiLanguage === 'es' ? 'Altura Box' : 'Box Height'}
                      </label>
                      <input
                        type="range"
                        min="0.7"
                        max="2.2"
                        step="0.05"
                        name="boxSequenceHeightScale"
                        value={props.boxSequenceHeightScale}
                        onChange={handleChange}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                    <input
                      type="checkbox"
                      name="boxSequenceUseGradient"
                      checked={props.boxSequenceUseGradient}
                      onChange={handleChange}
                      className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                    />
                    {uiLanguage === 'es' ? 'Usar Degradado Compartido' : 'Use Shared Gradient'}
                  </label>

                  {props.boxSequenceUseGradient ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                          {uiLanguage === 'es' ? 'Degradado A' : 'Gradient A'}
                        </label>
                        <input
                          type="color"
                          name="boxSequenceGradientStart"
                          value={props.boxSequenceGradientStart}
                          onChange={handleChange}
                          className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                          {uiLanguage === 'es' ? 'Degradado B' : 'Gradient B'}
                        </label>
                        <input
                          type="color"
                          name="boxSequenceGradientEnd"
                          value={props.boxSequenceGradientEnd}
                          onChange={handleChange}
                          className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                        {uiLanguage === 'es' ? 'Colores de Fondo por Box' : 'Background Colors per Box'}
                      </label>
                      <div className="max-h-44 overflow-y-auto space-y-1 rounded-md border border-neutral-800 bg-neutral-950/50 p-1.5">
                        {Array.from({ length: kineticBoxCount }).map((_, index) => {
                          const labelWord = segmentedWords[index] ?? `${uiLanguage === 'es' ? 'Box' : 'Box'} ${index + 1}`;
                          return (
                            <div key={`kinetic-bg-color-${index}`} className="grid grid-cols-[26px_minmax(0,1fr)_44px] items-center gap-1.5">
                              <span className="text-[10px] text-neutral-400 text-right">#{index + 1}</span>
                              <span className="truncate text-[10px] text-neutral-200">{labelWord}</span>
                              <input
                                type="color"
                                value={kineticBackgroundColors[index]}
                                onChange={(e) => updateKineticColorList('boxSequenceColorsRaw', index, e.target.value)}
                                className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                      {uiLanguage === 'es' ? 'Color de Texto por Box' : 'Text Color per Box'}
                    </label>
                    <div className="max-h-44 overflow-y-auto space-y-1 rounded-md border border-neutral-800 bg-neutral-950/50 p-1.5">
                      {Array.from({ length: kineticBoxCount }).map((_, index) => {
                        const labelWord = segmentedWords[index] ?? `${uiLanguage === 'es' ? 'Box' : 'Box'} ${index + 1}`;
                        return (
                          <div key={`kinetic-text-color-${index}`} className="grid grid-cols-[26px_minmax(0,1fr)_44px] items-center gap-1.5">
                            <span className="text-[10px] text-neutral-400 text-right">#{index + 1}</span>
                            <span className="truncate text-[10px] text-neutral-200">{labelWord}</span>
                            <input
                              type="color"
                              value={kineticTextColors[index]}
                              onChange={(e) => updateKineticColorList('boxSequenceTextColorsRaw', index, e.target.value)}
                              className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1"
                            />
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-neutral-500">
                      {uiLanguage === 'es'
                        ? 'Tipografía y degradados por palabra se ajustan en la sección "Palabras".'
                        : 'Word typography and gradients are configured in the "Words" section.'}
                    </p>
                  </div>
                </div>
              ) : null}
            </Accordion>

            <Accordion title={tx.threeDMaterial} storageKey="text3d-3d-material">
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                <input
                  type="checkbox"
                  name="showTextLayer"
                  checked={props.showTextLayer}
                  onChange={handleChange}
                  className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                />
                {tx.showTextLayer}
              </label>

              {props.animationStyle === 'extruded-3d' ? (
                <>
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                    <input
                      type="checkbox"
                      name="useFont3dOverride"
                      checked={props.useFont3dOverride}
                      onChange={handleChange}
                      className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                    />
                    {tx.use3dOverride}
                  </label>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.metalPreset}</label>
                      <select name="metalPreset" value={props.metalPreset} onChange={handleChange} className={compactInputClass}>
                        <option value="silver">{uiLanguage === 'es' ? 'Plateado' : 'Silver'}</option>
                        <option value="gold">{uiLanguage === 'es' ? 'Oro' : 'Gold'}</option>
                        <option value="bronze">{uiLanguage === 'es' ? 'Bronce' : 'Bronze'}</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.metalTone}</label>
                      <select name="metalTone" value={props.metalTone} onChange={handleChange} className={compactInputClass}>
                        <option value="light">{uiLanguage === 'es' ? 'Claro' : 'Light'}</option>
                        <option value="classic">{uiLanguage === 'es' ? 'Clasico' : 'Classic'}</option>
                        <option value="rich">{uiLanguage === 'es' ? 'Intenso' : 'Rich'}</option>
                        <option value="aged">{uiLanguage === 'es' ? 'Envejecido' : 'Aged'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-[20px_minmax(0,1fr)_46px] gap-1.5 items-center">
                    <span className="text-[10px] uppercase text-neutral-400">B</span>
                    <input
                      type="range"
                      min="0.6"
                      max="1.8"
                      step="0.01"
                      name="metalBrightness"
                      value={props.metalBrightness}
                      onChange={handleChange}
                      className="w-full"
                    />
                    <span className="text-xs text-emerald-400 text-right">{props.metalBrightness.toFixed(2)}</span>
                  </div>
                  <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-500 -mt-0.5">{tx.metalBrightness}</label>

                  <div className="grid grid-cols-[20px_minmax(0,1fr)_46px] gap-1.5 items-center">
                    <span className="text-[10px] uppercase text-neutral-400">C</span>
                    <input
                      type="range"
                      min="0.6"
                      max="1.8"
                      step="0.01"
                      name="metalContrast"
                      value={props.metalContrast}
                      onChange={handleChange}
                      className="w-full"
                    />
                    <span className="text-xs text-emerald-400 text-right">{props.metalContrast.toFixed(2)}</span>
                  </div>
                  <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-500 -mt-0.5">{tx.metalContrast}</label>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.font3dPreset}</label>
                    <select
                      name="font3dPreset"
                      value={props.font3dPreset}
                      onChange={handleChange}
                      disabled={!props.useFont3dOverride}
                      className={`${compactInputClass} disabled:opacity-50`}
                    >
                      {FONT_3D_PRESETS.map((font3d) => (
                        <option key={font3d} value={font3d}>
                          {font3d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.letterSpacing3d}</label>
                      <input type="number" step="0.5" name="letterSpacing3d" value={props.letterSpacing3d} onChange={handleChange} className={compactInputClass} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.lineHeight3d}</label>
                      <input type="number" step="0.05" name="lineHeight3d" value={props.lineHeight3d} onChange={handleChange} className={compactInputClass} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.extrudeDepth3d}</label>
                      <input type="number" step="0.1" min="0.2" name="extrudeDepth3d" value={props.extrudeDepth3d} onChange={handleChange} className={compactInputClass} />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-[10px] text-neutral-500">
                  {uiLanguage === 'es'
                    ? 'Controles 3D avanzados disponibles cuando el estilo Master es "Impacto 3D Real".'
                    : 'Advanced 3D controls are available when Master Style is "Real 3D Impact".'}
                </p>
              )}
            </Accordion>

            <Accordion title={tx.words} storageKey="text3d-words">
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                <input
                  type="checkbox"
                  checked={editWordByWord}
                  onChange={(e) => setEditWordByWord(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                />
                {tx.editWordByWord}
              </label>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.fullText}</label>
                <input
                  type="text"
                  name="text"
                  value={textDraft}
                  onFocus={beginTextDraft}
                  onKeyDown={handleTextDraftKeyDown}
                  onBlur={() => setTextDraft(props.text)}
                  onChange={(e) => handleFullTextChange(e.target.value)}
                  className={compactInputClass}
                />
                <p className="text-[10px] text-neutral-500">{tx.fullTextHint}</p>
                <p className="text-[10px] text-neutral-500">{tx.rightClickHint}</p>
                <div ref={charPreviewRef} className="relative rounded-md border border-neutral-800 bg-neutral-950 p-2">
                  <div className="flex flex-wrap gap-0.5">
                    {Array.from(props.text || '').map((char, index) =>
                      char === '\n' ? (
                        <span key={`char-break-${index}`} className="w-full h-0" />
                      ) : (
                        <span
                          key={`char-btn-${index}`}
                          onClick={(e) => {
                            e.preventDefault();
                            if (!charMenuState.visible) return;
                            setCharMenuState((prev) => ({ ...prev, index }));
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCharMenuState({
                              visible: true,
                              x: e.clientX,
                              y: e.clientY,
                              index,
                            });
                          }}
                          className={`inline-block min-w-[10px] rounded px-0.5 py-0.5 text-xs leading-none text-neutral-200 hover:bg-neutral-800 ${
                            charMenuState.visible && charMenuState.index === index ? 'bg-neutral-800 ring-1 ring-cyan-500/60' : ''
                          }`}
                        >
                          {char === ' ' ? '\u00A0' : char}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1.5">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                      {tx.word1}
                    </label>
                  <span className="text-[10px] text-neutral-500">{editWordByWord ? tx.manual : tx.autoFromText}</span>
                </div>
                <input
                  type="text"
                  value={editWordByWord ? (segmentedWords[0] ?? '') : (segmentedWords[0] ?? '')}
                  readOnly={!editWordByWord}
                  onChange={(e) => {
                    updateWordAtIndex(0, e.target.value);
                  }}
                  className={`${compactInputClass} ${editWordByWord ? '' : 'opacity-80'}`}
                />
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                  <input
                    type="checkbox"
                    checked={wordTypo1Enabled}
                    onChange={(e) => setWordTypo1Enabled(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                  />
                  {tx.typography}
                </label>
                {wordTypo1Enabled ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.font}</label>
                      <select
                        value={wordFont1}
                        onChange={(e) => setWordFont1(e.target.value)}
                        className={compactInputClass}
                      >
                        {FONT_OPTIONS.map((font) => (
                          <option key={`word1-font-${font}`} value={font}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.size}</label>
                      <input
                        type="number"
                        min={8}
                        max={420}
                        step={1}
                        value={wordSize1}
                        onChange={(e) => setWordSize1(Number(e.target.value))}
                        className={compactInputClass}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setWordTypo1Enabled(false)}
                      className="col-span-2 h-6 rounded border border-neutral-700 bg-neutral-900 px-2 text-left text-xs text-neutral-300 hover:bg-neutral-800"
                    >
                      {tx.resetTypography}
                    </button>
                  </div>
                ) : null}
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                  <input
                    type="checkbox"
                    checked={Boolean(gradientWord1)}
                    onChange={(e) =>
                      upsertWordGradient(
                        1,
                        wordGradient1A,
                        wordGradient1B,
                        e.target.checked,
                        gradientWord1?.mode === 'stroke-gradient' ? 'stroke-gradient' : 'fill-gradient'
                      )
                    }
                    className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                  />
                  {tx.gradient}
                </label>
                {gradientWord1 ? (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.gradientMode}</label>
                  <select
                    value={gradientWord1.mode === 'stroke-gradient' ? 'stroke-gradient' : 'fill-gradient'}
                    onChange={(e) =>
                      upsertWordGradient(
                        1,
                        gradientWord1.strokeGradientStart ?? wordGradient1A,
                        gradientWord1.strokeGradientEnd ?? wordGradient1B,
                        true,
                        e.target.value === 'stroke-gradient' ? 'stroke-gradient' : 'fill-gradient'
                      )
                    }
                    className={compactInputClass}
                  >
                    <option value="fill-gradient">Fill</option>
                    <option value="stroke-gradient">Stroke</option>
                  </select>
                </div>
                ) : null}
                {gradientWord1 ? (
                <div className="grid grid-cols-2 gap-1.5 items-center">
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                    {tx.colorA}
                  </label>
                  <input
                    type="color"
                    value={gradientWord1?.strokeGradientStart ?? wordGradient1A}
                    onChange={(e) => {
                      const next = e.target.value;
                      setWordGradient1A(next);
                      if (gradientWord1) {
                        upsertWordGradient(
                          1,
                          next,
                          gradientWord1.strokeGradientEnd ?? wordGradient1B,
                          true,
                          gradientWord1.mode === 'stroke-gradient' ? 'stroke-gradient' : 'fill-gradient'
                        );
                      }
                    }}
                    className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1"
                  />
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                    {tx.colorB}
                  </label>
                  <input
                    type="color"
                    value={gradientWord1?.strokeGradientEnd ?? wordGradient1B}
                    onChange={(e) => {
                      const next = e.target.value;
                      setWordGradient1B(next);
                      if (gradientWord1) {
                        upsertWordGradient(
                          1,
                          gradientWord1.strokeGradientStart ?? wordGradient1A,
                          next,
                          true,
                          gradientWord1.mode === 'stroke-gradient' ? 'stroke-gradient' : 'fill-gradient'
                        );
                      }
                    }}
                    className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1"
                  />
                </div>
                ) : null}
              </div>
              {showWord2Section ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.word2}</label>
                    <span className="text-[10px] text-neutral-500">{editWordByWord ? tx.manual : tx.autoFromText}</span>
                  </div>
                  <input
                    type="text"
                    value={segmentedWords[1] ?? ''}
                    readOnly={!editWordByWord}
                    onChange={(e) => {
                      updateWordAtIndex(1, e.target.value);
                    }}
                    className={`${compactInputClass} ${editWordByWord ? '' : 'opacity-80'}`}
                  />
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                    <input
                      type="checkbox"
                      checked={wordTypo2Enabled}
                      onChange={(e) => setWordTypo2Enabled(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                    />
                    {tx.typography}
                  </label>
                  {wordTypo2Enabled ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.font}</label>
                        <select
                          value={wordFont2}
                          onChange={(e) => setWordFont2(e.target.value)}
                          className={compactInputClass}
                        >
                          {FONT_OPTIONS.map((font) => (
                            <option key={`word2-font-${font}`} value={font}>
                              {font}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.size}</label>
                        <input
                          type="number"
                          min={8}
                          max={420}
                          step={1}
                          value={wordSize2}
                          onChange={(e) => setWordSize2(Number(e.target.value))}
                          className={compactInputClass}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setWordTypo2Enabled(false)}
                        className="col-span-2 h-6 rounded border border-neutral-700 bg-neutral-900 px-2 text-left text-xs text-neutral-300 hover:bg-neutral-800"
                      >
                        {tx.resetTypography}
                      </button>
                    </div>
                  ) : null}
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                    <input
                      type="checkbox"
                      checked={Boolean(gradientWord2)}
                      onChange={(e) =>
                        upsertWordGradient(
                          2,
                          wordGradient2A,
                          wordGradient2B,
                          e.target.checked,
                          gradientWord2?.mode === 'stroke-gradient' ? 'stroke-gradient' : 'fill-gradient'
                        )
                      }
                      className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                    />
                    {tx.gradient}
                  </label>
                  {gradientWord2 ? (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.gradientMode}</label>
                    <select
                      value={gradientWord2.mode === 'stroke-gradient' ? 'stroke-gradient' : 'fill-gradient'}
                      onChange={(e) =>
                        upsertWordGradient(
                          2,
                          gradientWord2.strokeGradientStart ?? wordGradient2A,
                          gradientWord2.strokeGradientEnd ?? wordGradient2B,
                          true,
                          e.target.value === 'stroke-gradient' ? 'stroke-gradient' : 'fill-gradient'
                        )
                      }
                      className={compactInputClass}
                    >
                      <option value="fill-gradient">Fill</option>
                      <option value="stroke-gradient">Stroke</option>
                    </select>
                  </div>
                  ) : null}
                  {gradientWord2 ? (
                  <div className="grid grid-cols-2 gap-1.5 items-center">
                    <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                      {tx.colorA}
                    </label>
                    <input
                      type="color"
                      value={gradientWord2?.strokeGradientStart ?? wordGradient2A}
                      onChange={(e) => {
                        const next = e.target.value;
                        setWordGradient2A(next);
                        if (gradientWord2) {
                          upsertWordGradient(
                            2,
                            next,
                            gradientWord2.strokeGradientEnd ?? wordGradient2B,
                            true,
                            gradientWord2.mode === 'stroke-gradient' ? 'stroke-gradient' : 'fill-gradient'
                          );
                        }
                      }}
                      className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1"
                    />
                    <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                      {tx.colorB}
                    </label>
                    <input
                      type="color"
                      value={gradientWord2?.strokeGradientEnd ?? wordGradient2B}
                      onChange={(e) => {
                        const next = e.target.value;
                        setWordGradient2B(next);
                        if (gradientWord2) {
                          upsertWordGradient(
                            2,
                            gradientWord2.strokeGradientStart ?? wordGradient2A,
                            next,
                            true,
                            gradientWord2.mode === 'stroke-gradient' ? 'stroke-gradient' : 'fill-gradient'
                          );
                        }
                      }}
                      className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1"
                    />
                  </div>
                  ) : null}
                </div>
              ) : null}
              {showWord3Section ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.word3}</label>
                    <span className="text-[10px] text-neutral-500">{editWordByWord ? tx.manual : tx.autoFromText}</span>
                  </div>
                  <input
                    type="text"
                    value={segmentedWords[2] ?? ''}
                    readOnly={!editWordByWord}
                    onChange={(e) => {
                      updateWordAtIndex(2, e.target.value);
                    }}
                    className={`${compactInputClass} ${editWordByWord ? '' : 'opacity-80'}`}
                  />
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                    <input
                      type="checkbox"
                      checked={wordTypo3Enabled}
                      onChange={(e) => setWordTypo3Enabled(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                    />
                    {tx.typography}
                  </label>
                  {wordTypo3Enabled ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.font}</label>
                        <select
                          value={wordFont3}
                          onChange={(e) => setWordFont3(e.target.value)}
                          className={compactInputClass}
                        >
                          {FONT_OPTIONS.map((font) => (
                            <option key={`word3-font-${font}`} value={font}>
                              {font}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.size}</label>
                        <input
                          type="number"
                          min={8}
                          max={420}
                          step={1}
                          value={wordSize3}
                          onChange={(e) => setWordSize3(Number(e.target.value))}
                          className={compactInputClass}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setWordTypo3Enabled(false)}
                        className="col-span-2 h-6 rounded border border-neutral-700 bg-neutral-900 px-2 text-left text-xs text-neutral-300 hover:bg-neutral-800"
                      >
                        {tx.resetTypography}
                      </button>
                    </div>
                  ) : null}
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                    <input
                      type="checkbox"
                      checked={Boolean(gradientWord3)}
                      onChange={(e) =>
                        upsertWordGradient(
                          3,
                          wordGradient3A,
                          wordGradient3B,
                          e.target.checked,
                          gradientWord3?.mode === 'stroke-gradient' ? 'stroke-gradient' : 'fill-gradient'
                        )
                      }
                      className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                    />
                    {tx.gradient}
                  </label>
                  {gradientWord3 ? (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.gradientMode}</label>
                    <select
                      value={gradientWord3.mode === 'stroke-gradient' ? 'stroke-gradient' : 'fill-gradient'}
                      onChange={(e) =>
                        upsertWordGradient(
                          3,
                          gradientWord3.strokeGradientStart ?? wordGradient3A,
                          gradientWord3.strokeGradientEnd ?? wordGradient3B,
                          true,
                          e.target.value === 'stroke-gradient' ? 'stroke-gradient' : 'fill-gradient'
                        )
                      }
                      className={compactInputClass}
                    >
                      <option value="fill-gradient">Fill</option>
                      <option value="stroke-gradient">Stroke</option>
                    </select>
                  </div>
                  ) : null}
                  {gradientWord3 ? (
                  <div className="grid grid-cols-2 gap-1.5 items-center">
                    <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                      {tx.colorA}
                    </label>
                    <input
                      type="color"
                      value={gradientWord3?.strokeGradientStart ?? wordGradient3A}
                      onChange={(e) => {
                        const next = e.target.value;
                        setWordGradient3A(next);
                        if (gradientWord3) {
                          upsertWordGradient(
                            3,
                            next,
                            gradientWord3.strokeGradientEnd ?? wordGradient3B,
                            true,
                            gradientWord3.mode === 'stroke-gradient' ? 'stroke-gradient' : 'fill-gradient'
                          );
                        }
                      }}
                      className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1"
                    />
                    <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                      {tx.colorB}
                    </label>
                    <input
                      type="color"
                      value={gradientWord3?.strokeGradientEnd ?? wordGradient3B}
                      onChange={(e) => {
                        const next = e.target.value;
                        setWordGradient3B(next);
                        if (gradientWord3) {
                          upsertWordGradient(
                            3,
                            gradientWord3.strokeGradientStart ?? wordGradient3A,
                            next,
                            true,
                            gradientWord3.mode === 'stroke-gradient' ? 'stroke-gradient' : 'fill-gradient'
                          );
                        }
                      }}
                      className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1"
                    />
                  </div>
                  ) : null}
                </div>
              ) : null}

              {segmentedWords.length > 3
                ? segmentedWords.slice(3).map((word, extraIndex) => {
                    const absoluteIndex = extraIndex + 3;
                    const label = uiLanguage === 'es' ? `Palabra ${absoluteIndex + 1}` : `Word ${absoluteIndex + 1}`;
                    return (
                      <div key={`word-extra-${absoluteIndex}`} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1.5">
                          <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{label}</label>
                          <span className="text-[10px] text-neutral-500">
                            {editWordByWord ? tx.manual : tx.autoFromText}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={word}
                          readOnly={!editWordByWord}
                          onChange={(e) => updateWordAtIndex(absoluteIndex, e.target.value)}
                          className={`${compactInputClass} ${editWordByWord ? '' : 'opacity-80'}`}
                        />
                      </div>
                    );
                  })
                : null}
            </Accordion>

            <Accordion title={tx.fillBorder} storageKey="text3d-fill-border">
              <div className="grid grid-cols-3 gap-1.5">
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                  <input
                    type="checkbox"
                    name="enableFill"
                    checked={props.enableFill}
                    onChange={handleChange}
                    className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                  />
                  Relleno sólido 1
                </label>
                {supportsSecondaryWordStyling ? (
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                    <input
                      type="checkbox"
                      name="enableFillTwo"
                      checked={props.enableFillTwo}
                      onChange={handleChange}
                      className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                    />
                    Relleno sólido 2
                  </label>
                ) : <div />}
                {supportsTertiaryWordStyling ? (
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                    <input
                      type="checkbox"
                      name="enableFillThree"
                      checked={props.enableFillThree}
                      onChange={handleChange}
                      className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                    />
                    Relleno sólido 3
                  </label>
                ) : <div />}
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                  <input
                    type="checkbox"
                    name="enableBorder"
                    checked={props.enableBorder}
                    onChange={handleChange}
                    className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                  />
                  Borde 1
                </label>
                {supportsSecondaryWordStyling ? (
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                    <input
                      type="checkbox"
                      name="enableBorderTwo"
                      checked={props.enableBorderTwo}
                      onChange={handleChange}
                      className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                    />
                    Border 2
                  </label>
                ) : <div />}
                {supportsTertiaryWordStyling ? (
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                    <input
                      type="checkbox"
                      name="enableBorderThree"
                      checked={props.enableBorderThree}
                      onChange={handleChange}
                      className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                    />
                    Border 3
                  </label>
                ) : <div />}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">Fill Color 1</label>
                  <input type="color" name="color" value={props.color} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" />
                </div>
                {supportsSecondaryWordStyling ? (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">Fill Color 2</label>
                    <input type="color" name="colorTwo" value={props.colorTwo} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" />
                  </div>
                ) : <div />}
                {supportsTertiaryWordStyling ? (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">Fill Color 3</label>
                    <input type="color" name="colorThree" value={props.colorThree} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" />
                  </div>
                ) : <div />}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">Border Color 1</label>
                  <input type="color" name="borderColor" value={props.borderColor} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" />
                </div>
                {supportsSecondaryWordStyling ? (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">Border Color 2</label>
                    <input type="color" name="borderColorTwo" value={props.borderColorTwo} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" />
                  </div>
                ) : <div />}
                {supportsTertiaryWordStyling ? (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">Border Color 3</label>
                    <input type="color" name="borderColorThree" value={props.borderColorThree} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" />
                  </div>
                ) : <div />}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">Stroke Width 1</label>
                  <input type="number" min="0" step="0.1" name="borderWidth" value={props.borderWidth} onChange={handleChange} className={compactInputClass} />
                </div>
                {supportsSecondaryWordStyling ? (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">Stroke Width 2</label>
                    <input type="number" min="0" step="0.1" name="borderWidthTwo" value={props.borderWidthTwo} onChange={handleChange} className={compactInputClass} />
                  </div>
                ) : <div />}
                {supportsTertiaryWordStyling ? (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">Stroke Width 3</label>
                    <input type="number" min="0" step="0.1" name="borderWidthThree" value={props.borderWidthThree} onChange={handleChange} className={compactInputClass} />
                  </div>
                ) : <div />}
              </div>
            </Accordion>

            {isAiCircuitHud ? (
            <Accordion title="AI Circuit HUD (Legacy Fields)" storageKey="text3d-ai-circuit">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">Title Text</label>
                <input
                  type="text"
                  name="titleText"
                  value={props.titleText}
                  onChange={handleChange}
                  className={compactInputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">Subtitle Text</label>
                <input
                  type="text"
                  name="subtitleText"
                  value={props.subtitleText}
                  onChange={handleChange}
                  className={compactInputClass}
                />
              </div>
              <p className="text-[10px] text-neutral-500">
                {uiLanguage === 'es'
                  ? 'Campos exclusivos de AI Circuit HUD.'
                  : 'Fields specific to AI Circuit HUD.'}
              </p>
              {isAiCircuitHud ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">Circuit Base Image</label>
                    <input
                      type="text"
                      name="circuitBaseImage"
                      value={props.circuitBaseImage}
                      onChange={handleChange}
                      className={compactInputClass}
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                    <input
                      type="checkbox"
                      name="showCircuitBaseImage"
                      checked={props.showCircuitBaseImage}
                      onChange={handleChange}
                      className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                    />
                    Show Circuit Base Image
                  </label>
                </>
              ) : (
                <p className="text-[10px] text-neutral-500">
                  AI Circuit-specific controls are hidden for this template.
                </p>
              )}
              <div className="grid grid-cols-2 gap-1.5">
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                  <input
                    type="checkbox"
                    name="enableBorder"
                    checked={props.enableBorder}
                    onChange={handleChange}
                    className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                  />
                  Enable Border 1
                </label>
                <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                  <input
                    type="checkbox"
                    name="enableFill"
                    checked={props.enableFill}
                    onChange={handleChange}
                    className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                  />
                  Relleno sólido 1
                </label>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">Border Color 1</label>
                <input
                  type="color"
                  name="borderColor"
                  value={props.borderColor}
                  onChange={handleChange}
                  className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1"
                />
              </div>
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                <input
                  type="checkbox"
                  name="typewriterCursorFollowTextStyle"
                  checked={props.typewriterCursorFollowTextStyle}
                  onChange={handleChange}
                  className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                />
                Typewriter Cursor Follow Style
              </label>
            </Accordion>
            ) : null}
          </>
        ) : null}

        {activeTab === 'particles' ? (
          <ParticlesTab />
        ) : null}

        {activeTab === 'export' ? (
          <>
            <Accordion title={tx.renderOutput} storageKey="export-output">
              <div className="space-y-1">
                <label htmlFor="render-pipeline-preference" className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">Aceleración de render</label>
                <select id="render-pipeline-preference" value={renderPipelinePreference} onChange={(event) => setRenderPipelinePreference(event.target.value as 'auto' | 'gpu' | 'cpu')} className={compactInputClass}>
                  <option value="auto">Automática (GPU → CPU)</option>
                  <option value="gpu">GPU preferida</option>
                  <option value="cpu">CPU</option>
                </select>
                <p className="text-[10px] text-neutral-500">La GPU se intenta primero y el render puede usar CPU si falla.</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.renderMode}</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExportMode('single')}
                    className={`h-7 rounded-md border text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                      exportMode === 'single'
                        ? 'border-neutral-500 bg-neutral-700 text-neutral-100'
                        : 'border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600'
                    }`}
                  >
                    {tx.singleRender}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportMode('batch')}
                    className={`h-7 rounded-md border text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                      exportMode === 'batch'
                        ? 'border-neutral-500 bg-neutral-700 text-neutral-100'
                        : 'border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600'
                    }`}
                  >
                    {tx.batchRender}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                <input
                  type="checkbox"
                  name="isTransparent"
                  checked={props.isTransparent}
                  onChange={handleChange}
                  className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                />
                {tx.alphaChannel}
              </label>

              {props.isTransparent ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.transparentCodec}</label>
                    <select
                      value={transparentCodec}
                      onChange={(e) => setTransparentCodec(e.target.value === 'vp9' ? 'vp9' : 'prores')}
                      className={compactInputClass}
                    >
                      <option value="vp9">{tx.exportWebmFast}</option>
                      <option value="prores">{tx.exportProresHigh}</option>
                    </select>
                  </div>

                  {transparentCodec === 'prores' ? (
                    <p className="text-[10px] leading-snug text-amber-300 bg-amber-950/30 border border-amber-700/40 rounded-md px-2 py-1">
                      {tx.proresWarning}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-[10px] text-neutral-500">{tx.opaqueMp4}</p>
              )}
            </Accordion>

            <Accordion title={tx.actions} storageKey="export-actions">
              {renderDiagnostics ? <p role="status" className="mb-2 rounded-md border border-neutral-700 px-2 py-1 text-[10px] text-neutral-300">Render: {renderDiagnostics.renderMode === 'gpu' ? 'GPU' : 'CPU'} · {renderDiagnostics.glBackend || 'estándar'} · {renderDiagnostics.encodeMode || 'estándar'}{renderDiagnostics.fallbackUsed ? ' · fallback aplicado' : ''}</p> : null}
              {!renderUrl ? (
                <>
                <button
                  type="button"
                  onClick={handleRenderVideo}
                  disabled={isRendering || exportBusy}
                  className={`h-8 w-full rounded-md border text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
                    exportBusy || isRendering
                      ? 'cursor-not-allowed border-neutral-700 bg-neutral-800 text-neutral-500'
                      : 'border-indigo-500/60 bg-indigo-600/90 text-white hover:bg-indigo-500'
                  }`}
                >
                  {isRendering || exportBusy
                    ? exportState.status === 'selecting-destination' ? 'Seleccionando destino...' : exportState.status === 'writing' ? 'Guardando...' : tx.rendering
                    : exportMode === 'batch'
                      ? `${tx.batchRender}`
                        : props.isTransparent
                        ? transparentCodec === 'prores'
                          ? tx.exportProres
                          : tx.exportWebm
                        : tx.exportMp4}
                </button>
                {exportMode === 'single' ? (
                  <div className="mt-2 space-y-1">
                    <button
                      type="button"
                      onClick={handleRenderStillFrame}
                      disabled={isRendering || exportBusy}
                      className="h-8 w-full rounded-md border border-cyan-500/60 bg-cyan-950/60 text-xs font-semibold uppercase tracking-[0.08em] text-cyan-100 hover:bg-cyan-900/70 disabled:cursor-not-allowed disabled:border-neutral-700 disabled:bg-neutral-800 disabled:text-neutral-500"
                    >
                      EXPORTAR PNG DEL FOTOGRAMA ACTUAL
                    </button>
                    <p className="text-[10px] leading-snug text-neutral-500">
                      Pausa o mueve la línea de tiempo y exporta exactamente ese fotograma
                    </p>
                  </div>
                ) : null}
                {exportState.status === 'completed' ? <p role="status" className="mt-1 text-center text-xs text-emerald-300">{exportState.result?.delivery === 'download-requested' ? 'Descarga iniciada' : 'Exportación completada'}</p> : null}
                {exportState.status === 'failed' ? <p role="alert" className="mt-1 text-center text-xs text-red-300">{exportState.error || 'Error de exportación.'}</p> : null}
                {batchProgress ? <p role="status" className="mt-1 text-center text-[10px] text-neutral-400">{batchProgress.current} de {batchProgress.total} · {batchProgress.phase === 'rendering' ? 'Renderizando...' : 'Guardando...'}</p> : null}
                {batchRenderResults.length > 0 ? <div className="mt-2 space-y-1.5"><div className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">{tx.batchDone}: {batchRenderResults.filter((result) => result.status !== 'failed').length} · Fallidos: {batchRenderResults.filter((result) => result.status === 'failed').length}</div>{batchRenderResults.map((result) => <div key={`${result.fileName}-${result.lineNumber}`} className="space-y-1"><div className={result.status === 'failed' ? 'w-full rounded-md border border-red-800/60 bg-neutral-900 px-2 py-1 text-left text-xs text-red-300' : 'w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-left text-xs text-neutral-200'}>{`#${result.lineNumber} · ${result.fileName}`}{result.status === 'failed' ? ` · ${result.error || 'Falló'}` : result.delivery === 'download-requested' ? ' · Descarga iniciada' : ' · Exportación completada'}</div>{result.url ? <div className="grid grid-cols-2 gap-1"><button type="button" disabled={exportBusy} onClick={() => window.open(result.url, '_blank', 'noopener,noreferrer')} className="w-full rounded-md border border-emerald-700/70 px-2 py-1 text-left text-xs text-emerald-200 disabled:opacity-50">Abrir video</button><button type="button" disabled={exportBusy} onClick={() => saveVideo(result.url)} className="w-full rounded-md border border-neutral-700 px-2 py-1 text-left text-xs text-neutral-300 disabled:opacity-50">Descargar resultado renderizado</button></div> : null}</div>)}</div> : null}
                </>
              ) : renderUrl ? (
                <>
                <div className="grid grid-cols-2 gap-1">
<button type="button" onClick={() => window.open(renderUrl, '_blank', 'noopener,noreferrer')} className="h-8 w-full rounded-md border border-emerald-600/60 bg-emerald-600/90 text-xs font-semibold uppercase tracking-[0.08em] text-white hover:bg-emerald-500">Guardar copia</button>
                  <button type="button" onClick={() => saveVideo(renderUrl)} className="h-8 w-full rounded-md border border-neutral-700 px-2 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-200 hover:border-neutral-500">{tx.saveVideo}</button>
                </div>
                {exportState.status === 'completed' ? <p role="status" className="mt-1 text-center text-xs text-emerald-300">Exportación completada</p> : null}
                </>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                    {tx.batchDone}: {batchRenderResults.length}
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-1">
                    {batchRenderResults.map((result) => (
                      <button
                        key={`${result.fileName}-${result.lineNumber}`}
                        type="button"
                        onClick={() => saveVideo(result.url)}
                        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-left text-xs text-neutral-200 hover:bg-neutral-800"
                      >
                        {`#${result.lineNumber} · ${result.fileName}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Accordion>
          </>
        ) : null}
      </div>
      {isClient && charMenuState.visible
        ? createPortal(
            <div
              ref={charMenuRef}
              className="fixed z-[9999] w-56 max-w-[calc(100vw-12px)] max-h-[calc(100vh-12px)] overflow-y-auto rounded-md border border-neutral-700 bg-neutral-950 p-1 shadow-2xl"
              style={{ left: charMenuPosition.left, top: charMenuPosition.top }}
            >
              <div className="rounded border border-neutral-800 bg-neutral-900/60 px-2 py-1.5">
                <div className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                  {uiLanguage === 'es'
                    ? `Caracter ${charMenuState.index + 1}`
                    : `Character ${charMenuState.index + 1}`}
                </div>
                <div className="text-xs text-neutral-200 truncate">
                  {Array.from(props.text || '')[charMenuState.index] === ' '
                    ? (uiLanguage === 'es' ? '(espacio)' : '(space)')
                    : Array.from(props.text || '')[charMenuState.index] || ''}
                </div>
              </div>

              <div className="mt-1 space-y-1 rounded border border-neutral-800 bg-neutral-900/40 p-1.5">
                <div className="rounded border border-neutral-800 p-1">
                  <div className="mb-1 text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                    {uiLanguage === 'es' ? 'Relleno' : 'Fill'}
                  </div>
                  <label className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
                    <input
                      type="checkbox"
                      checked={charTransparentFill}
                      onChange={(e) => setCharTransparentFill(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
                    />
                    {tx.transparentFill}
                  </label>
                  <div className="grid grid-cols-[1fr_auto] gap-1">
                    <input
                      type="color"
                      value={rangeFillColor}
                      onChange={(e) => setRangeFillColor(e.target.value)}
                      className="h-6 w-full rounded border border-neutral-700 bg-neutral-900 p-0.5"
                      disabled={charTransparentFill}
                    />
                    <button
                      type="button"
                      onClick={() => applySingleCharStyle(charMenuState.index, 'fill')}
                      className="rounded border border-neutral-700 px-2 text-xs text-neutral-100 hover:bg-neutral-800"
                    >
                      {uiLanguage === 'es' ? 'Aplicar' : 'Apply'}
                    </button>
                  </div>
                </div>

                <div className="rounded border border-neutral-800 p-1">
                  <div className="mb-1 text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                    {uiLanguage === 'es' ? 'Borde (sin relleno)' : 'Stroke (no fill)'}
                  </div>
                  <div className="grid grid-cols-[1fr_54px_auto] gap-1">
                    <input
                      type="color"
                      value={rangeStrokeColor}
                      onChange={(e) => setRangeStrokeColor(e.target.value)}
                      className="h-6 w-full rounded border border-neutral-700 bg-neutral-900 p-0.5"
                    />
                    <input
                      type="number"
                      min={0.2}
                      max={16}
                      step={0.1}
                      value={rangeStrokeWidth}
                      onChange={(e) => setRangeStrokeWidth(Number(e.target.value))}
                      className="h-6 w-full rounded border border-neutral-700 bg-neutral-900 px-1 text-xs text-neutral-200"
                    />
                    <button
                      type="button"
                      onClick={() => applySingleCharStyle(charMenuState.index, 'stroke')}
                      className="rounded border border-neutral-700 px-2 text-xs text-neutral-100 hover:bg-neutral-800"
                    >
                      {uiLanguage === 'es' ? 'Aplicar' : 'Apply'}
                    </button>
                  </div>
                </div>

                <div className="rounded border border-neutral-800 p-1">
                  <div className="mb-1 text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                    {uiLanguage === 'es' ? 'Relleno + Borde' : 'Fill + Stroke'}
                  </div>
                  <div className="grid grid-cols-[1fr_1fr_54px_auto] gap-1">
                    <input
                      type="color"
                      value={rangeFillColor}
                      onChange={(e) => setRangeFillColor(e.target.value)}
                      className="h-6 w-full rounded border border-neutral-700 bg-neutral-900 p-0.5"
                      disabled={charTransparentFill}
                    />
                    <input
                      type="color"
                      value={rangeStrokeColor}
                      onChange={(e) => setRangeStrokeColor(e.target.value)}
                      className="h-6 w-full rounded border border-neutral-700 bg-neutral-900 p-0.5"
                    />
                    <input
                      type="number"
                      min={0.2}
                      max={16}
                      step={0.1}
                      value={rangeStrokeWidth}
                      onChange={(e) => setRangeStrokeWidth(Number(e.target.value))}
                      className="h-6 w-full rounded border border-neutral-700 bg-neutral-900 px-1 text-xs text-neutral-200"
                    />
                    <button
                      type="button"
                      onClick={() => applySingleCharStyle(charMenuState.index, 'fill-stroke')}
                      className="rounded border border-neutral-700 px-2 text-xs text-neutral-100 hover:bg-neutral-800"
                    >
                      {uiLanguage === 'es' ? 'Aplicar' : 'Apply'}
                    </button>
                  </div>
                </div>

                <div className="rounded border border-neutral-800 p-1">
                  <div className="mb-1 text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                    {uiLanguage === 'es' ? 'Degradado de Relleno' : 'Fill Gradient'}
                  </div>
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-1">
                    <input
                      type="color"
                      value={rangeGradientStart}
                      onChange={(e) => setRangeGradientStart(e.target.value)}
                      className="h-6 w-full rounded border border-neutral-700 bg-neutral-900 p-0.5"
                    />
                    <input
                      type="color"
                      value={rangeGradientEnd}
                      onChange={(e) => setRangeGradientEnd(e.target.value)}
                      className="h-6 w-full rounded border border-neutral-700 bg-neutral-900 p-0.5"
                    />
                    <button
                      type="button"
                      onClick={() => applySingleCharStyle(charMenuState.index, 'fill-gradient')}
                      className="rounded border border-neutral-700 px-2 text-xs text-neutral-100 hover:bg-neutral-800"
                    >
                      {uiLanguage === 'es' ? 'Aplicar' : 'Apply'}
                    </button>
                  </div>
                </div>

                <div className="rounded border border-neutral-800 p-1">
                  <div className="mb-1 text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                    {uiLanguage === 'es' ? 'Degradado de Borde (sin relleno)' : 'Stroke Gradient (no fill)'}
                  </div>
                  <div className="grid grid-cols-[1fr_1fr_54px_auto] gap-1">
                    <input
                      type="color"
                      value={rangeGradientStart}
                      onChange={(e) => setRangeGradientStart(e.target.value)}
                      className="h-6 w-full rounded border border-neutral-700 bg-neutral-900 p-0.5"
                    />
                    <input
                      type="color"
                      value={rangeGradientEnd}
                      onChange={(e) => setRangeGradientEnd(e.target.value)}
                      className="h-6 w-full rounded border border-neutral-700 bg-neutral-900 p-0.5"
                    />
                    <input
                      type="number"
                      min={0.2}
                      max={16}
                      step={0.1}
                      value={rangeStrokeWidth}
                      onChange={(e) => setRangeStrokeWidth(Number(e.target.value))}
                      className="h-6 w-full rounded border border-neutral-700 bg-neutral-900 px-1 text-xs text-neutral-200"
                    />
                    <button
                      type="button"
                      onClick={() => applySingleCharStyle(charMenuState.index, 'stroke-gradient')}
                      className="rounded border border-neutral-700 px-2 text-xs text-neutral-100 hover:bg-neutral-800"
                    >
                      {uiLanguage === 'es' ? 'Aplicar' : 'Apply'}
                    </button>
                  </div>
                </div>
                <label className="block text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                  {tx.font}
                </label>
                <select
                  value={charFontFamily}
                  onChange={(e) => setCharFontFamily(e.target.value)}
                  className={compactInputClass}
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={`char-font-${font}`} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
                <label className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                  {tx.size}
                  <input
                    type="number"
                    min={8}
                    max={420}
                    step={1}
                    value={charFontSize}
                    onChange={(e) => setCharFontSize(Number(e.target.value))}
                    className="h-5 w-20 rounded border border-neutral-700 bg-neutral-900 px-1 text-xs text-neutral-200"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => applySingleCharTypography(charMenuState.index, charFontFamily, charFontSize)}
                  className="w-full rounded border border-neutral-800 px-2 py-1 text-left text-xs text-neutral-200 hover:bg-neutral-800"
                >
                  {tx.applyTypography}
                </button>
                <button
                  type="button"
                  onClick={() => resetSingleCharTypography(charMenuState.index)}
                  className="w-full rounded border border-neutral-700 px-2 py-1 text-left text-xs text-neutral-300 hover:bg-neutral-800"
                >
                  {tx.resetTypography}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const idx = charMenuState.index;
                  setProps((prev) => ({
                    ...prev,
                    textRangeStyles: (prev.textRangeStyles ?? []).filter(
                      (style) => !(style.id.startsWith('char-') && idx >= style.start && idx < style.end)
                    ),
                  }));
                  setCharMenuState((prev) => ({ ...prev, visible: false }));
                }}
                className="mt-1 w-full rounded border border-red-800/60 px-2 py-1 text-left text-xs text-red-200 hover:bg-red-950/50"
              >
                {tx.clearStyle}
              </button>
              <button
                type="button"
                onClick={() => setCharMenuState((prev) => ({ ...prev, visible: false }))}
                className="mt-1 w-full rounded border border-neutral-700 px-2 py-1 text-left text-xs text-neutral-300 hover:bg-neutral-900"
              >
                {uiLanguage === 'es' ? 'Cerrar menú' : 'Close menu'}
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
