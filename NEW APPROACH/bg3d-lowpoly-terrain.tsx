// bg3d-lowpoly-terrain.tsx
// Remotion 3D Background: Low-poly Terrain + Floating Dust Sky
// ⚠️  Escrito para ThreeCanvas de @remotion/three — NO usar Canvas de @react-three/fiber
// ✅  Fondo transparente — se compone sobre otras capas en Remotion
//
// La escena combina dos sistemas en un solo ThreeCanvas:
//   1. Terreno low-poly animado con flatShading y materiales PBR (plano inferior)
//   2. Campo de partículas flotantes tipo polvo/cielo (plano superior)
//
// Uso:
//   import { BG3D_LowPolyTerrain } from './bg3d-lowpoly-terrain';
//   <BG3D_LowPolyTerrain colorTerrain1="#112244" dustColorA="#4488ff" />
//
// ── TERRAIN PROPS ────────────────────────────────────────────────
//   colorTerrain1   — color plano superior          default "#112244"
//   colorTerrain2   — color plano inferior          default "#001122"
//   colorLightA/B/C — luces orbitales               defaults azul/naranja/cian
//   speed           — velocidad de ondulación       default 1.5
//   amplitude       — altura de las olas            default 1.4
//   metalness       — 0 mate → 1 espejo             default 0.3
//   roughness       — 0 pulido → 1 rugoso           default 0.6
//   showMirror      — segundo plano inferior        default true
//
// ── DUST PROPS ───────────────────────────────────────────────────
//   dustColorA/B/C  — colores de las partículas     defaults azul/celeste/blanco
//   dustCount       — cantidad de partículas        default 2400
//   dustSize        — tamaño de partícula           default 0.028
//   dustSpeed       — velocidad de deriva           default 0.4
//   dustTurbulence  — agitación lateral             default 0.5
//   dustOpacity     — opacidad                      default 0.7
//   dustZSpread     — profundidad de la nube        default 10
//
// ── SHARED ───────────────────────────────────────────────────────
//   bloomStrength                                    default 1.2
//
// Packages requeridos:
//   remotion @4.0.x  |  @remotion/three
//   three @0.168.x   |  @react-three/fiber @8.x
//   @react-three/postprocessing @2.x  |  postprocessing @6.x

