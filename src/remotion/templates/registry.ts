import type { ComponentType } from 'react';
import type { AnimationProps, AnimationStyle } from '@/lib/AnimationContext';
import { AppleStyleText } from './AppleStyleText';
import { BarRevealEffect } from './BarRevealEffect';
import { BlurringTextCascade } from './BlurringTextCascade';
import { BlurRevealEffect } from './BlurRevealEffect';
import { BubblePopEffect } from './BubblePopEffect';
import { CinematicText } from './CinematicText';
import { CleanModernText } from './CleanModernText';
import { Extruded3DEffect } from './Extruded3DEffect';
import { FlickerEffect } from './FlickerEffect';
import { FlickerOutlineFillEffect } from './FlickerOutlineFillEffect';
import { FlyThroughEffect } from './FlyThroughEffect';
import { FollowerEffect } from './FollowerEffect';
import { FollowerGrowRotate } from './FollowerGrowRotate';
import { GlitchEffect } from './GlitchEffect';
import { KineticBoxSequenceEffect } from './KineticBoxSequenceEffect';
import { KineticSlideIn } from './KineticSlideIn';
import { NeonPulseEffect } from './NeonPulseEffect';
import { RotationRevealEffect } from './RotationRevealEffect';
import { ScrambleEffect } from './ScrambleEffect';
import { ShakeFlickerEffect } from './ShakeFlickerEffect';
import { ShapeRevealEffect } from './ShapeRevealEffect';
import { SlideRevealEffect } from './SlideRevealEffect';
import { SmoothSlidingText } from './SmoothSlidingText';
import { TypewriterEffect } from './TypewriterEffect';
import { ViralTextEffect } from './ViralTextEffect';
import { WipeRevealEffect } from './WipeRevealEffect';
import { WordHighlightTracker } from './WordHighlightTracker';
import { PaperCutoutAssemble } from './PaperCutoutAssemble';
import { InkStampPrint } from './InkStampPrint';
import { VariableWeightWave } from './VariableWeightWave';
import { GlyphTileAssemble } from './GlyphTileAssemble';
import { DualTextLayers } from './DualTextLayers';

export type AnimationTemplateComponent = ComponentType<AnimationProps>;

export const templateRegistry: Partial<Record<AnimationStyle, AnimationTemplateComponent>> & Record<'typewriter', AnimationTemplateComponent> = {
  'typewriter': TypewriterEffect,
  'slide-in': KineticSlideIn,
  'bubble-pop': BubblePopEffect,
  'glitch': GlitchEffect,
  'wipe-reveal': WipeRevealEffect,
  'blur-reveal': BlurRevealEffect,
  'scramble': ScrambleEffect,
  'neon-pulse': NeonPulseEffect,
  'slide-reveal': SlideRevealEffect,
  'follower': FollowerEffect,
  'rotation': RotationRevealEffect,
  'flicker': FlickerEffect,
  'flicker-outline-fill': FlickerOutlineFillEffect,
  'kinetic-box-sequence': KineticBoxSequenceEffect,
  'smooth-sliding': SmoothSlidingText,
  'shape-reveal': ShapeRevealEffect,
  'fly-through': FlyThroughEffect,
  'clean-modern': CleanModernText,
  'bar-reveal': BarRevealEffect,
  'follower-grow': FollowerGrowRotate,
  'viral-text': ViralTextEffect,
  'shake-flicker': ShakeFlickerEffect,
  'blur-cascade': BlurringTextCascade,
  'cinematic': CinematicText,
  'apple-style': AppleStyleText,
  'extruded-3d': Extruded3DEffect,
  'word-highlight-tracker': WordHighlightTracker,
  'paper-cutout-assemble': PaperCutoutAssemble,
  'ink-stamp-print': InkStampPrint,
  'variable-weight-wave': VariableWeightWave,
  'glyph-tile-assemble': GlyphTileAssemble,
  'dual-text-layers': DualTextLayers,
};
