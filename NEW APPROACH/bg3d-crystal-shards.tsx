// bg3d-crystal-shards.tsx
// Remotion 3D Background: Crystal Shards
// ⚠️  Escrito para ThreeCanvas de @remotion/three — NO usar Canvas de @react-three/fiber
//
// Uso:
//   import { BG3D_CrystalShards } from './bg3d-crystal-shards';
//   <BG3D_CrystalShards lightColorA="#0066ff" metalness={0.9} />
//
// Props:
//   lightColorA/B/C — colores de las tres luces orbitales
//   shardCount      — cantidad de cristales        default 55
//   metalness       — 0 mate → 1 espejo            default 0.9
//   roughness       — 0 pulido → 1 rugoso          default 0.1
//   speed           — velocidad orbita/rotación    default 1.0
//   bloomStrength                                   default 1.4
//
// Packages requeridos:
//   remotion @4.0.x
//   @remotion/three
//   three @0.168.x
//   @react-three/fiber @8.x
//   @react-three/postprocessing @2.x
//   postprocessing @6.x

import React, { useRef, useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { resolveCrystalOpacity, resolveCrystalShardScale } from "../src/remotion/backgrounds/crystalAppearance";

export interface CrystalShardsBGProps {
  lightColorA?: string;
  lightColorB?: string;
  lightColorC?: string;
  shardCount?: number;
  metalness?: number;
  roughness?: number;
  speed?: number;
  bloomStrength?: number;
  opacity?: number;
  sizeMin?: number;
  sizeMax?: number;
  transparentBackground?: boolean;
}

interface ShardData {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  geoIndex: number;
  color: THREE.Color;
  rx: number;
  ry: number;
  rz: number;
  phase: number;
  baseY: number;
}

function buildShards(count: number, sizeMin = 0, sizeMax = 100, seed = 42): ShardData[] {
  // Deterministic pseudo-random so Remotion renders consistently frame-to-frame
  let s = seed;
  const rand = () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };

  return Array.from({ length: count }, () => ({
    position:  [(rand() - 0.5) * 18, (rand() - 0.5) * 11, (rand() - 0.5) * 9] as [number,number,number],
    rotation:  [rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2] as [number,number,number],
    scale:     resolveCrystalShardScale(sizeMin, sizeMax, rand()),
    geoIndex:  Math.floor(rand() * 4),
    color:     new THREE.Color().setHSL(rand(), 0.25, 0.65),
    rx:        (rand() - 0.5) * 0.008,
    ry:        (rand() - 0.5) * 0.013,
    rz:        (rand() - 0.5) * 0.007,
    phase:     rand() * Math.PI * 2,
    baseY:     (rand() - 0.5) * 11,
  }));
}

function ShardsScene({
  lightColorA  = "#0066ff",
  lightColorB  = "#ff2266",
  lightColorC  = "#00ffaa",
  shardCount   = 55,
  metalness    = 0.9,
  roughness    = 0.1,
  speed        = 1.0,
  bloomStrength = 1.4,
  opacity = 1,
  sizeMin = 0,
  sizeMax = 100,
  transparentBackground,
}: CrystalShardsBGProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const lARef    = useRef<THREE.PointLight>(null!);
  const lBRef    = useRef<THREE.PointLight>(null!);
  const lCRef    = useRef<THREE.PointLight>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const { camera } = useThree();

  const geos = useMemo(() => [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.OctahedronGeometry(1, 0),
    new THREE.TetrahedronGeometry(1, 0),
    new THREE.IcosahedronGeometry(1, 1),
  ], []);

  const shards = useMemo(() => buildShards(shardCount, sizeMin, sizeMax), [shardCount, sizeMin, sizeMax]);
  const crystalOpacity = resolveCrystalOpacity(opacity);

  useFrame(() => {
    // Orbit lights
    lARef.current.position.set(
      Math.cos(t * speed * 0.7) * 10,
      Math.sin(t * speed * 0.5) * 6,
      Math.sin(t * speed * 0.4) * 8
    );
    lBRef.current.position.set(
      Math.cos(t * speed * 0.5 + 2.1) * 10,
      Math.sin(t * speed * 0.6 + 1.0) * 6,
      Math.cos(t * speed * 0.3 + 1.0) * 8
    );
    lCRef.current.position.set(
      Math.cos(t * speed * 0.4 + 4.2) * 8,
      Math.sin(t * speed * 0.4 + 2.0) * 5,
      Math.sin(t * speed * 0.5 + 2.0) * 7
    );

    // Rotate + float each shard
    groupRef.current.children.forEach((child, i) => {
      const s = shards[i];
      child.rotation.x += s.rx * speed;
      child.rotation.y += s.ry * speed;
      child.rotation.z += s.rz * speed;
      child.position.y  = s.baseY + Math.sin(t * 0.4 + s.phase) * 0.35;
    });

    // Slow camera drift — critical for correct framing
    camera.position.set(
      Math.sin(t * 0.08) * 2,
      Math.cos(t * 0.06) * 1,
      12
    );
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.4} color="#111133" />
      <pointLight ref={lARef} color={lightColorA} intensity={4} distance={28} />
      <pointLight ref={lBRef} color={lightColorB} intensity={4} distance={28} />
      <pointLight ref={lCRef} color={lightColorC} intensity={3} distance={22} />

      <group ref={groupRef}>
        {shards.map((s, i) => (
          <mesh
            key={i}
            geometry={geos[s.geoIndex]}
            position={s.position}
            rotation={s.rotation}
            scale={s.scale}
          >
            <meshStandardMaterial
              color={s.color}
              metalness={metalness}
              roughness={roughness}
              transparent={crystalOpacity.transparent}
              opacity={crystalOpacity.opacity}
            />
          </mesh>
        ))}
      </group>

      {!transparentBackground && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
            intensity={bloomStrength}
          />
        </EffectComposer>
      )}
    </>
  );
}

export const BG3D_CrystalShards: React.FC<CrystalShardsBGProps> = (props) => {
  const { width, height } = useVideoConfig();

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{
          position: [0, 0, 12],
          fov: 55,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: true,                          // fondo transparente
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        <ShardsScene {...props} />
      </ThreeCanvas>
    </div>
  );
};

export default BG3D_CrystalShards;
