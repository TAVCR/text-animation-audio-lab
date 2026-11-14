import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing';
import * as THREE from 'three';

type HexFieldProps = {
  seed: number | string;
  flowSpeed: number;
  branchDensity: number;
  waveAmplitude: number;
  hexColor: string;
  backgroundColor: string;
  enablePost: boolean;
  timeSec: number;
};

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

const hash2 = (x: number, y: number, seed: number): number => {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 0.6180339) * 43758.5453123;
  return value - Math.floor(value);
};

const valueNoise2D = (x: number, y: number, seed: number): number => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);

  const n00 = hash2(xi, yi, seed);
  const n10 = hash2(xi + 1, yi, seed);
  const n01 = hash2(xi, yi + 1, seed);
  const n11 = hash2(xi + 1, yi + 1, seed);

  const ix0 = n00 + (n10 - n00) * sx;
  const ix1 = n01 + (n11 - n01) * sx;

  return ix0 + (ix1 - ix0) * sy;
};

const fbm2D = (x: number, y: number, seed: number): number => {
  let total = 0;
  let amplitude = 0.5;
  let frequency = 1;

  for (let octave = 0; octave < 4; octave += 1) {
    total += valueNoise2D(x * frequency, y * frequency, seed + octave * 1777) * amplitude;
    frequency *= 2.03;
    amplitude *= 0.5;
  }

  return total;
};

const createHexGeometry = (): THREE.CylinderGeometry => {
  const geometry = new THREE.CylinderGeometry(1, 1, 1, 6, 1, false);
  geometry.rotateX(Math.PI * 0.5);
  geometry.rotateZ(Math.PI / 6);
  return geometry;
};

