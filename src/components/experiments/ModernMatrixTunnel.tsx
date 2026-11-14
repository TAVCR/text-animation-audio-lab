import React from 'react';
import { registerRoot, Composition, AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';

type FrameTunnelProps = {
  timeSec: number;
  flySpeed: number;
  seed: number | string;
};

type CodeSurfaceSpec = {
  width: number;
  height: number;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  opacity: number;
  headOpacity: number;
  speed: number;
  repeatX: number;
  repeatY: number;
};

type CodeTunnelProps = {
  timeSec: number;
  seed: number | string;
};

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;
const DURATION_IN_FRAMES = 180;
const COMPOSITION_ID = 'ModernMatrixTunnel';

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

const addRoundedRect = (path: THREE.Shape | THREE.Path, width: number, height: number, radius: number) => {
  const hw = width * 0.5;
  const hh = height * 0.5;
  const r = Math.min(radius, hw, hh);

  path.moveTo(-hw + r, -hh);
  path.lineTo(hw - r, -hh);
  path.absarc(hw - r, -hh + r, r, -Math.PI * 0.5, 0);
  path.lineTo(hw, hh - r);
  path.absarc(hw - r, hh - r, r, 0, Math.PI * 0.5);
  path.lineTo(-hw + r, hh);
  path.absarc(-hw + r, hh - r, r, Math.PI * 0.5, Math.PI);
  path.lineTo(-hw, -hh + r);
  path.absarc(-hw + r, -hh + r, r, Math.PI, Math.PI * 1.5);
};

const createRoundedFrameGeometry = (outerW: number, outerH: number, thickness: number, radius: number) => {
  const shape = new THREE.Shape();
  addRoundedRect(shape, outerW, outerH, radius);

  const inner = new THREE.Path();
  addRoundedRect(inner, outerW - thickness * 2, outerH - thickness * 2, Math.max(0.0001, radius - thickness));
  shape.holes.push(inner);

  const geometry = new THREE.ShapeGeometry(shape, 24);
  geometry.computeVertexNormals();
  return geometry;
};

const DIGIT_PATTERNS: string[] = [
  '01110|10001|10011|10101|11001|10001|01110',
  '00100|01100|00100|00100|00100|00100|01110',
  '01110|10001|00001|00010|00100|01000|11111',
  '11110|00001|00001|01110|00001|00001|11110',
  '00010|00110|01010|10010|11111|00010|00010',
  '11111|10000|11110|00001|00001|10001|01110',
  '00110|01000|10000|11110|10001|10001|01110',
  '11111|00001|00010|00100|01000|10000|10000',
  '01110|10001|10001|01110|10001|10001|01110',
  '01110|10001|10001|01111|00001|00010|01100',
  '00100|01110|10101|00100|00100|11111|00100',
  '00000|00100|01110|11111|01110|00100|00000',
];

const patternPixel = (pattern: string, x: number, y: number): number => {
  const rows = pattern.split('|');
  if (y < 0 || y >= rows.length) return 0;
  const row = rows[y];
  if (x < 0 || x >= row.length) return 0;
  return row[x] === '1' ? 1 : 0;
};

const createDigitalRainTextures = (seed: number | string) => {
  const width = 256;
  const height = 1024;
  const cellW = 8;
  const cellH = 14;
  const cols = Math.floor(width / cellW);
  const rows = Math.floor(height / cellH);

  const trailData = new Uint8Array(width * height * 4);
  const headData = new Uint8Array(width * height * 4);

  const rng = createRng(hashSeed(seed) ^ 0x53f1bba7);

  for (let col = 0; col < cols; col += 1) {
    const startRow = Math.floor(rng() * rows);
    const trailLength = Math.floor(10 + rng() * 24);
    const symbolOffset = Math.floor(rng() * DIGIT_PATTERNS.length);

    for (let row = 0; row < rows; row += 1) {
      const dist = (row - startRow + rows) % rows;
      if (dist >= trailLength) continue;

      const strength = Math.pow(1 - dist / trailLength, 1.3);
      const pattern = DIGIT_PATTERNS[(symbolOffset + row * 3 + col) % DIGIT_PATTERNS.length];

      for (let py = 0; py < cellH; py += 1) {
        for (let px = 0; px < cellW; px += 1) {
          const gx = Math.floor((px / cellW) * 5);
          const gy = Math.floor((py / cellH) * 7);
          if (patternPixel(pattern, gx, gy) < 1) continue;

          const x = col * cellW + px;
          const y = row * cellH + py;
          const idx = (y * width + x) * 4;

          const pulse = 0.72 + rng() * 0.28;
          const alphaTrail = Math.floor(clamp(strength * pulse, 0, 1) * 255);
          trailData[idx] = 255;
          trailData[idx + 1] = 255;
          trailData[idx + 2] = 255;
          trailData[idx + 3] = Math.max(trailData[idx + 3], alphaTrail);

          if (dist === 0) {
            const alphaHead = Math.floor(220 + rng() * 35);
            headData[idx] = 255;
            headData[idx + 1] = 255;
            headData[idx + 2] = 255;
            headData[idx + 3] = Math.max(headData[idx + 3], alphaHead);
          }
        }
      }
    }
  }

  const trailTexture = new THREE.DataTexture(trailData, width, height, THREE.RGBAFormat);
  trailTexture.needsUpdate = true;
  trailTexture.wrapS = THREE.RepeatWrapping;
  trailTexture.wrapT = THREE.RepeatWrapping;
  trailTexture.magFilter = THREE.NearestFilter;
  trailTexture.minFilter = THREE.LinearMipmapLinearFilter;
  trailTexture.generateMipmaps = true;
  trailTexture.colorSpace = THREE.SRGBColorSpace;

  const headTexture = new THREE.DataTexture(headData, width, height, THREE.RGBAFormat);
  headTexture.needsUpdate = true;
  headTexture.wrapS = THREE.RepeatWrapping;
  headTexture.wrapT = THREE.RepeatWrapping;
  headTexture.magFilter = THREE.NearestFilter;
  headTexture.minFilter = THREE.LinearMipmapLinearFilter;
  headTexture.generateMipmaps = true;
  headTexture.colorSpace = THREE.SRGBColorSpace;

  return { trailTexture, headTexture };
};

const CameraFly: React.FC<{ timeSec: number; flySpeed: number }> = ({ timeSec, flySpeed }) => {
  const camera = useThree((state) => state.camera);

  React.useLayoutEffect(() => {
    const z = -timeSec * flySpeed;
    const x = Math.sin(timeSec * 0.16) * 0.28;
    const y = Math.cos(timeSec * 0.13) * 0.16;
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, z - 22);
    camera.updateProjectionMatrix();
  }, [camera, flySpeed, timeSec]);

  return null;
};

