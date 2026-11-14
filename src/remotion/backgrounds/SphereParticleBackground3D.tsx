import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { useFrame } from '@react-three/fiber';
import { ThreeCanvas } from '@remotion/three';
import { Bloom, DepthOfField, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';

type SphereParticleBackground3DProps = {
  count: number;
  opacity: number;
  speed: number;
  sizeMin: number;
  sizeMax: number;
  blur: number;
  colorA: string;
  colorB: string;
  backdropColor: string;
  backdropOpacity: number;
};

type SimulationState = {
  posX: Float32Array;
  posY: Float32Array;
  posZ: Float32Array;
  velX: Float32Array;
  velY: Float32Array;
  velZ: Float32Array;
  radius: Float32Array;
  colorMix: Float32Array;
  phaseA: Float32Array;
  phaseB: Float32Array;
  freq: Float32Array;
};

const clamp = (v: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, v));
};

const fract = (v: number): number => {
  return v - Math.floor(v);
};

const seeded = (seed: number): number => {
  return fract(Math.sin(seed * 12.9898 + 78.233) * 43758.5453);
};

const relaxOverlaps = (
  posX: Float32Array,
  posY: Float32Array,
  posZ: Float32Array,
  radius: Float32Array,
  count: number
): void => {
  for (let pass = 0; pass < 4; pass += 1) {
    for (let i = 0; i < count; i += 1) {
      for (let j = i + 1; j < count; j += 1) {
        const dx = posX[j] - posX[i];
        const dy = posY[j] - posY[i];
        const dz = posZ[j] - posZ[i];
        const minDist = radius[i] + radius[j];
        const minDistSq = minDist * minDist;
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq >= minDistSq) continue;

        const dist = Math.sqrt(Math.max(1e-8, distSq));
        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;
        const overlap = minDist - dist;
        const correction = overlap * 0.52;

        posX[i] -= nx * correction;
        posY[i] -= ny * correction;
        posZ[i] -= nz * correction;
        posX[j] += nx * correction;
        posY[j] += ny * correction;
        posZ[j] += nz * correction;
      }
    }
  }
};

const initializeSimulation = (
  sim: SimulationState,
  count: number,
  worldX: number,
  worldY: number,
  worldZ: number,
  minRadius: number,
  maxRadius: number
): void => {
  for (let i = 0; i < count; i += 1) {
    const p = i + 1;
    const a = seeded(p * 1.17);
    const b = seeded(p * 2.23);
    const c = seeded(p * 3.19);
    const d = seeded(p * 4.91);
    const e = seeded(p * 5.71);
    const f = seeded(p * 6.31);
    const g = seeded(p * 7.43);
    const h = seeded(p * 8.57);
    const q = seeded(p * 9.61);
    const w = seeded(p * 10.71);

    const r = minRadius + a * (maxRadius - minRadius);
    const safeX = Math.max(0.05, worldX - r);
    const safeY = Math.max(0.05, worldY - r);
    const safeZ = Math.max(0.05, worldZ * 0.92 - r);

    sim.radius[i] = r;
    sim.colorMix[i] = b;
    sim.phaseA[i] = c * Math.PI * 2;
    sim.phaseB[i] = d * Math.PI * 2;
    sim.freq[i] = 0.55 + e * 1.2;

    sim.posX[i] = (f * 2 - 1) * safeX;
    sim.posY[i] = (g * 2 - 1) * safeY;
    sim.posZ[i] = (h * 2 - 1) * safeZ;

    const theta = q * Math.PI * 2;
    const phi = w * Math.PI - Math.PI * 0.5;
    const velMag = 0.45 + seeded(p * 11.89) * 0.95;
    sim.velX[i] = Math.cos(theta) * Math.cos(phi) * velMag;
    sim.velY[i] = Math.sin(theta) * Math.cos(phi) * velMag;
    sim.velZ[i] = Math.sin(phi) * velMag * 0.65;
  }

  relaxOverlaps(sim.posX, sim.posY, sim.posZ, sim.radius, count);
};

