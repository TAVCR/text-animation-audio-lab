import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, DepthOfField, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';

const GRID_SIZE = 50;
const INSTANCE_COUNT = GRID_SIZE * GRID_SIZE;
const HEX_RADIUS = 0.36;
const BASE_HEIGHT = 0.36;

export type HexWave3DProps = {
  primaryColor: string;
};

type LayoutData = {
  xz: Float32Array;
  distanceFromCenter: Float32Array;
};

const clamp = (v: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, v));
};

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / Math.max(1e-6, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const buildHexLayout = (): LayoutData => {
  const xz = new Float32Array(INSTANCE_COUNT * 2);
  const distanceFromCenter = new Float32Array(INSTANCE_COUNT);

  const xStep = Math.sqrt(3) * HEX_RADIUS;
  const zStep = 1.5 * HEX_RADIUS;
  const center = (GRID_SIZE - 1) * 0.5;

  let i = 0;
  for (let row = 0; row < GRID_SIZE; row += 1) {
    const rowOffset = (row % 2) * xStep * 0.5;
    for (let col = 0; col < GRID_SIZE; col += 1) {
      const x = (col - center) * xStep + rowOffset;
      const z = (row - center) * zStep;
      xz[i * 2] = x;
      xz[i * 2 + 1] = z;
      distanceFromCenter[i] = Math.hypot(x, z);
      i += 1;
    }
  }

  return { xz, distanceFromCenter };
};

const CameraRig: React.FC<{ time: number }> = ({ time }) => {
  const camera = useThree((state) => state.camera);
  const timeRef = React.useRef(time);
  timeRef.current = time;

  const applyCameraPose = React.useCallback(
    (t: number) => {
      const swingX = Math.sin(t * 0.22) * 0.95 + Math.sin(t * 0.09) * 0.35;
      const swingY = Math.cos(t * 0.18) * 0.28;
      const swingZ = Math.cos(t * 0.2) * 0.82;
      camera.position.set(swingX, 9 + swingY, 13 + swingZ);
      camera.lookAt(0, 0.1, 0);
      camera.updateProjectionMatrix();
    },
    [camera]
  );

  React.useLayoutEffect(() => {
    applyCameraPose(timeRef.current);
  }, [applyCameraPose]);

  useFrame(() => {
    applyCameraPose(timeRef.current);
  });

  return null;
};

const HexField: React.FC<{ primaryColor: string; time: number }> = ({ primaryColor, time }) => {
  const meshRef = React.useRef<THREE.InstancedMesh>(null);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);
  const layout = React.useMemo(() => buildHexLayout(), []);
  const prevTime = React.useRef(-1);
  const timeRef = React.useRef(time);
  timeRef.current = time;
  const coolTint = React.useMemo(() => new THREE.Color('#d9e5f6'), []);
  const lowColor = React.useMemo(() => new THREE.Color(primaryColor).lerp(coolTint, 0.42), [coolTint, primaryColor]);
  const highColor = React.useMemo(() => new THREE.Color(primaryColor).lerp(new THREE.Color('#ffffff'), 0.32), [primaryColor]);
  const dofFogColor = React.useMemo(() => new THREE.Color('#eef3f9'), []);
  const colorScratch = React.useMemo(() => new THREE.Color(), []);

  React.useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (mesh.instanceColor) {
      mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }

    for (let i = 0; i < INSTANCE_COUNT; i += 1) {
      const x = layout.xz[i * 2];
      const z = layout.xz[i * 2 + 1];
      dummy.position.set(x, BASE_HEIGHT * 0.5, z);
      dummy.scale.set(1, BASE_HEIGHT, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      colorScratch.lerpColors(lowColor, highColor, 0.45);
      mesh.setColorAt(i, colorScratch);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [colorScratch, dummy, highColor, layout, lowColor]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = timeRef.current;
    if (Math.abs(t - prevTime.current) < 1e-6) return;
    prevTime.current = t;

    const camX = Math.sin(t * 0.22) * 0.95 + Math.sin(t * 0.09) * 0.35;
    const camY = 9 + Math.cos(t * 0.18) * 0.28;
    const camZ = 13 + Math.cos(t * 0.2) * 0.82;

    for (let i = 0; i < INSTANCE_COUNT; i += 1) {
      const x = layout.xz[i * 2];
      const z = layout.xz[i * 2 + 1];
      const d = layout.distanceFromCenter[i];

      const radialWave = Math.sin(d * 1.65 - t * 2.35);
      const diagonalWave = Math.sin((x + z) * 0.92 + t * 1.55);
      const micro = Math.sin(x * 0.55 + t * 0.85) * Math.cos(z * 0.48 - t * 1.1);

      const displacement = radialWave * 0.2 + diagonalWave * 0.08 + micro * 0.05;
      const height = clamp(BASE_HEIGHT + displacement, 0.14, 0.82);
      const hNorm = smoothstep(0.14, 0.82, height);
      const cameraDist = Math.hypot(x - camX, height * 0.5 - camY, z - camZ);
      const focusBand = Math.exp(-Math.pow((cameraDist - 15.2) / 6.5, 2));
      const dofSoftness = 1 - focusBand;

      dummy.position.set(x, height * 0.5, z);
      dummy.scale.set(1, height, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      colorScratch.lerpColors(lowColor, highColor, hNorm);
      colorScratch.lerp(dofFogColor, dofSoftness * 0.28);
      mesh.setColorAt(i, colorScratch);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, INSTANCE_COUNT]} castShadow receiveShadow>
      <cylinderGeometry args={[HEX_RADIUS, HEX_RADIUS, 1, 6, 1, false]} />
      <meshStandardMaterial color={'#ffffff'} roughness={0.2} metalness={0.1} />
    </instancedMesh>
  );
};

export const HexWave3D: React.FC<HexWave3DProps> = ({ primaryColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <Canvas
        shadows
        camera={{ position: [0, 9, 13], fov: 42, near: 0.1, far: 200 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
        }}
      >
        <CameraRig time={time} />
        <ambientLight intensity={0.24} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={2.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={60}
          shadow-camera-left={-16}
          shadow-camera-right={16}
          shadow-camera-top={16}
          shadow-camera-bottom={-16}
          shadow-bias={-0.00008}
        />
        <HexField primaryColor={primaryColor} time={time} />
        <EffectComposer multisampling={0}>
          <DepthOfField
            focusDistance={0.018}
            focalLength={0.024}
            bokehScale={2.2}
            height={360}
          />
          <Bloom
            intensity={0.1}
            luminanceThreshold={0.87}
            luminanceSmoothing={0.3}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </AbsoluteFill>
  );
};

export default HexWave3D;
