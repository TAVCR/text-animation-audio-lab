import React from 'react';
import { AbsoluteFill, getRemotionEnvironment, useCurrentFrame, useVideoConfig } from 'remotion';

type Point = { x: number; y: number };
type Path = Point[];

type PathMetric = {
  points: Path;
  segmentLengths: Float32Array;
  totalLength: number;
};

type Orb = {
  pathIndex: number;
  phase: number;
  speed: number;
  size: number;
  direction: 1 | -1;
};

type Palette = {
  main: string;
  sec: string;
  bg: string;
  chipBg: string;
  rgba: (alpha: number) => string;
  rgbaSec: (alpha: number) => string;
};

const D4: ReadonlyArray<Point> = [
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
];

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const wrap01 = (value: number): number => {
  return ((value % 1) + 1) % 1;
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

const buildPalette = (hue: number, saturation: number, brightness: number): Palette => {
  const h = ((hue % 360) + 360) % 360;
  const s = clamp(saturation, 0, 1);
  const b = clamp(brightness, 0, 1);

  const toPct = (value: number): number => Math.round(value * 100);
  const secHue = (h + 20) % 360;
  const secBrightness = Math.min(b + 0.1, 1);

  return {
    main: `hsl(${h},${toPct(s)}%,${toPct(b)}%)`,
    sec: `hsl(${secHue},${toPct(s)}%,${toPct(secBrightness)}%)`,
    bg: `hsl(${h},${toPct(s * 0.07)}%,2%)`,
    chipBg: `hsla(${h},${toPct(s * 0.28)}%,4%,0.97)`,
    rgba: (alpha: number) => `hsla(${h},${toPct(s)}%,${toPct(b)}%,${clamp(alpha, 0, 1)})`,
    rgbaSec: (alpha: number) => `hsla(${secHue},${toPct(s)}%,${toPct(secBrightness)}%,${clamp(alpha, 0, 1)})`,
  };
};

const buildCircuits = (
  centerX: number,
  centerY: number,
  chipHalfSize: number,
  width: number,
  height: number,
  complexity: number,
  seed: number
): Path[] => {
  const rng = createRng(seed);
  const paths: Path[] = [];

  const maxDepth = 3 + complexity;
  const branchProbability = 0.28 + complexity * 0.06;
  const pad = 24;
  const maxPaths = 300;

  const grow = (points: Path, direction: number, depth: number): void => {
    if (paths.length >= maxPaths) return;

    const current = points[points.length - 1];
    if (!current) return;

    if (depth >= maxDepth) {
      paths.push(points.slice());
      return;
    }

    const step = Math.max(14, (100 - depth * 8) * (0.4 + rng()));
    const dir = D4[direction];
    const nextRawX = current.x + dir.x * step;
    const nextRawY = current.y + dir.y * step;

    const nextX = clamp(nextRawX, pad, width - pad);
    const nextY = clamp(nextRawY, pad, height - pad);
    const outOfBounds = nextRawX !== nextX || nextRawY !== nextY;

    const next: Point = { x: nextX, y: nextY };
    const nextPoints = points.concat(next);

    if (outOfBounds) {
      paths.push(nextPoints);
      return;
    }

    grow(nextPoints, direction, depth + 1);
    if (rng() < branchProbability) {
      grow(nextPoints, (direction + 1) % 4, depth + 1);
    }
    if (rng() < branchProbability) {
      grow(nextPoints, (direction + 3) % 4, depth + 1);
    }
  };

  for (let side = 0; side < 4; side += 1) {
    for (let i = 0; i < 7; i += 1) {
      const u = (i + 0.5) / 7;

      let startX = centerX;
      let startY = centerY;

      if (side === 0) {
        startX = centerX + chipHalfSize;
        startY = centerY - chipHalfSize + u * chipHalfSize * 2;
      } else if (side === 1) {
        startX = centerX - chipHalfSize + u * chipHalfSize * 2;
        startY = centerY + chipHalfSize;
      } else if (side === 2) {
        startX = centerX - chipHalfSize;
        startY = centerY - chipHalfSize + u * chipHalfSize * 2;
      } else {
        startX = centerX - chipHalfSize + u * chipHalfSize * 2;
        startY = centerY - chipHalfSize;
      }

      grow(
        [
          { x: centerX, y: centerY },
          { x: startX, y: startY },
        ],
        side,
        0
      );
    }
  }

  return paths;
};

const toPathMetric = (path: Path): PathMetric | null => {
  if (path.length < 2) return null;

  const segmentLengths = new Float32Array(Math.max(0, path.length - 1));
  let totalLength = 0;

  for (let i = 1; i < path.length; i += 1) {
    const length = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y);
    segmentLengths[i - 1] = length;
    totalLength += length;
  }

  if (totalLength <= 0) return null;

  return {
    points: path,
    segmentLengths,
    totalLength,
  };
};

