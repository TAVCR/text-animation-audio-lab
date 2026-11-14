import React from 'react';
import { AbsoluteFill, getRemotionEnvironment, useCurrentFrame, useVideoConfig } from 'remotion';

type Point = {
  x: number;
  y: number;
};

type Segment = {
  from: Point;
  to: Point;
};

type SegmentMetric = {
  from: Point;
  to: Point;
  length: number;
};

type PathMetric = {
  points: Point[];
  segments: SegmentMetric[];
  totalLength: number;
};

type CircuitLayout = {
  segments: Segment[];
  paths: PathMetric[];
  particleLimit: number;
};

type Particle = {
  pathIndex: number;
  phase: number;
  speed: number;
  size: number;
  alpha: number;
  trail: number;
  direction: 1 | -1;
};

type DirectionIndex = 0 | 1 | 2 | 3;

type GridNode = {
  id: number;
  x: number;
  y: number;
  parentId: number | null;
  direction: DirectionIndex | null;
  depth: number;
  children: number[];
};

const DIRECTIONS: ReadonlyArray<{ x: number; y: number }> = [
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

const coordKey = (x: number, y: number): string => `${x},${y}`;

const edgeKey = (ax: number, ay: number, bx: number, by: number): string => {
  if (ax < bx || (ax === bx && ay <= by)) {
    return `${ax},${ay}|${bx},${by}`;
  }
  return `${bx},${by}|${ax},${ay}`;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const normalized = hex.trim().replace('#', '');

  if (normalized.length === 3) {
    const r = Number.parseInt(normalized[0] + normalized[0], 16);
    const g = Number.parseInt(normalized[1] + normalized[1], 16);
    const b = Number.parseInt(normalized[2] + normalized[2], 16);
    return {
      r: Number.isFinite(r) ? r : 87,
      g: Number.isFinite(g) ? g : 245,
      b: Number.isFinite(b) ? b : 255,
    };
  }

  const safe = normalized.padEnd(6, '0').slice(0, 6);
  const r = Number.parseInt(safe.slice(0, 2), 16);
  const g = Number.parseInt(safe.slice(2, 4), 16);
  const b = Number.parseInt(safe.slice(4, 6), 16);

  return {
    r: Number.isFinite(r) ? r : 87,
    g: Number.isFinite(g) ? g : 245,
    b: Number.isFinite(b) ? b : 255,
  };
};

const toRgba = (rgb: { r: number; g: number; b: number }, alpha: number): string => {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clamp(alpha, 0, 1)})`;
};

const buildPathMetric = (points: Point[]): PathMetric | null => {
  if (points.length < 2) {
    return null;
  }

  const segments: SegmentMetric[] = [];
  let totalLength = 0;

  for (let i = 0; i < points.length - 1; i += 1) {
    const from = points[i];
    const to = points[i + 1];
    const length = Math.hypot(to.x - from.x, to.y - from.y);

    if (length <= 0) {
      continue;
    }

    segments.push({ from, to, length });
    totalLength += length;
  }

  if (totalLength <= 0 || segments.length === 0) {
    return null;
  }

  return {
    points,
    segments,
    totalLength,
  };
};

const samplePath = (path: PathMetric, progress: number): Point => {
  const target = wrap01(progress) * path.totalLength;
  let walked = 0;

  for (let i = 0; i < path.segments.length; i += 1) {
    const segment = path.segments[i];
    const next = walked + segment.length;

    if (target <= next) {
      const local = (target - walked) / segment.length;
      return {
        x: segment.from.x + (segment.to.x - segment.from.x) * local,
        y: segment.from.y + (segment.to.y - segment.from.y) * local,
      };
    }

    walked = next;
  }

  return path.points[path.points.length - 1] ?? { x: 0, y: 0 };
};

const buildCircuitLayout = (
  width: number,
  height: number,
  seed: number | string,
  branchDensity: number
): CircuitLayout => {
  const density = clamp(branchDensity, 0, 1);
  const seedValue = hashSeed(seed);
  const rng = createRng(seedValue ^ 0x9e3779b9);

  const maxSegments = clamp(Math.round(96 + density * 224), 72, 320);
  const maxDepth = clamp(Math.round(7 + density * 11), 6, 18);
  const radiusY = clamp(Math.round(6 + density * 10), 5, 16);
  const radiusX = clamp(Math.round(radiusY * (width / Math.max(1, height))), 6, 28);

  const nodes = new Map<number, GridNode>();
  const occupied = new Map<string, number>();
  const edges = new Set<string>();
  const frontier: number[] = [];

  let nodeId = 0;
  let segmentCount = 0;

  const root: GridNode = {
    id: nodeId,
    x: 0,
    y: 0,
    parentId: null,
    direction: null,
    depth: 0,
    children: [],
  };

  nodes.set(root.id, root);
  occupied.set(coordKey(0, 0), root.id);

  const inBounds = (x: number, y: number): boolean => {
    return Math.abs(x) <= radiusX && Math.abs(y) <= radiusY;
  };

  const tryGrow = (fromId: number, direction: DirectionIndex, maxRunLength: number): number | null => {
    let currentId = fromId;
    let progressed = false;
    const runLength = 1 + Math.floor(rng() * Math.max(1, maxRunLength));

    for (let step = 0; step < runLength; step += 1) {
      if (segmentCount >= maxSegments) break;

      const current = nodes.get(currentId);
      if (!current) break;
      if (current.depth >= maxDepth) break;

      const dir = DIRECTIONS[direction];
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;

      if (!inBounds(nx, ny)) break;
      if (occupied.has(coordKey(nx, ny))) break;

      const edge = edgeKey(current.x, current.y, nx, ny);
      if (edges.has(edge)) break;

      nodeId += 1;
      const next: GridNode = {
        id: nodeId,
        x: nx,
        y: ny,
        parentId: current.id,
        direction,
        depth: current.depth + 1,
        children: [],
      };

      nodes.set(next.id, next);
      occupied.set(coordKey(nx, ny), next.id);
      edges.add(edge);
      segmentCount += 1;

      current.children.push(next.id);
      currentId = next.id;
      progressed = true;
    }

    return progressed ? currentId : null;
  };

  for (let direction = 0; direction < 4; direction += 1) {
    const baseRun = 3 + Math.floor(density * 2) + Math.floor(rng() * 2);
    const tip = tryGrow(root.id, direction as DirectionIndex, baseRun);
    if (tip !== null) {
      frontier.push(tip);
    }
  }

  while (frontier.length > 0 && segmentCount < maxSegments) {
    const index = Math.floor(rng() * frontier.length);
    const [nodeRef] = frontier.splice(index, 1);

    const node = nodes.get(nodeRef);
    if (!node || node.direction === null || node.depth >= maxDepth) {
      continue;
    }

    const straight = node.direction;
    const left = ((straight + 3) % 4) as DirectionIndex;
    const right = ((straight + 1) % 4) as DirectionIndex;

    const depthFactor = 1 - node.depth / (maxDepth + 1);
    const continueChance = clamp(0.4 + density * 0.45 + depthFactor * 0.2, 0.2, 0.95);
    const branchChance = clamp(0.08 + density * 0.55, 0.05, 0.8);

    const straightRun = 1 + Math.floor(rng() * (2 + density * 2));
    const branchRun = 1 + Math.floor(rng() * (1 + density * 2));

    if (rng() < continueChance) {
      const tip = tryGrow(node.id, straight, straightRun);
      if (tip !== null) frontier.push(tip);
    }

    if (rng() < branchChance) {
      const tip = tryGrow(node.id, left, branchRun);
      if (tip !== null) frontier.push(tip);
    }

    if (rng() < branchChance) {
      const tip = tryGrow(node.id, right, branchRun);
      if (tip !== null) frontier.push(tip);
    }
  }

  const allNodes = Array.from(nodes.values());
  const step = Math.max(
    6,
    Math.min(width * 0.92 / Math.max(2, radiusX * 2 + 2), height * 0.92 / Math.max(2, radiusY * 2 + 2))
  );
  const centerX = width * 0.5;
  const centerY = height * 0.5;

  const toPixel = (x: number, y: number): Point => ({
    x: centerX + x * step,
    y: centerY + y * step,
  });

  const segments: Segment[] = [];

  for (let i = 0; i < allNodes.length; i += 1) {
    const node = allNodes[i];
    if (node.parentId === null) continue;

    const parent = nodes.get(node.parentId);
    if (!parent) continue;

    segments.push({
      from: toPixel(parent.x, parent.y),
      to: toPixel(node.x, node.y),
    });
  }

  const leaves = allNodes.filter((node) => node.id !== root.id && node.children.length === 0);
  const rawPaths: Array<{ metric: PathMetric; id: number }> = [];

  for (let i = 0; i < leaves.length; i += 1) {
    const leaf = leaves[i];
    const pathNodes: GridNode[] = [];

    let cursor: GridNode | undefined = leaf;

    while (cursor) {
      pathNodes.push(cursor);
      if (cursor.parentId === null) break;
      cursor = nodes.get(cursor.parentId);
    }

    pathNodes.reverse();

    const points = pathNodes.map((point) => toPixel(point.x, point.y));
    const metric = buildPathMetric(points);
    if (metric) {
      rawPaths.push({ metric, id: leaf.id });
    }
  }

  const pathLimit = clamp(Math.round(36 + density * 64), 24, 80);
  rawPaths.sort((a, b) => {
    if (b.metric.totalLength !== a.metric.totalLength) {
      return b.metric.totalLength - a.metric.totalLength;
    }

    return a.id - b.id;
  });

  const paths = rawPaths.slice(0, pathLimit).map((entry) => entry.metric);

  const particleLimit = clamp(Math.round(42 + density * 170 + segments.length * 0.24), 36, 220);

  return {
    segments,
    paths,
    particleLimit,
  };
};

const buildParticles = (
  paths: PathMetric[],
  seed: number | string,
  branchDensity: number,
  lineWidth: number,
  particleLimit: number
): Particle[] => {
  if (paths.length === 0 || particleLimit <= 0) {
    return [];
  }

  const density = clamp(branchDensity, 0, 1);
  const rng = createRng(hashSeed(seed) ^ 0x85ebca6b);

  const targetCount = clamp(Math.round(34 + density * 128 + paths.length * 0.4), 28, particleLimit);

  const cumulative: number[] = [];
  let totalLength = 0;

  for (let i = 0; i < paths.length; i += 1) {
    totalLength += paths[i].totalLength;
    cumulative.push(totalLength);
  }

  const pickPathIndex = (): number => {
    if (totalLength <= 0) {
      return Math.floor(rng() * paths.length);
    }

    const value = rng() * totalLength;
    for (let i = 0; i < cumulative.length; i += 1) {
      if (value <= cumulative[i]) {
        return i;
      }
    }

    return cumulative.length - 1;
  };

  return Array.from({ length: targetCount }, () => {
    const widthFactor = clamp(lineWidth, 0.6, 4);

    return {
      pathIndex: pickPathIndex(),
      phase: rng(),
      speed: 0.08 + rng() * 0.26,
      size: 0.9 + rng() * (1.4 + widthFactor * 0.5),
      alpha: 0.4 + rng() * 0.6,
      trail: 0.01 + rng() * 0.03,
      direction: rng() > 0.5 ? 1 : -1,
    };
  });
};

export type ProceduralCircuitProps = {
  seed: number | string;
  flowSpeed: number;
  branchDensity: number;
  glowColor: string;
  lineWidth: number;
};

export const ProceduralCircuit: React.FC<ProceduralCircuitProps> = ({
  seed,
  flowSpeed,
  branchDensity,
  glowColor,
  lineWidth,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const { isRendering } = getRemotionEnvironment();

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rafRef = React.useRef<number | null>(null);
  const baseTimeRef = React.useRef<number | null>(null);

  const safeFlowSpeed = clamp(flowSpeed, 0.05, 4);
  const safeDensity = clamp(branchDensity, 0, 1);
  const safeLineWidth = clamp(lineWidth, 0.5, 6);
  const glowRgb = React.useMemo(() => hexToRgb(glowColor), [glowColor]);

  const layout = React.useMemo(() => {
    return buildCircuitLayout(width, height, seed, safeDensity);
  }, [height, safeDensity, seed, width]);

  const particles = React.useMemo(() => {
    return buildParticles(layout.paths, seed, safeDensity, safeLineWidth, layout.particleLimit);
  }, [layout.particleLimit, layout.paths, safeDensity, safeLineWidth, seed]);

  const draw = React.useCallback(
    (timeSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      const breathing = 0.65 + 0.35 * Math.sin(timeSec * 1.8);
      const baseLineAlpha = clamp(0.12 + safeDensity * 0.18, 0.08, 0.32);

      ctx.strokeStyle = toRgba(glowRgb, baseLineAlpha);
      ctx.lineWidth = safeLineWidth;
      ctx.beginPath();
      for (let i = 0; i < layout.segments.length; i += 1) {
        const segment = layout.segments[i];
        ctx.moveTo(segment.from.x, segment.from.y);
        ctx.lineTo(segment.to.x, segment.to.y);
      }
      ctx.stroke();

      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i];
        const path = layout.paths[particle.pathIndex];
        if (!path) continue;

        let progress = wrap01(timeSec * safeFlowSpeed * particle.speed + particle.phase);
        if (particle.direction < 0) {
          progress = 1 - progress;
        }

        const pos = samplePath(path, progress);
        const prev = samplePath(path, progress - particle.trail * safeFlowSpeed);
        const flicker = 0.66 + 0.34 * Math.sin(timeSec * 6 + particle.phase * Math.PI * 2);
        const alpha = clamp(particle.alpha * flicker * breathing, 0.08, 1);

        ctx.strokeStyle = toRgba(glowRgb, alpha * 0.44);
        ctx.lineWidth = safeLineWidth * 0.75 + particle.size * 0.85;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        ctx.shadowBlur = 7 + particle.size * 5.5;
        ctx.shadowColor = toRgba(glowRgb, 0.95);
        ctx.fillStyle = toRgba(glowRgb, alpha);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      const centerPulse = 0.92 + 0.08 * Math.sin(timeSec * 2.4);
      const centerRadius = Math.max(3.5, 4.5 + safeLineWidth * 0.9);
      ctx.shadowBlur = 22;
      ctx.shadowColor = toRgba(glowRgb, 0.9);
      ctx.fillStyle = toRgba(glowRgb, 0.52 * centerPulse);
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.5, centerRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
    [glowRgb, height, layout.paths, layout.segments, particles, safeDensity, safeFlowSpeed, safeLineWidth, width]
  );

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

      const elapsedSec = (timestamp - baseTimeRef.current) / 1000;
      draw(elapsedSec);
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

  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent', overflow: 'hidden' }}>
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
          backgroundColor: 'transparent',
        }}
      />
    </AbsoluteFill>
  );
};
