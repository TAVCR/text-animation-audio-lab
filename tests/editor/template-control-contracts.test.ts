import { describe, expect, it } from 'vitest';
import { backgroundCatalog, textTemplateCatalog } from '@/lib/editor/catalog';
import { backgroundControlContracts, textControlContracts } from '@/lib/editor/templateControlContracts';

describe('contratos exhaustivos del catálogo', () => {
  it('cubre cada plantilla de texto y cada fondo sin IDs huérfanos', () => {
    expect(Object.keys(textControlContracts).sort()).toEqual(Object.keys(textTemplateCatalog).sort());
    expect(Object.keys(backgroundControlContracts).sort()).toEqual(Object.keys(backgroundCatalog).sort());
  });

  it('describe cada control numérico con rango, paso, default y consumidor', () => {
    for (const contract of [...Object.values(textControlContracts), ...Object.values(backgroundControlContracts)]) {
      for (const control of contract.controls) {
        expect(control.renderer).toBeTruthy();
        if (control.type === 'number') {
          const min = control.min;
          const max = control.max;
          const step = control.step;
          const defaultValue = control.default;
          if (min === undefined || max === undefined || step === undefined || typeof defaultValue !== 'number') {
            throw new Error(`Contrato numérico incompleto: ${control.key}`);
          }
          expect(Number.isFinite(min)).toBe(true);
          expect(Number.isFinite(max)).toBe(true);
          expect(min).toBeLessThanOrEqual(max);
          expect(step).toBeGreaterThan(0);
          expect(defaultValue).toBeGreaterThanOrEqual(min);
          expect(defaultValue).toBeLessThanOrEqual(max);
        }
      }
    }
  });

  it('marca los videos importados como recursos sin controles de características', () => {
    for (const id of ['imported-video-1', 'imported-video-2', 'imported-video-3', 'imported-video-4', 'imported-video-5', 'imported-video-6'] as const) {
      expect(backgroundControlContracts[id].immutableResource).toBe(true);
      expect(backgroundControlContracts[id].controls).toEqual([]);
    }
  });
});
