import { describe, expect, it } from 'vitest';
import { getInkStampCoverage, getInkStampDepthProgress, getInkStampDepthProjection, getInkStampDepthZ, getInkStampProgress, getInkStampScale, getInkStampStartsFromFront } from '@/remotion/templates/inkStampUtils';
import { defaultAnimationProps } from '@/lib/AnimationContext';

describe('ink stamp print', () => {
  it('converge a una transferencia estable y determinista', () => {
    expect(getInkStampProgress(3, 6)).toBe(0.5);
    expect(getInkStampProgress(6, 6)).toBe(1);
    expect(getInkStampProgress(90, 6)).toBe(1);
  });

  it('usa una intensidad predeterminada agresiva', () => {
    expect(defaultAnimationProps.inkStampPressure).toBeGreaterThanOrEqual(1.25);
  });

  it('inicia desde el fondo por defecto', () => {
    expect(defaultAnimationProps.inkStampFromFront).toBe(false);
  });

  it('usa una inclinación inicial pronunciada', () => {
    expect(defaultAnimationProps.inkStampInitialAngle).toBeGreaterThanOrEqual(15);
  });

  it('define escalas inicial y final para controlar la profundidad', () => {
    expect(defaultAnimationProps.inkStampStartScale).toBeLessThan(1);
    expect(defaultAnimationProps.inkStampEndScale).toBeGreaterThanOrEqual(1);
  });

  it('define levitación posterior controlable', () => {
    expect(defaultAnimationProps.inkStampFloatAmplitudePx).toBeGreaterThan(0);
    expect(defaultAnimationProps.inkStampFloatSpeed).toBeGreaterThan(0);
  });

  it('mantiene la trayectoria de tamaño y separa la dirección de profundidad', () => {
    expect(getInkStampScale(0, 0.4, 1, true)).toBe(0.4);
    expect(getInkStampScale(1, 0.4, 1, true)).toBe(1);
    expect(getInkStampScale(0, 0.4, 1, false)).toBe(0.4);
    expect(getInkStampScale(1, 0.4, 1, false)).toBe(1);
  });

  it('aplica cobertura real a la densidad del sello', () => {
    expect(getInkStampCoverage(1, 0.25)).toBe(0.25);
    expect(getInkStampCoverage(1, 1)).toBe(1);
  });

  it('deduce el lado de origen Z solamente a partir de los tamaños', () => {
    expect(getInkStampStartsFromFront(0.3, 1)).toBe(false);
    expect(getInkStampDepthZ(0, 1.5, getInkStampStartsFromFront(0.3, 1))).toBeLessThan(0);
    expect(getInkStampStartsFromFront(1, 0.3)).toBe(true);
    expect(getInkStampDepthZ(0, 1.5, getInkStampStartsFromFront(1, 0.3))).toBeGreaterThan(0);
    expect(getInkStampDepthZ(1, 1.5, getInkStampStartsFromFront(0.3, 1))).toBe(0);
    expect(getInkStampDepthZ(1, 1.5, getInkStampStartsFromFront(1, 0.3))).toBe(0);
  });

  it('proyecta visualmente la profundidad positiva y negativa en sentidos opuestos', () => {
    expect(getInkStampDepthProjection(600)).toBeGreaterThan(1);
    expect(getInkStampDepthProjection(-600)).toBeLessThan(1);
  });

  it('mantiene el mismo progreso de tamaño al invertir el origen de profundidad', () => {
    expect(getInkStampDepthProgress(0, false)).toBe(0);
    expect(getInkStampDepthProgress(1, false)).toBe(1);
    expect(getInkStampDepthProgress(0, true)).toBe(0);
    expect(getInkStampDepthProgress(1, true)).toBe(1);
    expect(getInkStampScale(0, 0.3, 1.2, false)).toBe(0.3);
    expect(getInkStampScale(1, 0.3, 1.2, true)).toBe(1.2);
  });
});
