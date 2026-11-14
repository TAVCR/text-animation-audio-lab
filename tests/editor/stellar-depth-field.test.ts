import { describe, expect, it } from 'vitest';
import {
  createStellarParticle,
  getDepthBlur,
  getStellarColor,
  projectStellarParticle,
  type StellarProjectionOptions,
} from '@/remotion/backgrounds/stellarDepthField';

const options = (overrides: Partial<StellarProjectionOptions> = {}): StellarProjectionOptions => ({
  width: 1920,
  height: 1080,
  frame: 45,
  fps: 30,
  depth: 1.6,
  perspective: 1.25,
  parallax: 0.55,
  motionMode: 'drift-advance',
  speed: 0.7,
  driftAngle: 25,
  cameraMotion: 0.25,
  sway: 0.2,
  rotation: 0.08,
  zSpeed: 0.45,
  size: 2.4,
  sizeVariation: 0.55,
  brightness: 1,
  twinkle: 0.2,
  dof: 0.35,
  focusPlane: 0.55,
  depthFog: 0.3,
  ...overrides,
});

describe('Stellar Depth Field spatial model', () => {
  it('genera la misma partícula para el mismo seed e índice y otra para un seed distinto', () => {
    const first = createStellarParticle(42, 7, 'balanced');
    expect(createStellarParticle(42, 7, 'balanced')).toEqual(first);
    expect(createStellarParticle(43, 7, 'balanced')).not.toEqual(first);
  });

  it('proyecta partículas cercanas mayores y con más respuesta de parallax que las lejanas', () => {
    const base = createStellarParticle(9, 2, 'uniform');
    const near = projectStellarParticle({ ...base, z: 0.12 }, options({ cameraMotion: 0 }), 0);
    const far = projectStellarParticle({ ...base, z: 0.88 }, options({ cameraMotion: 0 }), 0);
    expect(near.scale).toBeGreaterThan(far.scale);

    const nearMoved = projectStellarParticle({ ...base, z: 0.12 }, options({ cameraMotion: 1 }), 0);
    const farMoved = projectStellarParticle({ ...base, z: 0.88 }, options({ cameraMotion: 1 }), 0);
    expect(Math.abs(nearMoved.x - near.x)).toBeGreaterThan(Math.abs(farMoved.x - far.x));
  });

  it('una perspectiva mayor amplía la separación visual near/far', () => {
    const base = createStellarParticle(12, 3, 'uniform');
    const lowNear = projectStellarParticle({ ...base, z: 0.15 }, options({ perspective: 0.55 }), 0);
    const lowFar = projectStellarParticle({ ...base, z: 0.85 }, options({ perspective: 0.55 }), 0);
    const highNear = projectStellarParticle({ ...base, z: 0.15 }, options({ perspective: 2.2 }), 0);
    const highFar = projectStellarParticle({ ...base, z: 0.85 }, options({ perspective: 2.2 }), 0);
    expect(highNear.scale / highFar.scale).toBeGreaterThan(lowNear.scale / lowFar.scale);
  });

  it('calcula foco mínimo en el plano elegido y desactiva la modulación con DOF cero', () => {
    expect(getDepthBlur(0.5, 0.5, 1)).toBe(0);
    expect(getDepthBlur(0.1, 0.5, 1)).toBeGreaterThan(getDepthBlur(0.4, 0.5, 1));
    expect(getDepthBlur(0.1, 0.5, 0)).toBe(0);
  });

  it('mantiene brillo temporal estable con centelleo cero y usa fases distintas al activarlo', () => {
    const a = createStellarParticle(5, 1, 'balanced');
    const b = createStellarParticle(5, 2, 'balanced');
    const stableA = projectStellarParticle(a, options({ frame: 0, twinkle: 0, motionMode: 'drift', speed: 0 }), 0);
    const stableB = projectStellarParticle(a, options({ frame: 90, twinkle: 0, motionMode: 'drift', speed: 0 }), 0);
    expect(stableB.brightness).toBe(stableA.brightness);
    const twinkleA = projectStellarParticle(a, options({ frame: 45, twinkle: 1 }), 0);
    const twinkleB = projectStellarParticle(b, options({ frame: 45, twinkle: 1 }), 0);
    expect(twinkleA.twinkle).not.toBe(twinkleB.twinkle);
  });

  it('produce movimientos distinguibles y deterministas por modo', () => {
    const particle = createStellarParticle(21, 8, 'balanced');
    const drift = projectStellarParticle(particle, options({ motionMode: 'drift' }), 0);
    const advance = projectStellarParticle(particle, options({ motionMode: 'advance' }), 0);
    const orbit = projectStellarParticle(particle, options({ motionMode: 'orbit' }), 0);
    const combined = projectStellarParticle(particle, options({ motionMode: 'drift-advance' }), 0);
    expect(new Set([drift.x, advance.x, orbit.x, combined.x]).size).toBeGreaterThan(2);
    expect(projectStellarParticle(particle, options({ motionMode: 'orbit' }), 0)).toEqual(orbit);
  });

  it('recicla Z de forma determinista sin depender de frames anteriores', () => {
    const particle = { ...createStellarParticle(32, 4, 'uniform'), z: 0.98 };
    const later = projectStellarParticle(particle, options({ frame: 600, motionMode: 'advance', zSpeed: 2 }), 0);
    expect(later.z).toBeGreaterThanOrEqual(0);
    expect(later.z).toBeLessThan(1);
    expect(projectStellarParticle(particle, options({ frame: 600, motionMode: 'advance', zSpeed: 2 }), 0)).toEqual(later);
    expect(projectStellarParticle(particle, options({ frame: 120, motionMode: 'advance', zSpeed: 2 }), 0)).not.toEqual(later);
  });

  it.each([[1920, 1080], [1080, 1920], [1080, 1080]])('mantiene cobertura normalizada en %sx%s', (width, height) => {
    const projected = Array.from({ length: 80 }, (_, index) => projectStellarParticle(createStellarParticle(88, index, 'balanced'), options({ width, height }), index));
    expect(projected.some((point) => point.x > 0 && point.x < width && point.y > 0 && point.y < height)).toBe(true);
    expect(projected.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.scale))).toBe(true);
  });

  it('genera modos cromáticos astronómicos reproducibles sin arcoíris', () => {
    expect(getStellarColor('monochrome', '#abcdef', '#fedcba', 0.8, 0.5)).toBe('#abcdef');
    expect(getStellarColor('bicolor', '#0000ff', '#ff0000', 0, 0.5)).toBe('#0000ff');
    expect(getStellarColor('bicolor', '#0000ff', '#ff0000', 1, 0.5)).toBe('#ff0000');
    expect(getStellarColor('temperature', '#000000', '#ffffff', 0.1, 1)).toMatch(/^#[0-9a-f]{6}$/i);
    expect(getStellarColor('temperature', '#000000', '#ffffff', 0.9, 1)).not.toBe(getStellarColor('temperature', '#000000', '#ffffff', 0.1, 1));
  });
});
