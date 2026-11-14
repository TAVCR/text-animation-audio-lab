'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import MovableResizablePanel from '@/components/MovableResizablePanel';
import PreviewContainer from '@/components/PreviewContainer';
import { Resizable } from 're-resizable';
import { defaultAnimationProps, useAnimation } from '@/lib/AnimationContext';
import type { TextRangeStyle, TextRangeStyleMode } from '@/lib/AnimationContext';
import { useRenderExport } from '@/lib/hooks/useRenderExport';
import {
  getEffectiveDurationInFrames,
  getResolvedDurationInFrames,
  MAX_DURATION_IN_FRAMES,
  MIN_DURATION_IN_FRAMES,
  REMOTION_FPS,
  sanitizeDurationInFrames,
  sanitizeSpeedMultiplier,
} from '@/lib/videoConfig';

const FONTS = [
  'Arial', 'Impact', 'Helvetica', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Times New Roman',
  'Georgia', 'Courier New', 'Comic Sans MS', 'Roboto', 'Montserrat', 'Open Sans', 'Oswald',
  'Bebas Neue', 'Bangers', 'Anton', 'Poppins', 'Inter', 'Playfair Display', 'Rubik', 'Nunito',
  'Roboto Mono', 'Orbitron',
];
const RECENT_FONTS_STORAGE_KEY = 'remotion-fx:recent-fonts:v1';
const MAX_RECENT_FONTS = 12;
const TOP_WORKSPACE_SIZE_STORAGE_KEY = 'remotion-fx:top-controls-workspace-size:v1';
const TOP_WORKSPACE_DEFAULT_WIDTH = 1400;
const TOP_WORKSPACE_MIN_WIDTH = 780;
const TOP_WORKSPACE_DEFAULT_HEIGHT = 860;
const TOP_WORKSPACE_MIN_HEIGHT = 520;

type LocalFont = { family: string };
type WindowWithLocalFonts = Window & {
  queryLocalFonts?: () => Promise<LocalFont[]>;
};

const normalizeFontName = (value: string): string => value.trim();

const mergeFontFamilies = (...groups: Array<readonly string[]>): string[] => {
  const normalized = new Map<string, string>();
  for (const group of groups) {
    for (const rawFont of group) {
      const font = normalizeFontName(rawFont);
      if (!font) continue;
      const key = font.toLocaleLowerCase();
      if (!normalized.has(key)) normalized.set(key, font);
    }
  }

  return Array.from(normalized.values()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );
};

const parseRecentFonts = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => (typeof value === 'string' ? normalizeFontName(value) : ''))
      .filter(Boolean)
      .slice(0, MAX_RECENT_FONTS);
  } catch {
    return [];
  }
};

const weightOptions = [
  { value: '100', label: 'Thin (100)' },
  { value: '200', label: 'Extra Light (200)' },
  { value: '300', label: 'Light (300)' },
  { value: '400', label: 'Regular (400)' },
  { value: '500', label: 'Medium (500)' },
  { value: '600', label: 'Semi Bold (600)' },
  { value: '700', label: 'Bold (700)' },
  { value: '800', label: 'Extra Bold (800)' },
  { value: '900', label: 'Black (900)' },
  { value: 'normal', label: 'Normal' },
  { value: 'bold', label: 'Bold Classic' },
];

const animationStyleOptions = [
  { value: 'typewriter', label: 'Typewriter (Clásico)' },
  { value: 'slide-in', label: 'Kinetic Slide-in' },
  { value: 'kinetic-box-sequence', label: 'Kinetic Box Sequence (Experimental)' },
  { value: 'apple-style', label: 'Apple Style Text (Bounce)' },
  { value: 'bubble-pop', label: 'Bubble Pop (Energético)' },
  { value: 'glitch', label: 'Cyberpunk Glitch' },
  { value: 'wipe-reveal', label: 'Smooth Wipe Reveal' },
  { value: 'blur-reveal', label: 'Cinematic Blur Reveal' },
  { value: 'scramble', label: 'Hacker Scramble (Matrix)' },
  { value: 'neon-pulse', label: 'Neon Flicker Pulse' },
  { value: 'flicker', label: 'Broken Film Flicker' },
  { value: 'flicker-outline-fill', label: 'Broken Film Flicker (Borde a Relleno)' },
  { value: 'smooth-sliding', label: 'Smooth Cascade Sliding' },
  { value: 'slide-reveal', label: 'Solid Box Reveal' },
  { value: 'shape-reveal', label: 'Shape Reveal (Masked Grad)' },
  { value: 'fly-through', label: '3D Camera Fly-Through' },
  { value: 'clean-modern', label: 'Clean Modern (Sombra)' },
  { value: 'bar-reveal', label: 'Bar Reveal & Replace (Doble)' },
  { value: 'follower-grow', label: 'Follower Grow (Wavy)' },
  { value: 'follower', label: 'Character Cascade Drop' },
  { value: 'rotation', label: '3D Rotation By Word' },
  { value: 'viral-text', label: 'Viral Text (Multi-Fuente)' },
  { value: 'shake-flicker', label: 'Shake Errático' },
  { value: 'blur-cascade', label: 'Blurring Text Cascade' },
  { value: 'cinematic', label: 'Cinematic Text (Zoom)' },
  { value: 'extruded-3d', label: 'Impacto 3D Real (Fuente Principal + Override)' },
] as const;

const clampWeight = (value: string | number): number => {
  const numeric = Number.parseInt(String(value), 10);
  if (!Number.isFinite(numeric)) return 700;
  return Math.min(900, Math.max(100, Math.round(numeric / 100) * 100));
};

function adjustRangeIndices(
  ranges: TextRangeStyle[],
  oldText: string,
  newText: string
): TextRangeStyle[] {
  if (oldText === newText) return ranges;

  // Find the first position where texts diverge
  let changeIndex = 0;
  const minLen = Math.min(oldText.length, newText.length);
  while (changeIndex < minLen && oldText[changeIndex] === newText[changeIndex]) {
    changeIndex++;
  }

  const oldLen = oldText.length;
  const newLen = newText.length;
  const delta = newLen - oldLen; // positive = insertion, negative = deletion

  if (delta === 0) return ranges; // same length, no index adjustment needed

  const result: TextRangeStyle[] = [];

  for (const range of ranges) {
    let start = range.start;
    let end = range.end;

    if (delta > 0) {
      // Insertion of `delta` chars at `changeIndex`
      if (start >= changeIndex) start += delta;
      if (end >= changeIndex) end += delta;
      // If range straddles changeIndex, expand it
      if (start < changeIndex && end >= changeIndex) {
        end += delta;
      }
    } else {
      // Deletion: chars from `changeIndex` to `changeIndex + Math.abs(delta)` were removed
      const deleteStart = changeIndex;
      const deleteEnd = changeIndex + Math.abs(delta);

      // Range fully inside deleted region — discard
      if (start >= deleteStart && end <= deleteEnd) continue;

      // Clamp start
      if (start >= deleteStart && start < deleteEnd) start = deleteStart;
      else if (start >= deleteEnd) start += delta;

      // Clamp end
      if (end > deleteStart && end <= deleteEnd) end = deleteStart;
      else if (end > deleteEnd) end += delta;
    }

    // Discard collapsed or inverted ranges
    if (start >= end) continue;

    result.push({ ...range, start, end });
  }

  return result;
}

