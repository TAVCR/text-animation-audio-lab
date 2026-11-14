import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, DepthOfField, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';

const DEFAULT_SPHERE_COUNT = 280;
const WORLD_X = 16;
const WORLD_Y = 9;
const WORLD_Z = 14;

export type SphereField3DProps = {
  primaryColor?: string;
  sphereCount?: number;
};

type MotionData = {
  baseX: Float32Array;
  baseY: Float32Array;
  baseZ: Float32Array;
  driftX: Float32Array;
  driftY: Float32Array;
  phaseA: Float32Array;
  phaseB: Float32Array;
  phaseSpeed: Float32Array;
  radius: Float32Array;
};

const clamp = (v: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, v));
};

const fract = (v: number): number => {
  return v - Math.floor(v);
};

const hash = (v: number): number => {
  return fract(Math.sin(v * 127.1 + 311.7) * 43758.5453123);
};

const wrap = (v: number, min: number, max: number): number => {
  const span = max - min;
  const m = (v - min) % span;
  return (m < 0 ? m + span : m) + min;
};

const buildMotionData = (count: number): MotionData => {
  const baseX = new Float32Array(count);
  const baseY = new Float32Array(count);
  const baseZ = new Float32Array(count);
  const driftX = new Float32Array(count);
  const driftY = new Float32Array(count);
  const phaseA = new Float32Array(count);
  const phaseB = new Float32Array(count);
  const phaseSpeed = new Float32Array(count);
  const radius = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const a = hash(i * 1.17 + 1.0);
    const b = hash(i * 2.43 + 2.0);
    const c = hash(i * 3.91 + 3.0);
    const d = hash(i * 4.73 + 4.0);
    const e = hash(i * 5.37 + 5.0);
    const f = hash(i * 6.19 + 6.0);

    baseX[i] = (a * 2 - 1) * WORLD_X * 0.95;
    baseY[i] = (b * 2 - 1) * WORLD_Y * 0.95;
    baseZ[i] = (c * 2 - 1) * WORLD_Z * 0.65;
    driftX[i] = (d * 2 - 1) * 0.8;
    driftY[i] = (e * 2 - 1) * 0.55;
    phaseA[i] = f * Math.PI * 2;
    phaseB[i] = hash(i * 7.01 + 7.0) * Math.PI * 2;
    phaseSpeed[i] = 0.45 + hash(i * 7.97 + 8.0) * 1.15;
    radius[i] = 0.08 + hash(i * 8.63 + 9.0) * 0.32;
  }

  return { baseX, baseY, baseZ, driftX, driftY, phaseA, phaseB, phaseSpeed, radius };
};

const CameraDrift: React.FC<{ time: number }> = ({ time }) => {
  const camera = useThree((state) => state.camera);
  const timeRef = React.useRef(time);
  timeRef.current = time;

  const applyPose = React.useCallback(
    (t: number) => {
      const x = Math.sin(t * 0.12) * 0.6;
      const y = Math.cos(t * 0.09) * 0.35;
      const z = 15 + Math.cos(t * 0.11) * 0.5;
      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    },
    [camera]
  );

  React.useLayoutEffect(() => {
    applyPose(timeRef.current);
  }, [applyPose]);

  useFrame(() => {
    applyPose(timeRef.current);
  });

  return null;
};

const SphereInstances: React.FC<{ time: number; count: number; primaryColor: string }> = ({
  time,
  count,
  primaryColor,
}) => {
  const meshRef = React.useRef<THREE.InstancedMesh>(null);
  const scratch = React.useMemo(() => new THREE.Object3D(), []);
  const motion = React.useMemo(() => buildMotionData(count), [count]);
  const prevTime = React.useRef(-1);
  const timeRef = React.useRef(time);
  timeRef.current = time;
  const baseColor = React.useMemo(() => new THREE.Color(primaryColor), [primaryColor]);
  const coolNear = React.useMemo(() => new THREE.Color('#cfe0ff'), []);
  const farTint = React.useMemo(() => new THREE.Color('#d9d9df'), []);
  const colorScratch = React.useMemo(() => new THREE.Color(), []);

  React.useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (mesh.instanceColor) {
      mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }

    for (let i = 0; i < count; i += 1) {
      scratch.position.set(motion.baseX[i], motion.baseY[i], motion.baseZ[i]);
      const r = motion.radius[i];
      scratch.scale.set(r, r, r);
      scratch.updateMatrix();
      mesh.setMatrixAt(i, scratch.matrix);

      colorScratch.copy(baseColor).lerp(coolNear, 0.15);
      mesh.setColorAt(i, colorScratch);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [baseColor, colorScratch, coolNear, count, motion, scratch]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    const t = timeRef.current;
    if (Math.abs(t - prevTime.current) < 1e-6) {
      return;
    }
    prevTime.current = t;

    for (let i = 0; i < count; i += 1) {
      const x = wrap(
        motion.baseX[i] + t * motion.driftX[i] + Math.sin(t * motion.phaseSpeed[i] + motion.phaseA[i]) * 0.8,
        -WORLD_X,
        WORLD_X
      );
      const y = wrap(
        motion.baseY[i] + t * motion.driftY[i] + Math.cos(t * (motion.phaseSpeed[i] * 0.75) + motion.phaseB[i]) * 0.6,
        -WORLD_Y,
        WORLD_Y
      );
      const z = motion.baseZ[i] + Math.sin(t * (motion.phaseSpeed[i] * 0.95) + motion.phaseA[i]) * 1.6;

      const depthNorm = clamp((z + WORLD_Z) / (WORLD_Z * 2), 0, 1);
      const pulse = 0.9 + Math.sin(t * (motion.phaseSpeed[i] * 1.15) + motion.phaseB[i]) * 0.12;
      const r = motion.radius[i] * pulse;

      scratch.position.set(x, y, z);
      scratch.scale.set(r, r, r);
      scratch.updateMatrix();
      mesh.setMatrixAt(i, scratch.matrix);

      colorScratch.copy(baseColor);
      colorScratch.lerp(coolNear, 0.22 * (1 - depthNorm));
      colorScratch.lerp(farTint, 0.3 * depthNorm);
      mesh.setColorAt(i, colorScratch);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <sphereGeometry args={[1, 24, 24]} />
      <meshPhysicalMaterial
        color={'#ffffff'}
        roughness={0.18}
        metalness={0.08}
        clearcoat={0.9}
        clearcoatRoughness={0.12}
        reflectivity={0.85}
      />
    </instancedMesh>
  );
};

export const SphereField3D: React.FC<SphereField3DProps> = ({
  primaryColor = '#ffffff',
  sphereCount = DEFAULT_SPHERE_COUNT,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 15], fov: 45, near: 0.1, far: 120 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
        }}
      >
        <CameraDrift time={time} />
        <ambientLight intensity={0.32} />
        <directionalLight
          position={[6, 8, 7]}
          intensity={2.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-bias={-0.00007}
        />
        <pointLight position={[-8, 2, 10]} intensity={24} color={'#e6f1ff'} distance={55} decay={2} />
        <pointLight position={[8, -4, 7]} intensity={14} color={'#ffffff'} distance={45} decay={2} />

        <SphereInstances time={time} count={sphereCount} primaryColor={primaryColor} />

        <EffectComposer multisampling={0}>
          <DepthOfField focusDistance={0.02} focalLength={0.03} bokehScale={1.8} height={360} />
          <Bloom intensity={0.22} luminanceThreshold={0.68} luminanceSmoothing={0.28} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </AbsoluteFill>
  );
};

export default SphereField3D;