import React, { useRef, useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// ── Props ──────────────────────────────────────────────────────────
export interface LowPolyTerrainBGProps {
  // Terrain
  colorTerrain1?: string;
  colorTerrain2?: string;
  colorLightA?: string;
  colorLightB?: string;
  colorLightC?: string;
  speed?: number;
  amplitude?: number;
  metalness?: number;
  roughness?: number;
  showMirror?: boolean;
  // Dust
  dustColorA?: string;
  dustColorB?: string;
  dustColorC?: string;
  dustCount?: number;
  dustSize?: number;
  dustSpeed?: number;
  dustTurbulence?: number;
  dustOpacity?: number;
  dustZSpread?: number;
  // Shared
  bloomStrength?: number;
  transparentBackground?: boolean;
}

const TERRAIN_GRID = 28;

// ── Deterministic particle data (stable across Remotion frames) ────
function buildDustData(
  n: number,
  zSpread: number,
  cA: string,
  cB: string,
  cC: string
) {
  const palette = [cA, cB, cC].map((h) => {
    const r = parseInt(h.slice(1, 3), 16) / 255;
    const g = parseInt(h.slice(3, 5), 16) / 255;
    const b = parseInt(h.slice(5, 7), 16) / 255;
    return [r, g, b];
  });

  const positions  = new Float32Array(n * 3);
  const colors     = new Float32Array(n * 3);
  const phases     = new Float32Array(n);
  const speeds     = new Float32Array(n);
  const turbX      = new Float32Array(n);
  const turbZ      = new Float32Array(n);

  let s = 12345;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  for (let i = 0; i < n; i++) {
    positions[i * 3]     = (rand() - 0.5) * 80;        // Spread wider across X
    positions[i * 3 + 1] = -20 + rand() * 50;          // Y from -20 to 30 (Covers whole canvas)
    positions[i * 3 + 2] = -15 - (rand() * 25);        // Z strictly behind the terrain (-15 to -40)
    phases[i]  = rand() * Math.PI * 2;
    speeds[i]  = 0.3 + rand() * 0.7;
    turbX[i]   = (rand() - 0.5) * 2;
    turbZ[i]   = (rand() - 0.5) * 2;
    const col  = palette[Math.floor(rand() * 3)];
    const bright = 0.55 + rand() * 0.45;
    colors[i * 3]     = col[0] * bright;
    colors[i * 3 + 1] = col[1] * bright;
    colors[i * 3 + 2] = col[2] * bright;
  }

  return { positions, colors, phases, speeds, turbX, turbZ };
}

// ── Floating Dust system ───────────────────────────────────────────
function DustSystem({
  dustColorA    = "#4488ff",
  dustColorB    = "#aaddff",
  dustColorC    = "#ffffff",
  dustCount     = 2400,
  dustSize      = 0.028,
  dustSpeed     = 0.4,
  dustTurbulence = 0.5,
  dustOpacity   = 0.7,
  dustZSpread   = 10,
}: Pick<LowPolyTerrainBGProps,
  | "dustColorA" | "dustColorB" | "dustColorC"
  | "dustCount" | "dustSize" | "dustSpeed"
  | "dustTurbulence" | "dustOpacity" | "dustZSpread"
>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const pointsRef = useRef<THREE.Points>(null!);

  const { positions, colors, phases, speeds, turbX, turbZ } = useMemo(
    () => buildDustData(dustCount, dustZSpread, dustColorA, dustColorB, dustColorC),
    [dustCount, dustZSpread, dustColorA, dustColorB, dustColorC]
  );

  // Working copy mutated each frame
  const workPos = useMemo(() => positions.slice(), [positions]);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(workPos, 3));
    g.setAttribute("color",    new THREE.BufferAttribute(colors, 3));
    return g;
  }, [workPos, colors]);

  useFrame(() => {
    for (let i = 0; i < dustCount; i++) {
      const ph = phases[i];
      const sp = speeds[i] * dustSpeed;

      workPos[i * 3]     = positions[i * 3]     + Math.sin(t * sp * 0.4 + ph) * dustTurbulence * turbX[i] * 0.6;
      workPos[i * 3 + 1] = positions[i * 3 + 1] + ((t * sp * 0.15 + ph) % 50) - 25;
      workPos[i * 3 + 2] = positions[i * 3 + 2] + Math.cos(t * sp * 0.3 + ph) * dustTurbulence * turbZ[i] * 0.2;

      // Wrap Y so particles cycle continuously within the whole Canvas area [-20, 30]
      if (workPos[i * 3 + 1] >  30) workPos[i * 3 + 1] -= 50;
      if (workPos[i * 3 + 1] < -20) workPos[i * 3 + 1] += 50;
    }
    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geo}>
      <pointsMaterial
        vertexColors
        size={dustSize}
        sizeAttenuation
        transparent
        opacity={dustOpacity}
        depthWrite={false}
      />
    </points>
  );
}

