import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Bloom, DepthOfField, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';

type LayerConfig = {
  initialZ: number;
  rows: number;
  cols: number;
  width: number;
  height: number;
  alpha: number;
  brightness: number;
  trailLength: number;
  fallSpeed: number;
  jitter: number;
  tiltX: number;
  tiltY: number;
  seed: number;
};

type MatrixGlyphLayerProps = {
  config: LayerConfig;
  timeSec: number;
  layerIndex: number;
  colorA: THREE.Color;
  colorB: THREE.Color;
  headColor: THREE.Color;
  layerRef: React.MutableRefObject<THREE.Group | null>;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const hashSeed = (seed: number | string): number => {
  const source = String(seed);
  let hash = 2166136261;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
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

const MATRIX_VERTEX_SHADER = `
attribute vec3 aData; // x: col, y: row, z: seed

varying vec2 vUv;
varying float vCol;
varying float vRow;
varying float vSeed;
varying float vLayer;

uniform float uTime;
uniform float uLayer;
uniform float uJitter;

void main() {
  vUv = uv;
  vCol = aData.x;
  vRow = aData.y;
  vSeed = aData.z;
  vLayer = uLayer;

  vec3 transformed = position;
  float sway = sin(uTime * 0.4 + vCol * 0.18 + vSeed * 9.13) * uJitter;
  transformed.x += sway;

  vec4 world = instanceMatrix * vec4(transformed, 1.0);
  vec4 mvPosition = modelViewMatrix * world;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const MATRIX_FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;
varying float vCol;
varying float vRow;
varying float vSeed;
varying float vLayer;

uniform float uTime;
uniform float uRows;
uniform float uTrailLength;
uniform float uTrailDecay;
uniform float uFallSpeed;
uniform float uLayerAlpha;
uniform float uBrightness;
uniform float uSeed;

uniform vec3 uTrailColorA;
uniform vec3 uTrailColorB;
uniform vec3 uHeadColor;

float hash(vec2 p) {
  p = fract(p * vec2(0.1031, 0.1030));
  p += dot(p, p.yx + 33.33);
  return fract((p.x + p.y) * p.x);
}

float glyphMask(vec2 uv, float symbolSeed) {
  vec2 dim = vec2(4.0, 6.0);
  vec2 cell = floor(uv * dim);
  vec2 local = fract(uv * dim);
  float border = step(0.08, local.x) * step(0.08, local.y) * step(local.x, 0.92) * step(local.y, 0.92);

  vec2 key = vec2(symbolSeed * 53.7, symbolSeed * 97.9);
  float bit = step(0.56, hash(cell + key));

  float stem = step(1.2, cell.x) * step(cell.x, 2.8) * step(0.4, cell.y) * step(cell.y, 5.6);
  float barTop = step(0.0, cell.y) * step(cell.y, 1.2) * step(0.45, hash(key + vec2(2.0, 7.0)));
  float barMid = step(2.2, cell.y) * step(cell.y, 3.2) * step(0.42, hash(key + vec2(5.0, 11.0)));
  float barBottom = step(4.5, cell.y) * step(cell.y, 5.7) * step(0.44, hash(key + vec2(9.0, 3.0)));

  float shape = max(bit, stem * 0.75 + max(barTop, max(barMid, barBottom)) * 0.82);
  return clamp(shape * border, 0.0, 1.0);
}

void main() {
  float rowNorm = vRow / max(1.0, (uRows - 1.0));
  float colNoise = hash(vec2(vCol * 0.137 + uSeed, vSeed * 17.3));
  float speed = mix(0.32, 1.25, colNoise) * uFallSpeed;

  float head = fract(1.0 - uTime * speed - colNoise);
  float dist = mod(rowNorm - head + 1.0, 1.0);

  float trail = exp(-dist * uTrailDecay) * step(dist, uTrailLength);
  float headGlow = smoothstep(0.035, 0.0, dist);

  float streamGate = step(0.2, hash(vec2(vCol * 0.53 + floor(uTime * 4.0), vSeed * 23.0)));
  float cellGate = step(0.33, hash(vec2(vCol * 1.9 + floor(uTime * 10.0 + vRow * 0.3), vRow + vSeed * 31.0)));
  float blink = 0.55 + 0.45 * sin(uTime * (3.0 + colNoise * 4.0) + vRow * 0.35 + vSeed * 8.0);

  float symbolFrame = floor(uTime * (6.0 + colNoise * 9.0) + vRow * 0.12);
  float symbolSeed = hash(vec2(vCol * 19.0 + vSeed * 37.0, symbolFrame));
  float glyph = glyphMask(vUv, symbolSeed);

  float intensity = (trail * blink * streamGate * cellGate) + headGlow * 1.9;
  float alpha = intensity * glyph * uLayerAlpha;
  if (alpha < 0.001) discard;

  vec3 trailColor = mix(uTrailColorA, uTrailColorB, hash(vec2(vCol * 0.21 + vSeed, vLayer * 1.7)));
  vec3 color = trailColor * (trail * 0.92 + 0.1);
  color += uHeadColor * (headGlow * 2.15);
  color *= uBrightness;

  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`;

const MatrixGlyphLayer: React.FC<MatrixGlyphLayerProps> = ({
  config,
  timeSec,
  layerIndex,
  colorA,
  colorB,
  headColor,
  layerRef,
}) => {
  const meshRef = React.useRef<THREE.InstancedMesh>(null);
  const scratch = React.useMemo(() => new THREE.Object3D(), []);

  const cellW = config.width / config.cols;
  const cellH = config.height / config.rows;
  const instanceCount = config.rows * config.cols;

  const geometry = React.useMemo(() => {
    const g = new THREE.PlaneGeometry(cellW * 0.86, cellH * 0.9);
    const aData = new Float32Array(instanceCount * 3);

    let index = 0;
    for (let row = 0; row < config.rows; row += 1) {
      for (let col = 0; col < config.cols; col += 1) {
        aData[index * 3] = col;
        aData[index * 3 + 1] = row;
        aData[index * 3 + 2] = ((col * 13.17 + row * 7.11 + config.seed) % 997) / 997;
        index += 1;
      }
    }

    g.setAttribute('aData', new THREE.InstancedBufferAttribute(aData, 3));
    return g;
  }, [cellH, cellW, config.cols, config.rows, config.seed, instanceCount]);

  const uniforms = React.useMemo(
    () => ({
      uTime: { value: 0 },
      uRows: { value: config.rows },
      uTrailLength: { value: config.trailLength },
      uTrailDecay: { value: 24.0 + layerIndex * 2.4 },
      uFallSpeed: { value: config.fallSpeed },
      uLayerAlpha: { value: config.alpha },
      uBrightness: { value: config.brightness },
      uJitter: { value: config.jitter },
      uLayer: { value: layerIndex },
      uSeed: { value: config.seed * 0.01 },
      uTrailColorA: { value: colorA },
      uTrailColorB: { value: colorB },
      uHeadColor: { value: headColor },
    }),
    [
      colorA,
      colorB,
      config.alpha,
      config.brightness,
      config.fallSpeed,
      config.jitter,
      config.rows,
      config.seed,
      config.trailLength,
      headColor,
      layerIndex,
    ]
  );

  React.useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    let index = 0;
    for (let row = 0; row < config.rows; row += 1) {
      const y = config.height * 0.5 - row * cellH - cellH * 0.5;
      for (let col = 0; col < config.cols; col += 1) {
        const x = -config.width * 0.5 + col * cellW + cellW * 0.5;
        scratch.position.set(x, y, 0);
        scratch.rotation.set(0, 0, 0);
        scratch.scale.set(1, 1, 1);
        scratch.updateMatrix();
        mesh.setMatrixAt(index, scratch.matrix);
        index += 1;
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [cellH, cellW, config.cols, config.height, config.rows, config.width, scratch]);

  React.useLayoutEffect(() => {
    uniforms.uTime.value = timeSec;
  }, [timeSec, uniforms]);

  React.useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <group ref={layerRef} rotation={[config.tiltX, config.tiltY, 0]}>
      <instancedMesh ref={meshRef} args={[geometry, undefined, instanceCount]} frustumCulled={false}>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={MATRIX_VERTEX_SHADER}
          fragmentShader={MATRIX_FRAGMENT_SHADER}
          transparent
          depthWrite={false}
          depthTest
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
};

type CameraRigProps = {
  timeSec: number;
  flySpeed: number;
};

const CameraRig: React.FC<CameraRigProps> = ({ timeSec, flySpeed }) => {
  const camera = useThree((state) => state.camera);

  React.useLayoutEffect(() => {
    const z = -timeSec * flySpeed;
    const x = Math.sin(timeSec * 0.22) * 0.62;
    const y = Math.cos(timeSec * 0.18) * 0.34;
    camera.position.set(x, y, z);
    camera.lookAt(
      Math.sin(timeSec * 0.12) * 0.35,
      Math.cos(timeSec * 0.1) * 0.22,
      z - 18
    );
    camera.updateProjectionMatrix();
  }, [camera, flySpeed, timeSec]);

  return null;
};

type LayerRecyclerProps = {
  timeSec: number;
  flySpeed: number;
  layerRefs: Array<React.MutableRefObject<THREE.Group | null>>;
  zPositionsRef: React.MutableRefObject<number[]>;
  recycleSpan: number;
  recycleThreshold: number;
};

const LayerRecycler: React.FC<LayerRecyclerProps> = ({
  timeSec,
  flySpeed,
  layerRefs,
  zPositionsRef,
  recycleSpan,
  recycleThreshold,
}) => {
  const camera = useThree((state) => state.camera);

  useFrame(() => {
    const cameraZ = -timeSec * flySpeed;
    camera.position.z = cameraZ;

    for (let i = 0; i < layerRefs.length; i += 1) {
      const ref = layerRefs[i].current;
      if (!ref) continue;

      let z = zPositionsRef.current[i];
      while (z > cameraZ + recycleThreshold) {
        z -= recycleSpan;
      }
      zPositionsRef.current[i] = z;
      ref.position.z = z;
    }
  });

  return null;
};

export type ModernMatrix3DProps = {
  seed?: number | string;
  flySpeed?: number;
  layers?: number;
};

export const ModernMatrix3D: React.FC<ModernMatrix3DProps> = ({
  seed = 'MODERN-MATRIX-3D-001',
  flySpeed = 8,
  layers = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeSec = frame / fps;

  const safeLayers = Math.round(clamp(layers, 4, 12));
  const safeFlySpeed = clamp(flySpeed, 2.5, 14);
  const seedHash = React.useMemo(() => hashSeed(seed), [seed]);

  const colorA = React.useMemo(() => new THREE.Color('#00ffff'), []);
  const colorB = React.useMemo(() => new THREE.Color('#ff00ff'), []);
  const headColor = React.useMemo(() => new THREE.Color('#f8fbff'), []);

  const layerConfigs = React.useMemo<LayerConfig[]>(() => {
    const rng = createRng(seedHash ^ 0xa53c9d7);
    const configs: LayerConfig[] = [];
    const spacingBase = 14;

    for (let i = 0; i < safeLayers; i += 1) {
      const depthFactor = i / Math.max(1, safeLayers - 1);
      const spacing = spacingBase + depthFactor * 6;
      const initialZ = -10 - i * spacing;

      configs.push({
        initialZ,
        rows: Math.round(26 + depthFactor * 16),
        cols: Math.round(46 + depthFactor * 30),
        width: 36 + depthFactor * 22,
        height: 22 + depthFactor * 14,
        alpha: 0.3 + (1 - depthFactor) * 0.34,
        brightness: 0.95 + (1 - depthFactor) * 0.65,
        trailLength: 0.18 + rng() * 0.26,
        fallSpeed: 0.65 + rng() * 0.8,
        jitter: 0.02 + (1 - depthFactor) * 0.06,
        tiltX: (rng() * 2 - 1) * 0.06,
        tiltY: (rng() * 2 - 1) * 0.08,
        seed: rng() * 1000 + i * 31,
      });
    }

    return configs;
  }, [safeLayers, seedHash]);

  const layerRefs = React.useMemo<Array<React.MutableRefObject<THREE.Group | null>>>(
    () => layerConfigs.map(() => ({ current: null })),
    [layerConfigs]
  );

  const zPositionsRef = React.useRef<number[]>(layerConfigs.map((layer) => layer.initialZ));
  React.useEffect(() => {
    zPositionsRef.current = layerConfigs.map((layer) => layer.initialZ);
  }, [layerConfigs]);

  const recycleSpan = React.useMemo(() => {
    const first = layerConfigs[0]?.initialZ ?? -10;
    const last = layerConfigs[layerConfigs.length - 1]?.initialZ ?? -80;
    return Math.abs(last - first) + 44;
  }, [layerConfigs]);

  return (
    <AbsoluteFill>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#040512'), 1);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
        }}
      >
        <PerspectiveCamera makeDefault fov={42} near={0.1} far={360} position={[0, 0, 0]} />
        <CameraRig timeSec={timeSec} flySpeed={safeFlySpeed} />
        <LayerRecycler
          timeSec={timeSec}
          flySpeed={safeFlySpeed}
          layerRefs={layerRefs}
          zPositionsRef={zPositionsRef}
          recycleSpan={recycleSpan}
          recycleThreshold={8}
        />

        <fog attach="fog" args={['#040512', 24, 260]} />
        <ambientLight intensity={0.12} />
        <pointLight position={[0, 0, -16]} intensity={16} color={'#9de8ff'} distance={48} decay={2} />
        <pointLight position={[3.5, 1.2, -36]} intensity={18} color={'#ff5dff'} distance={52} decay={2} />

        {layerConfigs.map((config, index) => (
          <MatrixGlyphLayer
            key={`matrix-layer-${index}`}
            config={config}
            timeSec={timeSec}
            layerIndex={index}
            colorA={colorA}
            colorB={colorB}
            headColor={headColor}
            layerRef={layerRefs[index]}
          />
        ))}

        <EffectComposer multisampling={0}>
          <Bloom
            intensity={1.55}
            luminanceThreshold={0.18}
            luminanceSmoothing={0.24}
            mipmapBlur
          />
          <DepthOfField
            focusDistance={0.045}
            focalLength={0.055}
            bokehScale={2.4}
            height={720}
          />
        </EffectComposer>
      </Canvas>
    </AbsoluteFill>
  );
};

export default ModernMatrix3D;
