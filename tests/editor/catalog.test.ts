import { describe, expect, it } from 'vitest';
import { backgroundCatalog, textTemplateCatalog } from '@/lib/editor/catalog';
import { normalizeTextTemplateId } from '@/lib/editor/selection';

describe('editor catalogs', () => {
  it('contains every text template exactly once', () => {
    const ids = Object.keys(textTemplateCatalog);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain('multi-line-frame');
    expect(textTemplateCatalog.typewriter.name).toBeTruthy();
    expect(textTemplateCatalog['dual-text-layers'].name).toBe('Dual Text Layers');
  });

  it('contains every background exactly once', () => {
    expect(Object.keys(backgroundCatalog)).toHaveLength(41);
    expect(new Set(Object.keys(backgroundCatalog)).size).toBe(41);
    expect(backgroundCatalog['light-orbs'].name).toBeTruthy();
    expect(backgroundCatalog['stellar-depth-field'].name).toBe('Stellar Depth Field');
  });

  it('falls back safely for a retired text template id', () => {
    expect(normalizeTextTemplateId('multi-line-frame')).toBe('typewriter');
    expect(normalizeTextTemplateId('ai-circuit-hud')).toBe('typewriter');
    expect(normalizeTextTemplateId('not-a-template')).toBe('typewriter');
  });
});
