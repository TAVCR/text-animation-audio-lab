import React, { useMemo } from 'react';
import { useVideoConfig, interpolate, AbsoluteFill, staticFile } from 'remotion';
import { AnimationProps, getEasing } from '@/lib/AnimationContext';
import { useMotionFrame } from '@/remotion/useMotionFrame';
import { ThreeCanvas } from '@remotion/three';
import { useLoader, useThree } from '@react-three/fiber';
import { Center, Environment, Text3D } from '@react-three/drei';
import * as THREE from 'three';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import { resolveExtrudedAppearance } from './extrudedAppearance';

const LANDSCAPE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1152" viewBox="0 0 2048 1152">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f223b"/>
      <stop offset="40%" stop-color="#1f476a"/>
      <stop offset="75%" stop-color="#f08b59"/>
      <stop offset="100%" stop-color="#f9d6aa"/>
    </linearGradient>
    <linearGradient id="mountainA" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#203d55"/>
      <stop offset="100%" stop-color="#102434"/>
    </linearGradient>
    <linearGradient id="mountainB" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#314f66"/>
      <stop offset="100%" stop-color="#162b3f"/>
    </linearGradient>
    <radialGradient id="sunGlow" cx="50%" cy="48%" r="35%">
      <stop offset="0%" stop-color="#ffd9a8" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#ffd9a8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="2048" height="1152" fill="url(#sky)"/>
  <circle cx="1024" cy="550" r="380" fill="url(#sunGlow)"/>
  <path d="M0 760 L360 520 L720 790 L1080 470 L1440 790 L1820 540 L2048 760 L2048 1152 L0 1152 Z" fill="url(#mountainA)"/>
  <path d="M0 860 L280 660 L540 910 L860 640 L1200 900 L1580 680 L2048 860 L2048 1152 L0 1152 Z" fill="url(#mountainB)"/>
  <rect x="0" y="960" width="2048" height="220" fill="#0a1723"/>
</svg>`;

const LANDSCAPE_TEXTURE_URI = `data:image/svg+xml;utf8,${encodeURIComponent(LANDSCAPE_SVG)}`;
const HOLE_PRIORITY = ['O', 'A', 'D', 'P', 'Q', 'R', 'B'];
const isBoldWeight = (weight?: string) => /(bold|700|800|900)/i.test(String(weight ?? ''));
const BASE_UI_FONT_SIZE = 120;
const BASE_GEOMETRY_SIZE = 2.88;

type FontPreset = Exclude<AnimationProps['font3dPreset'], 'auto'>;
type LineLayout = { glyphs: Array<{ char: string; x: number }>; width: number };
type ResolvedFontAsset = { source: 'json' | 'ttf'; file: string };
type TypefaceGlyph = {
  ha?: number;
  x_min?: number;
  x_max?: number;
  xMin?: number;
  xMax?: number;
};
type TypefaceData = {
  resolution?: number;
  glyphs?: Record<string, TypefaceGlyph>;
};

const normalizeFontFamily = (fontFamily: string): string => {
  return (fontFamily || '')
    .toLowerCase()
    .replace(/["']/g, '')
    .split(',')[0]
    .trim();
};

const brightenHex = (hex: string, amount: number): string => {
  const clamped = Math.max(0, Math.min(1, amount));
  const color = new THREE.Color(hex);
  color.lerp(new THREE.Color('#ffffff'), clamped);
  return `#${color.getHexString()}`;
};

const gradeColor = (hex: string, lift: number, saturationScale: number): string => {
  const color = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  hsl.s = Math.min(1, Math.max(0, hsl.s * saturationScale));
  hsl.l = Math.min(1, Math.max(0, hsl.l + (1 - hsl.l) * lift));
  color.setHSL(hsl.h, hsl.s, hsl.l);
  return `#${color.getHexString()}`;
};

