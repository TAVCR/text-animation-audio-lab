'use client';

import React from 'react';
import { defaultAnimationProps } from '@/lib/AnimationContext';
import type { AnimationProps } from '@/lib/AnimationContext';
import { ensureWritePermission, sanitizeExportFileName } from '@/lib/editor/exportFilesystem';
import { normalizeStillFrame } from '@/lib/editor/stillExport';

type RenderCodec = 'vp9' | 'prores';
export type RenderDiagnostics = { renderMode?: string; glBackend?: string; encodeMode?: string; fallbackUsed?: boolean };
type WritableLike = { write: (blob: Blob) => Promise<void>; close: () => Promise<void>; abort?: () => Promise<void> };
type PermissionedHandleLike = { queryPermission?: (options: { mode: 'readwrite' }) => Promise<'granted' | 'prompt' | 'denied'>; requestPermission?: (options: { mode: 'readwrite' }) => Promise<'granted' | 'denied'> };
type FileSystemHandleLike = PermissionedHandleLike & { createWritable: () => Promise<WritableLike> };
type DirectoryHandleLike = PermissionedHandleLike & { getFileHandle: (name: string, options: { create: boolean }) => Promise<FileSystemHandleLike>; entries?: () => AsyncIterableIterator<[string, unknown]> };
export type ExportDestination = { kind: 'filesystem'; handle: FileSystemHandleLike } | { kind: 'directory'; handle: DirectoryHandleLike } | { kind: 'download' };

export type BatchRenderResult = {
  url: string;
  fileName: string;
  lineNumber: number;
  text: string;
  status?: 'completed' | 'failed';
  delivery?: 'written' | 'download-requested';
  error?: string;
};

type RenderResult =
  | { mode: 'single'; url: string; diagnostics?: RenderDiagnostics }
  | { mode: 'batch'; renders: BatchRenderResult[] };

type NumberSanitizers = Partial<Record<keyof AnimationProps, (value: number) => number>>;

type HandlePropChangeOptions = {
  numberSanitizers?: NumberSanitizers;
};

type UseRenderExportParams = {
  props: AnimationProps;
  setProps: React.Dispatch<React.SetStateAction<AnimationProps>>;
  exportSession?: { tryAcquireExport: () => boolean; releaseExport: () => void; dispatchExport: (action: import('@/lib/editor/exportState').ExportAction) => void };
};