// ── Terrain system ─────────────────────────────────────────────────
function TerrainSystem({
  colorTerrain1 = "#112244",
  colorTerrain2 = "#001122",
  colorLightA   = "#0066ff",
  colorLightB   = "#ff4400",
  colorLightC   = "#00ffcc",
  speed         = 1.5,
  amplitude     = 1.4,
  metalness     = 0.3,
  roughness     = 0.6,
  showMirror    = true,
}: Pick<LowPolyTerrainBGProps,
  | "colorTerrain1" | "colorTerrain2"
  | "colorLightA" | "colorLightB" | "colorLightC"
  | "speed" | "amplitude" | "metalness" | "roughness" | "showMirror"
>) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const lARef = useRef<THREE.PointLight>(null!);
  const lBRef = useRef<THREE.PointLight>(null!);
  const lCRef = useRef<THREE.PointLight>(null!);

  const geo1 = useMemo(() => {
    const g = new THREE.PlaneGeometry(36, 36, TERRAIN_GRID, TERRAIN_GRID);
    g.rotateX(-Math.PI / 2);
    const colors = new Float32Array(g.attributes.position.count * 3);
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);

  const geo2 = useMemo(() => {
    const g = new THREE.PlaneGeometry(36, 36, TERRAIN_GRID, TERRAIN_GRID);
    g.rotateX(-Math.PI / 2);
    const colors = new Float32Array(g.attributes.position.count * 3);
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);

  const c1Ref = useRef(new THREE.Color());
  const c2Ref = useRef(new THREE.Color());

  useFrame(() => {
    const o = t * speed;
    c1Ref.current.set(colorTerrain1);
    c2Ref.current.set(colorTerrain2);
    const r1 = c1Ref.current.r, g1 = c1Ref.current.g, b1 = c1Ref.current.b;
    const r2 = c2Ref.current.r, g2 = c2Ref.current.g, b2 = c2Ref.current.b;

    const p1 = geo1.attributes.position as THREE.BufferAttribute;
    const c1Attr = geo1.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < p1.count; i++) {
      const x = p1.getX(i), z = p1.getZ(i);
      const y = Math.sin(x * 0.38 + o * 0.28) * Math.cos(z * 0.32) * amplitude +
                Math.sin(x * 0.85 + z * 0.65 + o * 0.18) * amplitude * 0.42 +
                Math.cos(x * 0.22 + z * 0.28 + o * 0.12) * amplitude * 0.25;
      p1.setY(i, y);
      
      const f = Math.max(0, Math.min(1, (y + amplitude * 1.2) / (amplitude * 2.4)));
      c1Attr.setXYZ(i, r2 + (r1 - r2) * f, g2 + (g1 - g2) * f, b2 + (b1 - b2) * f);
    }
    p1.needsUpdate = true;
    c1Attr.needsUpdate = true;
    geo1.computeVertexNormals();

    if (showMirror) {
      const o2 = o + 0.8;
      const p2 = geo2.attributes.position as THREE.BufferAttribute;
      const c2Attr = geo2.attributes.color as THREE.BufferAttribute;
      for (let i = 0; i < p2.count; i++) {
        const x = p2.getX(i), z = p2.getZ(i);
        const y = Math.sin(x * 0.38 + o2 * 0.28) * Math.cos(z * 0.32) * amplitude * 0.8 +
                  Math.sin(x * 0.85 + z * 0.65 + o2 * 0.18) * amplitude * 0.35 +
                  Math.cos(x * 0.22 + z * 0.28 + o2 * 0.12) * amplitude * 0.2;
        p2.setY(i, y);

        const f = Math.max(0, Math.min(1, (y + amplitude * 0.9) / (amplitude * 1.8)));
        c2Attr.setXYZ(i, r2 + (r1 - r2) * f, g2 + (g1 - g2) * f, b2 + (b1 - b2) * f);
      }
      p2.needsUpdate = true;
      c2Attr.needsUpdate = true;
      geo2.computeVertexNormals();
    }

    lARef.current.position.set(Math.cos(t * 0.35) * 10, 10 + Math.sin(t * 0.2) * 2, Math.sin(t * 0.28) * 7);
    lBRef.current.position.set(Math.cos(t * 0.28 + 2.1) * 10, 7, Math.sin(t * 0.35 + 1.2) * 8);
    lCRef.current.position.set(Math.cos(t * 0.22 + 4.2) * 8, 12, Math.sin(t * 0.25 + 2.4) * 6);
  });

  return (
    <>
      <ambientLight intensity={2.5} color="#ffffff" />
      <pointLight ref={lARef} color={colorLightA} intensity={80} distance={150} />
      <pointLight ref={lBRef} color={colorLightB} intensity={70} distance={150} />
      <pointLight ref={lCRef} color={colorLightC} intensity={60} distance={150} />

      <mesh geometry={geo1}>
        <meshStandardMaterial
          color="#ffffff"
          vertexColors={true}
          metalness={metalness}
          roughness={roughness}
          flatShading
        />
      </mesh>

      {showMirror && (
        <group>
          <pointLight position={[0, -12, 0]} color="#ffffff" intensity={60} distance={150} />
          <mesh geometry={geo2} position={[0, -4.5, 0]} rotation={[0, 0, Math.PI]}>
            <meshStandardMaterial
              color="#ffffff"
              vertexColors={true}
              metalness={Math.min(1, metalness + 0.2)}
              roughness={Math.max(0, roughness - 0.1)}
              flatShading
            />
          </mesh>
        </group>
      )}
    </>
  );
}

// ── Combined scene inside ThreeCanvas ─────────────────────────────
function CombinedScene(props: LowPolyTerrainBGProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { camera } = useThree();

  useFrame(() => {
    camera.position.set(
      Math.sin(t * 0.08) * 2.5,
      5 + Math.cos(t * 0.06) * 0.8,
      11
    );
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <TerrainSystem {...props} />
      <DustSystem {...props} />
      {!props.transparentBackground && (
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.1}
            luminanceSmoothing={0.9}
            intensity={props.bloomStrength ?? 1.2}
          />
        </EffectComposer>
      )}
    </>
  );
}

// ── Root component ─────────────────────────────────────────────────
export const BG3D_LowPolyTerrain: React.FC<LowPolyTerrainBGProps> = (props) => {
  const { width, height } = useVideoConfig();

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{
          position: [0, 5, 11],
          fov: 60,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.4,
        }}
      >
        <CombinedScene {...props} />
      </ThreeCanvas>
    </div>
  );
};

export default BG3D_LowPolyTerrain;