const clampNumber = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const TTF_FONT_MAP: Record<string, { regular: string; bold?: string }> = {
  arial: { regular: 'OpenSans-Var.ttf' },
  helvetica: { regular: 'OpenSans-Var.ttf' },
  verdana: { regular: 'OpenSans-Var.ttf' },
  tahoma: { regular: 'OpenSans-Var.ttf' },
  'trebuchet ms': { regular: 'OpenSans-Var.ttf' },
  'open sans': { regular: 'OpenSans-Var.ttf' },
  roboto: { regular: 'Roboto-Var.ttf' },
  montserrat: { regular: 'Montserrat-Var.ttf' },
  oswald: { regular: 'Oswald-Var.ttf' },
  nunito: { regular: 'Nunito-Var.ttf' },
  rubik: { regular: 'Rubik-Var.ttf' },
  inter: { regular: 'Inter-Var.ttf' },
  'times new roman': { regular: 'PlayfairDisplay-Var.ttf' },
  georgia: { regular: 'PlayfairDisplay-Var.ttf' },
  'playfair display': { regular: 'PlayfairDisplay-Var.ttf' },
  'courier new': { regular: 'RobotoMono-Var.ttf' },
  'comic sans ms': { regular: 'ComicNeue-Regular.ttf', bold: 'ComicNeue-Bold.ttf' },
  impact: { regular: 'Anton-Regular.ttf' },
  poppins: { regular: 'Poppins-Regular.ttf', bold: 'Poppins-Bold.ttf' },
  anton: { regular: 'Anton-Regular.ttf' },
  bangers: { regular: 'Bangers-Regular.ttf' },
  'bebas neue': { regular: 'BebasNeue-Regular.ttf' },
};

const AUTO_FONT_MAP: Record<string, FontPreset> = {
  arial: 'helvetiker-regular',
  helvetica: 'helvetiker-regular',
  verdana: 'helvetiker-regular',
  tahoma: 'helvetiker-regular',
  'trebuchet ms': 'helvetiker-regular',
  impact: 'helvetiker-bold',
  'times new roman': 'droid-serif-regular',
  georgia: 'droid-serif-regular',
  'courier new': 'droid-mono',
  'comic sans ms': 'optimer-regular',
};

const presetToFile = (preset: FontPreset, bold: boolean): string => {
  switch (preset) {
    case 'helvetiker-regular':
      return 'helvetiker_regular.typeface.json';
    case 'helvetiker-bold':
      return 'helvetiker_bold.typeface.json';
    case 'optimer-regular':
      return 'optimer_regular.typeface.json';
    case 'optimer-bold':
      return 'optimer_bold.typeface.json';
    case 'gentilis-regular':
      return 'gentilis_regular.typeface.json';
    case 'gentilis-bold':
      return 'gentilis_bold.typeface.json';
    case 'droid-serif-regular':
      return 'droid_serif_regular.typeface.json';
    case 'droid-serif-bold':
      return 'droid_serif_bold.typeface.json';
    case 'droid-mono':
      return 'droid_sans_mono_regular.typeface.json';
    default:
      return bold ? 'helvetiker_bold.typeface.json' : 'helvetiker_regular.typeface.json';
  }
};

const resolveFontAsset = (
  fontFamily: string,
  fontWeight: string,
  useFont3dOverride: boolean,
  font3dPreset: AnimationProps['font3dPreset']
): ResolvedFontAsset => {
  const family = normalizeFontFamily(fontFamily);
  const bold = isBoldWeight(fontWeight);

  if (useFont3dOverride && font3dPreset !== 'auto') {
    return { source: 'json', file: presetToFile(font3dPreset, bold) };
  }

  const ttfFont = TTF_FONT_MAP[family];
  if (ttfFont) {
    return { source: 'ttf', file: bold && ttfFont.bold ? ttfFont.bold : ttfFont.regular };
  }

  const mappedPreset = AUTO_FONT_MAP[family];
  if (mappedPreset) {
    return { source: 'json', file: presetToFile(mappedPreset, bold) };
  }

  if (/times|georgia|playfair|serif/.test(family)) {
    return { source: 'json', file: presetToFile(bold ? 'droid-serif-bold' : 'droid-serif-regular', bold) };
  }
  if (/comic/.test(family)) {
    return { source: 'json', file: presetToFile(bold ? 'optimer-bold' : 'optimer-regular', bold) };
  }
  if (/courier|mono/.test(family)) {
    return { source: 'json', file: presetToFile('droid-mono', bold) };
  }
  if (/gentilis|rubik/.test(family)) {
    return { source: 'json', file: presetToFile(bold ? 'gentilis-bold' : 'gentilis-regular', bold) };
  }
  return { source: 'json', file: presetToFile(bold ? 'helvetiker-bold' : 'helvetiker-regular', bold) };
};