const samplePath = (path: PathMetric, progress: number): Point => {
  const t = clamp(progress, 0, 0.999999);
  const target = t * path.totalLength;

  let walked = 0;
  for (let i = 0; i < path.segmentLengths.length; i += 1) {
    const next = walked + path.segmentLengths[i];
    if (target <= next) {
      const local = path.segmentLengths[i] <= 0 ? 0 : (target - walked) / path.segmentLengths[i];
      const from = path.points[i];
      const to = path.points[i + 1];
      return {
        x: from.x + (to.x - from.x) * local,
        y: from.y + (to.y - from.y) * local,
      };
    }
    walked = next;
  }

  return path.points[path.points.length - 1] ?? { x: 0, y: 0 };
};

const buildOrbs = (
  pathCount: number,
  complexity: number,
  flowSpeed: number,
  seed: number
): Orb[] => {
  if (pathCount <= 0) return [];

  const rng = createRng(seed ^ 0x4f1bbcdc);
  const count = Math.max(24, Math.round(55 + complexity * 12));
  const flow = clamp(flowSpeed, 0.1, 3);

  return Array.from({ length: count }, () => {
    return {
      pathIndex: Math.floor(rng() * pathCount),
      phase: rng(),
      speed: (0.022 + rng() * 0.055) * flow,
      size: 1.8 + rng() * 2.5,
      direction: rng() > 0.5 ? 1 : -1,
    };
  });
};

const useCanvasClock = (draw: (timeSec: number) => void) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isRendering } = getRemotionEnvironment();

  const rafRef = React.useRef<number | null>(null);
  const baseTimeRef = React.useRef<number | null>(null);

  React.useLayoutEffect(() => {
    if (!isRendering) return;
    draw(frame / fps);
  }, [draw, fps, frame, isRendering]);

  React.useEffect(() => {
    if (isRendering) return;

    const tick = (timestamp: number) => {
      if (baseTimeRef.current === null) {
        baseTimeRef.current = timestamp;
      }

      const elapsed = (timestamp - baseTimeRef.current) / 1000;
      draw(elapsed);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
      baseTimeRef.current = null;
    };
  }, [draw, isRendering]);
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 11,
  color: 'rgba(220, 220, 220, 0.75)',
};

type ControlsProps = {
  seed: number;
  hue: number;
  saturation: number;
  brightness: number;
  branchDensity: number;
  flowSpeed: number;
  glowIntensity: number;
  onSeed: (value: number) => void;
  onHue: (value: number) => void;
  onSaturation: (value: number) => void;
  onBrightness: (value: number) => void;
  onBranchDensity: (value: number) => void;
  onFlowSpeed: (value: number) => void;
  onGlowIntensity: (value: number) => void;
};

