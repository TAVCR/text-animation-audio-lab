import React from 'react';
import { Canvas } from '@react-three/fiber';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

const GRID_VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const GRID_FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;

uniform vec3 uGridColor;
uniform float uGridScaleX;
uniform float uGridScaleY;
uniform float uMinorThickness;
uniform float uTime;
uniform float uScrollSpeed;
uniform float uGridBrightness;
uniform float uOpacity;

float lineMask(float coord, float scale, float thickness, float aaMul) {
  float scaled = coord * scale;
  float dist = abs(fract(scaled) - 0.5);
  float aa = clamp(fwidth(scaled) * 4.6 * aaMul, 0.008, 0.06);
  return 1.0 - smoothstep(thickness, thickness + aa, dist);
}

void main() {
  float yScroll = vUv.y + uTime * uScrollSpeed;

  float topStab = smoothstep(0.80, 1.0, vUv.y);
  float thickness = mix(uMinorThickness, uMinorThickness * 2.2, topStab);
  float aaMul = mix(1.0, 3.1, topStab);

  float minorX = lineMask(vUv.x, uGridScaleX, thickness, aaMul);
  float minorY = lineMask(yScroll, uGridScaleY, thickness, aaMul);
  float minorGrid = max(minorX, minorY);

  // Blur region near horizon to hide shimmering/flicker.
  float topBlur = smoothstep(0.72, 0.985, vUv.y);
  float blurOffset = (fwidth(yScroll) + fwidth(vUv.x)) * 7.5;
  float yBlurA = lineMask(yScroll - blurOffset, uGridScaleY, thickness * 1.04, aaMul * 1.2);
  float yBlurB = lineMask(yScroll + blurOffset, uGridScaleY, thickness * 1.04, aaMul * 1.2);
  float xBlurA = lineMask(vUv.x - blurOffset, uGridScaleX, thickness * 1.04, aaMul * 1.2);
  float xBlurB = lineMask(vUv.x + blurOffset, uGridScaleX, thickness * 1.04, aaMul * 1.2);
  float blurredGrid = max(max(xBlurA, xBlurB), max(yBlurA, yBlurB));
  minorGrid = mix(minorGrid, max(minorGrid, blurredGrid), topBlur);

  float perspectiveFade = pow(1.0 - vUv.y, 1.08);
  float horizonFade = smoothstep(0.03, 0.18, vUv.y);
  float topCut = 1.0 - smoothstep(0.97, 1.0, vUv.y);
  float mask = perspectiveFade * horizonFade * topCut;

  float lineAlpha = clamp(minorGrid * mask * 2.15, 0.0, 1.0) * clamp(uOpacity, 0.0, 1.0);
  vec3 color = uGridColor * uGridBrightness;
  gl_FragColor = vec4(color, lineAlpha);
}
`;

type RetroGridTiltSceneProps = {
  timeSec: number;
  tiltRadians: number;
  gridColor: string;
  backgroundColor: string;
  scrollSpeed: number;
  gridSize: number;
  gridOpacity: number;
  aspectRatio: number;
};

const RetroGridTiltScene: React.FC<RetroGridTiltSceneProps> = ({
  timeSec,
  tiltRadians,
  gridColor,
  backgroundColor,
  scrollSpeed,
  gridSize,
  gridOpacity,
  aspectRatio,
}) => {
  const gridMaterialRef = React.useRef<THREE.ShaderMaterial>(null);
  const gridColorThree = React.useMemo(() => new THREE.Color(gridColor), [gridColor]);
  const safeGridSize = THREE.MathUtils.clamp(gridSize, 8, 64);
  const densityFactor = 22 / safeGridSize;
  const gridScaleX = 15.5 * densityFactor;
  const gridScaleY = 24.0 * densityFactor;
  const minorThickness = 0.0215 / Math.sqrt(densityFactor);

  const uniforms = React.useMemo(() => {
    return {
      uGridColor: { value: gridColorThree },
      uGridScaleX: { value: gridScaleX },
      uGridScaleY: { value: gridScaleY },
      uMinorThickness: { value: minorThickness },
      uTime: { value: 0 },
      uScrollSpeed: { value: scrollSpeed },
      uGridBrightness: { value: 3.05 },
      uOpacity: { value: THREE.MathUtils.clamp(gridOpacity, 0, 1) },
    };
  }, [gridColorThree, gridOpacity, gridScaleX, gridScaleY, minorThickness, scrollSpeed]);

  React.useLayoutEffect(() => {
    const material = gridMaterialRef.current;
    if (!material) return;
    material.uniforms.uGridColor.value = gridColorThree;
    material.uniforms.uGridScaleX.value = gridScaleX;
    material.uniforms.uGridScaleY.value = gridScaleY;
    material.uniforms.uMinorThickness.value = minorThickness;
    material.uniforms.uTime.value = timeSec;
    material.uniforms.uScrollSpeed.value = scrollSpeed;
    material.uniforms.uOpacity.value = THREE.MathUtils.clamp(gridOpacity, 0, 1);
  }, [gridColorThree, gridOpacity, gridScaleX, gridScaleY, minorThickness, scrollSpeed, timeSec]);

  const safeAspect = Math.max(0.2, aspectRatio);
  const yLift = safeAspect >= 1 ? 0 : (1 - safeAspect) * 2.2;
  const zPush = safeAspect >= 1 ? 0 : (1 - safeAspect) * 10;

  return (
    <>
      <color attach="background" args={[backgroundColor]} />

      <group position={[0, -7.2 + yLift, -118 + zPush]} rotation={[tiltRadians, 0, 0]}>
        <mesh>
          <planeGeometry args={[320, 620, 1, 1]} />
          <meshBasicMaterial color={backgroundColor} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <planeGeometry args={[320, 620, 1, 1]} />
          <shaderMaterial
            ref={gridMaterialRef}
            uniforms={uniforms}
            vertexShader={GRID_VERTEX_SHADER}
            fragmentShader={GRID_FRAGMENT_SHADER}
            transparent
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
  );
};

export type RetroGridTiltProps = {
  seed: number | string;
  startTiltDeg: number;
  endTiltDeg: number;
  settleDurationSec: number;
  scrollSpeed: number;
  gridColor: string;
  backgroundColor: string;
  gridSize?: number;
  gridOpacity?: number;
};

export const RetroGridTiltBackground: React.FC<RetroGridTiltProps> = ({
  endTiltDeg,
  scrollSpeed,
  gridColor,
  backgroundColor,
  gridSize = 22,
  gridOpacity = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { width, height } = useVideoConfig();
  const timeSec = frame / fps;
  const tiltRadians = THREE.MathUtils.degToRad(endTiltDeg);
  const aspectRatio = width / Math.max(1, height);

  return (
    <AbsoluteFill>
      <Canvas
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
        dpr={2}
        camera={{ fov: 52, position: [0, 7.4, 18.5] }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <RetroGridTiltScene
          timeSec={timeSec}
          tiltRadians={tiltRadians}
          gridColor={gridColor}
          backgroundColor={backgroundColor}
          scrollSpeed={scrollSpeed}
          gridSize={gridSize}
          gridOpacity={gridOpacity}
          aspectRatio={aspectRatio}
        />
      </Canvas>
    </AbsoluteFill>
  );
};
