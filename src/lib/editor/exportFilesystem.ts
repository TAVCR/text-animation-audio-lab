export type SaveFilePickerLike = (options: {
  suggestedName: string;
  types: Array<{ description: string; accept: Record<string, string[]> }>;
}) => Promise<{ createWritable: () => Promise<{ write: (blob: Blob) => Promise<void>; close: () => Promise<void> }> }>;

export type FileSystemAccessLike = { showSaveFilePicker?: SaveFilePickerLike };

export type PermissionHandleLike = {
  queryPermission?: (options: { mode: 'readwrite' }) => Promise<'granted' | 'prompt' | 'denied'>;
  requestPermission?: (options: { mode: 'readwrite' }) => Promise<'granted' | 'denied'>;
};

export const ensureWritePermission = async (handle: PermissionHandleLike): Promise<void> => {
  if (!handle.queryPermission) return;
  let permission = await handle.queryPermission({ mode: 'readwrite' });
  if (permission === 'prompt' && handle.requestPermission) permission = await handle.requestPermission({ mode: 'readwrite' });
  if (permission === 'denied') throw new Error('Permiso de escritura denegado.');
};

export const supportsFileSystemAccess = (scope: FileSystemAccessLike): boolean => typeof scope.showSaveFilePicker === 'function';

export const sanitizeExportFileName = (value: string, extension: string): string => {
  const requestedExtension = extension.replace(/^\./, '').toLowerCase();
  const withoutExpectedExtension = value.trim().replace(new RegExp(`\\.${requestedExtension}$`, 'i'), '');
  let base = withoutExpectedExtension.normalize('NFKD').replace(/[^\x00-\x7F]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'export';
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i.test(base)) base = `export_${base}`;
  return `${base}.${requestedExtension}`;
};