const Controls: React.FC<ControlsProps> = ({
  seed,
  hue,
  saturation,
  brightness,
  branchDensity,
  flowSpeed,
  glowIntensity,
  onSeed,
  onHue,
  onSaturation,
  onBrightness,
  onBranchDensity,
  onFlowSpeed,
  onGlowIntensity,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        right: 18,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 244,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(0,0,0,0.78)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        zIndex: 30,
      }}
    >
      <div
        style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 10,
          letterSpacing: '0.22em',
          color: '#ffffff',
          fontWeight: 700,
        }}
      >
        AI PULSE MASTER
      </div>

      <div>
        <div style={labelStyle}>
          <span>seed</span>
          <span>{seed}</span>
        </div>
        <input type="range" min={1} max={999} step={1} value={seed} onChange={(e) => onSeed(Number(e.target.value))} />
      </div>

      <div>
        <div style={labelStyle}>
          <span>flowSpeed</span>
          <span>{flowSpeed.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={3}
          step={0.01}
          value={flowSpeed}
          onChange={(e) => onFlowSpeed(Number(e.target.value))}
        />
      </div>

      <div>
        <div style={labelStyle}>
          <span>branchDensity</span>
          <span>{branchDensity.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={branchDensity}
          onChange={(e) => onBranchDensity(Number(e.target.value))}
        />
      </div>

      <div>
        <div style={labelStyle}>
          <span>hue</span>
          <span>{Math.round(hue)}</span>
        </div>
        <input type="range" min={0} max={360} step={1} value={hue} onChange={(e) => onHue(Number(e.target.value))} />
      </div>

      <div>
        <div style={labelStyle}>
          <span>saturation</span>
          <span>{saturation.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={saturation}
          onChange={(e) => onSaturation(Number(e.target.value))}
        />
      </div>

      <div>
        <div style={labelStyle}>
          <span>brightness</span>
          <span>{brightness.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.2}
          max={0.8}
          step={0.01}
          value={brightness}
          onChange={(e) => onBrightness(Number(e.target.value))}
        />
      </div>

      <div>
        <div style={labelStyle}>
          <span>glowIntensity</span>
          <span>{Math.round(glowIntensity)}</span>
        </div>
        <input
          type="range"
          min={5}
          max={50}
          step={1}
          value={glowIntensity}
          onChange={(e) => onGlowIntensity(Number(e.target.value))}
        />
      </div>
    </div>
  );
};

export type AIPulseMasterProps = {
  seed: number | string;
  flowSpeed: number;
  branchDensity: number;
  hue?: number;
  saturation?: number;
  brightness?: number;
  glowIntensity?: number;
  branchComplexity?: number;
  title?: string;
  subtitle?: string;
  showControls?: boolean;
};

export const AIPulseMaster: React.FC<AIPulseMasterProps> = ({
  seed,
  flowSpeed,
  branchDensity,
  hue = 39,
  saturation = 1,
  brightness = 0.6,
  glowIntensity = 22,
  branchComplexity,
  title = 'Ai',
  subtitle = 'artificial intelligence',
  showControls = false,
}) => {
  const { width, height } = useVideoConfig();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const initialSeed = typeof seed === 'number' ? seed : hashSeed(seed);

  const [uiSeed, setUiSeed] = React.useState(initialSeed);
  const [uiHue, setUiHue] = React.useState(hue);
  const [uiSat, setUiSat] = React.useState(saturation);
  const [uiBri, setUiBri] = React.useState(brightness);
  const [uiBranchDensity, setUiBranchDensity] = React.useState(branchDensity);
  const [uiFlowSpeed, setUiFlowSpeed] = React.useState(flowSpeed);
  const [uiGlow, setUiGlow] = React.useState(glowIntensity);

  React.useEffect(() => {
    if (!showControls) {
      setUiSeed(initialSeed);
      setUiHue(hue);
      setUiSat(saturation);
      setUiBri(brightness);
      setUiBranchDensity(branchDensity);
      setUiFlowSpeed(flowSpeed);
      setUiGlow(glowIntensity);
    }
  }, [
    branchDensity,
    brightness,
    flowSpeed,
    glowIntensity,
    hue,
    initialSeed,
    saturation,
    showControls,
  ]);

  const activeSeed = showControls ? uiSeed : initialSeed;
  const activeHue = clamp(showControls ? uiHue : hue, 0, 360);
  const activeSat = clamp(showControls ? uiSat : saturation, 0, 1);
  const activeBri = clamp(showControls ? uiBri : brightness, 0.2, 0.8);
  const activeBranchDensity = clamp(showControls ? uiBranchDensity : branchDensity, 0, 1);
  const activeFlow = clamp(showControls ? uiFlowSpeed : flowSpeed, 0.1, 3);
  const activeGlow = clamp(showControls ? uiGlow : glowIntensity, 5, 50);

  const effectiveComplexity = clamp(
    branchComplexity ?? Math.round(1 + activeBranchDensity * 4),
    1,
    5
  );

  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const chipHalfSize = Math.min(width, height) * 0.0463;

  const palette = React.useMemo(() => {
    return buildPalette(activeHue, activeSat, activeBri);
  }, [activeBri, activeHue, activeSat]);

  const rawPaths = React.useMemo(() => {
    return buildCircuits(
      centerX,
      centerY,
      chipHalfSize,
      width,
      height,
      effectiveComplexity,
      activeSeed
    );
  }, [activeSeed, centerX, centerY, chipHalfSize, effectiveComplexity, height, width]);

  const metrics = React.useMemo(() => {
    const pathMetrics: PathMetric[] = [];
    const endpoints: Point[] = [];
    const innerNodes: Point[] = [];

    for (let i = 0; i < rawPaths.length; i += 1) {
      const path = rawPaths[i];
      const metric = toPathMetric(path);
      if (!metric) continue;

      pathMetrics.push(metric);

      const endpoint = path[path.length - 1];
      if (endpoint) endpoints.push(endpoint);

      for (let j = 2; j < path.length - 1; j += 1) {
        innerNodes.push(path[j]);
      }
    }

    return {
      pathMetrics,
      endpoints,
      innerNodes,
      tierA: pathMetrics.filter((path) => path.points.length <= 3),
      tierB: pathMetrics.filter((path) => path.points.length > 3 && path.points.length <= 6),
      tierC: pathMetrics.filter((path) => path.points.length > 6),
    };
  }, [rawPaths]);

  const orbs = React.useMemo(() => {
    return buildOrbs(metrics.pathMetrics.length, effectiveComplexity, activeFlow, activeSeed);
  }, [activeFlow, activeSeed, effectiveComplexity, metrics.pathMetrics.length]);

  const draw = React.useCallback(
    (timeSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const breathing = 0.55 + 0.45 * Math.sin(timeSec * 0.7);

      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowBlur = 0;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);

      const vignette = ctx.createRadialGradient(centerX, centerY, chipHalfSize * 2, centerX, centerY, Math.min(width, height) * 0.8);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.65)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.lineCap = 'square';

      const tiers = [
        { list: metrics.tierA, alpha: 0.5, blur: activeGlow * 0.45, lineWidth: 1.1 },
        { list: metrics.tierB, alpha: 0.22, blur: activeGlow * 0.25, lineWidth: 0.8 },
        { list: metrics.tierC, alpha: 0.1, blur: activeGlow * 0.12, lineWidth: 0.5 },
      ];

      for (let i = 0; i < tiers.length; i += 1) {
        const tier = tiers[i];
        if (tier.list.length === 0) continue;

        ctx.shadowColor = palette.main;
        ctx.shadowBlur = tier.blur * breathing;
        ctx.strokeStyle = palette.rgba(tier.alpha);
        ctx.lineWidth = tier.lineWidth;
        ctx.beginPath();

        for (let j = 0; j < tier.list.length; j += 1) {
          const points = tier.list[j].points;
          if (points.length < 3) continue;

          ctx.moveTo(points[1].x, points[1].y);
          for (let k = 2; k < points.length; k += 1) {
            ctx.lineTo(points[k].x, points[k].y);
          }
        }

        ctx.stroke();
      }

      ctx.shadowColor = palette.main;
      ctx.shadowBlur = activeGlow * 0.7 * breathing;
      ctx.fillStyle = palette.main;
      ctx.beginPath();
      for (let i = 0; i < metrics.endpoints.length; i += 1) {
        const point = metrics.endpoints[i];
        ctx.moveTo(point.x + 2.4, point.y);
        ctx.arc(point.x, point.y, 2.4, 0, Math.PI * 2);
      }
      ctx.fill();

      ctx.shadowBlur = activeGlow * 0.2;
      ctx.fillStyle = palette.rgba(0.4);
      ctx.beginPath();
      for (let i = 0; i < metrics.innerNodes.length; i += 1) {
        const point = metrics.innerNodes[i];
        ctx.moveTo(point.x + 1.4, point.y);
        ctx.arc(point.x, point.y, 1.4, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();

      const chipX = centerX - chipHalfSize;
      const chipY = centerY - chipHalfSize;
      const chipSize = chipHalfSize * 2;

      ctx.save();
      const halo = ctx.createRadialGradient(centerX, centerY, chipHalfSize * 0.3, centerX, centerY, chipHalfSize * 4.2);
      halo.addColorStop(0, palette.rgba(0.18 * breathing));
      halo.addColorStop(1, palette.rgba(0));
      ctx.fillStyle = halo;
      ctx.fillRect(centerX - chipHalfSize * 5, centerY - chipHalfSize * 5, chipHalfSize * 10, chipHalfSize * 10);

      ctx.shadowColor = palette.main;
      ctx.shadowBlur = activeGlow * 2 * breathing;
      ctx.fillStyle = palette.chipBg;
      ctx.fillRect(chipX, chipY, chipSize, chipSize);

      ctx.strokeStyle = palette.main;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = activeGlow * 1.8 * breathing;
      ctx.strokeRect(chipX, chipY, chipSize, chipSize);

      ctx.shadowBlur = activeGlow * 0.5;
      ctx.strokeStyle = palette.rgba(0.5);
      ctx.lineWidth = 1;
      ctx.strokeRect(chipX + 4, chipY + 4, chipSize - 8, chipSize - 8);

      const inner = chipHalfSize * 0.6;
      ctx.shadowBlur = activeGlow * 0.9 * breathing;
      ctx.strokeStyle = palette.sec;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(centerX - inner, centerY - inner, inner * 2, inner * 2);
      ctx.fillStyle = palette.rgba(0.06);
      ctx.fillRect(centerX - inner, centerY - inner, inner * 2, inner * 2);

      const cornerSize = Math.max(5, chipHalfSize * 0.14);
      ctx.fillStyle = palette.main;
      ctx.shadowBlur = activeGlow * breathing;
      const corners: Array<[number, number]> = [
        [chipX - 1, chipY - 1],
        [chipX + chipSize - cornerSize + 1, chipY - 1],
        [chipX - 1, chipY + chipSize - cornerSize + 1],
        [chipX + chipSize - cornerSize + 1, chipY + chipSize - cornerSize + 1],
      ];
      for (let i = 0; i < corners.length; i += 1) {
        const [x, y] = corners[i];
        ctx.fillRect(x, y, cornerSize, cornerSize);
      }

      const pinWidth = Math.max(3, chipHalfSize * 0.1);
      const pinHeight = Math.max(6, chipHalfSize * 0.18);
      ctx.fillStyle = palette.rgba(0.68);
      ctx.shadowBlur = activeGlow * 0.4 * breathing;
      for (let i = 0; i < 7; i += 1) {
        const u = (i + 0.5) / 7;
        const px = chipX + u * chipSize;
        const py = chipY + u * chipSize;

        ctx.fillRect(px - pinWidth / 2, chipY - pinHeight, pinWidth, pinHeight);
        ctx.fillRect(px - pinWidth / 2, chipY + chipSize, pinWidth, pinHeight);
        ctx.fillRect(chipX - pinHeight, py - pinWidth / 2, pinHeight, pinWidth);
        ctx.fillRect(chipX + chipSize, py - pinWidth / 2, pinHeight, pinWidth);
      }
      ctx.restore();

      ctx.save();
      for (let i = 0; i < orbs.length; i += 1) {
        const orb = orbs[i];
        const path = metrics.pathMetrics[orb.pathIndex];
        if (!path) continue;

        let progress = wrap01(orb.phase + timeSec * orb.speed);
        if (orb.direction < 0) {
          progress = 1 - progress;
        }

        const position = samplePath(path, progress);
        const maxDistance = Math.max(Math.abs(position.x - centerX), Math.abs(position.y - centerY));
        if (maxDistance < chipHalfSize * 1.05) continue;

        const fadeIn = clamp((maxDistance - chipHalfSize * 1.05) / (chipHalfSize * 0.6), 0, 1);
        const fadeOut = 1 - Math.pow(progress, 4);
        const alpha = fadeIn * fadeOut;
        if (alpha < 0.02) continue;

        const radius = orb.size;

        ctx.shadowColor = palette.main;
        ctx.shadowBlur = radius * activeGlow * 0.28 * alpha;
        ctx.fillStyle = palette.rgba(alpha * 0.85);
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius * 1.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = palette.rgbaSec(alpha * 0.45);
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius * 2.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255,255,255,${(alpha * 0.9).toFixed(4)})`;
        ctx.shadowBlur = radius * 3;
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
    [
      activeGlow,
      centerX,
      centerY,
      chipHalfSize,
      height,
      metrics.endpoints,
      metrics.innerNodes,
      metrics.pathMetrics,
      metrics.tierA,
      metrics.tierB,
      metrics.tierC,
      orbs,
      palette,
      width,
    ]
  );

  useCanvasClock(draw);

  const accent = `hsl(${Math.round(activeHue)},${Math.round(activeSat * 100)}%,${Math.round(activeBri * 100)}%)`;
  const textShadow = `0 0 ${activeGlow * 0.6}px ${accent}, 0 0 ${activeGlow * 1.2}px ${accent}`;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontFamily: 'Orbitron, system-ui, sans-serif',
            fontWeight: 900,
            fontSize: Math.min(width, height) * 0.052,
            letterSpacing: '0.12em',
            color: accent,
            textShadow,
            animation: 'neonFlicker 3.2s ease-in-out infinite',
            lineHeight: 1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: 'Share Tech Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: Math.min(width, height) * 0.013,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: `hsla(${Math.round(activeHue)},${Math.round(activeSat * 100)}%,${Math.round(activeBri * 100)}%,0.72)`,
            textShadow: `0 0 ${activeGlow * 0.4}px ${accent}`,
            animation: 'neonFlicker 4.5s ease-in-out infinite 1.1s',
            marginTop: 6,
          }}
        >
          {subtitle}
        </div>
      </div>

      {showControls ? (
        <Controls
          seed={uiSeed}
          hue={uiHue}
          saturation={uiSat}
          brightness={uiBri}
          branchDensity={uiBranchDensity}
          flowSpeed={uiFlowSpeed}
          glowIntensity={uiGlow}
          onSeed={setUiSeed}
          onHue={setUiHue}
          onSaturation={setUiSat}
          onBrightness={setUiBri}
          onBranchDensity={setUiBranchDensity}
          onFlowSpeed={setUiFlowSpeed}
          onGlowIntensity={setUiGlow}
        />
      ) : null}

      <style>{`
        @keyframes neonFlicker {
          0%,94%,98%,100% { opacity: 1; }
          95% { opacity: 0.55; }
          96% { opacity: 0.9; }
          97% { opacity: 0.4; }
          99% { opacity: 0.8; }
        }
      `}</style>
    </AbsoluteFill>
  );
};

export default AIPulseMaster;
