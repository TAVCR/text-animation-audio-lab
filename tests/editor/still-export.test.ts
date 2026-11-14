import { describe, expect, it } from 'vitest';
import { normalizeStillFrame } from '@/lib/editor/stillExport';

describe('captura PNG del fotograma pausado', () => {
  it('redondea y limita el frame al rango de la composición', () => {
    expect(normalizeStillFrame(17.6, 120)).toBe(18);
    expect(normalizeStillFrame(-4, 120)).toBe(0);
    expect(normalizeStillFrame(999, 120)).toBe(119);
  });

  it('usa el último frame para una entrada no finita', () => {
    expect(normalizeStillFrame(Number.NaN, 120)).toBe(119);
  });
});
