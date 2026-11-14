import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('paquete de escritorio', () => {
  it('incluye los módulos del servidor standalone como recurso de Windows', () => {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as {
      build: { extraResources: Array<{ from: string; to: string }> };
    };

    expect(packageJson.build.extraResources).toEqual(expect.arrayContaining([
      expect.objectContaining({ from: '.next/standalone', to: 'server' }),
      expect.objectContaining({ from: '.next/standalone/node_modules', to: 'server/node_modules' }),
      expect.objectContaining({ from: 'src', to: 'server/src' }),
    ]));
  });

  it('incluye APIs, Remotion y assets públicos, pero excluye temporales administrados', () => {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8')) as { build: { files: string[]; extraResources: Array<{ from: string }> } };
    const resources = packageJson.build.extraResources.map((item) => item.from).join('|');
    expect(resources).toContain('public');
    expect(packageJson.build.files).toContain('electron/**/*');
    expect(resources).not.toContain('public/renders');
    expect(resources).not.toContain('tmp/subtitle-videos');
    const publicResource = packageJson.build.extraResources.find((item) => item.from === 'public') as { filter?: string[] };
    expect(publicResource.filter).toContain('!renders/**');
    expect(publicResource.filter).toContain('!tmp/**');
    expect(readFileSync(resolve(process.cwd(), 'electron/preload.cjs'), 'utf8')).not.toContain('exposeInMainWorld(\'fs\'');
    expect(readFileSync(resolve(process.cwd(), 'src/app/api/subtitles/render/route.ts'), 'utf8')).toContain('videoId');
  });

  it('no depende de una ruta absoluta del workspace en runtime', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/app/api/subtitles/render/route.ts'), 'utf8');
    expect(source).not.toContain('K:/ANTIGRAVITY');
    expect(source).not.toContain('TEXT ANIMATION_OPTIMIZACION');
  });
});
