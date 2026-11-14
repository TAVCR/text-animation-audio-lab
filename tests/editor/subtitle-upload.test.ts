import { describe, expect, it } from 'vitest';
import { extensionForUpload, getSubtitleMediaPath } from '@/lib/subtitles/mediaPaths';
describe('ingesta segura de vídeo para subtítulos', () => {
  it('acepta formatos de vídeo permitidos y resuelve IDs opacos dentro del directorio', () => {
    expect(extensionForUpload('source.MP4')).toBe('.mp4');
    expect(getSubtitleMediaPath('00000000-0000-4000-8000-000000000000')).toContain('subtitle-videos');
  });
  it('rechaza extensiones y traversal', () => {
    expect(() => extensionForUpload('source.exe')).toThrow();
    expect(() => getSubtitleMediaPath('../escape')).toThrow();
  });
});