const METAL_PRESETS: Record<
  AnimationProps['metalPreset'],
  Record<
    AnimationProps['metalTone'],
    {
      textColor: string;
      keyLight: string;
      fillLight: string;
      rimLight: string;
      roughness: number;
      envMapIntensity: number;
    }
  >
> = {
  silver: {
    light: {
      textColor: '#f3f7ff',
      keyLight: '#ffffff',
      fillLight: '#d2e6ff',
      rimLight: '#fff1df',
      roughness: 0.05,
      envMapIntensity: 3.8,
    },
    classic: {
      textColor: '#dde5ef',
      keyLight: '#f8fbff',
      fillLight: '#a8c9f5',
      rimLight: '#ffdcb8',
      roughness: 0.09,
      envMapIntensity: 3.1,
    },
    rich: {
      textColor: '#aebed2',
      keyLight: '#e3efff',
      fillLight: '#7ea3d8',
      rimLight: '#f5c8a2',
      roughness: 0.16,
      envMapIntensity: 2.4,
    },
    aged: {
      textColor: '#7e8a98',
      keyLight: '#ccd6e5',
      fillLight: '#617692',
      rimLight: '#a89481',
      roughness: 0.27,
      envMapIntensity: 1.75,
    },
  },
  gold: {
    light: {
      textColor: '#f1ddb0',
      keyLight: '#fff9ed',
      fillLight: '#fde7b8',
      rimLight: '#d5e3f4',
      roughness: 0.09,
      envMapIntensity: 3.0,
    },
    classic: {
      textColor: '#d6b169',
      keyLight: '#fff2d6',
      fillLight: '#efd29b',
      rimLight: '#c3d4ea',
      roughness: 0.14,
      envMapIntensity: 2.55,
    },
    rich: {
      textColor: '#b48635',
      keyLight: '#f8e2af',
      fillLight: '#d9b36b',
      rimLight: '#9fb9de',
      roughness: 0.21,
      envMapIntensity: 2.05,
    },
    aged: {
      textColor: '#8f6b3a',
      keyLight: '#dcca9c',
      fillLight: '#ad8755',
      rimLight: '#849fc4',
      roughness: 0.3,
      envMapIntensity: 1.6,
    },
  },
  bronze: {
    light: {
      textColor: '#c59a7c',
      keyLight: '#faefe6',
      fillLight: '#e8c5a9',
      rimLight: '#d4e0f0',
      roughness: 0.12,
      envMapIntensity: 2.75,
    },
    classic: {
      textColor: '#a77557',
      keyLight: '#f2ddca',
      fillLight: '#cf9f7f',
      rimLight: '#becee3',
      roughness: 0.17,
      envMapIntensity: 2.25,
    },
    rich: {
      textColor: '#85583f',
      keyLight: '#e8ccb8',
      fillLight: '#b27f63',
      rimLight: '#a5bad5',
      roughness: 0.24,
      envMapIntensity: 1.88,
    },
    aged: {
      textColor: '#644736',
      keyLight: '#ceb7a8',
      fillLight: '#8f6954',
      rimLight: '#8ba3c2',
      roughness: 0.33,
      envMapIntensity: 1.45,
    },
  },
};