const FrameTunnel: React.FC<FrameTunnelProps> = ({ timeSec, flySpeed, seed }) => {
  const meshRef = React.useRef<THREE.InstancedMesh>(null);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);
  const frameCount = 88;
  const spacing = 3.1;
  const nearStart = -8;
  const span = frameCount * spacing;
  const zPositionsRef = React.useRef<number[]>([]);
  const initedRef = React.useRef(false);

  const geometry = React.useMemo(() => createRoundedFrameGeometry(14, 8.2, 0.27, 1.15), []);

  React.useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  React.useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || initedRef.current) return;
    initedRef.current = true;

    const rng = createRng(hashSeed(seed) ^ 0x72ecf2b1);
    zPositionsRef.current = Array.from({ length: frameCount }, (_, i) => nearStart - i * spacing);

    for (let i = 0; i < frameCount; i += 1) {
      const z = zPositionsRef.current[i];
      const wobbleX = (rng() * 2 - 1) * 0.08;
      const wobbleY = (rng() * 2 - 1) * 0.08;
      dummy.position.set(wobbleX, wobbleY, z);
      dummy.rotation.set((rng() * 2 - 1) * 0.01, (rng() * 2 - 1) * 0.01, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, new THREE.Color(i % 2 === 0 ? '#00ffff' : '#ff00ff'));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [dummy, nearStart, seed]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const cameraZ = -timeSec * flySpeed;
    for (let i = 0; i < frameCount; i += 1) {
      let z = zPositionsRef.current[i];
      if (z > cameraZ + 1.2) {
        z -= span;
        zPositionsRef.current[i] = z;
      }
      dummy.position.set(0, 0, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, frameCount]} frustumCulled={false}>
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.98}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};

