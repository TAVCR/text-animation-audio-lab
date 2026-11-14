import React from 'react';
import { Composition } from 'remotion';
import { MainComposition } from './MainComposition';
import { ProceduralCircuit, type ProceduralCircuitProps } from '@/components/experimental/ProceduralCircuit';
import { AIPulseMaster, type AIPulseMasterProps } from '@/components/experimental/AIPulseMaster';
import { HexProceduralGround, type HexProceduralGroundProps } from '@/components/HexProceduralGround';
import { HexShaderBackground, type HexShaderBackgroundProps } from '@/components/experimental/HexShaderBackground';
import { Check3D } from '@/components/experimental/Check3D';
import { HexWave3D, type HexWave3DProps } from '@/components/experimental/HexWave3D';
import { SphereField3D, type SphereField3DProps } from '@/components/experimental/SphereField3D';
import { CaptionedVideo, type CaptionedVideoProps } from './CaptionedVideoComposition';
import { AnimationProps, defaultAnimationProps } from '../lib/AnimationContext';
import {
  DEFAULT_DURATION_IN_FRAMES,
  REMOTION_FPS,
  getResolvedDurationInFrames,
  getCompositionDimensions,
} from '../lib/videoConfig';

const remotionDefaultProps: AnimationProps = {
  ...defaultAnimationProps,
  text: 'TEXT',
  isTransparent: true,
  animationStyle: 'typewriter',
};

const asCompositionComponent = <T extends object>(
  component: React.ComponentType<T>
): React.ComponentType<Record<string, unknown>> => {
  return component as unknown as React.ComponentType<Record<string, unknown>>;
};

const proceduralCircuitDefaultProps: ProceduralCircuitProps = {
  seed: 'AG-CIRCUIT-001',
  flowSpeed: 1,
  branchDensity: 0.62,
  glowColor: '#57f5ff',
  lineWidth: 1.6,
};

const experimentalCircuitDefaultProps: AIPulseMasterProps = {
  seed: 'AG-CIRCUIT-001',
  flowSpeed: 1,
  branchDensity: 0.62,
  hue: 39,
  saturation: 1,
  brightness: 0.6,
  glowIntensity: 22,
  showControls: false,
};

const hexProceduralGroundDefaultProps: HexProceduralGroundProps = {
  seed: 'AG-HEX-PRO-001',
  flowSpeed: 0.9,
  branchDensity: 1.15,
  waveAmplitude: 1.1,
  hexColor: '#ffffff',
  backgroundColor: '#f1f1f1',
  enablePost: true,
};

const hexShaderBackgroundDefaultProps: HexShaderBackgroundProps = {
  color: '#ffffff',
};

const hexWave3DDefaultProps: HexWave3DProps = {
  primaryColor: '#ffffff',
};

const sphereField3DDefaultProps: SphereField3DProps = {
  primaryColor: '#ffffff',
  sphereCount: 280,
};

export const RemotionRoot: React.FC = () => {
  const baseDims = getCompositionDimensions(remotionDefaultProps.aspectRatio, remotionDefaultProps.resolutionPreset);
  const experimentalDims = getCompositionDimensions('16:9', '1080p');

  return (
    <>
      <Composition
        id="Main"
        component={asCompositionComponent(MainComposition)}
        durationInFrames={DEFAULT_DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={baseDims.width}
        height={baseDims.height}
        defaultProps={remotionDefaultProps as unknown as Record<string, unknown>}
        calculateMetadata={({ props }) => {
          const safeProps = { ...remotionDefaultProps, ...(props as Partial<AnimationProps>) };
          const dims = getCompositionDimensions(safeProps.aspectRatio, safeProps.resolutionPreset);
          const duration = getResolvedDurationInFrames(safeProps, REMOTION_FPS);

          return {
            width: dims.width,
            height: dims.height,
            durationInFrames: duration,
          };
        }}
      />
      <Composition
        id="CaptionedVideo"
        component={asCompositionComponent(CaptionedVideo)}
        durationInFrames={DEFAULT_DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={baseDims.width}
        height={baseDims.height}
        defaultProps={{ src: '', cues: [] } satisfies CaptionedVideoProps as unknown as Record<string, unknown>}
      />
      <Composition
        id="Experimental-ProceduralCircuit"
        component={asCompositionComponent(ProceduralCircuit)}
        durationInFrames={DEFAULT_DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={experimentalDims.width}
        height={experimentalDims.height}
        defaultProps={proceduralCircuitDefaultProps as unknown as Record<string, unknown>}
      />
      <Composition
        id="ExperimentalCircuit"
        component={asCompositionComponent(AIPulseMaster)}
        durationInFrames={DEFAULT_DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={experimentalDims.width}
        height={experimentalDims.height}
        defaultProps={experimentalCircuitDefaultProps as unknown as Record<string, unknown>}
      />
      <Composition
        id="Experimental-HexProceduralGround"
        component={asCompositionComponent(HexProceduralGround)}
        durationInFrames={DEFAULT_DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={experimentalDims.width}
        height={experimentalDims.height}
        defaultProps={hexProceduralGroundDefaultProps as unknown as Record<string, unknown>}
      />
      <Composition
        id="Experimental-HexShaderBackground"
        component={asCompositionComponent(HexShaderBackground)}
        durationInFrames={DEFAULT_DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={experimentalDims.width}
        height={experimentalDims.height}
        defaultProps={hexShaderBackgroundDefaultProps as unknown as Record<string, unknown>}
      />
      <Composition
        id="Experimental-Check3D"
        component={asCompositionComponent(Check3D)}
        durationInFrames={DEFAULT_DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={experimentalDims.width}
        height={experimentalDims.height}
      />
      <Composition
        id="Experimental-HexWave3D"
        component={asCompositionComponent(HexWave3D)}
        durationInFrames={DEFAULT_DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={experimentalDims.width}
        height={experimentalDims.height}
        defaultProps={hexWave3DDefaultProps as unknown as Record<string, unknown>}
      />
      <Composition
        id="Experimental-SphereField3D"
        component={asCompositionComponent(SphereField3D)}
        durationInFrames={DEFAULT_DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={experimentalDims.width}
        height={experimentalDims.height}
        defaultProps={sphereField3DDefaultProps as unknown as Record<string, unknown>}
      />
    </>
  );
};