const fallbackGlyphWidth = (char: string, size: number): number => {
  if (char === ' ') {
    return size * 0.45;
  }
  if (/[ilI1\|]/.test(char)) {
    return size * 0.34;
  }
  if (/[mwMW@#%&]/.test(char)) {
    return size * 0.9;
  }
  return size * 0.62;
};

const getGlyphFromFont = (char: string, fontData: TypefaceData | null): TypefaceGlyph | null => {
  const glyphs = fontData?.glyphs;
  if (!glyphs) {
    return null;
  }

  return glyphs[char] ?? glyphs[char.toUpperCase()] ?? glyphs[char.toLowerCase()] ?? glyphs['?'] ?? null;
};

const getGlyphWidth = (char: string, size: number, fontData: TypefaceData | null): number => {
  const glyph = getGlyphFromFont(char, fontData);
  const resolution = Math.max(1, fontData?.resolution ?? 1000);
  const scale = size / resolution;

  const xMin = glyph?.x_min ?? glyph?.xMin;
  const xMax = glyph?.x_max ?? glyph?.xMax;
  const visualWidth = typeof xMin === 'number' && typeof xMax === 'number' && xMax > xMin ? (xMax - xMin) * scale : null;
  const advanceWidth = typeof glyph?.ha === 'number' ? glyph.ha * scale : null;

  if (char === ' ') {
    return Math.max(advanceWidth ?? fallbackGlyphWidth(char, size), size * 0.3);
  }

  return Math.max(visualWidth ?? advanceWidth ?? fallbackGlyphWidth(char, size), size * 0.16);
};

const createLineLayout = (line: string, size: number, spacing: number, fontData: TypefaceData | null): LineLayout => {
  const chars = line.split('');
  if (chars.length === 0) {
    return { glyphs: [], width: 0 };
  }

  const widths = chars.map((char) => getGlyphWidth(char, size, fontData));
  const totalWidth = Math.max(0, widths.reduce((acc, width) => acc + width, 0) + spacing * Math.max(chars.length - 1, 0));
  let cursor = -totalWidth / 2;

  const glyphs = chars.map((char, index) => {
    const width = widths[index];
    const x = cursor + width / 2;
    cursor += width + (index < chars.length - 1 ? spacing : 0);
    return { char, x };
  });

  return { glyphs, width: totalWidth };
};

const getFlyTargetX = (text: string, size: number, spacing: number, fontData: TypefaceData | null): number => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 0;
  }

  const layout = createLineLayout(normalized, size, spacing, fontData);
  const upper = normalized.toUpperCase();
  let targetIndex = -1;

  for (const glyph of HOLE_PRIORITY) {
    const index = upper.indexOf(glyph);
    if (index !== -1) {
      targetIndex = index;
      break;
    }
  }

  if (targetIndex === -1) {
    targetIndex = Math.floor((layout.glyphs.length - 1) / 2);
  }

  return layout.glyphs[targetIndex]?.x ?? 0;
};

