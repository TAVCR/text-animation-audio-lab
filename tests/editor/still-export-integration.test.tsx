import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimationProvider, useAnimation } from '@/lib/AnimationContext';
import { ExportProvider, useExportSession } from '@/lib/editor/ExportContext';
import PreviewContainer from '@/components/PreviewContainer';
import { useRenderExport } from '@/lib/hooks/useRenderExport';

const playerControl = vi.hoisted(() => ({
  frame: 0,
  listeners: new Map<string, Set<(event: { detail: { frame: number } }) => void>>(),
  emit(name: string, frame: number) {
    this.frame = frame;
    this.listeners.get(name)?.forEach((listener) => listener({ detail: { frame } }));
  },
}));

class TestResizeObserver {
  observe() { /* jsdom boundary */ }
  disconnect() { /* jsdom boundary */ }
}

Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, value: TestResizeObserver });

vi.mock('@remotion/player', async () => {
  const ReactModule = await import('react');
  const Player = ReactModule.forwardRef((_props: Record<string, unknown>, ref: React.Ref<unknown>) => {
    ReactModule.useImperativeHandle(ref, () => ({
      getCurrentFrame: () => playerControl.frame,
      addEventListener: (name: string, listener: (event: { detail: { frame: number } }) => void) => {
        const listeners = playerControl.listeners.get(name) ?? new Set();
        listeners.add(listener);
        playerControl.listeners.set(name, listeners);
      },
      removeEventListener: (name: string, listener: (event: { detail: { frame: number } }) => void) => {
        playerControl.listeners.get(name)?.delete(listener);
      },
      seekTo: (frame: number) => playerControl.emit('seeked', frame),
      play: () => undefined,
      pause: () => undefined,
    }));
    return <div data-testid="real-preview-player" />;
  });
  return { Player };
});

type Deferred<T> = { promise: Promise<T>; resolve: (value: T) => void; reject: (error: unknown) => void };
const deferred = <T,>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

const Harness = () => {
  const { props, getPreviewFrame } = useAnimation();
  const exportSession = useExportSession();
  const exporter = useRenderExport({ props, setProps: () => undefined, exportSession });
  return (
    <>
      <button type="button" onClick={() => void exporter.renderStillFrame(getPreviewFrame()).catch(() => undefined)}>EXPORTAR PNG DEL FOTOGRAMA ACTUAL</button>
      <button type="button" onClick={() => void exporter.renderVideo({ transparentCodec: 'vp9' })}>Render individual</button>
      <button type="button" onClick={() => void exporter.renderStillFrame(getPreviewFrame()).catch(() => undefined)}>Segundo PNG</button>
      <output data-testid="export-status">{exportSession.exportState.status}</output>
      <output data-testid="preview-frame">{getPreviewFrame()}</output>
    </>
  );
};

const renderApp = () => render(
  <AnimationProvider>
    <ExportProvider>
      <PreviewContainer />
      <Harness />
    </ExportProvider>
  </AnimationProvider>,
);

beforeEach(() => {
  cleanup();
  playerControl.frame = 0;
  playerControl.listeners.clear();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('exportación PNG integrada al Preview y al lock F5', () => {
  it('recorre Player → autoridad de frame → request con frame exacto y mantiene lock durante render y escritura', async () => {
    const renderDeferred = deferred<Response>();
    const writeDeferred = deferred<void>();
    const write = vi.fn(() => writeDeferred.promise);
    const close = vi.fn(async () => undefined);
    const handle = { createWritable: vi.fn(async () => ({ write, close })) };
    Object.defineProperty(window, 'showSaveFilePicker', { configurable: true, value: vi.fn(async () => handle) });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (String(input) === '/api/render') return renderDeferred.promise;
      return new Response(new Blob(['png']), { status: 200, headers: { 'Content-Type': 'image/png' } });
    });
    renderApp();

    await waitFor(() => expect(playerControl.listeners.get('frameupdate')?.size).toBe(1));
    playerControl.emit('frameupdate', 41.6);
    playerControl.emit('seeked', 42);
    await waitFor(() => expect(screen.getByRole('slider', { name: 'Línea de tiempo' }).getAttribute('value')).toBe('42'));
    fireEvent.click(screen.getByRole('button', { name: 'EXPORTAR PNG DEL FOTOGRAMA ACTUAL' }));
    await waitFor(() => expect(screen.getByTestId('export-status').textContent).toBe('rendering'));
    expect(fetchMock).toHaveBeenCalledWith('/api/render', expect.objectContaining({ body: expect.stringContaining('"pngFrame":42') }));
    expect(screen.getByRole('button', { name: 'Segundo PNG' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Segundo PNG' }));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    renderDeferred.resolve(new Response(JSON.stringify({ success: true, outputKind: 'png-still', fileName: 'TextAnim_frame_42.png', url: '/renders/TextAnim_frame_42.png', frame: 42 }), { status: 200 }));
    await waitFor(() => expect(screen.getByTestId('export-status').textContent).toBe('writing'));
    expect(write).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Segundo PNG' }));
    expect(fetchMock).toHaveBeenCalledTimes(2);

    writeDeferred.resolve();
    await waitFor(() => expect(screen.getByTestId('export-status').textContent).toBe('completed'));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('cancela el selector sin error falso y permite la operación posterior', async () => {
    const picker = vi.fn(async () => { const error = new Error('cancel'); error.name = 'AbortError'; throw error; });
    Object.defineProperty(window, 'showSaveFilePicker', { configurable: true, value: picker });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());
    renderApp();
    playerControl.emit('frameupdate', 7);
    fireEvent.click(screen.getByRole('button', { name: 'EXPORTAR PNG DEL FOTOGRAMA ACTUAL' }));
    await waitFor(() => expect(screen.getByTestId('export-status').textContent).toBe('idle'));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(picker).toHaveBeenCalledTimes(1);
  });

  it('libera el lock cuando falla el render y cuando falla la escritura', async () => {
    const renderFail = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, error: 'render failed' }), { status: 500 }));
    Object.defineProperty(window, 'showSaveFilePicker', { configurable: true, value: vi.fn(async () => ({ createWritable: vi.fn() })) });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(renderFail);
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'EXPORTAR PNG DEL FOTOGRAMA ACTUAL' }));
    await waitFor(() => expect(screen.getByTestId('export-status').textContent).toBe('failed'));

    const writeError = new Error('disk full');
    const write = vi.fn(async () => { throw writeError; });
    const close = vi.fn(async () => undefined);
    Object.defineProperty(window, 'showSaveFilePicker', { configurable: true, value: vi.fn(async () => ({ createWritable: vi.fn(async () => ({ write, close })) })) });
    fetchMock.mockImplementation(async (input) => String(input) === '/api/render'
      ? new Response(JSON.stringify({ success: true, outputKind: 'png-still', fileName: 'x.png', url: '/x.png', frame: 0 }), { status: 200 })
      : new Response(new Blob(['png']), { status: 200 }));
    fireEvent.click(screen.getByRole('button', { name: 'EXPORTAR PNG DEL FOTOGRAMA ACTUAL' }));
    await waitFor(() => expect(screen.getByTestId('export-status').textContent).toBe('failed'));
    expect(close).not.toHaveBeenCalled();
  });
});
