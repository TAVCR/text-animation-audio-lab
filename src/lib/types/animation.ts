import type { AspectRatio, ResolutionPreset } from '../videoConfig';

export type AnimationStyle =
  | 'typewriter'
  | 'slide-in'
  | 'bubble-pop'
  | 'glitch'
  | 'wipe-reveal'
  | 'blur-reveal'
  | 'scramble'
  | 'neon-pulse'
  | 'slide-reveal'
  | 'follower'
  | 'rotation'
  | 'flicker'
  | 'flicker-outline-fill'
  | 'kinetic-box-sequence'
  | 'smooth-sliding'
  | 'shape-reveal'
  | 'fly-through'
  | 'clean-modern'
  | 'bar-reveal'
  | 'follower-grow'
  | 'viral-text'
  | 'shake-flicker'
  | 'blur-cascade'
  | 'cinematic'
  | 'apple-style'
  | 'extruded-3d'
  | 'word-highlight-tracker'
  | 'paper-cutout-assemble'
  | 'ink-stamp-print'
  | 'variable-weight-wave'
  | 'glyph-tile-assemble'
  | 'dual-text-layers';
  
  
  

export type TextRangeStyleMode = 'fill' | 'fill-gradient' | 'stroke' | 'fill-stroke' | 'stroke-gradient';

export interface TextRangeStyle {
  id: string;
  start: number;
  end: number;
  mode: TextRangeStyleMode;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeGradientStart?: string;
  strokeGradientEnd?: string;
  glowColor?: string;
  glowBlur?: number;
  glowOpacity?: number;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  letterSpacing?: number;
  lineHeight?: number;
  opacity?: number;
}

export type ParticlePreset =
  | 'imported-video-1'
  | 'imported-video-2'
  | 'imported-video-3'
  | 'imported-video-4'
  | 'imported-video-5'
  | 'imported-video-6'
  | 'halftone-wave-field'
  | 'neon-bulb-alternation'
  | 'floating-dust'
  | 'light-orbs'
  | 'starfield'
  | 'geometric-flow'
  | 'nebula-cinematic'
  | 'fluid-ribbons'
  | 'tech-network'
  | 'inferno-tracer-burst'
  | 'neon-data-vortex'
  | 'hud-command-center'
  | 'cyan-system-matrix'
  | 'neural-circuit-core'
  | 'quantum-lattice-flow'
  | 'aurora-silk-waves'
  | 'ember-spark-rain'
  | 'plasma-ring-tunnel'
  | 'obsidian-gold-luxe'
  | 'bio-lumina-veins'
  | 'radar-sweep-grid'
  | 'matrix-code-rain'
  | 'matrix-tunnel-flow'
  | 'metaball-reactor'
  | 'wireframe-constellation'
  | 'prism-noise-shimmer'
  | 'prism-sphere-shimmer-3d'
  | 'solar-wind-streaks'
  | 'crystal-shard-drift'
  | 'monochrome-moire'
  | 'electro-silk-tendrils'
  | 'bg3d-lowpoly-terrain'
  | 'bg3d-crystal-shards'
  | 'retro-grid-forward'
  | 'stellar-depth-field';

export interface TextContentProps {
  text: string;
  titleText: string;
  subtitleText: string;
  wordTwo: string;
  wordThree: string;
  textRangeStyles: TextRangeStyle[];
  showWordTwo: boolean;
  showWordThree: boolean;
}

