import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const SUBTITLE_VIDEO_DIR = path.resolve(process.cwd(), 'tmp', 'subtitle-videos');
const SAFE_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.m4v']);

export const createSubtitleMediaId = (): string => randomUUID();

export const getSubtitleMediaPath = (id: string, extension = '.media'): string => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid subtitle media id');
  const safeExtension = extension === '.media' ? extension : extensionForUpload(`upload${extension}`);
  const resolved = path.resolve(SUBTITLE_VIDEO_DIR, `${id}${safeExtension}`);
  const relative = path.relative(SUBTITLE_VIDEO_DIR, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Invalid subtitle media path');
  return resolved;
};

export const extensionForUpload = (name: string): string => {
  const extension = path.extname(name).toLowerCase();
  if (!SAFE_EXTENSIONS.has(extension)) throw new Error('Unsupported video format');
  return extension;
};