const HexInstancedField: React.FC<HexFieldProps> = ({
  seed,
  flowSpeed,
  branchDensity,
  waveAmplitude,
  hexColor,
  backgroundColor,
  enablePost,
  timeSec,
}) => {
  const meshRef = React.useRef<THREE.InstancedMesh>(null);
  const scratch = React.useMemo(() => new THREE.Object3D(), []);
  const prevTimeRef = React.useRef<number>(-1);
  const timeRef = React.useRef<number>(timeSec);
  timeRef.current = timeSec;

  const safeDensity = clamp(branchDensity, 0.6, 2.2);
  const safeSpeed = clamp(flowSpeed, 0.08, 2.5);
  const safeAmplitude = clamp(waveAmplitude, 0.1, 2);
  const seedInt = React.useMemo(() => hashSeed(seed), [seed]);

  const layout = React.useMemo(() => {
    const cols = Math.round(84 + safeDensity * 54);
    const rows = Math.round(62 + safeDensity * 38);

    const radius = 0.4;
    const stepX = Math.sqrt(3) * radius;
    const stepY = 1.5 * radius;

    const count = rows * cols;
    const positions = new Float32Array(count * 2);
    const phases = new Float32Array(count);
    const jitter = new Float32Array(count);

    let index = 0;
    for (let row = 0; row < rows; row += 1) {
      const offsetX = (row % 2) * stepX * 0.5;
      for (let col = 0; col < cols; col += 1) {
        positions[index * 2] = (col - cols * 0.5) * stepX + offsetX;
        positions[index * 2 + 1] = (row - rows * 0.34) * stepY;
        phases[index] = hash2(col, row, seedInt) * Math.PI * 2;
        jitter[index] = 0.92 + hash2(col + 91, row + 137, seedInt) * 0.16;
        index += 1;
      }
    }

    return {
      count,
      positions,
      phases,
      jitter,
      slabWidth: cols * stepX * 2.6,
      slabHeight: rows * stepY * 3.2,
    };
  }, [safeDensity, seedInt]);

  const geometry = React.useMemo(() => createHexGeometry(), []);

  React.useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < layout.count; i += 1) {
      const x = layout.positions[i * 2];
      const y = layout.positions[i * 2 + 1];

      scratch.position.set(x, y, 0.13);
      scratch.scale.set(0.915, 0.915, 0.26);
      scratch.rotation.set(0, 0, 0);
      scratch.updateMatrix();

      mesh.setMatrixAt(i, scratch.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  }, [layout.count, layout.positions, scratch]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = timeRef.current;
    if (Math.abs(time - prevTimeRef.current) < 1e-6) return;
    prevTimeRef.current = time;

    const baseHeight = 0.16;
    const waveLift = 0.12 + safeAmplitude * 0.3;
    const noiseScale = 0.22;

    for (let i = 0; i < layout.count; i += 1) {
      const x = layout.positions[i * 2];
      const y = layout.positions[i * 2 + 1];

      const nx = x * noiseScale + time * safeSpeed * 0.5;
      const ny = y * noiseScale - time * safeSpeed * 0.36;

      const nA = fbm2D(nx, ny, seedInt);
      const nB = fbm2D(nx * 0.58 - time * 0.14, ny * 0.58 + time * 0.19, seedInt ^ 0x9e3779b9);
      const mix = nA * 0.72 + nB * 0.28;

      const pulse = 0.5 + 0.5 * Math.sin(layout.phases[i] + time * safeSpeed * 0.75);
      const wave = clamp(mix * 0.86 + pulse * 0.14, 0, 1);
      const raised = Math.pow(clamp((wave - 0.4) / 0.6, 0, 1), 1.2);
      const localLift = baseHeight + waveLift * raised * layout.jitter[i];

      scratch.position.set(x, y, localLift * 0.5);
      scratch.scale.set(0.915, 0.915, localLift);
      scratch.rotation.set(0, 0, 0);
      scratch.updateMatrix();

      mesh.setMatrixAt(i, scratch.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <color attach="background" args={[backgroundColor]} />

      <ambientLight intensity={0.38} />
      <hemisphereLight args={['#ffffff', '#d6d6d6', 0.12]} />
      <directionalLight
        position={[-15, -10, 20]}
        intensity={2.6}
        color={'#ffffff'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-65}
        shadow-camera-right={65}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
        shadow-radius={2}
        shadow-bias={-0.00002}
        shadow-normalBias={0.7}
      />
      <directionalLight position={[9, 8, 12]} intensity={0.4} color={'#ffffff'} />

      <mesh position={[0, 0, -0.19]} receiveShadow>
        <planeGeometry args={[layout.slabWidth, layout.slabHeight]} />
        <meshStandardMaterial color={'#d9d9d9'} roughness={0.95} metalness={0.01} />
      </mesh>

      <instancedMesh ref={meshRef} args={[geometry, undefined, layout.count]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={hexColor}
          roughness={0.58}
          metalness={0.03}
          clearcoat={0.12}
          clearcoatRoughness={0.62}
        />
      </instancedMesh>

      {enablePost ? (
        <EffectComposer multisampling={0} enableNormalPass>
          <SSAO
            samples={16}
            radius={0.04}
            intensity={16}
            luminanceInfluence={0.25}
            worldDistanceThreshold={0.9}
            worldDistanceFalloff={0.18}
            worldProximityThreshold={0.45}
            worldProximityFalloff={0.2}
          />
          <Bloom mipmapBlur intensity={0.015} luminanceThreshold={0.96} luminanceSmoothing={0.2} />
        </EffectComposer>
      ) : null}
    </group>
  );
};

export type HexProceduralGroundProps = {
  seed: number | string;
  flowSpeed: number;
  branchDensity: number;
  waveAmplitude: number;
  hexColor: string;
  backgroundColor: string;
  enablePost?: boolean;
};

export const HexProceduralGround: React.FC<HexProceduralGroundProps> = ({
  seed,
  flowSpeed,
  branchDensity,
  waveAmplitude,
  hexColor,
  backgroundColor,
  enablePost = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeSec = frame / fps;

  return (
    <AbsoluteFill>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 26, position: [0, -19, 8], near: 0.1, far: 300 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(backgroundColor), 1);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.78;
        }}
      >
        <group position={[0, -0.3, 0]} rotation={[0, 0, 0]}>
          <HexInstancedField
            seed={seed}
            flowSpeed={flowSpeed}
            branchDensity={branchDensity}
            waveAmplitude={waveAmplitude}
            hexColor={hexColor}
            backgroundColor={backgroundColor}
            enablePost={enablePost}
            timeSec={timeSec}
          />
        </group>
      </Canvas>
    </AbsoluteFill>
  );
};

export default HexProceduralGround;
