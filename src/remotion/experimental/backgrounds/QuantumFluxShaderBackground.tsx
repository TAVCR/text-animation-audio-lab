import React from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { fragmentShader, vertexShader } from './QuantumFlux.shaders';

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const hashSeed = (seed: number | string): number => {
  const input = String(seed);
  let hash = 2166136261;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

export type QuantumFluxShaderProps = {
  seed: number | string;
  speed: number;
  complexity: number;
  hue: number;
  saturation: number;
  lightness: number;
  background: string;
};

const QuantumFluxShaderScene: React.FC<QuantumFluxShaderProps & { time: number; width: number; height: number }> = ({
  seed,
  speed,
  complexity,
  hue,
  saturation,
  lightness,
  background,
  time,
  width,
  height,
}) => {
  const materialRef = React.useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const uniforms = React.useMemo(() => {
    return {
      uTime: { value: 0 },
      uSpeed: { value: 1 },
      uComplexity: { value: 1 },
      uSeed: { value: 1 },
      uHue: { value: 0.6 },
      uSaturation: { value: 0.9 },
      uLightness: { value: 0.6 },
      uResolution: { value: new THREE.Vector2(width, height) },
    };
  }, [height, width]);

  uniforms.uTime.value = time;
  uniforms.uSpeed.value = clamp(speed, 0.1, 4);
  uniforms.uComplexity.value = clamp(complexity, 0.5, 3);
  uniforms.uSeed.value = hashSeed(seed) % 100000;
  uniforms.uHue.value = ((hue % 360) + 360) / 360;
  uniforms.uSaturation.value = clamp(saturation, 0, 1);
  uniforms.uLightness.value = clamp(lightness, 0.1, 0.9);
  uniforms.uResolution.value.set(width, height);

  return (
    <>
      <color attach="background" args={[background]} />
      <mesh scale={[viewport.width, viewport.height, 1]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent={false}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    </>
  );
};

export const QuantumFluxShaderBackground: React.FC<QuantumFluxShaderProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = frame / fps;

  return (
    <AbsoluteFill>
      <Canvas
        orthographic
        camera={{ position: [0, 0, 5], zoom: 100 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <QuantumFluxShaderScene {...props} time={time} width={width} height={height} />
      </Canvas>
    </AbsoluteFill>
  );
};
