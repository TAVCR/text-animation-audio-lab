import { describe, expect, it } from 'vitest';
import { BACKUP_BEFORE_V2_KEY, migrateV1ToV2 } from '@/lib/editor/persistence';
import { normalizeTextTemplateId } from '@/lib/editor/selection';
import { serializeEditorStorage, deserializeEditorStorage } from '@/lib/editor/persistence';

describe('v1 to v2 migration', () => {
  it('backs up legacy data before writing v2 and is idempotent', () => {
    const map = new Map([['legacy', JSON.stringify({ animationStyle: 'glitch', particlePreset: 'stars' })]]);
    const storage = { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => map.set(key, value) };
    const first = migrateV1ToV2(storage, 'legacy', 'current');
    const second = migrateV1ToV2(storage, 'legacy', 'current');
    expect(first).toMatchObject({ ok: true, migrated: true, state: { textTemplateId: 'glitch', backgroundId: 'stars' } });
    expect(second).toMatchObject({ ok: true, migrated: false });
    expect(map.has(BACKUP_BEFORE_V2_KEY)).toBe(true);
  });

  it('keeps legacy data and reports storage failure', () => {
    const raw = JSON.stringify({ animationStyle: 'glitch' });
    const storage = { getItem: (key: string) => key === 'legacy' ? raw : null, setItem: () => { throw new Error('quota'); } };
    expect(migrateV1ToV2(storage, 'legacy', 'current')).toMatchObject({ ok: false });
    expect(storage.getItem('legacy')).toBe(raw);
  });

  it('migra un preset antiguo retirado a una plantilla válida sin excepción', () => {
    const payload = serializeEditorStorage({ textTemplateId: 'multi-line-frame', backgroundId: 'neon-bulb' });
    const loaded = deserializeEditorStorage(payload);
    expect(() => normalizeTextTemplateId(loaded?.textTemplateId)).not.toThrow();
    expect(normalizeTextTemplateId(loaded?.textTemplateId)).toBe('typewriter');
    expect(loaded?.backgroundId).toBe('neon-bulb');
    expect(payload).not.toContain('fallbackUsed');
    expect(payload).not.toContain('videoId');
  });

  it('rechaza campos desconocidos con estado malformado sin romper la carga', () => {
    expect(deserializeEditorStorage(JSON.stringify({ version: 2, state: { textTemplateId: 3, unknown: 'x' } }))).toBeNull();
  });
});
