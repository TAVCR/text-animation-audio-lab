import { describe, expect, it } from 'vitest';
import { deserializeEditorStorage, serializeEditorStorage } from '@/lib/editor/persistence';

describe('editor persistence', () => {
  it('serializes a versioned payload and restores it', () => {
    const payload = serializeEditorStorage({ textTemplateId: 'typewriter', backgroundId: 'light-orbs' });
    expect(JSON.parse(payload).version).toBe(2);
    expect(deserializeEditorStorage(payload)).toEqual({ textTemplateId: 'typewriter', backgroundId: 'light-orbs' });
  });

  it('rejects malformed or incompatible payloads safely', () => {
    expect(deserializeEditorStorage('{bad json')).toBeNull();
    expect(deserializeEditorStorage(JSON.stringify({ version: 1 }))).toBeNull();
    expect(deserializeEditorStorage(JSON.stringify({ version: 2, state: [] }))).toBeNull();
  });
});
