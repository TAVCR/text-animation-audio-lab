export const EDITOR_STORAGE_VERSION = 2 as const;

export type EditorPersistedState = {
  textTemplateId: string | null;
  backgroundId: string | null;
};

type EditorStoragePayload = {
  version: typeof EDITOR_STORAGE_VERSION;
  state: EditorPersistedState;
};

export const serializeEditorStorage = (state: EditorPersistedState): string =>
  JSON.stringify({ version: EDITOR_STORAGE_VERSION, state });

export const deserializeEditorStorage = (raw: string | null): EditorPersistedState | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<EditorStoragePayload>;
    if (parsed.version !== EDITOR_STORAGE_VERSION || !parsed.state || typeof parsed.state !== 'object' || Array.isArray(parsed.state)) return null;
    const { textTemplateId, backgroundId } = parsed.state;
    if ((textTemplateId !== null && typeof textTemplateId !== 'string') || (backgroundId !== null && typeof backgroundId !== 'string')) return null;
    return { textTemplateId: textTemplateId ?? null, backgroundId: backgroundId ?? null };
  } catch {
    return null;
  }
};

export const BACKUP_BEFORE_V2_KEY = 'remotion-fx:backup-before-v2';

export type MigrationResult = { ok: true; state: EditorPersistedState; migrated: boolean } | { ok: false; error: string };

export const migrateV1ToV2 = (storage: Pick<Storage, 'getItem' | 'setItem'>, v1Key: string, v2Key: string): MigrationResult => {
  const existing = deserializeEditorStorage(storage.getItem(v2Key));
  if (existing) return { ok: true, state: existing, migrated: false };
  const raw = storage.getItem(v1Key);
  if (!raw) return { ok: false, error: 'No v1 payload found.' };
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return { ok: false, error: 'Invalid v1 payload.' }; }
  const source = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  const state: EditorPersistedState = {
    textTemplateId: typeof source.textTemplateId === 'string' ? source.textTemplateId : typeof source.animationStyle === 'string' ? source.animationStyle : null,
    backgroundId: typeof source.backgroundId === 'string' ? source.backgroundId : typeof source.particlePreset === 'string' ? source.particlePreset : null,
  };
  try {
    if (!storage.getItem(BACKUP_BEFORE_V2_KEY)) storage.setItem(BACKUP_BEFORE_V2_KEY, raw);
    if (!storage.getItem(BACKUP_BEFORE_V2_KEY)) return { ok: false, error: 'Backup could not be written.' };
    const serialized = serializeEditorStorage(state);
    if (!deserializeEditorStorage(serialized)) return { ok: false, error: 'V2 serialization failed.' };
    storage.setItem(v2Key, serialized);
    return { ok: true, state, migrated: true };
  } catch { return { ok: false, error: 'Storage write failed.' }; }
};
