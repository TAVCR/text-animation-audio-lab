import React from 'react';
import { Canvas } from '@react-three/fiber';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

type ParticleSpec = {
  radius: number;
  angle: number;
  drift: number;
  phase: number;
  scale: number;
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

export type HyperTunnelProps = {
  seed: number | string;
  speed: number;
  density: number;
  hue: number;
  saturation: number;
  lightness: number;
  background: string;
};

const TunnelScene: React.FC<HyperTunnelProps & { timeSec: number }> = ({
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
  const specs = React.useMemo<ParticleSpec[]>(() => {
    const safeDensity = clamp(density, 0.25, 2.5);
    const count = Math.round(600 + safeDensity * 1600);
    const rng = createRng(hashSeed(seed) ^ 0x51f15e);

    return Array.from({ length: count }, () => {
      return {
        radius: 1.4 + rng() * 9.2,
        angle: rng() * Math.PI * 2,
        drift: (rng() - 0.5) * 0.9,
        phase: rng(),
        scale: 0.03 + rng() * 0.09,
      };
    });
  }, [density, seed]);

  const dummy = React.useMemo(() => new THREE.Object3D(), []);
  const color = React.useMemo(() => new THREE.Color(`hsl(${hue}, ${Math.round(clamp(saturation, 0, 1) * 100)}%, ${Math.round(clamp(lightness, 0.2, 0.85) * 100)}%)`), [hue, saturation, lightness]);
  const accent = React.useMemo(() => new THREE.Color(`hsl(${(hue + 35) % 360}, ${Math.round(clamp(saturation * 0.9, 0, 1) * 100)}%, ${Math.round(clamp(lightness * 1.1, 0.2, 0.95) * 100)}%)`), [hue, saturation, lightness]);

  React.useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const tunnelDepth = 120;
    const safeSpeed = clamp(speed, 0.1, 4);

    for (let i = 0; i < specs.length; i += 1) {
      const spec = specs[i];
      const motion = (spec.phase + timeSec * safeSpeed * 0.09) % 1;
      const z = (1 - motion) * tunnelDepth - tunnelDepth * 0.5;

      const wobble = timeSec * spec.drift;
      const x = Math.cos(spec.angle + wobble) * spec.radius;
      const y = Math.sin(spec.angle + wobble * 0.9) * spec.radius * 0.56;
      const s = spec.scale * (0.6 + motion * 1.2);

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(s);
      dummy.rotation.set(0, 0, spec.angle + wobble);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);

      const blend = clamp(motion * 1.2, 0, 1);
      const instanceColor = color.clone().lerp(accent, blend);
      mesh.setColorAt(i, instanceColor);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [accent, color, dummy, speed, specs, timeSec]);

  const ringCount = 8;
  const ringColor = `hsl(${(hue + 15) % 360}, ${Math.round(clamp(saturation, 0, 1) * 100)}%, ${Math.round(clamp(lightness * 0.9, 0.1, 0.95) * 100)}%)`;

  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, 18, 70]} />
      <ambientLight intensity={0.32} />
      <pointLight position={[0, 0, 7]} color={accent} intensity={26} distance={32} />
      <pointLight position={[0, 0, -10]} color={color} intensity={18} distance={44} />

      <instancedMesh ref={meshRef} args={[undefined, undefined, specs.length]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial vertexColors transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>

      {Array.from({ length: ringCount }, (_, i) => {
        const u = i / ringCount;
        const z = -18 + u * 36;
        const pulse = Math.sin(timeSec * 0.6 + i * 0.7) * 0.18;
        return (
          <mesh key={i} position={[0, 0, z]} rotation={[Math.PI * 0.5 + pulse, pulse, timeSec * 0.08 + i * 0.22]}>
            <torusGeometry args={[2.4 + i * 0.55, 0.035, 8, 64]} />
            <meshBasicMaterial color={ringColor} transparent opacity={0.24 + (1 - u) * 0.16} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}
    </>
  );
};

export const HyperTunnelBackground: React.FC<HyperTunnelProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeSec = frame / fps;

  return (
    <AbsoluteFill>
      <Canvas
        dpr={[1, 1.6]}
        camera={{ fov: 48, position: [0, 0, 13] }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <TunnelScene {...props} timeSec={timeSec} />
      </Canvas>
    </AbsoluteFill>
  );
};