export interface TextStyleProps {
  fontFamily: string;
  fontFamilyTwo: string;
  fontFamilyThree: string;
  fontWeight: string;
  fontWeightTwo: string;
  fontWeightThree: string;
  fontSize: number;
  fontSizeTwo: number;
  fontSizeThree: number;
  letterSpacing: number;
  letterSpacingTwo: number;
  letterSpacingThree: number;
  lineHeight: number;
  lineHeightTwo: number;
  lineHeightThree: number;
  color: string;
  opacity: number;
  colorTwo: string;
  colorThree: string;
  enableFill: boolean;
  enableFillTwo: boolean;
  enableFillThree: boolean;
  enableBorder: boolean;
  enableBorderTwo: boolean;
  enableBorderThree: boolean;
  borderColor: string;
  borderColorTwo: string;
  borderColorThree: string;
  borderWidth: number;
  borderWidthTwo: number;
  borderWidthThree: number;
  enableShadow: boolean;
  enableShadowTwo: boolean;
  enableShadowThree: boolean;
  shadowColor: string;
  shadowColorTwo: string;
  shadowColorThree: string;
  shadowBlur: number;
  shadowBlurTwo: number;
  shadowBlurThree: number;
  typewriterCursorFollowTextStyle: boolean;
  typewriterShowCursor: boolean;
  typewriterCharactersPerSecond: number;
  typewriterCursorStyle: 'bar' | 'underscore' | 'block';
  typewriterCursorAfterEnd: 'blink' | 'hide' | 'hold';
  wordHighlightSeconds: number;
  wordHighlightColor: string;
  wordHighlightActiveTextColor: string;
  wordHighlightInactiveTextColor: string;
  wordHighlightCornerRadiusPx: number;
  wordHighlightPaddingPx: number;
  paperCutoutColor: string;
  paperCutoutInkColor: string;
  paperCutoutWordDelayFrames: number;
  paperCutoutSettleFrames: number;
  paperCutoutPaddingPx: number;
  paperCutoutShadowOpacity: number;
  paperCutoutSeed: string;
  paperCutoutFloatAmplitudePx: number;
  paperCutoutFloatSpeed: number;
  inkStampFrames: number;
  inkStampColor: string;
  inkStampCoverage: number;
  inkStampPressure: number;
  inkStampRoughness: number;
  inkStampRegistrationOffsetPx: number;
  inkStampRegistrationColor: string;
  inkStampSeed: string;
  inkStampFromFront: boolean;
  inkStampInitialAngle: number;
  inkStampStartScale: number;
  inkStampEndScale: number;
  inkStampFloatAmplitudePx: number;
  /** Alias de compatibilidad para sesiones creadas por el control contextual. */
  inkStampFloatAmplitude?: number;
  inkStampFloatSpeed: number;
  inkStampDepthDirection: number;
  variableWeightBaseWeight: number;
  variableWeightPeakWeight: number;
  variableWeightWaveWidth: number;
  variableWeightCycleSeconds: number;
  glyphTileSizePx: number;
  glyphTileScatterPx: number;
  glyphTileAssemblySeconds: number;
  showTextLayer: boolean;
}

export interface ThreeDStyleProps {
  font3dPreset:
    | 'auto'
    | 'helvetiker-regular'
    | 'helvetiker-bold'
    | 'optimer-regular'
    | 'optimer-bold'
    | 'gentilis-regular'
    | 'gentilis-bold'
    | 'droid-serif-regular'
    | 'droid-serif-bold'
    | 'droid-mono';
  useFont3dOverride: boolean;
  metalPreset: 'silver' | 'gold' | 'bronze';
  metalTone: 'light' | 'classic' | 'rich' | 'aged';
  metalBrightness: number;
  metalContrast: number;
  letterSpacing3d: number;
  lineHeight3d: number;
  extrudeDepth3d: number;
}

export interface CompositionProps {
  aspectRatio: AspectRatio;
  resolutionPreset: ResolutionPreset;
  animationStyle: AnimationStyle;
  backgroundColor: string;
  isTransparent: boolean;
}

export interface CircuitHudProps {
  circuitBaseImage: string;
  showCircuitBaseImage: boolean;
}

export interface MotionProps {
  easingStyle: 'cubic' | 'quad' | 'ease' | 'linear' | 'bezier';
  speed: number;
  speedControlsDuration: boolean;
  /** Version 1 fixes clip duration independently of effect clocks. */
  timingVersion?: 1;
  wordSpeedOne: number;
  wordSpeedTwo: number;
  wordSpeedThree: number;
  viralWordStagger: number;
  motionPhase: 'in' | 'out' | 'in-out';
  motionDurationFrames: number;
  reverseOutAnimation: boolean;
  textPositionX: number;
  textPositionY: number;
  startZ: number;
  endZ: number;
  slideDirection: 'top' | 'bottom' | 'left' | 'right';
  followerDirection: 'bottom-up' | 'top-down';
  smoothCascadeDirection: 'bottom-up' | 'top-down' | 'left-right' | 'right-left';
  cinematicDirection: 'zoom-in' | 'zoom-out';
}

export interface TextLayer {
  enabled: boolean;
  text: string;
  animationStyle: AnimationStyle;
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  positionX: number;
  positionY: number;
  color: string;
  opacity: number;
  enableFill: boolean;
  enableBorder: boolean;
  borderColor: string;
  borderWidth: number;
  enableShadow: boolean;
  shadowColor: string;
  shadowBlur: number;
  motionDurationFrames: number;
  speed: number;
  delayFrames: number;
  templateOptions: Record<string, unknown>;
}

export interface ShapeProps {
  boxColor: string;
  gradientStart: string;
  gradientEnd: string;
  enableGradient: boolean;
  shapeGradientWidth: number;
  shapeBorderRadius: number;
}

