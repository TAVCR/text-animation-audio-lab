import { describe, expect, it } from 'vitest';
import { getNeonBulbState, getNeonGridLayout, getNeonPatternSignal } from '@/remotion/backgrounds/neonBulbAlternation';

describe('neon-bulb-alternation', () => {
  it('crea retículas válidas y regularmente espaciadas en formatos comunes', () => {
    for (const [width, height] of [[360, 640], [1280, 720], [800, 800]]) {
      const grid = getNeonGridLayout(width, height, 40);
      expect(grid.rows).toBeGreaterThan(1);
      expect(grid.columns).toBeGreaterThan(1);
      expect(grid.points.every((point) => point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height)).toBe(true);
      expect(new Set(grid.points.map((point) => point.x)).size).toBe(grid.columns);
    }
  });

  it('asigna fases reproducibles y produce alternancia asincrónica', () => {
    const first = getNeonBulbState(7, 0, 30, 1);
    expect(getNeonBulbState(7, 0, 30, 1)).toEqual(first);
    expect(getNeonBulbState(8, 0, 30, 1).phase).not.toBe(first.phase);
    expect(getNeonBulbState(7, 0, 30, 1).colorMix).not.toBe(getNeonBulbState(8, 0, 30, 1).colorMix);
    expect(getNeonBulbState(7, 0, 30, 1).frequency).not.toBe(getNeonBulbState(8, 0, 30, 1).frequency);
  });

  it('produce patrones espaciales deterministas y distintos según su geometría', () => {
    const base = { frame: 12, fps: 30, speed: 1, waveLength: 0.5, angleDegrees: 25, centerX: 0.5, centerY: 0.5, reverse: false };
    const left = { x: 0.15, y: 0.35 };
    const right = { x: 0.85, y: 0.35 };
    const horizontal = getNeonPatternSignal(left, 3, { ...base, pattern: 'horizontal' });
    expect(getNeonPatternSignal(left, 3, { ...base, pattern: 'horizontal' })).toBe(horizontal);
    expect(getNeonPatternSignal(right, 3, { ...base, pattern: 'horizontal' })).not.toBe(horizontal);
    expect(getNeonPatternSignal(left, 3, { ...base, pattern: 'vertical' })).not.toBe(horizontal);
    expect(getNeonPatternSignal(left, 3, { ...base, pattern: 'diagonal-down' })).not.toBe(getNeonPatternSignal(left, 3, { ...base, pattern: 'diagonal-up' }));
    expect(getNeonPatternSignal(left, 3, { ...base, pattern: 'radial' })).not.toBe(getNeonPatternSignal(left, 3, { ...base, pattern: 'spiral' }));
    expect(getNeonPatternSignal(left, 3, { ...base, pattern: 'angular' })).toBeGreaterThanOrEqual(0);
    expect(getNeonPatternSignal(left, 3, { ...base, pattern: 'angular' })).toBeLessThanOrEqual(1);
  });

  it('invierte el viaje temporal sin alterar la geometría', () => {
    const options = { pattern: 'horizontal' as const, frame: 17, fps: 30, speed: 1.3, waveLength: 0.7, angleDegrees: 0, centerX: 0.5, centerY: 0.5 };
    const point = { x: 0.31, y: 0.72 };
    expect(getNeonPatternSignal(point, 4, { ...options, reverse: false })).not.toBe(getNeonPatternSignal(point, 4, { ...options, reverse: true }));
  });

  it('mezcla patrón principal, secundario y asincronía mediante controles independientes', () => {
    const point = { x: 0.22, y: 0.68 };
    const common = { frame: 24, fps: 30, speed: 1, waveLength: 0.6, angleDegrees: 45, centerX: 0.5, centerY: 0.5, reverse: false, secondaryPattern: 'vertical' as const };
    const primary = getNeonPatternSignal(point, 9, { ...common, pattern: 'horizontal', combine: true, patternMix: 0, homogeneity: 1 });
    const secondary = getNeonPatternSignal(point, 9, { ...common, pattern: 'horizontal', combine: true, patternMix: 1, homogeneity: 1 });
    expect(primary).toBe(getNeonPatternSignal(point, 9, { ...common, pattern: 'horizontal', combine: false, patternMix: 1, homogeneity: 1 }));
    expect(secondary).toBe(getNeonPatternSignal(point, 9, { ...common, pattern: 'vertical', combine: false, patternMix: 0, homogeneity: 1 }));
    expect(getNeonPatternSignal(point, 9, { ...common, pattern: 'horizontal', combine: true, patternMix: 0.5, homogeneity: 1 })).toBeCloseTo((primary + secondary) / 2, 10);
    expect(getNeonPatternSignal(point, 9, { ...common, pattern: 'horizontal', combine: false, patternMix: 0, homogeneity: 0 })).not.toBe(primary);
  });
});