const SphereInstances: React.FC<{
  count: number;
  time: number;
  opacity: number;
  colorA: string;
  colorB: string;
  worldX: number;
  worldY: number;
  worldZ: number;
  minRadius: number;
  maxRadius: number;
  geometrySegments: number;
}> = ({ count, time, opacity, colorA, colorB, worldX, worldY, worldZ, minRadius, maxRadius, geometrySegments }) => {
  const meshRef = React.useRef<THREE.InstancedMesh>(null);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);
  const prevTimeRef = React.useRef(-1);
  const timeRef = React.useRef(time);
  timeRef.current = time;

  const sim = React.useMemo<SimulationState>(() => {
    const state: SimulationState = {
      posX: new Float32Array(count),
      posY: new Float32Array(count),
      posZ: new Float32Array(count),
      velX: new Float32Array(count),
      velY: new Float32Array(count),
      velZ: new Float32Array(count),
      radius: new Float32Array(count),
      colorMix: new Float32Array(count),
      phaseA: new Float32Array(count),
      phaseB: new Float32Array(count),
      freq: new Float32Array(count),
    };
    initializeSimulation(state, count, worldX, worldY, worldZ, minRadius, maxRadius);
    return state;
  }, [count, worldX, worldY, worldZ, minRadius, maxRadius]);

  const colorAObj = React.useMemo(() => new THREE.Color(colorA), [colorA]);
  const colorBObj = React.useMemo(() => new THREE.Color(colorB), [colorB]);
  const nearTint = React.useMemo(() => new THREE.Color('#ffffff'), []);
  const farTint = React.useMemo(() => new THREE.Color('#c8d8ff'), []);
  const colorScratch = React.useMemo(() => new THREE.Color(), []);

  React.useLayoutEffect(() => {
    prevTimeRef.current = -1;
    initializeSimulation(sim, count, worldX, worldY, worldZ, minRadius, maxRadius);
  }, [count, maxRadius, minRadius, sim, worldX, worldY, worldZ]);

  React.useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    if (mesh.instanceColor) {
      mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }

    for (let i = 0; i < count; i += 1) {
      const depthNorm = clamp((sim.posZ[i] + worldZ) / (worldZ * 2), 0, 1);
      dummy.position.set(sim.posX[i], sim.posY[i], sim.posZ[i]);
      dummy.scale.set(sim.radius[i], sim.radius[i], sim.radius[i]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      colorScratch.lerpColors(colorAObj, colorBObj, sim.colorMix[i]);
      colorScratch.lerp(nearTint, (1 - depthNorm) * 0.2);
      colorScratch.lerp(farTint, depthNorm * 0.24);
      mesh.setColorAt(i, colorScratch);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [colorAObj, colorBObj, colorScratch, count, dummy, farTint, nearTint, sim, worldZ]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = timeRef.current;
    if (prevTimeRef.current < 0) {
      prevTimeRef.current = t;
      return;
    }

    let dt = t - prevTimeRef.current;
    if (!Number.isFinite(dt) || dt <= 0) {
      if (t < prevTimeRef.current - 1e-6) {
        initializeSimulation(sim, count, worldX, worldY, worldZ, minRadius, maxRadius);
      }
      prevTimeRef.current = t;
      return;
    }

    dt = clamp(dt, 1 / 180, 0.08);
    prevTimeRef.current = t;

    const boundX = worldX;
    const boundY = worldY;
    const boundZ = worldZ * 0.92;
    const subSteps = Math.min(4, Math.max(1, Math.ceil(dt / (1 / 90))));
    const stepDt = dt / subSteps;
    const frameStart = t - dt;

    for (let sub = 0; sub < subSteps; sub += 1) {
      const stepTime = frameStart + stepDt * (sub + 1);

      for (let i = 0; i < count; i += 1) {
        sim.velX[i] += Math.sin(stepTime * sim.freq[i] + sim.phaseA[i]) * 0.12 * stepDt;
        sim.velY[i] += Math.cos(stepTime * sim.freq[i] * 0.91 + sim.phaseB[i]) * 0.1 * stepDt;
        sim.velZ[i] += Math.sin(stepTime * sim.freq[i] * 1.13 + sim.phaseA[i] * 0.7) * 0.08 * stepDt;

        sim.velX[i] *= 0.998;
        sim.velY[i] *= 0.998;
        sim.velZ[i] *= 0.998;

        const speedSq = sim.velX[i] * sim.velX[i] + sim.velY[i] * sim.velY[i] + sim.velZ[i] * sim.velZ[i];
        const maxSpeed = 3.4;
        if (speedSq > maxSpeed * maxSpeed) {
          const k = maxSpeed / Math.sqrt(speedSq);
          sim.velX[i] *= k;
          sim.velY[i] *= k;
          sim.velZ[i] *= k;
        }

        sim.posX[i] += sim.velX[i] * stepDt;
        sim.posY[i] += sim.velY[i] * stepDt;
        sim.posZ[i] += sim.velZ[i] * stepDt;

        const rNow = sim.radius[i];
        const minX = -boundX + rNow;
        const maxX = boundX - rNow;
        const minY = -boundY + rNow;
        const maxY = boundY - rNow;
        const minZ = -boundZ + rNow;
        const maxZ = boundZ - rNow;

        if (sim.posX[i] < minX) {
          sim.posX[i] = minX;
          sim.velX[i] = Math.abs(sim.velX[i]) * (0.78 + seeded((i + 1) * 17.1 + stepTime * 1.7) * 0.25);
        } else if (sim.posX[i] > maxX) {
          sim.posX[i] = maxX;
          sim.velX[i] = -Math.abs(sim.velX[i]) * (0.78 + seeded((i + 1) * 17.9 + stepTime * 1.7) * 0.25);
        }

        if (sim.posY[i] < minY) {
          sim.posY[i] = minY;
          sim.velY[i] = Math.abs(sim.velY[i]) * (0.78 + seeded((i + 1) * 23.1 + stepTime * 1.3) * 0.25);
        } else if (sim.posY[i] > maxY) {
          sim.posY[i] = maxY;
          sim.velY[i] = -Math.abs(sim.velY[i]) * (0.78 + seeded((i + 1) * 23.9 + stepTime * 1.3) * 0.25);
        }

        if (sim.posZ[i] < minZ) {
          sim.posZ[i] = minZ;
          sim.velZ[i] = Math.abs(sim.velZ[i]) * (0.74 + seeded((i + 1) * 31.7 + stepTime * 1.1) * 0.22);
        } else if (sim.posZ[i] > maxZ) {
          sim.posZ[i] = maxZ;
          sim.velZ[i] = -Math.abs(sim.velZ[i]) * (0.74 + seeded((i + 1) * 32.9 + stepTime * 1.1) * 0.22);
        }
      }

      for (let i = 0; i < count; i += 1) {
        for (let j = i + 1; j < count; j += 1) {
          const dx = sim.posX[j] - sim.posX[i];
          const dy = sim.posY[j] - sim.posY[i];
          const dz = sim.posZ[j] - sim.posZ[i];
          const minDist = sim.radius[i] + sim.radius[j];
          const minDistSq = minDist * minDist;
          const distSq = dx * dx + dy * dy + dz * dz;
          if (distSq >= minDistSq) continue;

          const dist = Math.sqrt(Math.max(distSq, 1e-8));
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;

          const rI = Math.max(0.01, sim.radius[i]);
          const rJ = Math.max(0.01, sim.radius[j]);
          const mI = rI * rI * rI;
          const mJ = rJ * rJ * rJ;
          const invMI = 1 / mI;
          const invMJ = 1 / mJ;

          const overlap = minDist - dist;
          const correction = overlap + 1e-4;
          const weightI = invMI / (invMI + invMJ);
          const weightJ = invMJ / (invMI + invMJ);
          sim.posX[i] -= nx * correction * weightI;
          sim.posY[i] -= ny * correction * weightI;
          sim.posZ[i] -= nz * correction * weightI;
          sim.posX[j] += nx * correction * weightJ;
          sim.posY[j] += ny * correction * weightJ;
          sim.posZ[j] += nz * correction * weightJ;

          const rvx = sim.velX[j] - sim.velX[i];
          const rvy = sim.velY[j] - sim.velY[i];
          const rvz = sim.velZ[j] - sim.velZ[i];
          const relAlongNormal = rvx * nx + rvy * ny + rvz * nz;
          if (relAlongNormal < 0) {
            const restitution = 0.86;
            const impulse = -((1 + restitution) * relAlongNormal) / (invMI + invMJ);
            sim.velX[i] -= impulse * invMI * nx;
            sim.velY[i] -= impulse * invMI * ny;
            sim.velZ[i] -= impulse * invMI * nz;
            sim.velX[j] += impulse * invMJ * nx;
            sim.velY[j] += impulse * invMJ * ny;
            sim.velZ[j] += impulse * invMJ * nz;
          }

          let tx = -ny;
          let ty = nx;
          let tz = 0;
          let tLen = Math.hypot(tx, ty, tz);
          if (tLen < 1e-5) {
            tx = 0;
            ty = -nz;
            tz = ny;
            tLen = Math.hypot(tx, ty, tz);
          }
          tx /= tLen;
          ty /= tLen;
          tz /= tLen;

          const tick = Math.floor(stepTime * 60);
          const kickSeed = seeded((i + 1) * 19.13 + (j + 1) * 27.97 + tick * 0.117);
          const kick = (kickSeed - 0.5) * 0.42;
          sim.velX[i] += tx * kick * invMI;
          sim.velY[i] += ty * kick * invMI;
          sim.velZ[i] += tz * kick * invMI;
          sim.velX[j] -= tx * kick * invMJ;
          sim.velY[j] -= ty * kick * invMJ;
          sim.velZ[j] -= tz * kick * invMJ;
        }
      }
    }

    for (let i = 0; i < count; i += 1) {
      const depthNorm = clamp((sim.posZ[i] + worldZ) / (worldZ * 2), 0, 1);

      dummy.position.set(sim.posX[i], sim.posY[i], sim.posZ[i]);
      dummy.scale.set(sim.radius[i], sim.radius[i], sim.radius[i]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      colorScratch.lerpColors(colorAObj, colorBObj, sim.colorMix[i]);
      colorScratch.lerp(nearTint, (1 - depthNorm) * 0.2);
      colorScratch.lerp(farTint, depthNorm * 0.24);
      mesh.setColorAt(i, colorScratch);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <sphereGeometry args={[1, geometrySegments, geometrySegments]} />
      <meshPhysicalMaterial
        color={'#ffffff'}
        transparent
        opacity={opacity}
        roughness={0.12}
        metalness={0.04}
        clearcoat={1}
        clearcoatRoughness={0.08}
        reflectivity={1}
        envMapIntensity={1.35}
      />
    </instancedMesh>
  );
};

export const SphereParticleBackground3D: React.FC<SphereParticleBackground3DProps> = ({
  count,
  opacity,
  speed,
  sizeMin,
  sizeMax,
  blur,
  colorA,
  colorB,
  backdropColor,
  backdropOpacity,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const safeSpeed = Math.max(0.05, speed);
  const safeOpacity = clamp(opacity, 0.05, 1);
  const safeBlur = Math.max(0, blur);
  const safeCount = Math.max(1, Math.min(560, Math.floor(count)));
  const aspect = width / Math.max(1, height);
  const cameraFov = 45;
  const cameraZ = 25;
  const worldZ = 12;
  const depthSpan = worldZ * 0.92;
  const halfFovRad = THREE.MathUtils.degToRad(cameraFov * 0.5);
  const tanHalfFov = Math.tan(halfFovRad);
  const frustumHalfHeightNear = tanHalfFov * cameraZ;
  const frustumHalfHeightFar = tanHalfFov * (cameraZ + depthSpan);
  const worldY = (frustumHalfHeightNear + (frustumHalfHeightFar - frustumHalfHeightNear) * 0.72) * 1.06;
  const worldX = worldY * aspect * 1.06;
  const safeMinPx = Math.max(0.2, Math.min(sizeMin, sizeMax));
  const safeMaxPx = Math.max(safeMinPx + 0.2, Math.max(sizeMin, sizeMax));
  const minRadius = clamp(safeMinPx * 0.038, 0.03, 1.2);
  const maxRadius = clamp(safeMaxPx * 0.038, minRadius + 0.01, 2.3);
  const useHiResQuality = width >= 3000 || height >= 3000;
  const geometrySegments = useHiResQuality ? 42 : 30;
  const shadowMapSize = useHiResQuality ? 4096 : 2048;
  const composerMultisampling = useHiResQuality ? 4 : 8;
  const dofHeight = Math.round(clamp(height * 0.75, 480, 1600));
  const time = (frame / fps) * safeSpeed;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', backgroundColor: 'transparent' }}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows
        camera={{ position: [0, 0.4, cameraZ], fov: cameraFov, near: 0.1, far: 120 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance', precision: 'highp' }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.22;
        }}
      >
        <ambientLight intensity={0.72 + clamp(backdropOpacity, 0, 0.8) * 0.28} color={backdropColor} />
        <directionalLight
          position={[7, 10, 8]}
          intensity={3.4}
          castShadow
          shadow-mapSize-width={shadowMapSize}
          shadow-mapSize-height={shadowMapSize}
          shadow-camera-near={1}
          shadow-camera-far={64}
          shadow-camera-left={-26}
          shadow-camera-right={26}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-bias={-0.00008}
        />
        <pointLight position={[-10, 4, 9]} intensity={36} color={colorA} distance={70} decay={2} />
        <pointLight position={[10, -5, 10]} intensity={24} color={colorB} distance={65} decay={2} />

        <mesh position={[0, 0, -14]}>
          <planeGeometry args={[worldX * 3.2, worldY * 3.2]} />
          <meshBasicMaterial
            color={backdropColor}
            transparent
            opacity={clamp(backdropOpacity, 0, 0.8) * 0.2}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>

        <SphereInstances
          count={safeCount}
          time={time}
          opacity={safeOpacity}
          colorA={colorA}
          colorB={colorB}
          worldX={worldX}
          worldY={worldY}
          worldZ={worldZ}
          minRadius={minRadius}
          maxRadius={maxRadius}
          geometrySegments={geometrySegments}
        />

        <EffectComposer multisampling={composerMultisampling}>
          <DepthOfField
            focusDistance={0.018}
            focalLength={0.028}
            bokehScale={0.15 + safeBlur * 0.14}
            height={dofHeight}
          />
          <Bloom
            intensity={0.08 + safeBlur * 0.03}
            luminanceThreshold={0.68}
            luminanceSmoothing={0.28}
            mipmapBlur
          />
        </EffectComposer>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export default SphereParticleBackground3D;