export default function TopPrimaryControls() {
  const { props, setProps } = useAnimation();
  const [transparentCodec, setTransparentCodec] = React.useState<'vp9' | 'prores'>('prores');
  const { isRendering, renderUrl, saveVideo, renderVideo, handlePropChange } = useRenderExport({ props, setProps });
  const [rangeMenu, setRangeMenu] = React.useState<{
    open: boolean;
    x: number;
    y: number;
    start: number;
    end: number;
  }>({ open: false, x: 0, y: 0, start: 0, end: 0 });
  const [rangePrimaryMode, setRangePrimaryMode] = React.useState<'fill' | 'stroke'>('stroke');
  const [rangeColorMode, setRangeColorMode] = React.useState<'solid' | 'gradient'>('solid');
  const [rangeFillColor, setRangeFillColor] = React.useState('#ffffff');
  const [rangeStrokeColor, setRangeStrokeColor] = React.useState('#66ccff');
  const [rangeStrokeWidth, setRangeStrokeWidth] = React.useState(4);
  const [rangeGradientStart, setRangeGradientStart] = React.useState('#66ccff');
  const [rangeGradientEnd, setRangeGradientEnd] = React.useState('#ff55c7');
  const [rangeApplyTypography, setRangeApplyTypography] = React.useState(false);
  const [rangeFontFamily, setRangeFontFamily] = React.useState('Poppins');
  const [rangeFontSize, setRangeFontSize] = React.useState(120);
  const [rangeFontWeight, setRangeFontWeight] = React.useState('700');
  const [rangeItalic, setRangeItalic] = React.useState(false);
  const [rangeUnderline, setRangeUnderline] = React.useState(false);
  const [rangeApplyGlow, setRangeApplyGlow] = React.useState(false);
  const [rangeGlowColor, setRangeGlowColor] = React.useState('#66ccff');
  const [rangeGlowBlur, setRangeGlowBlur] = React.useState(8);
  const [rangeGlowOpacity, setRangeGlowOpacity] = React.useState(0.25);
  const [rangeUseOpacity, setRangeUseOpacity] = React.useState(false);
  const [rangeOpacity, setRangeOpacity] = React.useState(1);
  const rangeMenuRef = React.useRef<HTMLDivElement | null>(null);
  const rangePreviewIdRef = React.useRef<string | null>(null);
  const [isClientMounted, setIsClientMounted] = React.useState(false);

  React.useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const resetToDefaults = () => {
    if (confirm('¿Seguro que deseas volver a los valores por defecto? Se perderán los ajustes actuales.')) {
      setProps(defaultAnimationProps);
    }
  };

  const handleRenderVideo = async () => {
    try {
      const result = await renderVideo({ transparentCodec });
      if (result.mode === 'single') {
        alert('Renderizado completado. Por favor haz clic en "Guardar Video" para elegir la ruta de descarga.');
      }
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'Error desconocido';
      alert('Error en el render: ' + message);
    }
  };

  
  const [localFonts, setLocalFonts] = React.useState<string[]>(() => mergeFontFamilies(FONTS));
  const [recentFonts, setRecentFonts] = React.useState<string[]>([]);
  const [canQueryLocalFonts, setCanQueryLocalFonts] = React.useState(false);
  const hasLoadedSystemFontsRef = React.useRef(false);
  const workspaceHostRef = React.useRef<HTMLDivElement>(null);
  const [workspaceMaxWidth, setWorkspaceMaxWidth] = React.useState(TOP_WORKSPACE_DEFAULT_WIDTH);
  const [workspaceSize, setWorkspaceSize] = React.useState<{ width: number; height: number }>({
    width: TOP_WORKSPACE_DEFAULT_WIDTH,
    height: TOP_WORKSPACE_DEFAULT_HEIGHT,
  });

  const parseList = React.useCallback((value: string): string[] => {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, []);

  const parseDurationList = React.useCallback((value: string): number[] => {
    return parseList(value)
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0);
  }, [parseList]);

  const parseWords = React.useCallback((value: string): string[] => {
    return value.match(/\S+/g) ?? [];
  }, []);

  const needsWordTwo = ['bar-reveal', 'viral-text'].includes(props.animationStyle);
  const needsWordThree = props.animationStyle === 'viral-text';
  const isViralText = props.animationStyle === 'viral-text';
  const isKineticBoxSequence = props.animationStyle === 'kinetic-box-sequence';
  const isAiCircuitHud = false;
  const isFlickerOutlineFill = props.animationStyle === 'flicker-outline-fill';
  const showWordTwoControls = needsWordTwo && (props.animationStyle !== 'viral-text' || props.showWordTwo);
  const showWordThreeControls = needsWordThree && props.showWordThree;
  const showFloatingSpecificPanel =
    props.animationStyle === 'typewriter' ||
    props.animationStyle === 'slide-in' ||
    isKineticBoxSequence ||
    props.animationStyle === 'smooth-sliding' ||
    props.animationStyle === 'follower' ||
    props.animationStyle === 'cinematic' ||
    props.animationStyle === 'fly-through' ||
    props.animationStyle === 'extruded-3d' ||
    props.animationStyle === 'slide-reveal' ||
    props.animationStyle === 'bar-reveal' ||
    props.animationStyle === 'shape-reveal' ||
    props.animationStyle === 'blur-cascade' ||
    isViralText ||
    showWordTwoControls ||
    showWordThreeControls;
  const kineticWords = React.useMemo(() => parseWords(props.text || ''), [parseWords, props.text]);
  const parsedKineticDurations = parseDurationList(props.boxSequenceDurationsRaw || '');
  const activeKineticBoxCount = Math.max(1, kineticWords.length);
  const getKineticDuration = React.useCallback((index: number): number => {
    if (parsedKineticDurations[index] !== undefined) return parsedKineticDurations[index];
    if (index === 0) return Math.max(0.2, props.boxSequenceDurationOne || 1);
    if (index === 1) return Math.max(0.2, props.boxSequenceDurationTwo || props.boxSequenceDurationOne || 1);
    if (index === 2) return Math.max(0.2, props.boxSequenceDurationThree || props.boxSequenceDurationTwo || props.boxSequenceDurationOne || 1);
    if (index === 3) return Math.max(0.2, props.boxSequenceDurationFour || props.boxSequenceDurationThree || props.boxSequenceDurationTwo || props.boxSequenceDurationOne || 1);
    return Math.max(0.2, props.boxSequenceDurationFour || props.boxSequenceDurationThree || props.boxSequenceDurationTwo || props.boxSequenceDurationOne || 1);
  }, [
    parsedKineticDurations,
    props.boxSequenceDurationFour,
    props.boxSequenceDurationOne,
    props.boxSequenceDurationThree,
    props.boxSequenceDurationTwo,
  ]);
  const kineticDurationSeconds = React.useMemo(
    () => Array.from({ length: activeKineticBoxCount }, (_, index) => Number(getKineticDuration(index).toFixed(2))),
    [activeKineticBoxCount, getKineticDuration]
  );
  const updateKineticDurationAtIndex = React.useCallback((index: number, value: number) => {
    const safeValue = Number.isFinite(value) ? Math.max(0.15, Math.min(20, value)) : 1;
    const next = [...kineticDurationSeconds];
    while (next.length < activeKineticBoxCount) {
      next.push(1);
    }
    next[index] = safeValue;
    setProps((prev) => ({
      ...prev,
      boxSequenceDurationsRaw: next.map((item) => Number(item.toFixed(2))).join(', '),
    }));
  }, [activeKineticBoxCount, kineticDurationSeconds, setProps]);
  const kineticRequestedSeconds = Array.from({ length: activeKineticBoxCount }, (_, index) => getKineticDuration(index))
    .reduce((acc, value) => acc + value, 0);
  const showViralBlockTwo = isViralText ? props.showWordTwo : false;
  const showViralBlockThree = isViralText ? props.showWordThree : false;
  const safeSpeed = sanitizeSpeedMultiplier(props.speed);
  const baseDurationInFrames = sanitizeDurationInFrames(props.motionDurationFrames);
  const totalDurationInFrames = getResolvedDurationInFrames(props, REMOTION_FPS);
  const totalDurationSeconds = totalDurationInFrames / REMOTION_FPS;
  const baseDurationSeconds = baseDurationInFrames / REMOTION_FPS;

  const mergeLocalFonts = React.useCallback((families: readonly string[]) => {
    if (families.length === 0) return;
    setLocalFonts((prev) => {
      const merged = mergeFontFamilies(prev, FONTS, families);
      if (merged.length === prev.length && merged.every((font, index) => font === prev[index])) {
        return prev;
      }
      return merged;
    });
  }, []);

  const loadLocalFonts = React.useCallback(async () => {
    const win = window as WindowWithLocalFonts;
    if (typeof win.queryLocalFonts !== 'function') return;
    try {
      const fonts = await win.queryLocalFonts();
      const uniqueFamilies = fonts
        .map((font) => normalizeFontName(font.family))
        .filter(Boolean);
      mergeLocalFonts(uniqueFamilies);
      hasLoadedSystemFontsRef.current = true;
    } catch {
      // Ignore denied permission and keep fallback list.
    }
  }, [mergeLocalFonts]);

  const rememberFontsAsRecent = React.useCallback((families: string[]) => {
    setRecentFonts((prev) => {
      const next = [...prev];
      let changed = false;

      for (const rawFamily of families) {
        const family = normalizeFontName(rawFamily);
        if (!family) continue;
        const existingIndex = next.findIndex(
          (item) => item.localeCompare(family, undefined, { sensitivity: 'base' }) === 0
        );
        if (existingIndex === 0) continue;
        if (existingIndex > 0) {
          next.splice(existingIndex, 1);
        }
        next.unshift(family);
        changed = true;
      }

      if (next.length > MAX_RECENT_FONTS) {
        next.splice(MAX_RECENT_FONTS);
        changed = true;
      }

      if (!changed) return prev;
      return next;
    });
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    setCanQueryLocalFonts(typeof (window as WindowWithLocalFonts).queryLocalFonts === 'function');
    setRecentFonts(parseRecentFonts(window.localStorage.getItem(RECENT_FONTS_STORAGE_KEY)));
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(RECENT_FONTS_STORAGE_KEY, JSON.stringify(recentFonts.slice(0, MAX_RECENT_FONTS)));
    } catch {
      // Ignore localStorage write errors.
    }
  }, [recentFonts]);

  React.useEffect(() => {
    const currentFamilies = [props.fontFamily, props.fontFamilyTwo, props.fontFamilyThree];
    mergeLocalFonts(currentFamilies);
    rememberFontsAsRecent(currentFamilies);
  }, [
    mergeLocalFonts,
    props.fontFamily,
    props.fontFamilyThree,
    props.fontFamilyTwo,
    rememberFontsAsRecent,
  ]);

  React.useEffect(() => {
    if (!canQueryLocalFonts) return;
    void loadLocalFonts();
  }, [canQueryLocalFonts, loadLocalFonts]);

  const ensureLocalFonts = React.useCallback(() => {
    if (!canQueryLocalFonts) return;
    if (hasLoadedSystemFontsRef.current) return;
    void loadLocalFonts();
  }, [canQueryLocalFonts, loadLocalFonts]);

  const recentFontOptions = React.useMemo(() => {
    const localSet = new Set(localFonts.map((font) => font.toLocaleLowerCase()));
    return recentFonts.filter((font) => localSet.has(font.toLocaleLowerCase()));
  }, [localFonts, recentFonts]);

  const allFontOptions = React.useMemo(() => {
    const recentSet = new Set(recentFontOptions.map((font) => font.toLocaleLowerCase()));
    return localFonts.filter((font) => !recentSet.has(font.toLocaleLowerCase()));
  }, [localFonts, recentFontOptions]);

  const renderFontOptions = (selectedValue: string) => {
    const hasSelectedInRecent = recentFontOptions.some((font) => font === selectedValue);
    const hasSelectedInAll = allFontOptions.some((font) => font === selectedValue);
    
  

  

  return (
      <>
        {!hasSelectedInRecent && !hasSelectedInAll ? (
          <option value={selectedValue}>{selectedValue}</option>
        ) : null}
        {recentFontOptions.length > 0 ? (
          <optgroup label="Recientes">
            {recentFontOptions.map((font) => (
              <option key={`recent-${font}`} value={font}>{font}</option>
            ))}
          </optgroup>
        ) : null}
        <optgroup label="Todas las instaladas">
          {allFontOptions.map((font) => (
            <option key={`all-${font}`} value={font}>{font}</option>
          ))}
        </optgroup>
      </>
    );
  };

  React.useEffect(() => {
    if (isFlickerOutlineFill && !props.enableFill) {
      setProps((prev) => ({ ...prev, enableFill: true }));
    }
  }, [isFlickerOutlineFill, props.enableFill, setProps]);

  const clampWorkspaceWidth = React.useCallback((nextWidth: number, maxWidth: number) => {
    const minWidth = Math.min(TOP_WORKSPACE_MIN_WIDTH, maxWidth);
    return Math.max(minWidth, Math.min(nextWidth, maxWidth));
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(TOP_WORKSPACE_SIZE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{ width: number; height: number }>;
      if (!parsed || typeof parsed !== 'object') return;
      const width = Number.isFinite(parsed.width) ? Number(parsed.width) : TOP_WORKSPACE_DEFAULT_WIDTH;
      const height = Number.isFinite(parsed.height) ? Number(parsed.height) : TOP_WORKSPACE_DEFAULT_HEIGHT;
      setWorkspaceSize({
        width: Math.max(TOP_WORKSPACE_MIN_WIDTH, width),
        height: Math.max(TOP_WORKSPACE_MIN_HEIGHT, height),
      });
    } catch {
      // Ignore workspace storage parsing errors.
    }
  }, []);

  React.useEffect(() => {
    const updateWorkspaceBounds = () => {
      const hostWidth = workspaceHostRef.current?.clientWidth ?? TOP_WORKSPACE_DEFAULT_WIDTH;
      setWorkspaceMaxWidth(hostWidth);
      setWorkspaceSize((prev) => ({
        width: clampWorkspaceWidth(prev.width, hostWidth),
        height: Math.max(TOP_WORKSPACE_MIN_HEIGHT, prev.height),
      }));
    };

    updateWorkspaceBounds();
    window.addEventListener('resize', updateWorkspaceBounds);
    return () => window.removeEventListener('resize', updateWorkspaceBounds);
  }, [clampWorkspaceWidth]);

  const persistWorkspaceSize = React.useCallback((width: number, height: number) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        TOP_WORKSPACE_SIZE_STORAGE_KEY,
        JSON.stringify({ width, height })
      );
    } catch {
      // Ignore workspace storage write errors.
    }
  }, []);

  const handleWorkspaceResize = React.useCallback(
    (_event: MouseEvent | TouchEvent, _direction: unknown, ref: HTMLElement) => {
      const width = clampWorkspaceWidth(ref.offsetWidth, workspaceMaxWidth);
      const height = Math.max(TOP_WORKSPACE_MIN_HEIGHT, ref.offsetHeight);
      setWorkspaceSize({ width, height });
    },
    [clampWorkspaceWidth, workspaceMaxWidth]
  );

  const handleWorkspaceResizeStop = React.useCallback(
    (_event: MouseEvent | TouchEvent, _direction: unknown, ref: HTMLElement) => {
      const width = clampWorkspaceWidth(ref.offsetWidth, workspaceMaxWidth);
      const height = Math.max(TOP_WORKSPACE_MIN_HEIGHT, ref.offsetHeight);
      setWorkspaceSize({ width, height });
      persistWorkspaceSize(width, height);
    },
    [clampWorkspaceWidth, persistWorkspaceSize, workspaceMaxWidth]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (name === 'text') {
      const adjustedRanges = adjustRangeIndices(
        props.textRangeStyles ?? [],
        props.text ?? '',
        value
      );
      setProps((prev) => ({
        ...prev,
        text: value,
        textRangeStyles: adjustedRanges,
      }));
      return;
    }

    if ((type === 'number' || type === 'range') && ['fontWeight', 'fontWeightTwo', 'fontWeightThree'].includes(name)) {
      const numeric = Number(value);
      setProps((prev) => ({ ...prev, [name]: String(clampWeight(numeric)) }));
      return;
    }

    handlePropChange(e);
  };

  const closeRangeMenu = React.useCallback(
    (commit = false) => {
      setRangeMenu((prev) => ({ ...prev, open: false }));
      const previewId = rangePreviewIdRef.current;
      if (!commit && previewId) {
        setProps((prev) => ({
          ...prev,
          textRangeStyles: (prev.textRangeStyles ?? []).filter((style) => style.id !== previewId),
        }));
      }
      rangePreviewIdRef.current = null;
    },
    [setProps]
  );

  const handleMainTextContextMenu = (e: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    if (end <= start) return;
    e.preventDefault();
    const previousPreviewId = rangePreviewIdRef.current;
    if (previousPreviewId) {
      setProps((prev) => ({
        ...prev,
        textRangeStyles: (prev.textRangeStyles ?? []).filter((style) => style.id !== previousPreviewId),
      }));
    }
    rangePreviewIdRef.current = `preview-range-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setRangeFontFamily(props.fontFamily || 'Poppins');
    setRangeFontSize(Math.max(12, Math.min(1200, props.fontSize || 120)));
    setRangeFontWeight(String(clampWeight(props.fontWeight || '700')));
    const RANGE_MENU_WIDTH = 368;
    const RANGE_MENU_HEIGHT = 420;
    const rawX = e.clientX;
    const rawY = e.clientY;
    const clampedX = Math.min(rawX, window.innerWidth - RANGE_MENU_WIDTH - 8);
    const clampedY = Math.min(rawY, window.innerHeight - RANGE_MENU_HEIGHT - 8);
    setRangeMenu({
      open: true,
      x: clampedX,
      y: clampedY,
      start,
      end,
    });
  };

  const applyRangeStyle = () => {
    const textLength = Array.from(props.text ?? '').length;
    const rawStart = rangeMenu.start;
    const rawEnd = rangeMenu.end;
    const start = Math.max(0, Math.min(textLength, Math.floor(Math.min(rawStart, rawEnd))));
    const end = Math.max(0, Math.min(textLength, Math.floor(Math.max(rawStart, rawEnd))));
    if (end <= start) return;
    const previewId = rangePreviewIdRef.current;
    if (previewId) {
      setProps((prev) => ({
        ...prev,
        textRangeStyles: (prev.textRangeStyles ?? []).map((range) =>
          range.id === previewId ? { ...range, id: `range-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` } : range
        ),
      }));
    }
    closeRangeMenu(true);
  };

  const clearRangeStyle = () => {
    const textLength = Array.from(props.text ?? '').length;
    const rawStart = rangeMenu.start;
    const rawEnd = rangeMenu.end;
    const start = Math.max(0, Math.min(textLength, Math.floor(Math.min(rawStart, rawEnd))));
    const end = Math.max(0, Math.min(textLength, Math.floor(Math.max(rawStart, rawEnd))));
    if (end <= start) return;
    setProps((prev) => ({
      ...prev,
      textRangeStyles: (prev.textRangeStyles ?? []).filter(
        (range) => range.end <= start || range.start >= end
      ),
    }));
    closeRangeMenu(true);
  };

  React.useEffect(() => {
    if (!rangeMenu.open) return;

    const textLength = Array.from(props.text ?? '').length;
    const rawStart = rangeMenu.start;
    const rawEnd = rangeMenu.end;
    const start = Math.max(0, Math.min(textLength, Math.floor(Math.min(rawStart, rawEnd))));
    const end = Math.max(0, Math.min(textLength, Math.floor(Math.max(rawStart, rawEnd))));
    if (end <= start) return;

    const mode: TextRangeStyleMode =
      rangePrimaryMode === 'fill'
        ? rangeColorMode === 'gradient'
          ? 'fill-gradient'
          : 'fill'
        : rangeColorMode === 'gradient'
        ? 'stroke-gradient'
        : 'stroke';

    const previewId =
      rangePreviewIdRef.current ?? `preview-range-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    rangePreviewIdRef.current = previewId;
    const previewRange: TextRangeStyle = {
      id: previewId,
      start,
      end,
      mode,
      fillColor: mode === 'fill' ? rangeFillColor : undefined,
      strokeWidth: rangePrimaryMode === 'stroke' ? rangeStrokeWidth : undefined,
      strokeColor: mode === 'stroke' ? rangeStrokeColor : undefined,
      strokeGradientStart: rangeColorMode === 'gradient' ? rangeGradientStart : undefined,
      strokeGradientEnd: rangeColorMode === 'gradient' ? rangeGradientEnd : undefined,
      glowColor: rangeApplyGlow ? rangeGlowColor : undefined,
      glowBlur: rangeApplyGlow ? rangeGlowBlur : undefined,
      glowOpacity: rangeApplyGlow ? rangeGlowOpacity : undefined,
      fontFamily: rangeApplyTypography ? rangeFontFamily : undefined,
      fontSize: rangeApplyTypography ? rangeFontSize : undefined,
      fontWeight: rangeApplyTypography ? rangeFontWeight : undefined,
      fontStyle: rangeApplyTypography ? (rangeItalic ? 'italic' : 'normal') : undefined,
      textDecoration: rangeApplyTypography ? (rangeUnderline ? 'underline' : 'none') : undefined,
      opacity: rangeUseOpacity ? rangeOpacity : undefined,
    };
    setProps((prev) => {
      const baseStyles = (prev.textRangeStyles ?? []).filter((style) => !style.id.startsWith('preview-range-'));
      const keptStyles = baseStyles.filter((range) => range.end <= start || range.start >= end);
      return { ...prev, textRangeStyles: [...keptStyles, previewRange] };
    });
  }, [
    props.text,
    rangeApplyGlow,
    rangeApplyTypography,
    rangeColorMode,
    rangeFillColor,
    rangeFontFamily,
    rangeFontSize,
    rangeFontWeight,
    rangeGlowBlur,
    rangeGlowColor,
    rangeGlowOpacity,
    rangeGradientEnd,
    rangeGradientStart,
    rangeItalic,
    rangeMenu.end,
    rangeMenu.open,
    rangeMenu.start,
    rangeOpacity,
    rangePrimaryMode,
    rangeStrokeColor,
    rangeStrokeWidth,
    rangeUnderline,
    rangeUseOpacity,
    setProps,
  ]);

  React.useEffect(() => {
    if (!rangeMenu.open) return;
    const closeIfOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && rangeMenuRef.current?.contains(target)) return;
      closeRangeMenu();
    };
    const closeOnScroll = () => closeRangeMenu();
    window.addEventListener('mousedown', closeIfOutside);
    window.addEventListener('scroll', closeOnScroll, true);
    return () => {
      window.removeEventListener('mousedown', closeIfOutside);
      window.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [closeRangeMenu, rangeMenu.open]);

  const updateTotalDurationSeconds = (seconds: number) => {
    if (!Number.isFinite(seconds)) return;
    const targetEffectiveFrames = sanitizeDurationInFrames(seconds * REMOTION_FPS);
    const nextBaseFrames = props.speedControlsDuration
      ? sanitizeDurationInFrames(targetEffectiveFrames * safeSpeed)
      : targetEffectiveFrames;
    setProps((prev) => ({ ...prev, motionDurationFrames: nextBaseFrames }));
  };

  const handleSpeedDurationToggle = (checked: boolean) => {
    setProps((prev) => {
      const prevSpeed = sanitizeSpeedMultiplier(prev.speed);
      const currentEffective = getEffectiveDurationInFrames(
        prev.motionDurationFrames,
        prevSpeed,
        prev.speedControlsDuration
      );
      const nextBase = checked
        ? sanitizeDurationInFrames(currentEffective * prevSpeed)
        : currentEffective;

      return {
        ...prev,
        speedControlsDuration: checked,
        motionDurationFrames: nextBase,
      };
    });
  };

  const getDefaultNumericValue = (name: string, fallback: number): number => {
    const defaultValue = defaultAnimationProps[name as keyof typeof defaultAnimationProps];
    return typeof defaultValue === 'number' ? defaultValue : fallback;
  };

  const renderWeightSelector = (name: string, value: string) => (
    <div className="flex flex-col gap-1">
      <select
        name={name}
        value={String(clampWeight(value))}
        onChange={handleChange}
        className="w-full max-w-[12rem] bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none cursor-pointer"
      >
        {weightOptions.filter((w) => /^\d+$/.test(w.value)).map((w) => (
          <option key={`${name}-${w.value}`} value={w.value}>{w.label}</option>
        ))}
      </select>
    </div>
  );
  const renderSizeSlider = (name: string, value: number) => (
    <input
      type="range"
      min="12"
      max="1200"
      step="1"
      name={name}
      value={value}
      onChange={handleChange}
      className="max-w-full [--range-width:12rem] cursor-pointer"
    />
  );
  const renderLetterSpacingSlider = (name: string, value: number) => (
    <input
      type="range"
      min="-2"
      max="24"
      step="1"
      name={name}
      value={value}
      onChange={handleChange}
      className="max-w-full [--range-width:11rem] cursor-pointer"
    />
  );
  const renderLineHeightSlider = (name: string, value: number) => (
    <input
      type="range"
      min="0.8"
      max="2"
      step="0.05"
      name={name}
      value={value}
      onChange={handleChange}
      className="max-w-full [--range-width:11rem] cursor-pointer"
    />
  );
  const renderBorderWidthSlider = (name: string, value: number, disabled: boolean) => (
    <input
      type="range"
      min="0"
      max="80"
      step="0.1"
      name={name}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className="max-w-full [--range-width:11rem] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    />
  );
  const renderFontSelector = (name: string, value: string) => (
    <select
      name={name}
      value={value}
      onChange={handleChange}
      onFocus={ensureLocalFonts}
      onPointerDown={ensureLocalFonts}
      className="w-full max-w-[12rem] bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none cursor-pointer"
    >
      {renderFontOptions(value)}
    </select>
  );
  const topCompactContainerClass =
    'inline-flex w-fit max-w-full rounded-md border border-neutral-700 bg-neutral-900/60 px-2 py-1.5 flex-wrap gap-2 items-end';
  const renderTextWordControls = ({
    title,
    textName,
    textValue,
    fontName,
    fontValue,
    weightName,
    weightValue,
    sizeName,
    sizeValue,
    letterSpacingName,
    letterSpacingValue,
    lineHeightName,
    lineHeightValue,
    colorName,
    colorValue,
    borderColorName,
    borderColorValue,
    borderWidthName,
    borderWidthValue,
    enableBorderName,
    enableBorderValue,
    enableFillName,
    enableFillValue,
    enableShadowName,
    enableShadowValue,
    shadowColorName,
    shadowColorValue,
    shadowBlurName,
    shadowBlurValue,
    showShadowControls,
  }: {
    title: string;
    textName: string;
    textValue: string;
    fontName: string;
    fontValue: string;
    weightName: string;
    weightValue: string;
    sizeName: string;
    sizeValue: number;
    letterSpacingName: string;
    letterSpacingValue: number;
    lineHeightName: string;
    lineHeightValue: number;
    colorName: string;
    colorValue: string;
    borderColorName: string;
    borderColorValue: string;
    borderWidthName: string;
    borderWidthValue: number;
    enableBorderName: string;
    enableBorderValue: boolean;
    enableFillName: string;
    enableFillValue: boolean;
    enableShadowName: string;
    enableShadowValue: boolean;
    shadowColorName: string;
    shadowColorValue: string;
    shadowBlurName: string;
    shadowBlurValue: number;
    showShadowControls: boolean;
  }) => (
    <div className="space-y-2 border-t border-neutral-800 pt-2">
      <label className="text-sm text-neutral-300 font-semibold uppercase">{title}</label>
      <input
        type="text"
        name={textName}
        value={textValue}
        onChange={handleChange}
        className="w-full md:max-w-[680px] bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none"
      />
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1 w-full md:w-[280px]">
          <label className="text-xs text-neutral-400 font-semibold uppercase">Fuente</label>
          {renderFontSelector(fontName, fontValue)}
        </div>
        <div className="space-y-1 w-auto">
          <label className="text-xs text-neutral-400 font-semibold uppercase">Grosor / Estilo</label>
          {renderWeightSelector(weightName, weightValue)}
        </div>
        <div className="rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2 flex flex-wrap gap-3 items-end">
          <label className="text-xs text-neutral-400 font-semibold uppercase">Tamaño y Espaciado</label>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
            <div className="space-y-1 min-w-[138px]">
              <label className="text-xs text-neutral-400 font-semibold uppercase flex justify-between">
                <span>Tamaño</span>
                <span className="text-emerald-400">{sizeValue}px</span>
              </label>
              {renderSizeSlider(sizeName, sizeValue)}
            </div>
            <div className="space-y-1 min-w-[130px]">
              <label className="text-xs text-neutral-400 font-semibold uppercase flex justify-between">
                <span>Esp. Letras</span>
                <span className="text-emerald-400">{letterSpacingValue}px</span>
              </label>
              {renderLetterSpacingSlider(letterSpacingName, letterSpacingValue)}
            </div>
            <div className="space-y-1 min-w-[130px]">
              <label className="text-xs text-neutral-400 font-semibold uppercase flex justify-between">
                <span>Alto Línea</span>
                <span className="text-emerald-400">{lineHeightValue.toFixed(2)}</span>
              </label>
              {renderLineHeightSlider(lineHeightName, lineHeightValue)}
            </div>
          </div>
        </div>
        <div className="rounded-md border border-neutral-800 bg-neutral-900/60 px-3 py-2 flex flex-wrap gap-3 items-end">
          <label className="text-xs text-neutral-400 font-semibold uppercase">Relleno y Borde</label>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-400 font-semibold uppercase">Color Texto</label>
              <div className="flex items-center gap-2">
                <input type="color" name={colorName} value={colorValue} onChange={handleChange} className="w-14 h-10 bg-neutral-800 border border-neutral-700 rounded-md p-0.5 cursor-pointer" />
                <label className="flex items-center space-x-1.5 text-sm text-neutral-300 whitespace-nowrap">
                  <input type="checkbox" name={enableFillName} checked={enableFillValue} onChange={handleChange} className="rounded cursor-pointer" />
                  <span className="uppercase">V. Relleno</span>
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-400 font-semibold uppercase">Color Borde</label>
              <div className="flex items-center gap-2">
                <input type="color" name={borderColorName} value={borderColorValue} onChange={handleChange} disabled={!enableBorderValue} className="w-14 h-10 bg-neutral-800 border border-neutral-700 rounded-md p-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" />
                <label className="flex items-center space-x-1.5 text-sm text-neutral-300 whitespace-nowrap">
                  <input type="checkbox" name={enableBorderName} checked={enableBorderValue} onChange={handleChange} className="rounded cursor-pointer" />
                  <span className="uppercase">V. Borde</span>
                </label>
              </div>
            </div>
            <div className="space-y-1 min-w-[130px]">
              <label className="text-xs text-neutral-400 font-semibold uppercase flex justify-between">
                <span>Grosor Borde</span>
                <span className="text-emerald-400">{borderWidthValue}px</span>
              </label>
              {renderBorderWidthSlider(borderWidthName, borderWidthValue, !enableBorderValue)}
            </div>
          </div>
        </div>
      </div>
      {showShadowControls && (
        <div className="grid grid-cols-3 gap-2 border-t border-neutral-800 pt-2">
          <div className="flex items-center">
            <label className="flex items-center space-x-2 text-sm text-neutral-300">
              <input type="checkbox" name={enableShadowName} checked={enableShadowValue} onChange={handleChange} className="rounded cursor-pointer" />
              <span className="uppercase">V. Sombra</span>
            </label>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-400 font-semibold uppercase">Color Sombra</label>
            <input
              type="color"
              name={shadowColorName}
              value={shadowColorValue}
              onChange={handleChange}
              disabled={!enableShadowValue}
              className="w-14 h-10 bg-neutral-800 border border-neutral-700 rounded-md p-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-400 font-semibold uppercase flex justify-between">
              <span>Blur Sombra</span>
              <span className="text-emerald-400">{shadowBlurValue}px</span>
            </label>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              name={shadowBlurName}
              value={shadowBlurValue}
              onChange={handleChange}
              disabled={!enableShadowValue}
              className="max-w-full [--range-width:10rem] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      )}
    </div>
  );
  const handleRangeDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type !== 'range' || target.disabled || !target.name) return;

    const fallback = Number(target.value);
    const resetValue = getDefaultNumericValue(target.name, Number.isFinite(fallback) ? fallback : 0);
    setProps((prev) => ({ ...prev, [target.name]: resetValue }));
  };

  return (
    <div
      onDoubleClickCapture={handleRangeDoubleClick}
      className="relative h-full rounded-lg border border-neutral-800 bg-neutral-900/80 p-2 mb-2 flex flex-col"
    >
      <div className="w-full h-full space-y-2 flex flex-col">

        {isAiCircuitHud && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border-t border-neutral-800 pt-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-cyan-300 font-semibold uppercase">Title Text (Centro)</label>
              <input
                type="text"
                name="titleText"
                value={props.titleText}
                onChange={handleChange}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-white outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-cyan-300 font-semibold uppercase">Subtitle Text</label>
              <input
                type="text"
                name="subtitleText"
                value={props.subtitleText}
                onChange={handleChange}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-white outline-none"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-neutral-400 font-semibold uppercase">Ruta SVG/PNG Base</label>
              <input
                type="text"
                name="circuitBaseImage"
                value={props.circuitBaseImage}
                onChange={handleChange}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-white outline-none"
              />
            </div>
            <div className="flex items-center md:col-span-2">
              <label className="flex items-center space-x-2 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  name="showCircuitBaseImage"
                  checked={props.showCircuitBaseImage}
                  onChange={handleChange}
                  className="rounded cursor-pointer"
                />
                <span className="uppercase">Mostrar Imagen Base</span>
              </label>
            </div>
          </div>
        )}

        <div ref={workspaceHostRef} className="w-full flex-1 min-h-0">
          <Resizable
            size={{ width: Math.min(workspaceSize.width, workspaceMaxWidth), height: workspaceSize.height }}
            minWidth={Math.min(TOP_WORKSPACE_MIN_WIDTH, workspaceMaxWidth)}
            maxWidth={workspaceMaxWidth}
            minHeight={TOP_WORKSPACE_MIN_HEIGHT}
            onResize={handleWorkspaceResize}
            onResizeStop={handleWorkspaceResizeStop}
            className="rounded-md border border-neutral-800/80 bg-neutral-950/35 p-2"
            handleStyles={{
              right: { width: '10px', right: 0, cursor: 'e-resize' },
              bottom: { height: '10px', bottom: 0, cursor: 's-resize' },
              bottomRight: { width: '14px', height: '14px', right: 0, bottom: 0, cursor: 'se-resize' },
            }}
            handleComponent={{
              bottomRight: (
                <div className="flex h-3 w-3 items-center justify-center rounded-sm border border-fuchsia-600/50 bg-fuchsia-900/35 text-[9px] leading-none text-fuchsia-200">
                  +
                </div>
              ),
            }}
          >
            <div className="relative h-full w-full overflow-auto">
              <MovableResizablePanel
                id="top-text-main"
                defaultX={8}
                defaultY={8}
                defaultWidth={420}
                defaultHeight={132}
                minWidth={280}
                minHeight={110}
              >
                <div className="inline-flex h-full w-full rounded-md border border-neutral-800 bg-neutral-900/60 p-0.5 flex-col gap-1.5">
                  <label className="text-xs text-cyan-300 font-semibold uppercase tracking-[0.16em]">Texto Principal</label>
                  <div className="w-full space-y-1.5">
                    {isViralText ? (
                      <input
                        type="text"
                        name="text"
                        value={props.text}
                        onChange={handleChange}
                        onContextMenu={handleMainTextContextMenu}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none"
                      />
                    ) : (
                      <textarea
                        name="text"
                        value={props.text}
                        onChange={handleChange}
                        onContextMenu={handleMainTextContextMenu}
                        rows={1}
                        className="w-full min-h-[36px] max-h-[110px] bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none resize-y"
                      />
                    )}
                    {props.textRangeStyles && props.textRangeStyles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {props.textRangeStyles.map((range, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/10 border border-white/20"
                          >
                            <span
                              style={{ backgroundColor: range.fillColor ?? range.strokeColor ?? 'transparent' }}
                              className="w-2 h-2 rounded-sm flex-shrink-0 border border-white/30"
                            />
                            <span className="opacity-80">
                              {range.start}–{range.end}
                            </span>
                            <button
                              onClick={() => {
                                setProps(prev => ({
                                  ...prev,
                                  textRangeStyles: prev.textRangeStyles?.filter((_, i) => i !== idx),
                                }));
                              }}
                              className="opacity-60 hover:opacity-100 leading-none ml-0.5"
                              break-label="Delete range"
                              type="button"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={resetToDefaults}
                        disabled={isRendering}
                        className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-semibold py-1.5 px-2 rounded-md hover:bg-neutral-700 transition-all outline-none disabled:opacity-50 tracking-wider"
                      >
                        Reset
                      </button>
                      {!renderUrl ? (
                        props.isTransparent ? (
                          <div className="col-span-1 space-y-1">
                            <select
                              value={transparentCodec}
                              onChange={(e) => setTransparentCodec(e.target.value === 'vp9' ? 'vp9' : 'prores')}
                              disabled={isRendering}
                              className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-xs text-white outline-none cursor-pointer disabled:opacity-50"
                            >
                              <option value="vp9">Export WebM (VP9 - Fast)</option>
                              <option value="prores">Export ProRes 4444 (High Quality - .mov)</option>
                            </select>
                            <button
                              onClick={handleRenderVideo}
                              disabled={isRendering}
                              className={`${isRendering ? 'bg-neutral-600 cursor-not-allowed' : transparentCodec === 'prores' ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'} w-full text-white text-xs font-bold py-1.5 px-2 rounded-md shadow-md transition-all outline-none tracking-wider`}
                            >
                              {isRendering
                                ? 'Renderizando...'
                                : transparentCodec === 'prores'
                                  ? 'Export ProRes 4444 (.mov)'
                                  : 'Export WebM (VP9)'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleRenderVideo}
                            disabled={isRendering}
                            className={`${isRendering ? 'bg-neutral-600 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'} text-white text-xs font-bold py-1.5 px-2 rounded-md shadow-md transition-all outline-none tracking-wider`}
                          >
                            {isRendering ? 'Renderizando...' : 'Render (mp4)'}
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => saveVideo(renderUrl)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-2 rounded-md shadow-md transition-all outline-none tracking-wider animate-pulse"
                        >
                          Guardar Video
                        </button>
                      )}
                    </div>
                    {props.isTransparent && transparentCodec === 'prores' ? (
                      <p className="text-[11px] leading-snug text-amber-300 bg-amber-950/30 border border-amber-700/40 rounded-md px-2 py-1">
                        ProRes 4444 generates very large files and takes longer to render. Ideal for NLEs like Premiere/Resolve.
                      </p>
                    ) : null}
                  </div>
                </div>
              </MovableResizablePanel>

              <MovableResizablePanel
                id="top-font-controls"
                defaultX={440}
                defaultY={8}
                defaultWidth={232}
                defaultHeight={152}
                minWidth={210}
                minHeight={130}
              >
                <div className="h-full w-full rounded-md border border-neutral-700 bg-neutral-900/60 p-2 space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold uppercase">Grosor / Estilo</label>
                    {renderWeightSelector('fontWeight', props.fontWeight)}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-semibold uppercase">Fuente</label>
                    {renderFontSelector('fontFamily', props.fontFamily)}
                  </div>
                </div>
              </MovableResizablePanel>

              <MovableResizablePanel
                id="top-animation-header"
                defaultX={688}
                defaultY={8}
                defaultWidth={420}
                defaultHeight={92}
                minWidth={300}
                minHeight={72}
              >
                <div className={`${topCompactContainerClass} h-full w-full`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs text-cyan-300 font-semibold uppercase tracking-[0.16em]">
                      Animación de Texto (Rápido)
                    </h3>
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-amber-400 font-semibold uppercase tracking-wider whitespace-nowrap">
                        Curva Spline
                      </label>
                      <select
                        name="easingStyle"
                        value={props.easingStyle}
                        onChange={handleChange}
                        className="w-full max-w-[8.8rem] bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-xs text-white outline-none cursor-pointer"
                      >
                        <option value="cubic">Cúbica (Master Standard)</option>
                        <option value="quad">Cuadrática (Suave)</option>
                        <option value="ease">Curva Ease (Balanceada)</option>
                        <option value="bezier">Bezier Extrema (In/Out Drop)</option>
                        <option value="linear">Lineal Estricta (Constante)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider whitespace-nowrap">
                        Estilo Master
                      </label>
                      <select
                        name="animationStyle"
                        value={props.animationStyle}
                        onChange={handleChange}
                        className="w-full max-w-[9.6rem] bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-xs text-emerald-400 outline-none cursor-pointer"
                      >
                        {animationStyleOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </MovableResizablePanel>

              <MovableResizablePanel
                id="top-size-spacing"
                defaultX={688}
                defaultY={108}
                defaultWidth={560}
                defaultHeight={92}
                minWidth={320}
                minHeight={78}
              >
                <div className={`${topCompactContainerClass} h-full w-full`}>
                  <label className="text-xs text-neutral-400 font-semibold uppercase">Tamaño y Espaciado</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                    <div className="space-y-1 min-w-[138px]">
                      <label className="text-xs text-neutral-400 font-semibold uppercase flex justify-between">
                        <span>Tamaño</span>
                        <span className="text-emerald-400">{props.fontSize}px</span>
                      </label>
                      {renderSizeSlider('fontSize', props.fontSize)}
                    </div>
                    <div className="space-y-1 min-w-[130px]">
                      <label className="text-xs text-neutral-400 font-semibold uppercase flex justify-between">
                        <span>Esp. Letras</span>
                        <span className="text-emerald-400">{props.letterSpacing}px</span>
                      </label>
                      {renderLetterSpacingSlider('letterSpacing', props.letterSpacing)}
                    </div>
                    <div className="space-y-1 min-w-[130px]">
                      <label className="text-xs text-neutral-400 font-semibold uppercase flex justify-between">
                        <span>Alto Línea</span>
                        <span className="text-emerald-400">{props.lineHeight.toFixed(2)}</span>
                      </label>
                      {renderLineHeightSlider('lineHeight', props.lineHeight)}
                    </div>
                  </div>
                </div>
              </MovableResizablePanel>

              <MovableResizablePanel
                id="top-fill-border"
                defaultX={688}
                defaultY={208}
                defaultWidth={560}
                defaultHeight={92}
                minWidth={320}
                minHeight={78}
              >
                <div className={`${topCompactContainerClass} h-full w-full`}>
                  <label className="text-xs text-neutral-400 font-semibold uppercase">Relleno y Borde</label>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-neutral-400 font-semibold uppercase">Color Texto</label>
                      <div className="flex items-center gap-2">
                        <input type="color" name="color" value={props.color} onChange={handleChange} className="w-14 h-10 bg-neutral-800 border border-neutral-700 rounded-md p-0.5 cursor-pointer" />
                        <label className="flex items-center space-x-1.5 text-sm text-neutral-300 whitespace-nowrap">
                          <input
                            type="checkbox"
                            name="enableFill"
                            checked={isFlickerOutlineFill ? true : props.enableFill}
                            onChange={handleChange}
                            disabled={isFlickerOutlineFill}
                            className="rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isFlickerOutlineFill ? 'Desactivado en este efecto' : undefined}
                          />
                          <span className="uppercase">V. Relleno</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-neutral-400 font-semibold uppercase">Color Borde</label>
                      <div className="flex items-center gap-2">
                        <input type="color" name="borderColor" value={props.borderColor} onChange={handleChange} disabled={!props.enableBorder} className="w-14 h-10 bg-neutral-800 border border-neutral-700 rounded-md p-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" />
                        <label className="flex items-center space-x-1.5 text-sm text-neutral-300 whitespace-nowrap">
                          <input type="checkbox" name="enableBorder" checked={props.enableBorder} onChange={handleChange} className="rounded cursor-pointer" />
                          <span className="uppercase">V. Borde</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1 min-w-[130px]">
                      <label className="text-xs text-neutral-400 font-semibold uppercase flex justify-between">
                        <span>Grosor Borde</span>
                        <span className="text-emerald-400">{props.borderWidth}px</span>
                      </label>
                      {renderBorderWidthSlider('borderWidth', props.borderWidth, !props.enableBorder)}
                    </div>
                  </div>
                </div>
              </MovableResizablePanel>

              <MovableResizablePanel
                id="top-duration-position"
                defaultX={688}
                defaultY={308}
                defaultWidth={560}
                defaultHeight={110}
                minWidth={360}
                minHeight={88}
              >
                <div className={`${topCompactContainerClass} h-full w-full`}>
                  <div className="flex flex-wrap items-end gap-2">
                    {!isKineticBoxSequence ? (
                      <div className="space-y-1 min-w-[124px]">
                        <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                          Duración Total Preview/Render
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={MIN_DURATION_IN_FRAMES / REMOTION_FPS}
                            max={MAX_DURATION_IN_FRAMES / REMOTION_FPS}
                            step="0.1"
                            value={totalDurationSeconds}
                            onChange={(e) => updateTotalDurationSeconds(Number(e.target.value))}
                            className="w-full max-w-[8.5rem] cursor-pointer"
                          />
                          <input
                            type="number"
                            min={MIN_DURATION_IN_FRAMES / REMOTION_FPS}
                            max={MAX_DURATION_IN_FRAMES / REMOTION_FPS}
                            step="0.1"
                            value={Number(totalDurationSeconds.toFixed(2))}
                            onChange={(e) => updateTotalDurationSeconds(Number(e.target.value))}
                            className="w-[3.7rem] bg-neutral-800 border border-neutral-700 rounded-md px-1.5 py-1 text-xs text-white outline-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 min-w-[124px]">
                        <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                          Duración Total Preview/Render
                        </label>
                        <p className="text-[11px] text-neutral-500">
                          Auto por boxes: {kineticRequestedSeconds.toFixed(2)}s
                        </p>
                      </div>
                    )}
                    <div className="space-y-1 min-w-[244px]">
                      <label className="text-xs text-cyan-300 font-semibold uppercase tracking-wider">Posición X/Y</label>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-neutral-400 uppercase">X</span>
                        <input
                          type="range"
                          min="-45"
                          max="45"
                          step="1"
                          name="textPositionX"
                          value={props.textPositionX}
                          onChange={handleChange}
                          className="w-full max-w-[5.6rem] cursor-pointer"
                        />
                        <span className="text-xs text-emerald-400 min-w-[24px] text-right">{props.textPositionX.toFixed(0)}%</span>
                        <span className="text-xs text-neutral-400 uppercase">Y</span>
                        <input
                          type="range"
                          min="-45"
                          max="45"
                          step="1"
                          name="textPositionY"
                          value={props.textPositionY}
                          onChange={handleChange}
                          className="w-full max-w-[5.6rem] cursor-pointer"
                        />
                        <span className="text-xs text-emerald-400 min-w-[24px] text-right">{props.textPositionY.toFixed(0)}%</span>
                        <button
                          type="button"
                          onClick={() => setProps((prev) => ({ ...prev, textPositionX: 0, textPositionY: 0 }))}
                          disabled={props.textPositionX === 0 && props.textPositionY === 0}
                          className="w-auto bg-neutral-800 border border-neutral-700 text-neutral-100 text-xs font-semibold py-1 px-2 rounded-md hover:bg-neutral-700 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reset Posición
                        </button>
                        {!isViralText ? (
                          <label className="flex items-center space-x-2 text-xs text-neutral-300">
                            <input
                              type="checkbox"
                              name="enableShadow"
                              checked={props.enableShadow}
                              onChange={handleChange}
                              className="rounded cursor-pointer"
                            />
                            <span className="uppercase">Sombra Global</span>
                          </label>
                        ) : null}
                        {!isViralText && props.enableShadow ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              name="shadowColor"
                              value={props.shadowColor}
                              onChange={handleChange}
                              className="w-8 h-7 bg-neutral-800 border border-neutral-700 rounded-md p-0.5 cursor-pointer"
                            />
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="1"
                              name="shadowBlur"
                              value={props.shadowBlur}
                              onChange={handleChange}
                              className="w-full max-w-[6.4rem] cursor-pointer"
                            />
                            <span className="text-xs text-emerald-400 min-w-[34px] text-right">{props.shadowBlur}px</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </MovableResizablePanel>

              <MovableResizablePanel
                id="top-quick-motion-controls"
                defaultX={8}
                defaultY={320}
                defaultWidth={640}
                defaultHeight={130}
                minWidth={420}
                minHeight={110}
              >
                <div className="h-full w-full rounded-md border border-neutral-800 bg-neutral-950/45 p-2 space-y-2">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span className="text-xs text-neutral-500 uppercase tracking-wider">
                      {totalDurationSeconds.toFixed(2)}s ({totalDurationInFrames}f)
                      {!isKineticBoxSequence && props.speedControlsDuration ? ` / base ${baseDurationSeconds.toFixed(2)}s` : ''}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1 min-w-[160px]">
                      <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider flex justify-between">
                        <span>Velocidad</span>
                        <span className="text-emerald-400">{props.speed.toFixed(2)}x</span>
                      </label>
                      <input
                        type="range"
                        min="0.2"
                        max="3"
                        step="0.05"
                        name="speed"
                        value={props.speed}
                        onChange={handleChange}
                        className="w-full max-w-[10rem] cursor-pointer"
                      />
                      {!isKineticBoxSequence ? (
                        <label className="flex items-center space-x-2 text-xs text-neutral-300">
                          <input
                            type="checkbox"
                            checked={props.speedControlsDuration}
                            onChange={(e) => handleSpeedDurationToggle(e.target.checked)}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                          <span className="uppercase font-semibold tracking-wider">Velocidad redefine duración</span>
                        </label>
                      ) : (
                        <p className="text-[11px] text-neutral-500">
                          Duración total automática por boxes.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 min-w-[130px]">
                      <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                        Modo de Fase
                      </label>
                      <select
                        name="motionPhase"
                        value={props.motionPhase}
                        onChange={handleChange}
                        className="w-full max-w-[9rem] bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-xs text-white outline-none cursor-pointer"
                      >
                        <option value="in">ON ENTER</option>
                        <option value="out">ON EXIT</option>
                        <option value="in-out">BOTH</option>
                      </select>
                      <label className="flex items-center space-x-2 text-xs text-neutral-300">
                        <input
                          type="checkbox"
                          name="reverseOutAnimation"
                          checked={props.reverseOutAnimation}
                          onChange={handleChange}
                          className="rounded cursor-pointer"
                        />
                        <span className="uppercase font-semibold tracking-wider">Salida Inversa</span>
                      </label>
                    </div>
                  </div>
                </div>
              </MovableResizablePanel>

              <MovableResizablePanel
                id="top-preview-panel"
                defaultX={920}
                defaultY={8}
                defaultWidth={760}
                defaultHeight={520}
                minWidth={420}
                minHeight={280}
              >
                <div className="h-full w-full rounded-md border border-neutral-800/80 bg-neutral-900/50 overflow-hidden shadow-2xl relative shadow-black/50">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
                  <PreviewContainer />
                </div>
              </MovableResizablePanel>
            </div>
          </Resizable>
        </div>

        {showFloatingSpecificPanel && (
          <MovableResizablePanel
            id="top-template-specific"
            defaultX={8}
            defaultY={560}
            defaultWidth={1280}
            defaultHeight={320}
            minWidth={420}
            minHeight={140}
          >
            <div className="h-full w-full rounded-md border border-neutral-800 bg-neutral-950/45 p-3 overflow-auto space-y-3">

        {props.animationStyle === 'typewriter' && (
          <div className="border-t border-neutral-800 pt-2 space-y-2">
            <label className="flex items-center space-x-2 text-sm text-neutral-300">
              <input
                type="checkbox"
                name="typewriterCursorFollowTextStyle"
                checked={props.typewriterCursorFollowTextStyle}
                onChange={handleChange}
                className="rounded cursor-pointer"
              />
              <span className="uppercase">Cursor sigue estilo de texto/borde</span>
            </label>
            <p className="text-xs text-neutral-500">
              Si desactivas el relleno y mantienes borde activo, el cursor también se dibuja sin relleno con color de borde.
            </p>
          </div>
        )}

        {isViralText && (
          <div className="space-y-2 border-t border-neutral-800 pt-2">
            <label className="text-sm text-cyan-300 font-semibold uppercase tracking-wider">
              Velocidad por Bloque
            </label>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-neutral-300 font-semibold uppercase flex justify-between">
                  <span>Separación Temporal</span>
                  <span className="text-emerald-400">{props.viralWordStagger}f</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="36"
                  step="1"
                  name="viralWordStagger"
                  value={props.viralWordStagger}
                  onChange={handleChange}
                  className="w-full cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-300 font-semibold uppercase flex justify-between">
                  <span>Bloque 1</span>
                  <span className="text-emerald-400">{props.wordSpeedOne.toFixed(2)}x</span>
                </label>
                <input
                  type="range"
                  min="0.4"
                  max="2.2"
                  step="0.05"
                  name="wordSpeedOne"
                  value={props.wordSpeedOne}
                  onChange={handleChange}
                  className="w-full cursor-pointer"
                />
              </div>
              {showViralBlockTwo && (
                <div className="space-y-1">
                  <label className="text-xs text-neutral-300 font-semibold uppercase flex justify-between">
                    <span>Bloque 2</span>
                    <span className="text-emerald-400">{props.wordSpeedTwo.toFixed(2)}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.4"
                    max="2.2"
                    step="0.05"
                    name="wordSpeedTwo"
                    value={props.wordSpeedTwo}
                    onChange={handleChange}
                    className="w-full cursor-pointer"
                  />
                </div>
              )}
              {showViralBlockThree && (
                <div className="space-y-1">
                  <label className="text-xs text-neutral-300 font-semibold uppercase flex justify-between">
                    <span>Bloque 3</span>
                    <span className="text-emerald-400">{props.wordSpeedThree.toFixed(2)}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.4"
                    max="2.2"
                    step="0.05"
                    name="wordSpeedThree"
                    value={props.wordSpeedThree}
                    onChange={handleChange}
                    className="w-full cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {props.animationStyle === 'slide-in' && (
          <div className="border-t border-neutral-800 pt-2 space-y-2">
            <label className="text-sm text-emerald-400 font-semibold uppercase tracking-wider">
              Vector Kinético
            </label>
            <select
              name="slideDirection"
              value={props.slideDirection}
              onChange={handleChange}
              className="w-full max-w-[18rem] bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1.5 text-sm text-white outline-none cursor-pointer"
            >
              <option value="bottom">Aparecer de Abajo</option>
              <option value="top">Aparecer de Arriba</option>
              <option value="left">Mover a Derecha</option>
              <option value="right">Mover a Izquierda</option>
            </select>
          </div>
        )}

        {isKineticBoxSequence && (
          <div className="space-y-3 border-t border-neutral-800 pt-2">
            <label className="text-sm text-emerald-300 font-semibold uppercase tracking-wider">
              Kinetic Box Sequence
            </label>

            <div className="grid gap-2 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs text-neutral-300 font-semibold uppercase flex justify-between">
                  <span>Cantidad de Cajas</span>
                  <span className="text-emerald-400">{activeKineticBoxCount}</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={activeKineticBoxCount}
                  readOnly
                  disabled
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none"
                />
                <p className="text-[11px] text-neutral-500">
                  Automático según palabras en &quot;Texto Principal&quot;.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-300 font-semibold uppercase">Modo Caja</label>
                <select
                  name="boxSequenceMode"
                  value={props.boxSequenceMode}
                  onChange={handleChange}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none cursor-pointer"
                >
                  <option value="box">Caja</option>
                  <option value="bar">Barra</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-300 font-semibold uppercase">Dirección</label>
                <select
                  name="boxSequenceDirection"
                  value={props.boxSequenceDirection}
                  onChange={handleChange}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none cursor-pointer"
                >
                  <option value="from-bottom">Desde Abajo</option>
                  <option value="from-top">Desde Arriba</option>
                  <option value="from-left">Desde Izquierda</option>
                  <option value="from-right">Desde Derecha</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-neutral-500 uppercase tracking-wider">
              Cada palabra de &quot;Texto Principal&quot; ocupa su propia box.
            </p>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-neutral-300 font-semibold uppercase">
                  Palabras Detectadas
                </label>
                <textarea
                  value={kineticWords.length > 0 ? kineticWords.join('\n') : 'Sin palabras detectadas'}
                  readOnly
                  rows={4}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none resize-y"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-300 font-semibold uppercase">
                  Duraciones por Bloque
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border border-neutral-700 bg-neutral-900/50 p-1.5">
                  {Array.from({ length: activeKineticBoxCount }).map((_, index) => {
                    const labelWord = kineticWords[index] ?? `Box ${index + 1}`;
                    return (
                      <div key={`kinetic-duration-top-${index}`} className="grid grid-cols-[28px_minmax(0,1fr)_78px] items-center gap-2">
                        <span className="text-[11px] text-neutral-400 text-right">#{index + 1}</span>
                        <span className="truncate text-[11px] text-neutral-200">{labelWord}</span>
                        <input
                          type="number"
                          min="0.15"
                          max="20"
                          step="0.05"
                          value={Number(kineticDurationSeconds[index].toFixed(2))}
                          onChange={(e) => updateKineticDurationAtIndex(index, Number(e.target.value))}
                          className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-xs text-white outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-neutral-300 font-semibold uppercase">
                  Color de Texto por Box
                </label>
                <textarea
                  name="boxSequenceTextColorsRaw"
                  value={props.boxSequenceTextColorsRaw}
                  onChange={handleChange}
                  rows={2}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none resize-y"
                  placeholder="#ffffff, #00ffcc, #ffcc00"
                />
              </div>
            </div>

            <p className="text-xs text-neutral-500 uppercase tracking-wider">
              Duración solicitada: {kineticRequestedSeconds.toFixed(2)}s / Preview: {totalDurationSeconds.toFixed(2)}s
            </p>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-neutral-300 font-semibold uppercase flex justify-between">
                  <span>Redondeo</span>
                  <span className="text-emerald-400">{props.boxSequenceBorderRadius}px</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="1"
                  name="boxSequenceBorderRadius"
                  value={props.boxSequenceBorderRadius}
                  onChange={handleChange}
                  className="w-full cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-300 font-semibold uppercase flex justify-between">
                  <span>Altura Caja</span>
                  <span className="text-emerald-400">{props.boxSequenceHeightScale.toFixed(2)}x</span>
                </label>
                <input
                  type="range"
                  min="0.7"
                  max="2.2"
                  step="0.05"
                  name="boxSequenceHeightScale"
                  value={props.boxSequenceHeightScale}
                  onChange={handleChange}
                  className="w-full cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2 border-t border-neutral-800 pt-2">
              <label className="flex items-center space-x-2 text-xs text-neutral-300">
                <input
                  type="checkbox"
                  name="boxSequenceUseGradient"
                  checked={props.boxSequenceUseGradient}
                  onChange={handleChange}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <span className="uppercase font-semibold tracking-wider">Usar Degradado Compartido</span>
              </label>

              {props.boxSequenceUseGradient ? (
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 uppercase">Degradado A</label>
                    <input type="color" name="boxSequenceGradientStart" value={props.boxSequenceGradientStart} onChange={handleChange} className="w-14 h-10 rounded-md p-0.5 cursor-pointer" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 uppercase">Degradado B</label>
                    <input type="color" name="boxSequenceGradientEnd" value={props.boxSequenceGradientEnd} onChange={handleChange} className="w-14 h-10 rounded-md p-0.5 cursor-pointer" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-300 font-semibold uppercase">
                      Colores por Bloque
                    </label>
                    <textarea
                      name="boxSequenceColorsRaw"
                      value={props.boxSequenceColorsRaw}
                      onChange={handleChange}
                      rows={2}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none resize-y"
                      placeholder="#ff0055, #00d4ff, #ffd400"
                    />
                  </div>
                  <div className="grid gap-2 md:grid-cols-4">
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 uppercase">Color 1</label>
                      <input type="color" name="boxSequenceColorOne" value={props.boxSequenceColorOne} onChange={handleChange} className="w-14 h-10 rounded-md p-0.5 cursor-pointer" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 uppercase">Color 2</label>
                      <input type="color" name="boxSequenceColorTwo" value={props.boxSequenceColorTwo} onChange={handleChange} className="w-14 h-10 rounded-md p-0.5 cursor-pointer" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 uppercase">Color 3</label>
                      <input type="color" name="boxSequenceColorThree" value={props.boxSequenceColorThree} onChange={handleChange} className="w-14 h-10 rounded-md p-0.5 cursor-pointer" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 uppercase">Color 4</label>
                      <input type="color" name="boxSequenceColorFour" value={props.boxSequenceColorFour} onChange={handleChange} className="w-14 h-10 rounded-md p-0.5 cursor-pointer" />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {props.animationStyle === 'smooth-sliding' && (
          <div className="border-t border-neutral-800 pt-2 space-y-2">
            <label className="text-sm text-emerald-400 font-semibold uppercase tracking-wider">
              Dirección Smooth Cascade
            </label>
            <select
              name="smoothCascadeDirection"
              value={props.smoothCascadeDirection}
              onChange={handleChange}
              className="w-full max-w-[18rem] bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1.5 text-sm text-white outline-none cursor-pointer"
            >
              <option value="bottom-up">Abajo hacia Arriba</option>
              <option value="top-down">Arriba hacia Abajo</option>
              <option value="left-right">Izquierda hacia Derecha</option>
              <option value="right-left">Derecha hacia Izquierda</option>
            </select>
          </div>
        )}

        {props.animationStyle === 'follower' && (
          <div className="border-t border-neutral-800 pt-2 space-y-2">
            <label className="text-sm text-emerald-400 font-semibold uppercase tracking-wider">
              Dirección Character Cascade
            </label>
            <select
              name="followerDirection"
              value={props.followerDirection}
              onChange={handleChange}
              className="w-full max-w-[18rem] bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1.5 text-sm text-white outline-none cursor-pointer"
            >
              <option value="bottom-up">Subir desde Abajo</option>
              <option value="top-down">Bajar desde Arriba</option>
            </select>
          </div>
        )}

        {['cinematic', 'fly-through'].includes(props.animationStyle) && (
          <div className="border-t border-neutral-800 pt-2 space-y-2">
            <label className="text-sm text-emerald-400 font-semibold uppercase tracking-wider">
              Dirección Vectorial en Z-Space
            </label>
            <select
              name="cinematicDirection"
              value={props.cinematicDirection}
              onChange={handleChange}
              className="w-full max-w-[20rem] bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1.5 text-sm text-white outline-none cursor-pointer"
            >
              <option value="zoom-out">Aproximarse Hacia la Cámara</option>
              <option value="zoom-in">Alejarse Profundo</option>
            </select>
          </div>
        )}

        {props.animationStyle === 'extruded-3d' && (
          <div className="space-y-2 border-t border-neutral-800 pt-2">
            <label className="flex items-center space-x-2 text-sm text-amber-200">
              <input
                type="checkbox"
                name="useFont3dOverride"
                checked={props.useFont3dOverride}
                onChange={handleChange}
                className="rounded cursor-pointer"
              />
              <span className="uppercase font-semibold tracking-wider">Usar Override de Fuente 3D</span>
            </label>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-amber-300 font-semibold uppercase">Acabado Metálico</label>
                <select name="metalPreset" value={props.metalPreset} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none cursor-pointer">
                  <option value="silver">Plateado</option>
                  <option value="gold">Oro</option>
                  <option value="bronze">Bronce</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-amber-300 font-semibold uppercase">Tono Metálico</label>
                <select name="metalTone" value={props.metalTone} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none cursor-pointer">
                  <option value="light">Claro</option>
                  <option value="classic">Clásico</option>
                  <option value="rich">Intenso</option>
                  <option value="aged">Envejecido</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-amber-200 font-semibold uppercase flex justify-between">
                  <span>Brillo Metálico</span>
                  <span className="text-emerald-400">{props.metalBrightness.toFixed(2)}</span>
                </label>
                <input type="range" min="0.6" max="1.8" step="0.01" name="metalBrightness" value={props.metalBrightness} onChange={handleChange} className="w-full cursor-pointer" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-amber-200 font-semibold uppercase flex justify-between">
                  <span>Contraste Metálico</span>
                  <span className="text-emerald-400">{props.metalContrast.toFixed(2)}</span>
                </label>
                <input type="range" min="0.6" max="1.8" step="0.01" name="metalContrast" value={props.metalContrast} onChange={handleChange} className="w-full cursor-pointer" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-amber-300 font-semibold uppercase">Override Fuente 3D</label>
              <select
                name="font3dPreset"
                value={props.font3dPreset}
                onChange={handleChange}
                disabled={!props.useFont3dOverride}
                className="w-full max-w-[20rem] bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="auto">Auto</option>
                <option value="helvetiker-regular">Helvetiker Regular</option>
                <option value="helvetiker-bold">Helvetiker Bold</option>
                <option value="optimer-regular">Optimer Regular</option>
                <option value="optimer-bold">Optimer Bold</option>
                <option value="gentilis-regular">Gentilis Regular</option>
                <option value="gentilis-bold">Gentilis Bold</option>
                <option value="droid-serif-regular">Droid Serif Regular</option>
                <option value="droid-serif-bold">Droid Serif Bold</option>
                <option value="droid-mono">Droid Mono</option>
              </select>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs text-amber-200 font-semibold uppercase">Esp. Letras 3D</label>
                <input type="number" step="0.5" name="letterSpacing3d" value={props.letterSpacing3d} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-amber-200 font-semibold uppercase">Alto Entrelínea 3D</label>
                <input type="number" step="0.05" name="lineHeight3d" value={props.lineHeight3d} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-amber-200 font-semibold uppercase">Extrude 3D</label>
                <input type="number" step="0.1" min="0.2" name="extrudeDepth3d" value={props.extrudeDepth3d} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none" />
              </div>
            </div>
          </div>
        )}

        {['slide-reveal', 'bar-reveal'].includes(props.animationStyle) && (
          <div className="grid gap-2 md:grid-cols-2 border-t border-neutral-800 pt-2">
            <div className="space-y-1">
              <label className="text-sm text-pink-500 font-semibold uppercase tracking-wider">
                Color Caja / Barra
              </label>
              <input type="color" name="boxColor" value={props.boxColor || '#ff0055'} onChange={handleChange} className="w-14 h-10 rounded-md p-0.5 cursor-pointer" />
            </div>
            {props.animationStyle === 'bar-reveal' ? (
              <div className="space-y-1">
                <label className="text-sm text-pink-400 font-semibold uppercase tracking-wider">
                  Grosor de la Barra (px)
                </label>
                <input type="number" step="0.1" min="0" max="40" name="borderWidth" value={props.borderWidth || 4} onChange={handleChange} className="w-full max-w-[14rem] bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-sm text-white outline-none" />
              </div>
            ) : null}
          </div>
        )}

        {props.animationStyle === 'shape-reveal' && (
          <div className="grid gap-2 md:grid-cols-2 border-t border-neutral-800 pt-2">
            <div className="space-y-1">
              <label className="text-sm text-indigo-400 font-semibold uppercase tracking-wider flex justify-between">
                <span>Ancho Máscara</span>
                <span className="text-emerald-400">{props.shapeGradientWidth || 100}%</span>
              </label>
              <input type="range" min="20" max="100" step="5" name="shapeGradientWidth" value={props.shapeGradientWidth || 100} onChange={handleChange} className="w-full cursor-pointer" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-indigo-400 font-semibold uppercase tracking-wider flex justify-between">
                <span>Redondeo Esquinas</span>
                <span className="text-emerald-400">{props.shapeBorderRadius || 10}px</span>
              </label>
              <input type="range" min="0" max="120" step="1" name="shapeBorderRadius" value={props.shapeBorderRadius || 10} onChange={handleChange} className="w-full cursor-pointer" />
            </div>
          </div>
        )}

        {['shape-reveal', 'blur-cascade'].includes(props.animationStyle) && (
          <div className="grid gap-2 md:grid-cols-2 border-t border-neutral-800 pt-2">
            {props.animationStyle === 'blur-cascade' ? (
              <div className="md:col-span-2">
                <label className="flex items-center space-x-2 text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    name="enableGradient"
                    checked={props.enableGradient}
                    onChange={handleChange}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <span className="uppercase font-semibold tracking-wider text-cyan-300">Activar Degradado</span>
                </label>
              </div>
            ) : null}
            <div className="space-y-1">
              <label className="text-sm text-cyan-400 font-semibold uppercase tracking-wider">Degradado A</label>
              <input
                type="color"
                name="gradientStart"
                value={props.gradientStart || '#ff00cc'}
                onChange={handleChange}
                disabled={props.animationStyle === 'blur-cascade' && !props.enableGradient}
                className="w-14 h-10 rounded-md p-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-fuchsia-400 font-semibold uppercase tracking-wider">Degradado B</label>
              <input
                type="color"
                name="gradientEnd"
                value={props.gradientEnd || '#3333ff'}
                onChange={handleChange}
                disabled={props.animationStyle === 'blur-cascade' && !props.enableGradient}
                className="w-14 h-10 rounded-md p-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        )}

        {isViralText && (
          <div className="grid grid-cols-2 gap-2 border-t border-neutral-800 pt-2">
            <label className="flex items-center space-x-2 text-sm text-neutral-300">
              <input type="checkbox" name="showWordTwo" checked={props.showWordTwo} onChange={handleChange} className="rounded cursor-pointer" />
              <span className="uppercase">Mostrar línea 2</span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-neutral-300">
              <input type="checkbox" name="showWordThree" checked={props.showWordThree} onChange={handleChange} className="rounded cursor-pointer" />
              <span className="uppercase">Mostrar línea 3</span>
            </label>
          </div>
        )}

        {isViralText && (
          <div className="grid grid-cols-3 gap-2 border-t border-neutral-800 pt-2">
            <div className="flex items-center">
              <label className="flex items-center space-x-2 text-sm text-neutral-300">
                <input type="checkbox" name="enableShadow" checked={props.enableShadow} onChange={handleChange} className="rounded cursor-pointer" />
                <span className="uppercase">V. Sombra P1</span>
              </label>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-400 font-semibold uppercase">Color Sombra P1</label>
              <input
                type="color"
                name="shadowColor"
                value={props.shadowColor}
                onChange={handleChange}
                disabled={!props.enableShadow}
                className="w-14 h-10 bg-neutral-800 border border-neutral-700 rounded-md p-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-neutral-400 font-semibold uppercase flex justify-between">
                <span>Blur Sombra P1</span>
                <span className="text-emerald-400">{props.shadowBlur}px</span>
              </label>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                name="shadowBlur"
                value={props.shadowBlur}
                onChange={handleChange}
                disabled={!props.enableShadow}
                className="max-w-full [--range-width:10rem] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        )}

        {showWordTwoControls && renderTextWordControls({
          title: 'Palabra 2',
          textName: 'wordTwo',
          textValue: props.wordTwo,
          fontName: 'fontFamilyTwo',
          fontValue: props.fontFamilyTwo,
          weightName: 'fontWeightTwo',
          weightValue: props.fontWeightTwo,
          sizeName: 'fontSizeTwo',
          sizeValue: props.fontSizeTwo,
          letterSpacingName: 'letterSpacingTwo',
          letterSpacingValue: props.letterSpacingTwo ?? props.letterSpacing,
          lineHeightName: 'lineHeightTwo',
          lineHeightValue: props.lineHeightTwo ?? props.lineHeight,
          colorName: 'colorTwo',
          colorValue: props.colorTwo,
          borderColorName: 'borderColorTwo',
          borderColorValue: props.borderColorTwo,
          borderWidthName: 'borderWidthTwo',
          borderWidthValue: props.borderWidthTwo,
          enableBorderName: 'enableBorderTwo',
          enableBorderValue: props.enableBorderTwo,
          enableFillName: 'enableFillTwo',
          enableFillValue: props.enableFillTwo,
          enableShadowName: 'enableShadowTwo',
          enableShadowValue: props.enableShadowTwo,
          shadowColorName: 'shadowColorTwo',
          shadowColorValue: props.shadowColorTwo,
          shadowBlurName: 'shadowBlurTwo',
          shadowBlurValue: props.shadowBlurTwo,
          showShadowControls: isViralText,
        })}

        {showWordThreeControls && renderTextWordControls({
          title: 'Palabra 3',
          textName: 'wordThree',
          textValue: props.wordThree,
          fontName: 'fontFamilyThree',
          fontValue: props.fontFamilyThree,
          weightName: 'fontWeightThree',
          weightValue: props.fontWeightThree,
          sizeName: 'fontSizeThree',
          sizeValue: props.fontSizeThree,
          letterSpacingName: 'letterSpacingThree',
          letterSpacingValue: props.letterSpacingThree ?? props.letterSpacing,
          lineHeightName: 'lineHeightThree',
          lineHeightValue: props.lineHeightThree ?? props.lineHeight,
          colorName: 'colorThree',
          colorValue: props.colorThree,
          borderColorName: 'borderColorThree',
          borderColorValue: props.borderColorThree,
          borderWidthName: 'borderWidthThree',
          borderWidthValue: props.borderWidthThree,
          enableBorderName: 'enableBorderThree',
          enableBorderValue: props.enableBorderThree,
          enableFillName: 'enableFillThree',
          enableFillValue: props.enableFillThree,
          enableShadowName: 'enableShadowThree',
          enableShadowValue: props.enableShadowThree,
          shadowColorName: 'shadowColorThree',
          shadowColorValue: props.shadowColorThree,
          shadowBlurName: 'shadowBlurThree',
          shadowBlurValue: props.shadowBlurThree,
          showShadowControls: isViralText,
        })}

            </div>
          </MovableResizablePanel>
        )}

        {rangeMenu.open && isClientMounted && createPortal((
          <div
            ref={rangeMenuRef}
            className="fixed z-[9999] w-[23rem] rounded-md border border-cyan-700/70 bg-neutral-950/95 p-2 shadow-2xl"
            style={{ left: `${rangeMenu.x}px`, top: `${rangeMenu.y}px`, pointerEvents: 'auto' }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
              Estilo por selección
            </p>
            <p className="mt-1 text-[10px] text-neutral-400">
              Rango: {rangeMenu.start} - {Math.max(rangeMenu.start, rangeMenu.end - 1)}
            </p>
            <div className="mt-2 rounded border border-neutral-800 bg-neutral-900/40 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-300">
                1. Tipo de Cambio
              </p>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <label className="text-[10px] uppercase text-neutral-400">Base</label>
                <select
                  value={rangePrimaryMode}
                  onChange={(e) => setRangePrimaryMode(e.target.value as 'fill' | 'stroke')}
                  className="w-full rounded border border-neutral-700 bg-neutral-800 px-1.5 py-1 text-[11px] text-white outline-none"
                >
                  <option value="fill">Relleno</option>
                  <option value="stroke">Solo borde</option>
                </select>
              </div>
            </div>
            <div className="mt-2 rounded border border-neutral-800 bg-neutral-900/40 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-300">
                2. Colores
              </p>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <label className="text-[10px] uppercase text-neutral-400">Color</label>
                <select
                  value={rangeColorMode}
                  onChange={(e) => setRangeColorMode(e.target.value as 'solid' | 'gradient')}
                  className="w-full rounded border border-neutral-700 bg-neutral-800 px-1.5 py-1 text-[11px] text-white outline-none"
                >
                  <option value="solid">Color sólido</option>
                  <option value="gradient">Gradiente</option>
                </select>
              </div>
              {rangeColorMode === 'solid' ? (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="text-[10px] uppercase text-neutral-400">
                    {rangePrimaryMode === 'fill' ? 'Color relleno' : 'Color borde'}
                  </label>
                  <input
                    type="color"
                    value={rangePrimaryMode === 'fill' ? rangeFillColor : rangeStrokeColor}
                    onChange={(e) =>
                      rangePrimaryMode === 'fill'
                        ? setRangeFillColor(e.target.value)
                        : setRangeStrokeColor(e.target.value)
                    }
                    className="h-8 w-full cursor-pointer rounded border border-neutral-700 bg-neutral-800 p-1"
                  />
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="text-[10px] uppercase text-neutral-400">Gradiente</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={rangeGradientStart}
                      onChange={(e) => setRangeGradientStart(e.target.value)}
                      className="h-8 w-full cursor-pointer rounded border border-neutral-700 bg-neutral-800 p-1"
                    />
                    <input
                      type="color"
                      value={rangeGradientEnd}
                      onChange={(e) => setRangeGradientEnd(e.target.value)}
                      className="h-8 w-full cursor-pointer rounded border border-neutral-700 bg-neutral-800 p-1"
                    />
                  </div>
                </div>
              )}
              {rangePrimaryMode === 'stroke' && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="text-[10px] uppercase text-neutral-400">Grosor Stroke</label>
                  <input
                    type="range"
                    min="1"
                    max="16"
                    step="1"
                    value={rangeStrokeWidth}
                    onChange={(e) => setRangeStrokeWidth(Number(e.target.value))}
                    className="w-full cursor-pointer"
                  />
                </div>
              )}
            </div>
            <div className="mt-2 rounded border border-neutral-800 bg-neutral-900/40 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-300">
                3. Tipografía
              </p>
              <label className="mt-1 flex items-center gap-2 text-[11px] text-neutral-300">
                <input
                  type="checkbox"
                  checked={rangeApplyTypography}
                  onChange={(e) => setRangeApplyTypography(e.target.checked)}
                  className="cursor-pointer"
                />
                Aplicar fuente/tamaño/estilo al rango
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-[10px] uppercase text-neutral-400">Fuente</label>
                <select
                  value={rangeFontFamily}
                  onChange={(e) => setRangeFontFamily(e.target.value)}
                  disabled={!rangeApplyTypography}
                  className="w-full rounded border border-neutral-700 bg-neutral-800 px-1.5 py-1 text-[11px] text-white outline-none disabled:opacity-50"
                >
                  {renderFontOptions(rangeFontFamily)}
                </select>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-[10px] uppercase text-neutral-400">Tamaño</label>
                <input
                  type="range"
                  min="12"
                  max="1200"
                  step="1"
                  value={rangeFontSize}
                  onChange={(e) => setRangeFontSize(Number(e.target.value))}
                  disabled={!rangeApplyTypography}
                  className="w-full cursor-pointer disabled:opacity-50"
                />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-[10px] uppercase text-neutral-400">Peso</label>
                <select
                  value={String(clampWeight(rangeFontWeight))}
                  onChange={(e) => setRangeFontWeight(e.target.value)}
                  disabled={!rangeApplyTypography}
                  className="w-full rounded border border-neutral-700 bg-neutral-800 px-1.5 py-1 text-[11px] text-white outline-none disabled:opacity-50"
                >
                  {weightOptions.filter((w) => /^\d+$/.test(w.value)).map((w) => (
                    <option key={`range-${w.value}`} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-[11px] text-neutral-300">
                  <input
                    type="checkbox"
                    checked={rangeItalic}
                    onChange={(e) => setRangeItalic(e.target.checked)}
                    disabled={!rangeApplyTypography}
                    className="cursor-pointer disabled:opacity-50"
                  />
                  Itálica
                </label>
                <label className="flex items-center gap-2 text-[11px] text-neutral-300">
                  <input
                    type="checkbox"
                    checked={rangeUnderline}
                    onChange={(e) => setRangeUnderline(e.target.checked)}
                    disabled={!rangeApplyTypography}
                    className="cursor-pointer disabled:opacity-50"
                  />
                  Subrayado
                </label>
              </div>
            </div>
            <div className="mt-2 rounded border border-neutral-800 bg-neutral-900/40 p-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-300">
                4. Extras Sugeridos
              </p>
              <label className="mt-1 flex items-center gap-2 text-[11px] text-neutral-300">
                <input
                  type="checkbox"
                  checked={rangeApplyGlow}
                  onChange={(e) => setRangeApplyGlow(e.target.checked)}
                  className="cursor-pointer"
                />
                Glow local
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-[10px] uppercase text-neutral-400">Color Glow</label>
                <input
                  type="color"
                  value={rangeGlowColor}
                  onChange={(e) => setRangeGlowColor(e.target.value)}
                  disabled={!rangeApplyGlow}
                  className="h-8 w-full cursor-pointer rounded border border-neutral-700 bg-neutral-800 p-1 disabled:opacity-50"
                />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-[10px] uppercase text-neutral-400">Blur Glow</label>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={rangeGlowBlur}
                  onChange={(e) => setRangeGlowBlur(Number(e.target.value))}
                  disabled={!rangeApplyGlow}
                  className="w-full cursor-pointer disabled:opacity-50"
                />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-[10px] uppercase text-neutral-400">Opacidad Glow</label>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={rangeGlowOpacity}
                  onChange={(e) => setRangeGlowOpacity(Number(e.target.value))}
                  disabled={!rangeApplyGlow}
                  className="w-full cursor-pointer disabled:opacity-50"
                />
              </div>
              <label className="mt-2 flex items-center gap-2 text-[11px] text-neutral-300">
                <input
                  type="checkbox"
                  checked={rangeUseOpacity}
                  onChange={(e) => setRangeUseOpacity(e.target.checked)}
                  className="cursor-pointer"
                />
                Opacidad local
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-[10px] uppercase text-neutral-400">Opacidad</label>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={rangeOpacity}
                  onChange={(e) => setRangeOpacity(Number(e.target.value))}
                  disabled={!rangeUseOpacity}
                  className="w-full cursor-pointer disabled:opacity-50"
                />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={clearRangeStyle}
                className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-[11px] font-semibold text-neutral-200 hover:bg-neutral-700"
              >
                Limpiar rango
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={() => closeRangeMenu(false)}
                  className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-[11px] font-semibold text-neutral-200 hover:bg-neutral-700"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={applyRangeStyle}
                  className="rounded border border-cyan-600 bg-cyan-700/70 px-2 py-1 text-[11px] font-semibold text-white hover:bg-cyan-600/90"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        ), document.body)}

    </div>
    </div>
  );
}
