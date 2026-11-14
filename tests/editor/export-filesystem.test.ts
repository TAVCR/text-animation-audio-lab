import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRenderExport } from '@/lib/hooks/useRenderExport';
import { defaultAnimationProps } from '@/lib/AnimationContext';
import { ensureWritePermission, sanitizeExportFileName, supportsFileSystemAccess } from '@/lib/editor/exportFilesystem';

describe('export filesystem helpers', () => {
  it('detects support without assuming the API exists', () => {
    expect(supportsFileSystemAccess({})).toBe(false);
    expect(supportsFileSystemAccess({ showSaveFilePicker: (() => Promise.resolve({ createWritable: async () => ({ write: async () => undefined, close: async () => undefined }) })) as never })).toBe(true);
  });

  it('creates deterministic safe names with the requested extension', () => {
    expect(sanitizeExportFileName('Mi texto / prueba', 'mp4')).toBe('Mi_texto_prueba.mp4');
    expect(sanitizeExportFileName('', 'webm')).toBe('export.webm');
    expect(sanitizeExportFileName('video.mp4', 'mp4')).toBe('video.mp4');
    expect(sanitizeExportFileName('CON', 'mp4')).toBe('export_CON.mp4');
    expect(sanitizeExportFileName('CON.mp4', 'mp4')).toBe('export_CON.mp4');
    expect(sanitizeExportFileName('NUL', 'webm')).toBe('export_NUL.webm');
  });

  it('resolves supported write permission states and propagates denial', async () => {
    const granted = { queryPermission: async () => 'granted' as const };
    await expect(ensureWritePermission(granted)).resolves.toBeUndefined();
    const prompted = { queryPermission: async () => 'prompt' as const, requestPermission: async () => 'granted' as const };
    await expect(ensureWritePermission(prompted)).resolves.toBeUndefined();
    const denied = { queryPermission: async () => 'prompt' as const, requestPermission: async () => 'denied' as const };
    await expect(ensureWritePermission(denied)).rejects.toThrow('Permiso');
    await expect(ensureWritePermission({})).resolves.toBeUndefined();
  });

  it('escribe mediante el hook real y resuelve colisiones sucesivas', async () => {
    const originalFetch = window.fetch;
    window.fetch = async () => new Response(new Blob(['video']), { status: 200 });
    const existing = new Set(['A.mp4', 'A-2.mp4']);
    const written: string[] = [];
    const directory = {
      getFileHandle: async (name: string, options: { create: boolean }) => {
        if (!options.create && existing.has(name)) return { createWritable: async () => ({ write: async () => undefined, close: async () => undefined }) };
        if (!options.create) throw Object.assign(new Error('missing'), { name: 'NotFoundError' });
        written.push(name);
        return { createWritable: async () => ({ write: async () => undefined, close: async () => undefined }) };
      },
      entries: async function* () { yield ['clip.mp4', {}] as [string, unknown]; },
    };
    try {
      const { result } = renderHook(() => useRenderExport({ props: defaultAnimationProps, setProps: () => undefined }));
      const output = await result.current.writeVideo({ kind: 'directory', handle: directory }, 'https://example.test/video', 'mp4', 'A.mp4');
      expect(output.fileName).toBe('A-3.mp4');
      expect(written).toEqual(['A-3.mp4']);
      expect(output.delivery).toBe('written');
    } finally { window.fetch = originalFetch; }
  });

  it('resuelve colisión de directorio ignorando mayúsculas y conserva la extensión', async () => {
    const originalFetch = window.fetch;
    window.fetch = async () => new Response(new Blob(['video']), { status: 200 });
    const requested: string[] = [];
    const directory = {
      getFileHandle: async (name: string, options: { create: boolean }) => {
        if (!options.create && name === 'clip.mp4') return { createWritable: async () => ({ write: async () => undefined, close: async () => undefined }) };
        if (!options.create) throw Object.assign(new Error('missing'), { name: 'NotFoundError' });
        requested.push(name);
        return { createWritable: async () => ({ write: async () => undefined, close: async () => undefined }) };
      },
      entries: async function* () { yield ['clip.mp4', {}] as [string, unknown]; },
    };
    try {
      const { result } = renderHook(() => useRenderExport({ props: defaultAnimationProps, setProps: () => undefined }));
      const output = await result.current.writeVideo({ kind: 'directory', handle: directory }, 'https://example.test/video', 'mp4', 'Clip.mp4');
      expect(output.fileName).toBe('Clip-2.mp4');
      expect(requested).toEqual(['Clip-2.mp4']);
    } finally { window.fetch = originalFetch; }
  });

  it('propaga un error de existencia distinto de NotFound desde el writer sin crear un writable', async () => {
    const originalFetch = window.fetch;
    let createWritableCalls = 0;
    window.fetch = async () => new Response(new Blob(['video']), { status: 200 });
    const directory = {
      getFileHandle: async () => { throw Object.assign(new Error('access denied'), { name: 'SecurityError' }); },
    };
    try {
      const { result } = renderHook(() => useRenderExport({ props: defaultAnimationProps, setProps: () => undefined }));
      await expect(result.current.writeVideo({ kind: 'directory', handle: directory }, 'https://example.test/video', 'mp4', 'A.mp4')).rejects.toThrow('access denied');
      expect(createWritableCalls).toBe(0);
    } finally { window.fetch = originalFetch; }
  });

  it('propaga un fallo real al obtener Blob sin escribir ni cerrar como éxito', async () => {
    const originalFetch = window.fetch;
    let writeCalls = 0;
    let closeCalls = 0;
    let abortCalls = 0;
    window.fetch = async () => ({ ok: true, blob: async () => { throw new Error('blob failed'); } }) as unknown as Response;
    const handle = {
      createWritable: async () => ({
        write: async () => { writeCalls += 1; },
        close: async () => { closeCalls += 1; },
        abort: async () => { abortCalls += 1; },
      }),
    };
    try {
      const { result } = renderHook(() => useRenderExport({ props: defaultAnimationProps, setProps: () => undefined }));
      await expect(result.current.writeVideo({ kind: 'filesystem', handle }, 'https://example.test/video', 'mp4', 'A.mp4')).rejects.toThrow('blob failed');
      expect(writeCalls).toBe(0);
      expect(closeCalls).toBe(0);
      expect(abortCalls).toBe(1);
    } finally { window.fetch = originalFetch; }
  });

  it('aplica permisos desde chooseDestination y permite fallback cuando la API no los expone', async () => {
    const originalPicker = (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;
    const writable = { write: async () => undefined, close: async () => undefined };
    const handles = [
      { queryPermission: async () => 'granted' as const, createWritable: async () => writable },
      { queryPermission: async () => 'prompt' as const, requestPermission: async () => 'granted' as const, createWritable: async () => writable },
      { queryPermission: async () => 'prompt' as const, requestPermission: async () => 'denied' as const, createWritable: async () => writable },
    ];
    (window as unknown as { showSaveFilePicker: () => Promise<unknown> }).showSaveFilePicker = async () => handles.shift()!;
    try {
      const { result } = renderHook(() => useRenderExport({ props: defaultAnimationProps, setProps: () => undefined }));
      const granted = await result.current.chooseDestination('mp4', 'A');
      const prompted = await result.current.chooseDestination('mp4', 'B');
      expect(granted?.kind).toBe('filesystem');
      expect(prompted?.kind).toBe('filesystem');
      await expect(result.current.chooseDestination('mp4', 'C')).rejects.toThrow('Permiso');
      (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker = undefined;
      const fallback = await result.current.chooseDestination('mp4', 'D');
      expect(fallback?.kind).toBe('download');
    } finally { (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker = originalPicker; }
  });

  it('sanea un nombre reservado y propaga el nombre final desde el writer público', async () => {
    const originalFetch = window.fetch;
    const created: string[] = [];
    window.fetch = async () => new Response(new Blob(['video']), { status: 200 });
    const directory = {
      getFileHandle: async (name: string, options: { create: boolean }) => {
        if (!options.create) throw Object.assign(new Error('missing'), { name: 'NotFoundError' });
        created.push(name);
        return { createWritable: async () => ({ write: async () => undefined, close: async () => undefined }) };
      },
    };
    try {
      const { result } = renderHook(() => useRenderExport({ props: defaultAnimationProps, setProps: () => undefined }));
      const output = await result.current.writeVideo({ kind: 'directory', handle: directory }, 'https://example.test/video', 'mp4', sanitizeExportFileName('CON', 'mp4'));
      expect(created).toEqual(['export_CON.mp4']);
      expect(output.fileName).toBe('export_CON.mp4');
      expect(output.delivery).toBe('written');
    } finally { window.fetch = originalFetch; }
  });

  it.each(['createWritable', 'write', 'close'] as const)('propaga fallo real de %s y aborta cuando corresponde', async (failurePoint) => {
    const originalFetch = window.fetch;
    window.fetch = async () => new Response(new Blob(['video']), { status: 200 });
    let aborted = false;
    const handle = {
      createWritable: async () => {
        if (failurePoint === 'createWritable') throw new Error('createWritable failed');
        return {
          write: async () => { if (failurePoint === 'write') throw new Error('write failed'); },
          close: async () => { if (failurePoint === 'close') throw new Error('close failed'); },
          abort: async () => { aborted = true; },
        };
      },
    };
    try {
      const { result } = renderHook(() => useRenderExport({ props: defaultAnimationProps, setProps: () => undefined }));
      await expect(result.current.writeVideo({ kind: 'filesystem', handle }, 'https://example.test/video', 'mp4', 'A.mp4')).rejects.toThrow(failurePoint);
      expect(aborted).toBe(failurePoint !== 'createWritable');
    } finally { window.fetch = originalFetch; }
  });

  it('usa fallback de descarga con nombre saneado y delivery explícito', async () => {
    const originalFetch = window.fetch;
    const originalAppend = document.body.appendChild;
    const originalRemove = document.body.removeChild;
    let clicked = false;
    window.fetch = async () => new Response(new Blob(['video']), { status: 200 });
    document.body.appendChild = ((node: Node) => node) as typeof document.body.appendChild;
    document.body.removeChild = ((node: Node) => node) as typeof document.body.removeChild;
    const originalCreate = document.createElement;
    document.createElement = ((tag: string) => tag === 'a' ? Object.assign(originalCreate.call(document, 'a'), { click: () => { clicked = true; } }) : originalCreate.call(document, tag)) as typeof document.createElement;
    try {
      const { result } = renderHook(() => useRenderExport({ props: defaultAnimationProps, setProps: () => undefined }));
      const output = await result.current.writeVideo({ kind: 'download' }, 'https://example.test/video', 'mp4', 'video.mp4');
      expect(output.fileName).toBe('video.mp4');
      expect(output.delivery).toBe('download-requested');
      expect(clicked).toBe(true);
    } finally { window.fetch = originalFetch; document.body.appendChild = originalAppend; document.body.removeChild = originalRemove; document.createElement = originalCreate; }
  });
});