export interface KineticBoxSequenceProps {
  boxSequenceCount: number;
  boxSequenceMode: 'box' | 'bar';
  boxSequenceDirection: 'from-bottom' | 'from-top' | 'from-left' | 'from-right';
  boxSequenceTextsRaw: string;
  boxSequenceDurationsRaw: string;
  boxSequenceColorsRaw: string;
  boxSequenceTextColorsRaw: string;
  boxSequenceFontFamiliesRaw: string;
  boxSequenceFontWeightsRaw: string;
  boxSequenceFontSizesRaw: string;
  boxSequenceTextTwo: string;
  boxSequenceTextThree: string;
  boxSequenceTextFour: string;
  boxSequenceDurationOne: number;
  boxSequenceDurationTwo: number;
  boxSequenceDurationThree: number;
  boxSequenceDurationFour: number;
  boxSequenceUseGradient: boolean;
  boxSequenceGradientStart: string;
  boxSequenceGradientEnd: string;
  boxSequenceColorOne: string;
  boxSequenceColorTwo: string;
  boxSequenceColorThree: string;
  boxSequenceColorFour: string;
  boxSequenceWidth: number;
  boxSequenceBorderRadius: number;
  boxSequenceHeightScale: number;
}

export interface ParticleProps {
  enableParticles: boolean;
  particlePreset: ParticlePreset;
  particleCount: number;
  particleOpacity: number;
  particleSpeed: number;
  particleFlowDirection: 'forward' | 'backward';
  particleSizeMin: number;
  particleSizeMax: number;
  particleLineThickness: number;
  particleGridAngle: number;
  particleBlur: number;
  particleColorA: string;
  particleColorB: string;
  particleBackdropColor: string;
  particleBackdropOpacity: number;
  particleLightIntensityA: number;
  particleLightIntensityB: number;
  particleLightIntensityC: number;
  particleMetalness: number;
  particleRoughness: number;
  lowpolyLightA: string;
  lowpolyLightB: string;
  lowpolyLightC: string;
  lowpolyDustA: string;
  lowpolyDustB: string;
  lowpolyShowMirror: boolean;
  halftoneSpacingPx: number;
  halftoneRadiusMinPx: number;
  halftoneRadiusMaxPx: number;
  halftoneWaveLengthPx: number;
  halftoneDirectionDegrees: number;
  halftoneCenterClearPercent: number;
  neonBulbColorA: string;
  neonBulbColorB: string;
  neonBulbDensity: number;
  neonBulbSizePx: number;
  neonBulbBrightness: number;
  neonBulbSpeed: number;
  neonBulbPattern: 'organic' | 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up' | 'radial' | 'spiral' | 'angular';
  neonBulbCombinePattern: boolean;
  neonBulbSecondaryPattern: 'organic' | 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up' | 'radial' | 'spiral' | 'angular';
  neonBulbPatternMix: number;
  neonBulbHomogeneity: number;
  neonBulbWaveLength: number;
  neonBulbPatternSpeed: number;
  neonBulbContrast: number;
  neonBulbSoftness: number;
  neonBulbReverse: boolean;
  neonBulbPatternAngle: number;
  neonBulbCenterX: number;
  neonBulbCenterY: number;
  stellarDensity: number;
  stellarDistribution: 'uniform' | 'far' | 'balanced' | 'near';
  stellarSize: number;
  stellarSizeVariation: number;
  stellarDepth: number;
  stellarPerspective: number;
  stellarMotionMode: 'drift' | 'advance' | 'orbit' | 'drift-advance';
  stellarSpeed: number;
  stellarDriftAngle: number;
  stellarParallax: number;
  stellarCameraMotion: number;
  stellarSway: number;
  stellarRotation: number;
  stellarZSpeed: number;
  stellarStreaks: number;
  stellarBrightness: number;
  stellarGlow: number;
  stellarTwinkle: number;
  stellarColorMode: 'monochrome' | 'bicolor' | 'temperature' | 'custom';
  stellarColorA: string;
  stellarColorB: string;
  stellarTemperatureVariation: number;
  stellarDof: number;
  stellarFocusPlane: number;
  stellarDepthFog: number;
  stellarDust: number;
  stellarNebula: number;
  stellarNebulaScale: number;
  stellarNebulaSpeed: number;
  stellarNebulaIntensity: number;
  stellarNebulaColor: string;
  stellarSeed: number;
}

export type AnimationProps =
  & TextContentProps
  & TextStyleProps
  & ThreeDStyleProps
  & CompositionProps
  & MotionProps
  & ShapeProps
  & KineticBoxSequenceProps
  & ParticleProps
  & CircuitHudProps
  & DualTextLayerProps;

export interface DualTextLayerProps {
  secondaryTextLayer?: TextLayer;
  dualLayerOrder?: 'primary-front' | 'secondary-front';
  dualPrimaryDelayFrames?: number;
}
