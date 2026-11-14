import { describe, expect, it } from 'vitest';
import { getHalftonePoint, getHalftoneRadius, getHalftoneRadiusRange } from '@/remotion/backgrounds/halftoneWaveField';

describe('halftone-wave-field', () => {
  it('mantiene los centros fijos y mueve solo el radio de la onda', () => {
    const a = getHalftonePoint(4, 7, 28, 30);
    const b = getHalftonePoint(4, 7, 28, 30);
    expect(b).toEqual(a);
    expect(getHalftoneRadius(0, 1, 6, 240, 30, 120, 0)).toBeGreaterThanOrEqual(1);
    expect(getHalftoneRadius(0.5, 1, 6, 240, 30, 120, 0)).not.toBe(getHalftoneRadius(0, 1, 6, 240, 30, 120, 0));
  });

  it('traduce los tamaños globales a un rango visible de radios', () => {
    const small = getHalftoneRadiusRange(1, 8, 1, 6);
    const large = getHalftoneRadiusRange(10, 60, 1, 6);
    expect(large.max).toBeGreaterThan(small.max);
    expect(large.min).toBeGreaterThan(small.min);
  });
});
