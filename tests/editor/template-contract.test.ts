import { describe, expect, it } from 'vitest';
import { defaultAnimationProps } from '@/lib/AnimationContext';
import { textTemplateCatalog } from '@/lib/editor/catalog';
import { templateRegistry } from '@/remotion/templates/registry';

const numericPropNames = Object.keys(defaultAnimationProps).filter((key) => typeof defaultAnimationProps[key as keyof typeof defaultAnimationProps] === 'number');

describe('contrato común de plantillas de texto', () => {
  it.each(Object.keys(textTemplateCatalog))('%s tiene registro, descriptor y defaults seguros', (id) => {
    const descriptor = textTemplateCatalog[id as keyof typeof textTemplateCatalog];
    const component = templateRegistry[id as keyof typeof templateRegistry];

    expect(descriptor.id).toBe(id);
    expect(descriptor.name.trim()).not.toBe('');
    expect(component).toEqual(expect.any(Function));
    expect(descriptor.ownKeys).toEqual(Array.from(new Set(descriptor.ownKeys)));
    expect(descriptor.capabilities).toContain('text');
    expect(defaultAnimationProps.text).toBeTypeOf('string');
    for (const key of numericPropNames) expect(Number.isFinite(defaultAnimationProps[key as keyof typeof defaultAnimationProps] as number)).toBe(true);
  });

  it('no declara controles contextuales sin una clave de consumidor', () => {
    const allKeys = Object.values(textTemplateCatalog).flatMap((entry) => entry.ownKeys);
    expect(allKeys).toEqual(Array.from(new Set(allKeys)));
    expect(Object.keys(templateRegistry).sort()).toEqual(Object.keys(textTemplateCatalog).sort());
  });
});