export const useRenderExport = ({ props, setProps, exportSession }: UseRenderExportParams) => {
  const [isRendering, setIsRendering] = React.useState(false);
  const [renderUrl, setRenderUrl] = React.useState<string | null>(null);
  const [renderDiagnostics, setRenderDiagnostics] = React.useState<RenderDiagnostics | null>(null);

  const chooseDestination = React.useCallback(async (extension: string, label: string): Promise<ExportDestination | null> => {
    const scope = window as unknown as { showSaveFilePicker?: (options: unknown) => Promise<FileSystemHandleLike> };
    if (typeof scope.showSaveFilePicker !== 'function') return { kind: 'download' };
    try {
      const handle = await scope.showSaveFilePicker({
        suggestedName: sanitizeExportFileName(label, extension),
        types: [{ description: 'Video', accept: { [extension === 'mp4' ? 'video/mp4' : extension === 'webm' ? 'video/webm' : 'video/quicktime']: [`.${extension}`] } }],
      });
      await ensureWritePermission(handle);
      return { kind: 'filesystem', handle } as ExportDestination;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return null;
      throw error;
    }
  }, []);

  const chooseDirectory = React.useCallback(async (): Promise<ExportDestination | null> => {
    const scope = window as unknown as { showDirectoryPicker?: () => Promise<DirectoryHandleLike> };
    if (typeof scope.showDirectoryPicker !== 'function') return { kind: 'download' };
    try {
      const handle = await scope.showDirectoryPicker();
      await ensureWritePermission(handle);
      return { kind: 'directory', handle };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') return null;
      throw error;
    }
  }, []);

  const writeVideo = React.useCallback(async (destination: ExportDestination, url: string, extension: string, fileName?: string): Promise<{ fileName: string; delivery: 'written' | 'download-requested' }> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('No se pudo obtener el video renderizado.');
    if (destination.kind === 'filesystem' || destination.kind === 'directory') {
      let finalName = fileName || `export.${extension}`;
      const directoryHandle = destination.kind === 'directory' ? destination.handle : null;
      const findDirectoryHandle = async (name: string): Promise<FileSystemHandleLike | null> => {
        if (!directoryHandle) return null;
        try { return await directoryHandle.getFileHandle(name, { create: false }); } catch (error: unknown) {
          if ((error as { name?: string }).name !== 'NotFoundError') throw error;
          if (!directoryHandle.entries) return null;
          for await (const [entryName, entry] of directoryHandle.entries()) {
            if (entryName.toLowerCase() === name.toLowerCase()) return entry as FileSystemHandleLike;
          }
          return null;
        }
      };
      let handle = destination.kind === 'directory' ? await findDirectoryHandle(fileName || `export.${extension}`) : destination.handle;
      if (destination.kind === 'directory') {
        const requested = fileName || `export.${extension}`;
        const dot = requested.lastIndexOf('.');
        const base = dot > 0 ? requested.slice(0, dot) : requested;
        const suffix = dot > 0 ? requested.slice(dot) : `.${extension}`;
        let candidate = requested;
        let index = 1;
        while (handle) {
          index += 1;
          candidate = `${base}-${index}${suffix}`;
          handle = await findDirectoryHandle(candidate);
        }
        finalName = candidate;
        handle = await directoryHandle!.getFileHandle(candidate, { create: true });
      }
      if (!handle) throw new Error('No se pudo crear el archivo de destino.');
      const writable = await handle.createWritable();
      try { await writable.write(await response.blob()); await writable.close(); } catch (error) { if ('abort' in writable && typeof (writable as { abort?: () => Promise<void> }).abort === 'function') await (writable as { abort: () => Promise<void> }).abort().catch(() => undefined); throw error; }
      return { fileName: finalName, delivery: 'written' };
    }
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName || `export.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return { fileName: anchor.download, delivery: 'download-requested' };
  }, []);

  const handlePropChange = React.useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
      options?: HandlePropChangeOptions
    ) => {
      const target = e.target;
      const { name, type } = target;

      if (type === 'checkbox' && target instanceof HTMLInputElement) {
        setProps((prev) => ({ ...prev, [name]: target.checked }));
        return;
      }

      const raw = target.value;
      const key = name as keyof AnimationProps;
      const defaultValue = defaultAnimationProps[key];

      let value: unknown = raw;
      if (typeof defaultValue === 'number') {
        const parsed = Number(raw);
        value = Number.isFinite(parsed) ? parsed : defaultValue;
        const sanitizer = options?.numberSanitizers?.[key];
        if (sanitizer) value = sanitizer(value as number);
      }

      setProps((prev) => ({ ...prev, [name]: value }));
    },
    [setProps]
  );

  const saveVideo = React.useCallback(
    async (url: string) => {
      if (exportSession && !exportSession.tryAcquireExport()) return;
      exportSession?.dispatchExport({ type: 'writing' });
      let written: { fileName: string; delivery: 'written' | 'download-requested' } | null = null;
      let cancelled = false;
      try {
        const ext = url.split('.').pop() || (props.isTransparent ? 'mov' : 'mp4');
        const destination = await chooseDestination(ext, `remotion-video-${Date.now()}`);
        if (!destination) {
          cancelled = true;
          return;
        }
        written = await writeVideo(destination, url, ext);
        alert(written.delivery === 'download-requested' ? 'Descarga iniciada' : 'Archivo guardado');
        setRenderUrl(null);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          cancelled = true;
          return;
        }
        alert('Ocurrió un error al guardar el archivo.');
        console.error(err);
      } finally {
        exportSession?.releaseExport();
        if (exportSession) {
          exportSession.dispatchExport(
            written
              ? { type: 'completed', result: { fileName: written.fileName, url, delivery: written.delivery } }
              : cancelled
                ? { type: 'destination-cancelled' }
                : { type: 'failed', error: 'Error al guardar el archivo.' }
          );
        }
      }
    },
    [props.isTransparent, exportSession, chooseDestination, writeVideo]
  );

  const renderVideo = React.useCallback(
    async (options: { transparentCodec: RenderCodec; batchTexts?: string[]; publishResult?: boolean; renderPipelinePreference?: 'auto' | 'gpu' | 'cpu' }): Promise<RenderResult> => {
      try {
        setIsRendering(true);
        const payload: Record<string, unknown> = { ...props };
        if (props.isTransparent) {
          payload.transparentCodec = options.transparentCodec;
        }
        if (options.batchTexts && options.batchTexts.length > 0) {
          payload.batchTexts = options.batchTexts;
        }
        if (options.renderPipelinePreference) payload.renderPipelinePreference = options.renderPipelinePreference;

        const response = await fetch('/api/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorPayload = await response.json();
          throw new Error(errorPayload.error || 'Error al renderizar');
        }

        const data = await response.json();
        if (data.success && data.batch && Array.isArray(data.renders)) {
          const normalized = data.renders
            .filter((item: unknown) => item && typeof item === 'object')
            .map((item: Record<string, unknown>, index: number) => ({
              url: String(item.url ?? ''),
              fileName: String(item.fileName ?? `Render_Line${index + 1}`),
              lineNumber: Number(item.lineNumber ?? index + 1),
              text: String(item.text ?? ''),
            }))
            .filter((item: { url: string }) => item.url.length > 0);

          setRenderUrl(null);
          setRenderDiagnostics(data.diagnostics ?? null);
          return { mode: 'batch', renders: normalized };
        }

        if (data.success && data.url) {
          const url = String(data.url);
          if (options.publishResult !== false) setRenderUrl(url);
          setRenderDiagnostics(data.diagnostics ?? null);
          return { mode: 'single', url, diagnostics: data.diagnostics };
        }

        throw new Error('Respuesta inválida del servidor');
      } catch (err: unknown) {
        console.error(err);
        throw err;
      } finally {
        setIsRendering(false);
      }
    },
    [props]
  );

  const renderStillFrame = React.useCallback(async (frame: number) => {
    if (exportSession && !exportSession.tryAcquireExport()) return null;
    exportSession?.dispatchExport({ type: 'writing' });
    let cancelled = false;
    try {
      exportSession?.dispatchExport({ type: 'destination-selecting' });
      const destination = await chooseDestination('png', `TextAnim_frame_${Math.max(0, Math.round(frame))}`);
      if (!destination) {
        cancelled = true;
        return null;
      }
      exportSession?.dispatchExport({ type: 'rendering' });
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...props,
          outputProfile: 'png-paused-frame-alpha',
          pngFrame: normalizeStillFrame(frame, props.motionDurationFrames ?? 150),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || data.outputKind !== 'png-still') {
        throw new Error(data.error || 'Error al exportar el fotograma PNG.');
      }
      exportSession?.dispatchExport({ type: 'writing' });
      const written = await writeVideo(destination, String(data.url), 'png', String(data.fileName));
      exportSession?.dispatchExport({ type: 'completed', result: { fileName: written.fileName, url: String(data.url), delivery: written.delivery } });
      return { fileName: written.fileName, url: String(data.url), frame: Number(data.frame) };
    } catch (error: unknown) {
      if (!cancelled) exportSession?.dispatchExport({ type: 'failed', error: error instanceof Error ? error.message : String(error) });
      throw error;
    } finally {
      if (cancelled) exportSession?.dispatchExport({ type: 'destination-cancelled' });
      exportSession?.releaseExport();
    }
  }, [chooseDestination, exportSession, props, writeVideo]);

  return {
    isRendering,
    renderUrl,
    setRenderUrl,
    chooseDestination,
    chooseDirectory,
    writeVideo,
    saveVideo,
    renderVideo,
    renderStillFrame,
    renderDiagnostics,
    handlePropChange,
  };
};
