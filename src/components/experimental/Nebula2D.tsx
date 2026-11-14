import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

type NebulaBlob = {
  x: number;
  y: number;
  radius: number;
  colorMix: number;
  phase: number;
  speed: number;
  driftX: number;
  driftY: number;
  density: number;
};

type Filament = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  bendA: number;
  bendB: number;
  width: number;
  phase: number;
  speed: number;
  colorMix: number;
  alpha: number;
};

type Star = {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  alpha: number;
};

type Rgb = { r: number; g: number; b: number };

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

const toRgb = (hex: string): Rgb => {
  const input = hex.replace('#', '').trim();
  const normalized =
    input.length === 3
      ? `${input[0]}${input[0]}${input[1]}${input[1]}${input[2]}${input[2]}`
      : input.padEnd(6, '0').slice(0, 6);
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => {
  const k = clamp(t, 0, 1);
  return {
    r: Math.round(a.r + (b.r - a.r) * k),
    g: Math.round(a.g + (b.g - a.g) * k),
    b: Math.round(a.b + (b.b - a.b) * k),
  };
};

const rgba = (rgb: Rgb, alpha: number): string => {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`;
};

const FRACTAL_PALETTE = ['#4b0082', '#ff00ff', '#0000ff', '#7f2cff', '#260061'];

export type Nebula2DProps = {
  seed?: number | string;
  speed?: number;
  density?: number;
  glow?: number;
  contrast?: number;
  vignette?: number;
};

export const Nebula2D: React.FC<Nebula2DProps> = ({
  seed = 'NEBULA-2D-001',
  speed = 1,
  density = 1,
  glow = 1,
  contrast = 1,
  vignette = 0.65,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const safeSpeed = clamp(speed, 0.1, 3);
  const safeDensity = clamp(density, 0.4, 2.4);
  const safeGlow = clamp(glow, 0.2, 2.4);
  const safeContrast = clamp(contrast, 0.4, 2.4);
  const safeVignette = clamp(vignette, 0, 1);
  const timeSec = (frame / fps) * safeSpeed;

  const palette = React.useMemo(() => FRACTAL_PALETTE.map(toRgb), []);
  const seedHash = React.useMemo(() => hashSeed(seed), [seed]);

  const blobs = React.useMemo<NebulaBlob[]>(() => {
    const rng = createRng(seedHash ^ 0x9e3779b9);
    const count = Math.round(26 + safeDensity * 30);
    const items: NebulaBlob[] = [];

    for (let i = 0; i < count; i += 1) {
      const depth = rng();
      items.push({
        x: rng(),
        y: rng(),
        radius: 0.12 + rng() * 0.36 + depth * 0.18,
        colorMix: rng(),
        phase: rng() * Math.PI * 2,
        speed: 0.05 + rng() * 0.35,
        driftX: (rng() * 2 - 1) * (0.02 + depth * 0.06),
        driftY: (rng() * 2 - 1) * (0.015 + depth * 0.04),
        density: 0.35 + rng() * 0.85,
      });
    }

    return items;
  }, [safeDensity, seedHash]);

  const filaments = React.useMemo<Filament[]>(() => {
    const rng = createRng(seedHash ^ 0x7f4a7c15);
    const count = Math.round(20 + safeDensity * 32);
    const items: Filament[] = [];

    for (let i = 0; i < count; i += 1) {
      items.push({
        startX: rng(),
        startY: rng(),
        endX: rng(),
        endY: rng(),
        bendA: (rng() * 2 - 1) * 0.26,
        bendB: (rng() * 2 - 1) * 0.26,
        width: 0.001 + rng() * 0.0035,
        phase: rng() * Math.PI * 2,
        speed: 0.08 + rng() * 0.2,
        colorMix: rng(),
        alpha: 0.08 + rng() * 0.25,
      });
    }

    return items;
  }, [safeDensity, seedHash]);

  const stars = React.useMemo<Star[]>(() => {
    const rng = createRng(seedHash ^ 0x31f5ac83);
    const count = Math.round(80 + safeDensity * 110);
    const items: Star[] = [];

    for (let i = 0; i < count; i += 1) {
      items.push({
        x: rng(),
        y: rng(),
        r: 0.35 + rng() * 1.3,
        phase: rng() * Math.PI * 2,
        speed: 0.35 + rng() * 1.8,
        alpha: 0.12 + rng() * 0.45,
      });
    }

    return items;
  }, [safeDensity, seedHash]);

  const noiseTile = React.useMemo(() => {
    if (typeof document === 'undefined') return null;

    const tile = document.createElement('canvas');
    tile.width = 220;
    tile.height = 220;
    const ctx = tile.getContext('2d');
    if (!ctx) return null;

    const image = ctx.createImageData(tile.width, tile.height);
    const rng = createRng(seedHash ^ 0x59a9f7b1);

    for (let i = 0; i < image.data.length; i += 4) {
      const grain = Math.floor(rng() * 255);
      image.data[i] = grain;
      image.data[i + 1] = grain;
      image.data[i + 2] = grain;
      image.data[i + 3] = 26 + Math.floor(rng() * 42);
    }
    ctx.putImageData(image, 0, 0);
    return tile;
  }, [seedHash]);

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#16002f');
    bgGrad.addColorStop(0.55, '#120028');
    bgGrad.addColorStop(1, '#080018');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const coreGlow = ctx.createRadialGradient(
      width * 0.52,
      height * 0.48,
      Math.min(width, height) * 0.03,
      width * 0.52,
      height * 0.48,
      Math.min(width, height) * 0.62
    );
    coreGlow.addColorStop(0, `rgba(255, 0, 255, ${0.08 * safeGlow})`);
    coreGlow.addColorStop(0.35, `rgba(124, 44, 255, ${0.06 * safeGlow})`);
    coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coreGlow;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < blobs.length; i += 1) {
      const blob = blobs[i];
      const px = (blob.x + Math.sin(timeSec * blob.speed + blob.phase) * blob.driftX) * width;
      const py = (blob.y + Math.cos(timeSec * blob.speed * 0.8 + blob.phase) * blob.driftY) * height;
      const radius = blob.radius * Math.min(width, height);

      const a = palette[Math.floor(blob.colorMix * palette.length) % palette.length];
      const b = palette[(Math.floor(blob.colorMix * palette.length) + 1) % palette.length];
      const color = mixRgb(a, b, 0.5 + 0.5 * Math.sin(timeSec * (0.09 + blob.speed * 0.3) + blob.phase));

      const pulse = 0.65 + 0.35 * Math.sin(timeSec * (0.2 + blob.speed * 0.5) + blob.phase * 1.3);
      const alpha = clamp((0.05 + blob.density * 0.12) * pulse * safeGlow, 0.02, 0.28);

      const grad = ctx.createRadialGradient(px, py, radius * 0.08, px, py, radius);
      grad.addColorStop(0, rgba(color, alpha * 1.25));
      grad.addColorStop(0.45, rgba(color, alpha * 0.72));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = 0; i < filaments.length; i += 1) {
      const f = filaments[i];
      const drift = Math.sin(timeSec * f.speed + f.phase);

      const x1 = (f.startX + drift * 0.03) * width;
      const y1 = (f.startY + Math.cos(timeSec * f.speed * 0.7 + f.phase) * 0.02) * height;
      const x2 = (f.endX + Math.cos(timeSec * f.speed * 0.8 + f.phase) * 0.03) * width;
      const y2 = (f.endY + drift * 0.02) * height;
      const c1x = x1 + (x2 - x1) * (0.3 + f.bendA);
      const c1y = y1 - height * (0.08 + f.bendB);
      const c2x = x1 + (x2 - x1) * (0.68 - f.bendB);
      const c2y = y2 + height * (0.08 + f.bendA);

      const cA = palette[Math.floor(f.colorMix * palette.length) % palette.length];
      const cB = palette[(Math.floor(f.colorMix * palette.length) + 2) % palette.length];
      const c = mixRgb(cA, cB, 0.5 + 0.5 * drift);

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.4, rgba(c, f.alpha * 0.9 * safeContrast));
      grad.addColorStop(0.6, rgba(c, f.alpha * 1.2 * safeContrast));
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(0.6, f.width * Math.min(width, height));
      ctx.shadowBlur = (8 + f.width * 2200) * safeGlow;
      ctx.shadowColor = rgba(c, 0.35 * f.alpha);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, x2, y2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < stars.length; i += 1) {
      const s = stars[i];
      const twinkle = 0.45 + 0.55 * Math.sin(timeSec * s.speed + s.phase);
      const alpha = s.alpha * twinkle * 0.48;
      ctx.beginPath();
      ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230, 220, 255, ${alpha})`;
      ctx.fill();
    }
    ctx.restore();

    if (noiseTile) {
      const pattern = ctx.createPattern(noiseTile, 'repeat');
      if (pattern) {
        ctx.save();
        ctx.globalCompositeOperation = 'soft-light';
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    }

    const contrastLayer = ctx.createRadialGradient(
      width * 0.52,
      height * 0.52,
      Math.min(width, height) * 0.08,
      width * 0.52,
      height * 0.52,
      Math.min(width, height) * 0.76
    );
    contrastLayer.addColorStop(0, `rgba(255, 60, 255, ${0.05 * safeContrast})`);
    contrastLayer.addColorStop(0.55, `rgba(80, 20, 200, ${0.03 * safeContrast})`);
    contrastLayer.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = contrastLayer;
    ctx.fillRect(0, 0, width, height);

    const vignetteGrad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      Math.min(width, height) * 0.22,
      width * 0.5,
      height * 0.5,
      Math.min(width, height) * 0.82
    );
    vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vignetteGrad.addColorStop(0.62, `rgba(0,0,0,${0.1 * safeVignette})`);
    vignetteGrad.addColorStop(1, `rgba(0,0,0,${0.52 * safeVignette})`);
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, width, height);
  }, [
    blobs,
    filaments,
    height,
    noiseTile,
    palette,
    safeContrast,
    safeGlow,
    safeVignette,
    stars,
    timeSec,
    width,
  ]);

  return (
    <AbsoluteFill>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </AbsoluteFill>
  );
};

export default Nebula2D;
