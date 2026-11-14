import React from 'react';
import { Canvas } from '@react-three/fiber';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

type CellSpec = {
  x: number;
  y: number;
  phase: number;
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

const createRng = (seed: number): (() => number) => {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export type NeuralLatticeProps = {
  seed: number | string;
  speed: number;
  density: number;
  hue: number;
  saturation: number;
  lightness: number;
  background: string;
};

const LatticeScene: React.FC<NeuralLatticeProps & { timeSec: number }> = ({
  seed,
  speed,
  density,
  hue,
  saturation,
  lightness,
  background,
  timeSec,
}) => {
  const meshRef = React.useRef<THREE.InstancedMesh>(null);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);

  const safeDensity = clamp(density, 0.2, 2);
  const countX = Math.round(34 + safeDensity * 58);
  const countY = Math.round(20 + safeDensity * 34);

  const specs = React.useMemo<CellSpec[]>(() => {
    const rng = createRng(hashSeed(seed) ^ 0x9963e5);
    const width = 26;
    const height = 14;

    const cells: CellSpec[] = [];

    for (let yi = 0; yi < countY; yi += 1) {
      for (let xi = 0; xi < countX; xi += 1) {
        const x = (xi / Math.max(1, countX - 1) - 0.5) * width;
        const y = (yi / Math.max(1, countY - 1) - 0.5) * height;
        cells.push({
          x,
          y,
          phase: rng() * Math.PI * 2,
        });
      }
    }

    return cells;
  }, [countX, countY, seed]);

  const baseColor = React.useMemo(() => {
    return new THREE.Color(
      `hsl(${hue}, ${Math.round(clamp(saturation, 0, 1) * 100)}%, ${Math.round(clamp(lightness, 0.2, 0.85) * 100)}%)`
    );
  }, [hue, saturation, lightness]);

  const crestColor = React.useMemo(() => {
    return new THREE.Color(
      `hsl(${(hue + 42) % 360}, ${Math.round(clamp(saturation * 0.92, 0, 1) * 100)}%, ${Math.round(clamp(lightness * 1.16, 0.2, 0.95) * 100)}%)`
    );
  }, [hue, saturation, lightness]);

  React.useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const safeSpeed = clamp(speed, 0.15, 4);
    const amp = 0.42 + safeDensity * 0.92;

    for (let i = 0; i < specs.length; i += 1) {
      const cell = specs[i];
      const waveA = Math.sin(cell.x * 0.76 + timeSec * safeSpeed * 1.8 + cell.phase);
      const waveB = Math.cos(cell.y * 1.12 - timeSec * safeSpeed * 1.45 + cell.phase * 0.8);
      const wave = waveA * 0.68 + waveB * 0.42;

      const z = wave * amp;
      const sy = 0.12 + (wave + 1.3) * 0.36;
      const sx = 0.11 + (0.5 + wave * 0.2) * 0.22;
      const sz = 0.08 + (0.5 + wave * 0.25) * 0.18;

      dummy.position.set(cell.x, cell.y, z);
      dummy.scale.set(sx, sy, sz);
      dummy.rotation.set(0, 0, wave * 0.16);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      const mix = clamp((wave + 1) / 2, 0, 1);
      const c = baseColor.clone().lerp(crestColor, mix);
      mesh.setColorAt(i, c);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [baseColor, crestColor, dummy, safeDensity, speed, specs, timeSec]);

  const glowColor = `hsl(${(hue + 20) % 360}, ${Math.round(clamp(saturation * 0.7, 0, 1) * 100)}%, ${Math.round(clamp(lightness * 0.8, 0.1, 0.95) * 100)}%)`;

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 16, 54]} />
      <ambientLight intensity={0.36} />
      <directionalLight position={[5, 8, 9]} intensity={1.25} color={crestColor} />
      <pointLight position={[-8, -3, 8]} intensity={18} distance={36} color={baseColor} />

      <instancedMesh ref={meshRef} args={[undefined, undefined, specs.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          vertexColors
          roughness={0.28}
          metalness={0.62}
          emissive={glowColor}
          emissiveIntensity={0.18}
        />
      </instancedMesh>

      <mesh position={[0, 0, -2.6]} rotation={[-Math.PI * 0.5, 0, 0]}>
        <planeGeometry args={[36, 20, 1, 1]} />
        <meshBasicMaterial color={background} transparent opacity={0.75} />
      </mesh>
    </>
  );
};

export const NeuralLatticeBackground: React.FC<NeuralLatticeProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeSec = frame / fps;

  return (
    <AbsoluteFill>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ fov: 52, position: [0, 0, 17] }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <LatticeScene {...props} timeSec={timeSec} />
      </Canvas>
    </AbsoluteFill>
  );
};
