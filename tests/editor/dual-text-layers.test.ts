import { describe, expect, it } from 'vitest';
import { createDisabledSecondaryTextLayer, getCenteredLayerTransform, normalizeTextLayers } from '@/lib/editor/dualTextLayers';
import { defaultAnimationProps } from '@/lib/AnimationContext';

describe('dual text layers model', () => {
  it('normaliza documentos antiguos con una secundaria desactivada', () => {
    const normalized = normalizeTextLayers(defaultAnimationProps);
    expect(normalized.secondaryTextLayer.enabled).toBe(false);
    expect(normalized.secondaryTextLayer.text).toBe('');
    expect(normalized.secondaryTextLayer.positionX).toBe(defaultAnimationProps.textPositionX);
    expect(normalized.secondaryTextLayer.positionY).toBe(defaultAnimationProps.textPositionY);
  });

  it('conserva X/Y y configuración secundaria al normalizar', () => {
    const normalized = normalizeTextLayers({ ...defaultAnimationProps, secondaryTextLayer: { ...createDisabledSecondaryTextLayer(defaultAnimationProps), enabled: true, text: 'BACK', positionX: -120, positionY: 80, templateOptions: { seed: 's1' } } });
    expect(normalized.secondaryTextLayer).toMatchObject({ enabled: true, text: 'BACK', positionX: -120, positionY: 80, templateOptions: { seed: 's1' } });
  });

  it('mantiene un constructor secundario sin efectos colaterales sobre la primaria', () => {
    const secondary = createDisabledSecondaryTextLayer(defaultAnimationProps);
    expect(secondary.enabled).toBe(false);
    expect(defaultAnimationProps.text).not.toBe(secondary.text);
  });

  it('centra cada capa cuando X e Y son cero', () => {
    expect(getCenteredLayerTransform(0, 0)).toEqual({ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' });
    expect(getCenteredLayerTransform(80, -40)).toEqual({ left: '50%', top: '50%', transform: 'translate(calc(-50% + 80px), calc(-50% - 40px))' });
  });
});
