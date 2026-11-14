import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Canvas, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

type LayerSpec = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  seed: number;
  density: number;
  opacity: number;
  noiseScale: number;
  drift: [number, number];
  contrast: number;
  filament: number;
  brightness: number;
  glow: number;
  layer: number;
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

const VOLUMETRIC_VERTEX_SHADER = `
varying vec2 vUv;
varying float vLayer;
varying vec2 vDrift;
varying float vContrast;
varying float vFilament;
varying float vBrightness;
varying float vGlow;

uniform float uTime;
uniform float uLayer;
uniform float uTurbulence;
uniform vec2 uDrift;
uniform float uContrast;
uniform float uFilament;
uniform float uBrightness;
uniform float uGlow;

void main() {
  vUv = uv;
  vLayer = uLayer;
  vDrift = uDrift;
  vContrast = uContrast;
  vFilament = uFilament;
  vBrightness = uBrightness;
  vGlow = uGlow;

  vec3 pos = position;
  float waveA = sin((position.x * 1.35) + uTime * 0.09 + uLayer * 6.2831 + uDrift.x * 3.0);
  float waveB = cos((position.y * 1.1) - uTime * 0.07 + uLayer * 4.7123 + uDrift.y * 2.6);
  float waveC = sin((position.x + position.y) * 0.8 + uTime * 0.05 + uLayer * 2.9);

  float flow = 0.12 + vGlow * 0.08;
  pos.z += (waveA + waveB + waveC * 0.8) * (0.12 + vFilament * 0.05) * uTurbulence;
  pos.x += sin(position.y * 0.9 + uTime * (0.05 + flow) + uLayer * 3.0) * 0.06 * uTurbulence;
  pos.y += cos(position.x * 0.8 - uTime * (0.04 + flow * 0.8) + uLayer * 2.3) * 0.06 * uTurbulence;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const VOLUMETRIC_FRAGMENT_SHADER = `
varying vec2 vUv;
varying float vLayer;
varying vec2 vDrift;
varying float vContrast;
varying float vFilament;
varying float vBrightness;
varying float vGlow;

uniform float uTime;
uniform float uSeed;
uniform float uDensity;
uniform float uOpacity;
uniform float uNoiseScale;

uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 6; i++) {
    value += amplitude * noise(p * frequency);
    frequency *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

float ridged(vec2 p) {
  float n = fbm(p);
  return 1.0 - abs(n * 2.0 - 1.0);
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  float radius = length(uv * vec2(1.0, 0.78));
  float edgeMask = 1.0 - smoothstep(0.18, 1.15, radius);

  vec2 p = uv * uNoiseScale;
  p += vec2(
    uTime * (0.016 + vLayer * 0.008 + vDrift.x * 0.01),
    -uTime * (0.012 + vLayer * 0.006 + vDrift.y * 0.01)
  );
  p += vec2(uSeed * 0.13, uSeed * 0.17);

  float nA = fbm(p + vec2(0.0, vLayer * 2.7));
  float nB = fbm(p * 1.95 - vec2(uTime * 0.026, -uTime * 0.018));
  float warp = fbm((p + vec2(nB * 1.8, nA * 1.35)) * 1.35);
  float ridge = pow(clamp(ridged(p * 1.55 + warp * 0.9), 0.0, 1.0), 1.3 + vFilament * 2.6);
  float detail = fbm(p * 3.4 + vec2(warp * 2.2, ridge * 1.7));

  float baseGas = nA * 0.62 + nB * 0.44 + warp * 0.36 + detail * 0.26;
  float filamentField = ridge * (0.45 + 0.9 * vFilament);
  float gas = smoothstep(0.32, 0.96, baseGas + filamentField - 0.22 + (vContrast - 1.0) * 0.25);
  gas *= edgeMask;
  gas *= (0.38 + 0.62 * pow(edgeMask, 1.4));

  float core = exp(-abs(vLayer - 0.5) * 3.4);
  float glow = pow(clamp(gas + filamentField * 0.25, 0.0, 1.0), 1.4) * (1.05 + core * 0.85 + vGlow * 0.7);

  vec3 color = mix(uColorA, uColorB, clamp(nA * 0.7 + detail * 0.2 + vLayer * 0.25, 0.0, 1.0));
  color = mix(color, uColorC, clamp(ridge * 1.1 + warp * 0.25, 0.0, 1.0));
  color *= (0.18 + glow * (1.5 + vBrightness * 0.8));

  float alpha = clamp(gas * uDensity * uOpacity * (0.72 + core * 0.38 + vGlow * 0.22), 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
`;

type VolumetricLayerProps = {
  spec: LayerSpec;
  timeSec: number;
  turbulence: number;
  colorA: THREE.Color;
  colorB: THREE.Color;
  colorC: THREE.Color;
};

const VolumetricLayer: React.FC<VolumetricLayerProps> = ({
  spec,
  timeSec,
  turbulence,
  colorA,
  colorB,
  colorC,
}) => {
  const uniforms = React.useMemo(
    () => ({
      uTime: { value: 0 },
      uLayer: { value: spec.layer },
      uSeed: { value: spec.seed },
      uDensity: { value: spec.density },
      uOpacity: { value: spec.opacity },
      uNoiseScale: { value: spec.noiseScale },
      uTurbulence: { value: turbulence },
      uDrift: { value: new THREE.Vector2(spec.drift[0], spec.drift[1]) },
      uContrast: { value: spec.contrast },
      uFilament: { value: spec.filament },
      uBrightness: { value: spec.brightness },
      uGlow: { value: spec.glow },
      uColorA: { value: colorA },
      uColorB: { value: colorB },
      uColorC: { value: colorC },
    }),
    [
      colorA,
      colorB,
      colorC,
      spec.brightness,
      spec.contrast,
      spec.density,
      spec.drift,
      spec.filament,
      spec.glow,
      spec.layer,
      spec.noiseScale,
      spec.opacity,
      spec.seed,
      turbulence,
    ]
  );

  React.useLayoutEffect(() => {
    uniforms.uTime.value = timeSec;
    uniforms.uDensity.value = spec.density;
    uniforms.uOpacity.value = spec.opacity;
    uniforms.uTurbulence.value = turbulence;
    uniforms.uContrast.value = spec.contrast;
    uniforms.uFilament.value = spec.filament;
    uniforms.uBrightness.value = spec.brightness;
    uniforms.uGlow.value = spec.glow;
  }, [spec.brightness, spec.contrast, spec.density, spec.filament, spec.glow, spec.opacity, timeSec, turbulence, uniforms]);

  return (
    <mesh position={spec.position} rotation={spec.rotation} scale={spec.scale}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={VOLUMETRIC_VERTEX_SHADER}
        fragmentShader={VOLUMETRIC_FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        depthTest
        blending={spec.glow > 0.55 ? THREE.AdditiveBlending : THREE.NormalBlending}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
};

const CameraFlight: React.FC<{ timeSec: number }> = ({ timeSec }) => {
  const camera = useThree((state) => state.camera);

  React.useLayoutEffect(() => {
    const x = Math.sin(timeSec * 0.042) * 1.9;
    const y = Math.cos(timeSec * 0.034) * 1.1 + Math.sin(timeSec * 0.018) * 0.35;
    const z = 14.4 + Math.sin(timeSec * 0.025) * 1.7;
    camera.position.set(x, y, z);
    camera.lookAt(
      Math.sin(timeSec * 0.02) * 0.8,
      Math.cos(timeSec * 0.017) * 0.45,
      -8 + Math.sin(timeSec * 0.013) * 1.2
    );
    camera.updateProjectionMatrix();
  }, [camera, timeSec]);

  return null;
};

export type ThreeDNebulaProps = {
  seed?: number | string;
  speed?: number;
  density?: number;
  turbulence?: number;
  opacity?: number;
  layerCount?: number;
};

export const ThreeDNebula: React.FC<ThreeDNebulaProps> = ({
  seed = 'NEBULA-EXPERIMENT-001',
  speed = 1,
  density = 1,
  turbulence = 1,
  opacity = 0.7,
  layerCount = 84,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const safeSpeed = clamp(speed, 0.1, 2.8);
  const safeDensity = clamp(density, 0.45, 2.4);
  const safeTurbulence = clamp(turbulence, 0.2, 2.4);
  const safeOpacity = clamp(opacity, 0.15, 1);
  const safeLayerCount = Math.round(clamp(layerCount, 42, 140));

  const timeSec = (frame / fps) * safeSpeed;

  const colorA = React.useMemo(() => new THREE.Color('#4b0082'), []);
  const colorB = React.useMemo(() => new THREE.Color('#ff00ff'), []);
  const colorC = React.useMemo(() => new THREE.Color('#0000ff'), []);

  const layers = React.useMemo<LayerSpec[]>(() => {
    const rng = createRng(hashSeed(seed) ^ 0x9e3779b9);
    const items: LayerSpec[] = [];

    for (let i = 0; i < safeLayerCount; i += 1) {
      const p = i / Math.max(1, safeLayerCount - 1);
      const depth = -24 + p * 48;
      const spread = 6.5 + Math.abs(p - 0.5) * 12;
      const sx = 16 + rng() * 15;
      const sy = 9 + rng() * 10;
      const jitterX = (rng() * 2 - 1) * spread;
      const jitterY = (rng() * 2 - 1) * spread * 0.6;
      const glowBand = Math.exp(-Math.pow((p - 0.5) * 2.25, 2.0));
      const glow = clamp(glowBand * (0.35 + rng() * 0.7), 0, 1);
      const contrast = 0.9 + rng() * 0.5;
      const filament = 0.25 + rng() * 0.9;
      const brightness = 0.45 + rng() * 0.95;

      items.push({
        position: [jitterX, jitterY, depth],
        rotation: [
          (rng() * 2 - 1) * 0.24,
          (rng() * 2 - 1) * 0.24,
          (rng() * 2 - 1) * Math.PI,
        ],
        scale: [sx, sy, 1],
        seed: rng() * 1000,
        density: (0.62 + rng() * 0.78) * safeDensity,
        opacity: (0.05 + rng() * 0.14) * safeOpacity,
        noiseScale: 2.1 + rng() * 2.8,
        drift: [rng() * 2 - 1, rng() * 2 - 1],
        contrast,
        filament,
        brightness,
        glow,
        layer: p,
      });
    }

    items.sort((a, b) => a.position[2] - b.position[2]);
    return items;
  }, [safeDensity, safeLayerCount, safeOpacity, seed]);

  return (
    <AbsoluteFill>
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#04020a'), 1);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.24;
        }}
      >
        <PerspectiveCamera makeDefault fov={42} near={0.1} far={160} position={[0, 0, 14.5]} />
        <CameraFlight timeSec={timeSec} />

        <fog attach="fog" args={['#04020a', 12, 78]} />

        <ambientLight intensity={0.04} />
        <pointLight position={[0.7, 0.9, -2.2]} intensity={34} distance={34} decay={2} color={'#ff00ff'} />
        <pointLight position={[-3.4, -1.2, 1.2]} intensity={28} distance={30} decay={2} color={'#4b0082'} />
        <pointLight position={[3.8, 1.1, 2.6]} intensity={26} distance={32} decay={2} color={'#0000ff'} />
        <pointLight position={[0.2, -2.4, 4.8]} intensity={18} distance={26} decay={2} color={'#7a3cff'} />

        <mesh visible={false}>
          <sphereGeometry args={[36, 24, 24]} />
          <meshBasicMaterial />
        </mesh>

        {layers.map((spec, index) => (
          <VolumetricLayer
            key={`${index}-${spec.seed}`}
            spec={spec}
            timeSec={timeSec}
            turbulence={safeTurbulence}
            colorA={colorA}
            colorB={colorB}
            colorC={colorC}
          />
        ))}

        <EffectComposer multisampling={0}>
          <Bloom
            intensity={2.05}
            luminanceThreshold={0.02}
            luminanceSmoothing={0.22}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.24} darkness={0.76} />
        </EffectComposer>
      </Canvas>
    </AbsoluteFill>
  );
};

export default ThreeDNebula;
