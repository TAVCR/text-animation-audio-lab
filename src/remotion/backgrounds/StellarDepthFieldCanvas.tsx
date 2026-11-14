import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  createStellarParticle,
  getStellarColor,
  projectStellarParticle,
  type StellarColorMode,
  type StellarDistribution,
  type StellarMotionMode,
  type StellarParticle,
} from './stellarDepthField';

export type StellarDepthFieldProps = {
  density?: number;
  distribution?: StellarDistribution;
  size?: number;
  sizeVariation?: number;
  depth?: number;
  perspective?: number;
  motionMode?: StellarMotionMode;
  speed?: number;
  driftAngle?: number;
  parallax?: number;
  cameraMotion?: number;
  sway?: number;
  rotation?: number;
  zSpeed?: number;
  streaks?: number;
  brightness?: number;
  glow?: number;
  twinkle?: number;
  colorMode?: StellarColorMode;
  colorA?: string;
  colorB?: string;
  temperatureVariation?: number;
  dof?: number;
  focusPlane?: number;
  depthFog?: number;
  dust?: number;
  nebula?: number;
  nebulaScale?: number;
  nebulaSpeed?: number;
  nebulaIntensity?: number;
  nebulaColor?: string;
  seed?: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const hexToRgb = (hex: string) => {
  const value = hex.replace('#', '').padEnd(6, '0').slice(0, 6);
  return {
    r: Number.parseInt(value.slice(0, 2), 16) || 0,
    g: Number.parseInt(value.slice(2, 4), 16) || 0,
    b: Number.parseInt(value.slice(4, 6), 16) || 0,
  };
};
const rgba = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${clamp(alpha, 0, 1)})`;
};

export const StellarDepthField: React.FC<StellarDepthFieldProps> = ({
  density = 320,
  distribution = 'balanced',
  size = 2.2,
  sizeVariation = 0.62,
  depth = 1.7,
  perspective = 1.25,
  motionMode = 'drift-advance',
  speed = 0.55,
  driftAngle = 18,
  parallax = 0.62,
  cameraMotion = 0.28,
  sway = 0.35,
  rotation = 0.12,
  zSpeed = 0.42,
  streaks = 0.08,
  brightness = 1.05,
  glow = 0.55,
  twinkle = 0.18,
  colorMode = 'temperature',
  colorA = '#dcecff',
  colorB = '#8fb8ff',
  temperatureVariation = 0.52,
  dof = 0.28,
  focusPlane = 0.58,
  depthFog = 0.34,
  dust = 0.28,
  nebula = 0.2,
  nebulaScale = 1.15,
  nebulaSpeed = 0.18,
  nebulaIntensity = 0.22,
  nebulaColor = '#394b91',
  seed = 731,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const count = Math.round(clamp(density, 40, 900));

  const stars = React.useMemo<StellarParticle[]>(() =>
    Array.from({ length: count }, (_, index) => createStellarParticle(seed, index, distribution))
      .sort((a, b) => b.z - a.z), [count, distribution, seed]);

  const dustParticles = React.useMemo<StellarParticle[]>(() => {
    const dustCount = Math.round(count * clamp(dust, 0, 1.5) * 0.5);
    return Array.from({ length: dustCount }, (_, index) => ({
      ...createStellarParticle(seed + 991, index, 'near'),
      sizeBias: 0.6 + createStellarParticle(seed + 1991, index, 'near').sizeBias * 0.4,
    })).sort((a, b) => b.z - a.z);
  }, [count, dust, seed]);

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    // Solicita una superficie optimizada para composición y evita el modo
    // readback-oriented de Canvas 2D. La aceleración final depende del
    // navegador, pero estos flags permiten que Chromium use su compositor GPU
    // sin forzar una ruta lenta de lectura desde CPU.
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false,
    });
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const time = frame / Math.max(1, fps);
    if (nebula > 0 && nebulaIntensity > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const scale = clamp(nebulaScale, 0.4, 3);
      const nebulaAmount = clamp(nebula * nebulaIntensity, 0, 1);
      for (let index = 0; index < 4; index += 1) {
        const phase = seed * 0.013 + index * 1.91;
        const x = width * (0.18 + index * 0.21 + Math.sin(time * nebulaSpeed * (0.37 + index * 0.08) + phase) * 0.08);
        const y = height * (0.28 + (index % 2) * 0.38 + Math.cos(time * nebulaSpeed * 0.29 + phase) * 0.11);
        const radius = Math.min(width, height) * scale * (0.32 + index * 0.045);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, rgba(nebulaColor, nebulaAmount * (0.15 + index * 0.025)));
        gradient.addColorStop(0.48, rgba(index % 2 ? colorB : colorA, nebulaAmount * 0.055));
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();
    }

    const projectionOptions = {
      width, height, frame, fps, depth, perspective, parallax, motionMode, speed, driftAngle,
      cameraMotion, sway, rotation, zSpeed, size, sizeVariation, brightness, twinkle, dof,
      focusPlane, depthFog,
    };

    const drawPopulation = (population: StellarParticle[], isDust: boolean) => {
      const buckets = new Map<number, Array<{
        particle: StellarParticle;
        projected: ReturnType<typeof projectStellarParticle>;
        color: string;
        radius: number;
        opacity: number;
      }>>();
      for (let index = 0; index < population.length; index += 1) {
        const particle = population[index];
        const projected = projectStellarParticle(particle, projectionOptions, index + (isDust ? 10000 : 0));
        if (projected.x < -50 || projected.x > width + 50 || projected.y < -50 || projected.y > height + 50) continue;
        const color = isDust
          ? colorB
          : getStellarColor(colorMode, colorA, colorB, particle.colorBias, temperatureVariation);
        const radius = isDust ? clamp(projected.radius * 1.45, 0.45, 12) : projected.radius;
        const opacity = projected.opacity * (isDust ? clamp(dust, 0, 1) * 0.24 : 0.92);
        const blurBucket = projected.blur < 1 ? 0 : projected.blur < 4 ? 2 : projected.blur < 8 ? 5 : 9;

        const bucket = buckets.get(blurBucket) ?? [];
        bucket.push({ particle, projected, color, radius, opacity });
        buckets.set(blurBucket, bucket);
      }

      buckets.forEach((items, blurBucket) => {
        // Cambiar el estado del contexto una vez por nivel de blur es mucho más
        // barato que hacerlo una vez por partícula (especialmente con DOF activo).
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.filter = blurBucket > 0 ? `blur(${blurBucket}px)` : 'none';
        for (const item of items) {
          const { projected, color, radius, opacity } = item;
          ctx.globalAlpha = clamp(opacity * projected.brightness, 0.015, 1);
          if (!isDust && streaks > 0 && (motionMode === 'advance' || motionMode === 'drift-advance')) {
            const length = clamp(streaks, 0, 1) * 28 * projected.scale;
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(0.35, radius * 0.75);
            ctx.beginPath();
            ctx.moveTo(projected.x - projected.streakX * length, projected.y - projected.streakY * length);
            ctx.lineTo(projected.x, projected.y);
            ctx.stroke();
          }
          // El halo se aproxima con una segunda pasada agrupada; shadowBlur por
          // partícula fuerza al navegador a rasterizar y desenfocar repetidamente.
          if (!isDust && glow > 0 && radius > 0.8) {
            ctx.globalAlpha = clamp(opacity * projected.brightness * glow * 0.18, 0, 1);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(projected.x, projected.y, radius * (1.8 + glow * 1.2), 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = clamp(opacity * projected.brightness, 0.015, 1);
          }
          ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, radius, 0, Math.PI * 2);
        ctx.fill();
        if (!isDust && radius > 1.25 && projected.blur < 5) {
          ctx.filter = 'none';
          ctx.globalAlpha = clamp(opacity * 0.75, 0, 1);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, Math.max(0.3, radius * 0.23), 0, Math.PI * 2);
          ctx.fill();
        }
        }
        ctx.restore();
      });
    };

    drawPopulation(stars, false);
    if (dust > 0) drawPopulation(dustParticles, true);
  }, [brightness, cameraMotion, colorA, colorB, colorMode, depth, depthFog, dof, driftAngle, dust, dustParticles, focusPlane, fps, frame, glow, height, motionMode, nebula, nebulaColor, nebulaIntensity, nebulaScale, nebulaSpeed, parallax, perspective, rotation, seed, size, sizeVariation, speed, stars, streaks, sway, temperatureVariation, twinkle, width, zSpeed]);

  return (
    <AbsoluteFill data-stellar-depth-field="true" style={{ pointerEvents: 'none' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', willChange: 'transform', contain: 'strict' }}
      />
    </AbsoluteFill>
  );
};

export default StellarDepthField;
