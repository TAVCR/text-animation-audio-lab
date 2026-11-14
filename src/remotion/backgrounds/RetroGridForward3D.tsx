import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { GRID_FRAGMENT_SHADER, GRID_VERTEX_SHADER } from './RetroGrid.shaders';

type RetroGridForward3DProps = {
  color: string;
  speed: number;
  flowDirection: 'forward' | 'backward';
  sizeMin: number;
  sizeMax: number;
  lineThickness: number;
  angle: number;
  opacity: number;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const RetroGridForwardScene: React.FC<{
  time: number;
  gridColor: string;
  speed: number;
  flowDirection: 'forward' | 'backward';
  gridSize: number;
  lineThickness: number;
  angle: number;
  gridOpacity: number;
}> = ({ time, gridColor, speed, flowDirection, gridSize, lineThickness, angle, gridOpacity }) => {
  const gridMaterialRef = React.useRef<THREE.ShaderMaterial>(null);
  const uniformsRef = React.useRef({
    uGridColor: { value: new THREE.Color(gridColor) },
    uGridScaleX: { value: 1 },
    uGridScaleY: { value: 1 },
    uMinorThickness: { value: 0.02 },
    uTime: { value: 0 },
    uScrollSpeed: { value: 0.1 },
    uGridBrightness: { value: 3.05 },
    uOpacity: { value: 1 },
    uThicknessMultiplier: { value: 1 },
  });
  const gridColorThree = React.useMemo(() => new THREE.Color(gridColor), [gridColor]);
  const safeGridSize = THREE.MathUtils.clamp(gridSize, 8, 64);
  const densityFactor = 22 / safeGridSize;
  const gridScaleX = 15.5 * densityFactor;
  const gridScaleY = 24.0 * densityFactor;
  const minorThickness = 0.0215 / Math.sqrt(densityFactor);
  const speedBase = 0.0012 + Math.pow(clamp(speed, 0.01, 3), 1.45) * 0.07;
  const directionSign = flowDirection === 'forward' ? -1 : 1;
  const scrollSpeed = speedBase * directionSign;
  const tilt = THREE.MathUtils.degToRad(clamp(angle, 35, 88));

  React.useLayoutEffect(() => {
    const material = gridMaterialRef.current;
    if (!material) return;
    material.uniforms.uGridColor.value = gridColorThree;
    material.uniforms.uGridScaleX.value = gridScaleX;
    material.uniforms.uGridScaleY.value = gridScaleY;
    material.uniforms.uMinorThickness.value = minorThickness;
    material.uniforms.uTime.value = time;
    material.uniforms.uScrollSpeed.value = scrollSpeed;
    material.uniforms.uOpacity.value = THREE.MathUtils.clamp(gridOpacity, 0, 1);
    material.uniforms.uThicknessMultiplier.value = clamp(lineThickness, 0.4, 3);
  }, [gridColorThree, gridOpacity, gridScaleX, gridScaleY, lineThickness, minorThickness, scrollSpeed, time]);

  return (
    <>
      <group position={[0, 6.9, -118]} rotation={[tilt, 0, 0]}>
        <mesh position={[0, 0.02, 0]}>
          <planeGeometry args={[380, 760, 1, 1]} />
          <shaderMaterial
            ref={gridMaterialRef}
            uniforms={uniformsRef.current}
            vertexShader={GRID_VERTEX_SHADER}
            fragmentShader={GRID_FRAGMENT_SHADER}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </>
  );
};

export const RetroGridForward3D: React.FC<RetroGridForward3DProps> = ({
  color,
  speed,
  flowDirection,
  sizeMin,
  sizeMax,
  lineThickness,
  angle,
  opacity,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const time = frame / fps;
  const gridSize = clamp((sizeMin + sizeMax) * 0.5, 8, 64);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', backgroundColor: 'transparent' }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ fov: 52, position: [0, 7.4, 18.5], near: 0.1, far: 1400 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', precision: 'highp' }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0);
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          transform: 'scaleY(-1)',
        }}
      >
        <RetroGridForwardScene
          time={time}
          gridColor={color}
          speed={speed}
          flowDirection={flowDirection}
          gridSize={gridSize}
          lineThickness={lineThickness}
          angle={angle}
          gridOpacity={opacity}
        />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
