import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

type HexCell = {
  u: number;
  v: number;
  phase: number;
  weight: number;
  tint: number;
};

type Anchor = {
  u: number;
  v: number;
  phase: number;
  speed: number;
  radius: number;
  driftU: number;
  driftV: number;
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

const toRgb = (hex: string): { r: number; g: number; b: number } => {
  const n = hex.replace('#', '').trim();
  const safe = (n.length === 3 ? `${n[0]}${n[0]}${n[1]}${n[1]}${n[2]}${n[2]}` : n).padEnd(6, 'f').slice(0, 6);
  return {
    r: Number.parseInt(safe.slice(0, 2), 16),
    g: Number.parseInt(safe.slice(2, 4), 16),
    b: Number.parseInt(safe.slice(4, 6), 16),
  };
};

const rgbToCss = (rgb: { r: number; g: number; b: number }, mul = 1): string => {
  const r = clamp(Math.round(rgb.r * mul), 0, 255);
  const g = clamp(Math.round(rgb.g * mul), 0, 255);
  const b = clamp(Math.round(rgb.b * mul), 0, 255);
  return `rgb(${r}, ${g}, ${b})`;
};

export type HexReliefWaveProps = {
  seed: number | string;
  speed: number;
  density: number;
  amplitude: number;
  baseColor: string;
  background: string;
};

const hexPoints = (cx: number, cy: number, radius: number): Array<{ x: number; y: number }> => {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    points.push({ x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius });
  }
  return points;
};

const pathPoly = (ctx: CanvasRenderingContext2D, poly: Array<{ x: number; y: number }>) => {
  if (poly.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i += 1) {
    ctx.lineTo(poly[i].x, poly[i].y);
  }
  ctx.closePath();
};

export const HexReliefWaveBackground: React.FC<HexReliefWaveProps> = ({
  seed,
  speed,
  density,
  amplitude,
  baseColor,
  background,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const timeSec = frame / fps;
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const safeDensity = clamp(density, 0.55, 2);
  const safeSpeed = clamp(speed, 0.1, 2);
  const safeAmplitude = clamp(amplitude, 0.1, 2);

  const layout = React.useMemo(() => {
    const rng = createRng(hashSeed(seed) ^ 0x6ab93f2);
    const cols = Math.round(48 + safeDensity * 16);
    const rows = Math.round(30 + safeDensity * 10);

    const cells: HexCell[] = [];
    for (let r = -rows; r <= rows; r += 1) {
      for (let q = -cols; q <= cols; q += 1) {
        const u = Math.sqrt(3) * (q + r * 0.5);
        const v = r * 1.5;
        cells.push({
          u,
          v,
          phase: rng() * Math.PI * 2,
          weight: 0.4 + rng() * 0.6,
          tint: 0.94 + rng() * 0.06,
        });
      }
    }

    const anchors: Anchor[] = Array.from({ length: Math.round(5 + safeDensity * 4) }, () => ({
      u: (rng() - 0.5) * cols * 1.1,
      v: (rng() - 0.5) * rows * 1.2,
      phase: rng() * Math.PI * 2,
      speed: 0.25 + rng() * 0.45,
      radius: 4 + rng() * 5,
      driftU: 0.6 + rng() * 1.6,
      driftV: 0.4 + rng() * 1.2,
    }));

    return { cells, anchors };
  }, [safeDensity, seed]);

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bg = toRgb(background);
    const base = toRgb(baseColor);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = rgbToCss(bg, 1.02);
    ctx.fillRect(0, 0, width, height);

    const horizonY = height * 0.12;
    const nearY = height * 1.07;
    const slant = -0.18;

    const items: Array<{
      sx: number;
      sy: number;
      radiusPx: number;
      pop: number;
      tint: number;
      depth: number;
    }> = [];

    for (let i = 0; i < layout.cells.length; i += 1) {
      const cell = layout.cells[i];
      const depth = clamp((cell.v + 42) / 84, 0, 1);
      const perspective = 0.38 + depth * 1.35;

      const sx = width * 0.5 + cell.u * (8.2 + depth * 6.8) + depth * width * slant;
      const sy = horizonY + depth * (nearY - horizonY) + cell.u * 0.12;

      if (sx < -220 || sx > width + 220 || sy < -220 || sy > height + 220) continue;

      let field = 0;
      for (let a = 0; a < layout.anchors.length; a += 1) {
        const anchor = layout.anchors[a];
        const au = anchor.u + Math.sin(timeSec * anchor.speed + anchor.phase) * anchor.driftU;
        const av = anchor.v + Math.cos(timeSec * anchor.speed * 0.9 + anchor.phase * 1.17) * anchor.driftV;
        const du = cell.u - au;
        const dv = cell.v - av;
        const influence = Math.exp(-(du * du + dv * dv) / (anchor.radius * anchor.radius));
        const gate = 0.5 + 0.5 * Math.sin(timeSec * anchor.speed * 1.35 + anchor.phase);
        field += influence * clamp((gate - 0.28) / 0.72, 0, 1);
      }

      const micro = 0.5 + 0.5 * Math.sin(cell.phase + timeSec * safeSpeed * 1.1 + cell.u * 0.11 - cell.v * 0.08);
      const active = clamp(field * 0.78 + cell.weight * 0.18 + micro * 0.08 - 0.25, 0, 1);
      const pop = Math.pow(active, 2.9) * (0.55 + safeAmplitude * 0.45);

      items.push({
        sx,
        sy,
        radiusPx: (8.5 + depth * 13) * perspective,
        pop,
        tint: cell.tint,
        depth,
      });
    }

    items.sort((a, b) => a.depth - b.depth);

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const extrusion = (2.8 + item.depth * 3.4) * item.pop;
      const topDx = -extrusion * 0.26;
      const topDy = -extrusion;

      const basePoly = hexPoints(item.sx, item.sy, item.radiusPx);
      const topPoly = hexPoints(item.sx + topDx, item.sy + topDy, item.radiusPx);

      for (let e = 0; e < 6; e += 1) {
        const n = (e + 1) % 6;
        const midY = (basePoly[e].y + basePoly[n].y) * 0.5;
        if (midY < item.sy - 0.2) continue;

        const edgeShade = 0.86 - item.depth * 0.08 + e * 0.006;
        ctx.fillStyle = rgbToCss(base, edgeShade);
        ctx.beginPath();
        ctx.moveTo(basePoly[e].x, basePoly[e].y);
        ctx.lineTo(basePoly[n].x, basePoly[n].y);
        ctx.lineTo(topPoly[n].x, topPoly[n].y);
        ctx.lineTo(topPoly[e].x, topPoly[e].y);
        ctx.closePath();
        ctx.fill();
      }

      const topShade = clamp(item.tint - item.pop * 0.06 - item.depth * 0.03, 0.9, 1.02);
      ctx.fillStyle = rgbToCss(base, topShade);
      pathPoly(ctx, topPoly);
      ctx.fill();

      ctx.strokeStyle = rgbToCss(base, 0.83 - item.depth * 0.05);
      ctx.lineWidth = Math.max(0.7, item.radiusPx * 0.03);
      pathPoly(ctx, topPoly);
      ctx.stroke();
    }

    const vignette = ctx.createRadialGradient(width * 0.5, height * 0.48, height * 0.18, width * 0.5, height * 0.48, height * 0.92);
    vignette.addColorStop(0, 'rgba(255,255,255,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.06)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }, [amplitude, background, baseColor, fps, height, layout.anchors, layout.cells, safeAmplitude, safeSpeed, timeSec, width]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#f2f2f2' }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%', display: 'block' }} />
    </AbsoluteFill>
  );
};

