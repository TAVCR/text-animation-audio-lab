import { describe, expect, it } from 'vitest';
import { resolveCrystalOpacity, resolveCrystalShardScale } from '@/remotion/backgrounds/crystalAppearance';

describe('opacidad de Crystal Shards 3D', () => {
  it('conserva el valor seleccionado y activa transparencia cuando corresponde', () => {
    expect(resolveCrystalOpacity(0.35)).toEqual({ opacity: 0.35, transparent: true });
  });

  it('deriva la escala de los cristales desde tamaño mínimo y máximo', () => {
    expect(resolveCrystalShardScale(10, 20, 0)).toBeLessThan(resolveCrystalShardScale(40, 60, 1));
  });
});
