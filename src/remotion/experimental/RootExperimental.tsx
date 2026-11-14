import React from 'react';
import { Composition } from 'remotion';
import { REMOTION_FPS } from '@/lib/videoConfig';
import {
  HyperTunnelBackground,
  type HyperTunnelProps,
} from './backgrounds/HyperTunnelBackground';
import {
  NeuralLatticeBackground,
  type NeuralLatticeProps,
} from './backgrounds/NeuralLatticeBackground';
import {
  QuantumFluxShaderBackground,
  type QuantumFluxShaderProps,
} from './backgrounds/QuantumFluxShaderBackground';
import {
  HexReliefWaveBackground,
  type HexReliefWaveProps,
} from './backgrounds/HexReliefWaveBackground';
import {
  RetroGridTiltBackground,
  type RetroGridTiltProps,
} from './backgrounds/RetroGridTiltBackground';
import {
  HexProceduralGround,
  type HexProceduralGroundProps,
} from '@/components/HexProceduralGround';
import {
  ThreeDNebula,
  type ThreeDNebulaProps,
} from '@/components/experimental/3DNebula';
import {
  Nebula2D,
  type Nebula2DProps,
} from '@/components/experimental/Nebula2D';
import {
  ModernMatrix3D,
  type ModernMatrix3DProps,
} from '@/components/experimental/ModernMatrix3D';

const HyperTunnelLoose = HyperTunnelBackground as unknown as React.ComponentType<Record<string, unknown>>;
const NeuralLatticeLoose = NeuralLatticeBackground as unknown as React.ComponentType<Record<string, unknown>>;
const QuantumFluxShaderLoose = QuantumFluxShaderBackground as unknown as React.ComponentType<Record<string, unknown>>;
const HexReliefWaveLoose = HexReliefWaveBackground as unknown as React.ComponentType<Record<string, unknown>>;
const HexProceduralGroundLoose = HexProceduralGround as unknown as React.ComponentType<Record<string, unknown>>;
const ThreeDNebulaLoose = ThreeDNebula as unknown as React.ComponentType<Record<string, unknown>>;
const Nebula2DLoose = Nebula2D as unknown as React.ComponentType<Record<string, unknown>>;
const ModernMatrix3DLoose = ModernMatrix3D as unknown as React.ComponentType<Record<string, unknown>>;

const DURATION_IN_FRAMES = 180;
const WIDTH = 1920;
const HEIGHT = 1080;

const hyperTunnelDefaults: HyperTunnelProps = {
  seed: 'LAB-HYPER-001',
  speed: 1.25,
  density: 1.1,
  hue: 196,
  saturation: 0.94,
  lightness: 0.62,
  background: '#05080f',
};

const neuralLatticeDefaults: NeuralLatticeProps = {
  seed: 'LAB-LATTICE-001',
  speed: 1,
  density: 0.95,
  hue: 168,
  saturation: 0.88,
  lightness: 0.58,
  background: '#04070d',
};

const quantumFluxShaderDefaults: QuantumFluxShaderProps = {
  seed: 'LAB-QUANTUM-001',
  speed: 1.2,
  complexity: 1.9,
  hue: 214,
  saturation: 0.92,
  lightness: 0.58,
  background: '#02050b',
};

const hexReliefWaveDefaults: HexReliefWaveProps = {
  seed: 'LAB-HEX-001',
  speed: 0.6,
  density: 1.05,
  amplitude: 0.55,
  baseColor: '#fbfbfb',
  background: '#f4f4f4',
};

const hexProceduralGroundDefaults: HexProceduralGroundProps = {
  seed: 'LAB-HEX-PRO-001',
  flowSpeed: 0.9,
  branchDensity: 1.15,
  waveAmplitude: 1.1,
  hexColor: '#ffffff',
  backgroundColor: '#f1f1f1',
  enablePost: true,
};

const nebulaDefaults: ThreeDNebulaProps = {
  seed: 'LAB-NEBULA-001',
  speed: 1,
  density: 1.05,
  turbulence: 1.2,
  opacity: 0.74,
  layerCount: 60,
};

const nebula2dDefaults: Nebula2DProps = {
  seed: 'LAB-NEBULA-2D-001',
  speed: 1,
  density: 1.2,
  glow: 1.25,
  contrast: 1.2,
  vignette: 0.62,
};

const modernMatrix3DDefaults: ModernMatrix3DProps = {
  seed: 'LAB-MODERN-MATRIX-001',
  flySpeed: 8,
  layers: 8,
};

const retroGridTiltDefaults: RetroGridTiltProps = {
  seed: 'LAB-RETRO-GRID-001',
  startTiltDeg: -58,
  endTiltDeg: -86,
  settleDurationSec: 2.2,
  scrollSpeed: 0.028,
  gridColor: '#1f6bff',
  backgroundColor: '#000000',
};

const RetroGridTiltLoose = RetroGridTiltBackground as unknown as React.ComponentType<Record<string, unknown>>;

export const RemotionExperimentalRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Exp-HyperTunnel"
        component={HyperTunnelLoose}
        durationInFrames={DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={hyperTunnelDefaults as unknown as Record<string, unknown>}
      />
      <Composition
        id="Exp-NeuralLattice"
        component={NeuralLatticeLoose}
        durationInFrames={DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={neuralLatticeDefaults as unknown as Record<string, unknown>}
      />
      <Composition
        id="Exp-QuantumFluxShader"
        component={QuantumFluxShaderLoose}
        durationInFrames={DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={quantumFluxShaderDefaults as unknown as Record<string, unknown>}
      />
      <Composition
        id="Exp-HexReliefWave"
        component={HexReliefWaveLoose}
        durationInFrames={DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={hexReliefWaveDefaults as unknown as Record<string, unknown>}
      />
      <Composition
        id="Exp-HexProceduralGround"
        component={HexProceduralGroundLoose}
        durationInFrames={DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={hexProceduralGroundDefaults as unknown as Record<string, unknown>}
      />
      <Composition
        id="Exp-3DNebula"
        component={ThreeDNebulaLoose}
        durationInFrames={DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={nebulaDefaults as unknown as Record<string, unknown>}
      />
      <Composition
        id="Exp-Nebula2D"
        component={Nebula2DLoose}
        durationInFrames={DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={nebula2dDefaults as unknown as Record<string, unknown>}
      />
      <Composition
        id="Exp-ModernMatrix3D"
        component={ModernMatrix3DLoose}
        durationInFrames={DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={modernMatrix3DDefaults as unknown as Record<string, unknown>}
      />
      <Composition
        id="Exp-RetroGridTilt"
        component={RetroGridTiltLoose}
        durationInFrames={DURATION_IN_FRAMES}
        fps={REMOTION_FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={retroGridTiltDefaults as unknown as Record<string, unknown>}
      />
    </>
  );
};
