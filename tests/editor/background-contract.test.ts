import { describe, expect, it } from 'vitest';
import { defaultAnimationProps } from '@/lib/AnimationContext';
import { backgroundCatalog } from '@/lib/editor/catalog';
import { ParticleBackground } from '@/remotion/backgrounds/ParticleBackground';
import { RetroGridForward3D } from '@/remotion/backgrounds/RetroGridForward3D';
import { SphereParticleBackground3D } from '@/remotion/backgrounds/SphereParticleBackground3D';

const numericDefaults = Object.entries(defaultAnimationProps).filter(([, value]) => typeof value === 'number');

describe('contrato común de fondos F4', () => {
  it.each(Object.keys(backgroundCatalog))('%s tiene descriptor válido y consumidor de render', (id) => {
    const descriptor = backgroundCatalog[id as keyof typeof backgroundCatalog];
    expect(descriptor.id).toBe(id);
    expect(descriptor.name.trim()).not.toBe('');
    expect(descriptor.capabilities).toContain('background');
    expect(descriptor.ownKeys).toEqual(Array.from(new Set(descriptor.ownKeys)));
    expect(ParticleBackground).toEqual(expect.any(Function));
    for (const [, value] of numericDefaults) expect(Number.isFinite(value)).toBe(true);
  });

  it('mantiene resolubles las ramas especiales de canvas y Three', () => {
    expect(SphereParticleBackground3D).toEqual(expect.any(Function));
    expect(RetroGridForward3D).toEqual(expect.any(Function));
  });

    it('contiene exactamente 41 fondos activos y todos son únicos', () => {
    const ids = Object.keys(backgroundCatalog);
      expect(ids).toHaveLength(41);
      expect(new Set(ids).size).toBe(41);
  });
});