const LandscapePlane: React.FC = () => {
  const texture = useLoader(THREE.TextureLoader, LANDSCAPE_TEXTURE_URI);

  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <mesh position={[0, 0, -230]}>
      <planeGeometry args={[360, 200]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
};

const RendererGrade: React.FC<{ exposure: number }> = ({ exposure }) => {
  const { gl } = useThree();

  React.useEffect(() => {
    const previousToneMapping = gl.toneMapping;
    const previousExposure = gl.toneMappingExposure;

    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = exposure;

    return () => {
      gl.toneMapping = previousToneMapping;
      gl.toneMappingExposure = previousExposure;
    };
  }, [gl, exposure]);

  return null;
};

const CameraRig: React.FC<{
  targetX: number;
  speed: number;
  cinematicDirection: AnimationProps['cinematicDirection'];
  easingStyle: AnimationProps['easingStyle'];
  motionPhase: AnimationProps['motionPhase'];
  reverseOutAnimation: AnimationProps['reverseOutAnimation'];
}> = ({ targetX, speed, cinematicDirection, easingStyle, motionPhase, reverseOutAnimation }) => {
  const baseFrame = useMotionFrame({ motionPhase, reverseOutAnimation });
  const calibratedSpeed = clampNumber(speed, 0.2, 3) * 0.72;
  const frame = baseFrame * calibratedSpeed;
  const { durationInFrames } = useVideoConfig();
  const { camera } = useThree();

  const flightStartFrame = durationInFrames * 0.1;
  const flightEndFrame = durationInFrames * 0.9;
  const easing = getEasing(easingStyle);
  const cappedTargetX = Math.max(-22, Math.min(22, targetX));
  const flightSpan = Math.max(1, flightEndFrame - flightStartFrame);
  const xShiftStart = flightStartFrame + flightSpan * 0.56;
  const yShiftStart = flightStartFrame + flightSpan * 0.62;
  const endYOffset = cinematicDirection === 'zoom-in' ? 1.2 : -1.2;

  // Keep text perfectly centered at the beginning.
  const cameraX = interpolate(frame, [0, flightStartFrame, xShiftStart, flightEndFrame], [0, 0, 0, cappedTargetX], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cameraY = interpolate(frame, [0, flightStartFrame, yShiftStart, flightEndFrame], [0, 0, 0, endYOffset], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cameraZ = interpolate(frame, [0, flightStartFrame, flightEndFrame], [66, 66, -82], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lookAtX = interpolate(frame, [0, flightStartFrame, xShiftStart, flightEndFrame], [0, 0, 0, cappedTargetX * 0.2], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lookAtZ = interpolate(frame, [0, flightStartFrame, flightEndFrame], [0, 0, -268], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  camera.position.set(cameraX, cameraY, cameraZ);
  camera.lookAt(lookAtX, 0, lookAtZ);

  return null;
};

export const Extruded3DEffect: React.FC<AnimationProps> = (props) => {
  const baseFrame = useMotionFrame(props);
  const speed = props.speed || 1;
  const frame = baseFrame * speed;
  const { width, height } = useVideoConfig();

  const rawText = (props.text || 'MOTION').trim() || 'MOTION';
  const lines = rawText.split('\n').map((line) => line.trim()).filter((line, index, arr) => line.length > 0 || arr.length === 1);
  const centerLine = lines[Math.floor(lines.length / 2)] || 'MOTION';

  const fontScale = Math.max(0.25, (props.fontSize || BASE_UI_FONT_SIZE) / BASE_UI_FONT_SIZE);
  const textSize = BASE_GEOMETRY_SIZE;
  const extrusionDepth = Math.max(0.2, props.extrudeDepth3d ?? 2.4);
  const bevelThickness = Math.max(0.04, Math.min(extrusionDepth * 0.42, textSize * 0.18, props.enableBorder ? Math.max(0.04, props.borderWidth * 0.02) : textSize * 0.18));
  const bevelSize = Math.max(0.02, Math.min(bevelThickness * 0.72, textSize * 0.095));
  const textLetterSpacing = Math.max(-1.2, (props.letterSpacing3d ?? props.letterSpacing ?? 0) * 0.06);
  const lineHeight3d = Math.max(0.7, props.lineHeight3d ?? props.lineHeight ?? 1.2);
  const lineStep = textSize * lineHeight3d * 1.22;
  const resolvedFont = useMemo(
    () => resolveFontAsset(props.fontFamily, props.fontWeight, props.useFont3dOverride, props.font3dPreset),
    [props.fontFamily, props.fontWeight, props.useFont3dOverride, props.font3dPreset]
  );
  const fontAssetPath =
    resolvedFont.source === 'ttf'
      ? staticFile(`fonts/ttf/${resolvedFont.file}`)
      : staticFile(`fonts/${resolvedFont.file}`);
  const rawFontData = useLoader(
    (resolvedFont.source === 'ttf' ? TTFLoader : THREE.FileLoader) as unknown as never,
    fontAssetPath
  ) as unknown;
  const fontMetrics = useMemo<TypefaceData | null>(() => {
    if (!rawFontData) {
      return null;
    }
    if (resolvedFont.source === 'ttf' && typeof rawFontData === 'object') {
      return rawFontData as TypefaceData;
    }
    if (typeof rawFontData === 'string') {
      try {
        return JSON.parse(rawFontData) as TypefaceData;
      } catch {
        return null;
      }
    }
    if (typeof rawFontData === 'object') {
      return rawFontData as TypefaceData;
    }
    return null;
  }, [rawFontData, resolvedFont.source]);
  const text3dFont = useMemo<string | Record<string, unknown>>(() => {
    if (resolvedFont.source === 'ttf' && fontMetrics) {
      return fontMetrics as unknown as Record<string, unknown>;
    }
    return staticFile(`fonts/${resolvedFont.file}`);
  }, [resolvedFont, fontMetrics]);
  const lineLayouts = useMemo(
    () => lines.map((line) => createLineLayout(line.length > 0 ? line : ' ', textSize, textLetterSpacing, fontMetrics)),
    [lines, textSize, textLetterSpacing, fontMetrics]
  );
  const targetX = useMemo(
    () => getFlyTargetX(centerLine, textSize, textLetterSpacing, fontMetrics) * fontScale,
    [centerLine, textSize, textLetterSpacing, fontMetrics, fontScale]
  );
  const metalPreset = props.metalPreset ?? 'silver';
  const metalTone = props.metalTone ?? 'classic';
  const metalBrightness = clampNumber(props.metalBrightness ?? 1, 0.6, 1.8);
  const metalContrast = clampNumber(props.metalContrast ?? 1, 0.6, 1.8);
  const metalBase = METAL_PRESETS[metalPreset][metalTone];
  const metal = useMemo(() => {
    const toneProfile =
      metalTone === 'light'
        ? {
            lift: 0.62,
            saturationScale: 0.86,
            roughnessScale: 0.25,
            envMul: 2.15,
            emissive: 0.16,
            clearcoat: 1,
            clearcoatRoughness: 0.006,
            ambientIntensity: 0.92,
            keyIntensity: 4.8,
            fillIntensity: 3.55,
            rimIntensity: 2.9,
            exposure: 1.58,
          }
        : metalTone === 'classic'
        ? {
            lift: 0.34,
            saturationScale: 1.0,
            roughnessScale: 0.62,
            envMul: 1.42,
            emissive: 0.1,
            clearcoat: 1,
            clearcoatRoughness: 0.02,
            ambientIntensity: 0.62,
            keyIntensity: 3.35,
            fillIntensity: 2.55,
            rimIntensity: 1.95,
            exposure: 1.28,
          }
        : metalTone === 'rich'
        ? {
            lift: 0.12,
            saturationScale: 1.22,
            roughnessScale: 1.05,
            envMul: 0.94,
            emissive: 0.055,
            clearcoat: 0.93,
            clearcoatRoughness: 0.042,
            ambientIntensity: 0.42,
            keyIntensity: 2.45,
            fillIntensity: 1.82,
            rimIntensity: 1.42,
            exposure: 1.04,
          }
        : {
            lift: 0.02,
            saturationScale: 0.68,
            roughnessScale: 1.9,
            envMul: 0.62,
            emissive: 0.02,
            clearcoat: 0.74,
            clearcoatRoughness: 0.082,
            ambientIntensity: 0.28,
            keyIntensity: 1.68,
            fillIntensity: 1.24,
            rimIntensity: 0.92,
            exposure: 0.88,
          };

    const brightnessDelta = metalBrightness - 1;
    const contrastDelta = metalContrast - 1;
    const lift = toneProfile.lift + brightnessDelta * 0.28 - Math.max(0, contrastDelta) * 0.08;
    const saturation = toneProfile.saturationScale * (1 + contrastDelta * 0.22);
    const roughnessScale = toneProfile.roughnessScale * (1 - contrastDelta * 0.26 + Math.max(0, -brightnessDelta) * 0.2);
    const envMul = toneProfile.envMul * (1 + brightnessDelta * 0.38 + contrastDelta * 0.2);
    const exposure = toneProfile.exposure * (1 + brightnessDelta * 0.45 + contrastDelta * 0.12);

    const ambientIntensity = toneProfile.ambientIntensity * (1 + brightnessDelta * 0.34 - contrastDelta * 0.48);
    const keyIntensity = toneProfile.keyIntensity * (1 + brightnessDelta * 0.26 + contrastDelta * 0.42);
    const fillIntensity = toneProfile.fillIntensity * (1 + brightnessDelta * 0.2 + contrastDelta * 0.26);
    const rimIntensity = toneProfile.rimIntensity * (1 + brightnessDelta * 0.18 + contrastDelta * 0.3);
    const emissive = toneProfile.emissive * (1 + brightnessDelta * 0.4 - Math.max(0, contrastDelta) * 0.18);
    const clearcoat = toneProfile.clearcoat * (1 + contrastDelta * 0.16);
    const clearcoatRoughness = toneProfile.clearcoatRoughness * (1 - contrastDelta * 0.22 + Math.max(0, -brightnessDelta) * 0.16);

    return {
      ...metalBase,
      textColor: gradeColor(metalBase.textColor, clampNumber(lift, 0, 0.75), clampNumber(saturation, 0.5, 1.8)),
      keyLight: brightenHex(metalBase.keyLight, clampNumber(lift * 0.36, 0, 0.55)),
      fillLight: brightenHex(metalBase.fillLight, clampNumber(lift * 0.3, 0, 0.45)),
      rimLight: brightenHex(metalBase.rimLight, clampNumber(lift * 0.24, 0, 0.4)),
      roughness: clampNumber(metalBase.roughness * roughnessScale, 0.03, 0.42),
      envMapIntensity: clampNumber(metalBase.envMapIntensity * envMul, 1.2, 6.4),
      emissiveIntensity: clampNumber(emissive, 0.01, 0.22),
      clearcoat: clampNumber(clearcoat, 0.6, 1),
      clearcoatRoughness: clampNumber(clearcoatRoughness, 0.006, 0.12),
      ambientIntensity: clampNumber(ambientIntensity, 0.18, 1.1),
      keyIntensity: clampNumber(keyIntensity, 1.3, 5.4),
      fillIntensity: clampNumber(fillIntensity, 1.0, 4.2),
      rimIntensity: clampNumber(rimIntensity, 0.8, 3.5),
      exposure: clampNumber(exposure, 0.82, 1.95),
    };
  }, [metalBase, metalTone, metalBrightness, metalContrast]);
  const appearance = resolveExtrudedAppearance(props);

  const introOpacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: props.isTransparent ? 'transparent' : '#05070f',
        overflow: 'hidden',
      }}
    >
      <AbsoluteFill style={{ opacity: introOpacity }}>
        <ThreeCanvas
          width={width}
          height={height}
          camera={{ position: [0, 0, 78], fov: 36, near: 0.1, far: 600 }}
        >
          <RendererGrade exposure={metal.exposure} />
          {!props.isTransparent && <LandscapePlane />}

          <ambientLight intensity={metal.ambientIntensity} />
          <hemisphereLight args={['#f6f9ff', '#2c3c4d', 0.72]} />
          {/* Balanced lighting rig to avoid side-by-side tint shifts across long words */}
          <directionalLight position={[0, 26, 34]} intensity={metal.keyIntensity} color={metal.keyLight} />
          <directionalLight position={[-22, 12, 22]} intensity={metal.fillIntensity * 0.62} color={metal.fillLight} />
          <directionalLight position={[22, 12, 22]} intensity={metal.fillIntensity * 0.62} color={metal.fillLight} />
          <directionalLight position={[0, 18, -22]} intensity={metal.rimIntensity} color={metal.rimLight} />
          <Environment preset="studio" />

          <group rotation={[0, 0, 0]} scale={[fontScale, fontScale, fontScale]}>
            {lineLayouts.map((layout, lineIndex) => {
              const y = ((lineLayouts.length - 1) * lineStep) / 2 - lineIndex * lineStep;

              return (
                <group key={`line-${lineIndex}`} position={[0, y, 0]}>
                  {layout.glyphs.map((glyph, glyphIndex) => {
                    if (glyph.char === ' ') {
                      return null;
                    }

                    return (
                      <group key={`glyph-${lineIndex}-${glyphIndex}-${glyph.char}`} position={[glyph.x, 0, 0]}>
                        <Center>
                          <Text3D
                            font={text3dFont as never}
                            size={textSize}
                            height={extrusionDepth}
                            curveSegments={12}
                            bevelEnabled
                            bevelThickness={bevelThickness}
                            bevelSize={bevelSize}
                            bevelOffset={0}
                            bevelSegments={8}
                          >
                            {glyph.char}
                            <meshPhysicalMaterial
                              color={appearance.color}
                              metalness={1}
                              roughness={metal.roughness}
                              clearcoat={metal.clearcoat}
                              clearcoatRoughness={metal.clearcoatRoughness}
                              reflectivity={1}
                              envMapIntensity={metal.envMapIntensity}
                              emissive={appearance.emissive}
                              emissiveIntensity={metal.emissiveIntensity + appearance.emissiveIntensity}
                              transparent={appearance.transparent}
                              opacity={appearance.opacity}
                              side={THREE.DoubleSide}
                            />
                          </Text3D>
                        </Center>
                      </group>
                    );
                  })}
                </group>
              );
            })}
          </group>

          <CameraRig
            targetX={targetX}
            speed={speed}
            cinematicDirection={props.cinematicDirection}
            easingStyle={props.easingStyle}
            motionPhase={props.motionPhase}
            reverseOutAnimation={props.reverseOutAnimation}
          />
        </ThreeCanvas>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
