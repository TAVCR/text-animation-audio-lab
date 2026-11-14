import { describe, expect, it } from 'vitest';
import { getPaperCutoutPiece } from '@/remotion/templates/paperCutoutUtils';
import { defaultAnimationProps } from '@/lib/AnimationContext';

describe('paper cutout assemble', () => {
  it('calcula una entrada determinista y converge cada pieza a su destino', () => {
    const first = getPaperCutoutPiece(2, 12, 30, 'paper-cutout-assemble-1');
    const second = getPaperCutoutPiece(2, 12, 30, 'paper-cutout-assemble-1');
    expect(first).toEqual(second);
    expect(getPaperCutoutPiece(2, 30, 30, 'paper-cutout-assemble-1').progress).toBe(1);
    expect(first.rotation).toBeGreaterThanOrEqual(-6);
    expect(first.rotation).toBeLessThanOrEqual(6);
  });

  it('mantiene una levitación acotada y determinista después del asentamiento', () => {
    const first = getPaperCutoutPiece(1, 90, 30, 'paper-cutout-assemble-1', 4, 1);
    const second = getPaperCutoutPiece(1, 90, 30, 'paper-cutout-assemble-1', 4, 1);
    const later = getPaperCutoutPiece(1, 120, 30, 'paper-cutout-assemble-1', 4, 1);
    expect(first.floatY).toBe(second.floatY);
    expect(Math.abs(first.floatY)).toBeLessThanOrEqual(4);
    expect(later.floatY).not.toBe(first.floatY);
    expect(getPaperCutoutPiece(1, 10, 30, 'paper-cutout-assemble-1', 4, 1).floatY).toBe(0);
  });

  it('usa una amplitud predeterminada perceptible en un preview reducido', () => {
    expect(defaultAnimationProps.paperCutoutFloatAmplitudePx).toBeGreaterThanOrEqual(40);
  });
});