const CodeSurface: React.FC<{
  spec: CodeSurfaceSpec;
  trailTemplate: THREE.Texture;
  headTemplate: THREE.Texture;
  timeSec: number;
}> = ({ spec, trailTemplate, headTemplate, timeSec }) => {
  const trailMap = React.useMemo(() => {
    const t = trailTemplate.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(spec.repeatX, spec.repeatY);
    t.needsUpdate = true;
    return t;
  }, [spec.repeatX, spec.repeatY, trailTemplate]);

  const headMap = React.useMemo(() => {
    const t = headTemplate.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(spec.repeatX, spec.repeatY);
    t.needsUpdate = true;
    return t;
  }, [headTemplate, spec.repeatX, spec.repeatY]);

  React.useEffect(() => {
    return () => {
      trailMap.dispose();
      headMap.dispose();
    };
  }, [headMap, trailMap]);

  useFrame(() => {
    const flow = (timeSec * spec.speed) % 1;
    trailMap.offset.y = -flow;
    headMap.offset.y = -(flow * 1.24);
  });

  return (
    <group position={spec.position} rotation={spec.rotation}>
      <mesh>
        <planeGeometry args={[spec.width, spec.height]} />
        <meshBasicMaterial
          map={trailMap}
          color={spec.color}
          transparent
          opacity={spec.opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[spec.width, spec.height]} />
        <meshBasicMaterial
          map={headMap}
          color={'#ffffff'}
          transparent
          opacity={spec.headOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

const CodeTunnel: React.FC<CodeTunnelProps> = ({ timeSec, seed }) => {
  const { trailTexture, headTexture } = React.useMemo(() => createDigitalRainTextures(seed), [seed]);

  React.useEffect(() => {
    return () => {
      trailTexture.dispose();
      headTexture.dispose();
    };
  }, [headTexture, trailTexture]);

  const tunnelLength = 280;
  const tunnelWidth = 12.2;
  const tunnelHeight = 7.1;
  const centerZ = -tunnelLength * 0.5 - 8;

  const surfaces = React.useMemo<CodeSurfaceSpec[]>(
    () => [
      {
        width: tunnelLength,
        height: tunnelHeight,
        position: [-tunnelWidth * 0.5, 0, centerZ],
        rotation: [0, Math.PI * 0.5, 0],
        color: '#00ffff',
        opacity: 0.48,
        headOpacity: 0.85,
        speed: 0.13,
        repeatX: 26,
        repeatY: 7,
      },
      {
        width: tunnelLength,
        height: tunnelHeight,
        position: [tunnelWidth * 0.5, 0, centerZ],
        rotation: [0, -Math.PI * 0.5, 0],
        color: '#ff00ff',
        opacity: 0.46,
        headOpacity: 0.84,
        speed: 0.11,
        repeatX: 24,
        repeatY: 7,
      },
      {
        width: tunnelLength,
        height: tunnelWidth,
        position: [0, -tunnelHeight * 0.5, centerZ],
        rotation: [-Math.PI * 0.5, 0, 0],
        color: '#00ffff',
        opacity: 0.36,
        headOpacity: 0.58,
        speed: 0.1,
        repeatX: 26,
        repeatY: 10,
      },
      {
        width: tunnelLength,
        height: tunnelWidth,
        position: [0, tunnelHeight * 0.5, centerZ],
        rotation: [Math.PI * 0.5, 0, 0],
        color: '#ff00ff',
        opacity: 0.31,
        headOpacity: 0.5,
        speed: 0.09,
        repeatX: 24,
        repeatY: 10,
      },
    ],
    [centerZ, tunnelHeight, tunnelLength, tunnelWidth]
  );

  return (
    <>
      {surfaces.map((spec, index) => (
        <CodeSurface
          key={`surface-${index}`}
          spec={spec}
          trailTemplate={trailTexture}
          headTemplate={headTexture}
          timeSec={timeSec}
        />
      ))}
    </>
  );
};

export type ModernMatrixTunnelProps = {
  seed?: number | string;
  flySpeed?: number;
  bloomIntensity?: number;
};

export const ModernMatrixTunnel: React.FC<ModernMatrixTunnelProps> = ({
  seed = 'MODERN-MATRIX-TUNNEL-001',
  flySpeed = 7.8,
  bloomIntensity = 1.75,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeSec = frame / fps;
  const safeFlySpeed = clamp(flySpeed, 2.5, 14);
  const safeBloom = clamp(bloomIntensity, 0.4, 3);

  return (
    <AbsoluteFill>
      <Canvas
        dpr={[1, 1.75]}
        gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color('#050611'), 1);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.12;
        }}
      >
        <PerspectiveCamera makeDefault fov={53} near={0.1} far={500} position={[0, 0, 0]} />
        <CameraFly timeSec={timeSec} flySpeed={safeFlySpeed} />

        <fog attach="fog" args={['#04050e', 18, 280]} />
        <ambientLight intensity={0.08} />
        <pointLight position={[0, 0, -24]} intensity={10} color={'#9de4ff'} distance={48} decay={2} />

        <CodeTunnel timeSec={timeSec} seed={seed} />
        <FrameTunnel timeSec={timeSec} flySpeed={safeFlySpeed} seed={seed} />

        <EffectComposer multisampling={0}>
          <Bloom
            intensity={safeBloom}
            luminanceThreshold={0.14}
            luminanceSmoothing={0.24}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </AbsoluteFill>
  );
};

export const ModernMatrixTunnelRoot: React.FC = () => {
  return (
    <Composition
      id={COMPOSITION_ID}
      component={ModernMatrixTunnel}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{
        seed: 'MODERN-MATRIX-TUNNEL-001',
        flySpeed: 7.8,
        bloomIntensity: 1.75,
      }}
    />
  );
};

registerRoot(ModernMatrixTunnelRoot);
