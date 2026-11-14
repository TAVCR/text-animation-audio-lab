import { describe, expect, it, vi } from 'vitest';
import { renderCaptionedVideo } from '@/lib/render/renderCaptionedVideo';
import { runSingleExport } from '@/lib/editor/exportOrchestration';
import { createInitialExportState, exportReducer } from '@/lib/editor/exportState';
describe('render subtitulado single-pass', () => {
  it('usa CaptionedVideo y una única llamada efectiva a renderMedia', async () => {
    const renderMedia = vi.fn().mockResolvedValue(undefined);
    const result = await renderCaptionedVideo({ src: '/video.mp4', cues: [{ id: '1', start: 0, end: 1, text: 'Hola' }], outputPath: 'final.mp4', serveUrl: 'bundle', width: 1920, height: 1080, durationInFrames: 30, fps: 30, preference: 'cpu' }, { getCompositions: vi.fn().mockResolvedValue([{ id: 'CaptionedVideo', width: 1920, height: 1080, durationInFrames: 30 }]), renderMedia });
    expect(renderMedia).toHaveBeenCalledTimes(1);
    expect(renderMedia.mock.calls[0][0].inputProps.cues[0].text).toBe('Hola');
    expect(result.fileName).toBe('final.mp4');
  });

  it('hace fallback GPU→CPU sin intermediario y conserva diagnóstico', async () => {
    const renderMedia = vi.fn().mockRejectedValueOnce(new Error('gpu')).mockRejectedValueOnce(new Error('gpu')).mockResolvedValueOnce(undefined);
    const result = await renderCaptionedVideo({ src: '/video.mp4', cues: [], outputPath: 'final.mp4', serveUrl: 'bundle', width: 1920, height: 1080, durationInFrames: 30, fps: 30, preference: 'auto' }, { getCompositions: vi.fn().mockResolvedValue([{ id: 'CaptionedVideo', width: 1920, height: 1080, durationInFrames: 30 }]), renderMedia });
    expect(renderMedia).toHaveBeenCalledTimes(3);
    expect(renderMedia.mock.calls[2][0].outputLocation).toBe('final.mp4');
    expect(result).toMatchObject({ renderMode: 'cpu', fallbackUsed: true });
  });

  it('GPU estricto no ejecuta CPU y limpia el parcial', async () => {
    const cleanup = vi.fn().mockResolvedValue(undefined);
    const renderMedia = vi.fn().mockRejectedValue(new Error('gpu unavailable'));
    await expect(renderCaptionedVideo({ src: '/video.mp4', cues: [], outputPath: 'partial.mp4', serveUrl: 'bundle', width: 1920, height: 1080, durationInFrames: 30, fps: 30, preference: 'gpu', cleanup }, { getCompositions: vi.fn().mockResolvedValue([{ id: 'CaptionedVideo', width: 1920, height: 1080, durationInFrames: 30 }]), renderMedia })).rejects.toThrow('gpu unavailable');
    expect(renderMedia).toHaveBeenCalledTimes(2);
    expect(cleanup).toHaveBeenCalledTimes(2);
    expect(renderMedia.mock.calls.every((call) => Boolean(call[0].chromiumOptions))).toBe(true);
  });

  it('cancela sin fallback y ejecuta cleanup', async () => {
    const renderMedia = vi.fn().mockResolvedValue(undefined);
    const cleanup = vi.fn().mockResolvedValue(undefined);
    await expect(renderCaptionedVideo({ src: '/video.mp4', cues: [], outputPath: 'cancel.mp4', serveUrl: 'bundle', width: 1920, height: 1080, durationInFrames: 30, fps: 30, preference: 'auto', isCancelled: () => true, cleanup }, { getCompositions: vi.fn(), renderMedia })).rejects.toThrow('cancelled');
    expect(renderMedia).not.toHaveBeenCalled();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('mantiene la autoridad F5 entre render pendiente, writer pendiente y close', async () => {
    let resolveRender!: (value: { fileName: string; url: string }) => void;
    let resolveWrite!: () => void;
    let resolveClose!: () => void;
    const renderPromise = new Promise<{ fileName: string; url: string }>((resolve) => { resolveRender = resolve; });
    const writePromise = new Promise<void>((resolve) => { resolveWrite = resolve; });
    const closePromise = new Promise<void>((resolve) => { resolveClose = resolve; });
    let locked = false; let state = createInitialExportState();
    const dispatch = (action: Parameters<typeof exportReducer>[1]) => { state = exportReducer(state, action); };
    const acquire = () => { if (locked) return false; locked = true; return true; };
    const release = () => { locked = false; };
    const operation = (async () => { if (!acquire()) return null; try { return await runSingleExport({ chooseDestination: vi.fn().mockResolvedValue({}), render: vi.fn().mockReturnValue(renderPromise), write: vi.fn().mockImplementation(async () => { await writePromise; await closePromise; }), dispatch }); } finally { release(); } })();
    await Promise.resolve();
    expect(locked).toBe(true); expect(state.status).toBe('rendering'); expect(acquire()).toBe(false);
    resolveRender({ fileName: 'captioned.mp4', url: '/renders/captioned.mp4' });
    await Promise.resolve(); await Promise.resolve();
    expect(locked).toBe(true); expect(state.status).toBe('writing'); expect(acquire()).toBe(false);
    resolveWrite(); await Promise.resolve(); expect(locked).toBe(true);
    resolveClose(); await operation;
    expect(state.status).toBe('completed'); expect(locked).toBe(false); expect(acquire()).toBe(true); release();
  });

  it.each([
    ['Electron', { delivery: 'written' as const }],
    ['Web FS Access', { delivery: 'written' as const }],
    ['Web fallback', { delivery: 'download-requested' as const }],
  ])('preserva filename, diagnostics y no vuelve a renderizar durante delivery %s', async (_name, delivery) => {
    const dispatch = vi.fn(); const render = vi.fn().mockResolvedValue({ fileName: 'CaptionedVideo.mp4', url: '/renders/CaptionedVideo.mp4' }); const write = vi.fn().mockResolvedValue(delivery);
    const result = await runSingleExport({ chooseDestination: vi.fn().mockResolvedValue({ kind: 'file' }), render, write, dispatch });
    expect(render).toHaveBeenCalledTimes(1); expect(write).toHaveBeenCalledTimes(1); expect(result).toMatchObject({ fileName: 'CaptionedVideo.mp4', delivery: delivery.delivery });
    expect(dispatch.mock.calls.at(-1)?.[0]).toMatchObject({ type: 'completed', result: { delivery: delivery.delivery } });
  });

  it('selector cancelado no hace render, writer ni fallback y permite otra operación', async () => {
    const dispatch = vi.fn(); const render = vi.fn(); const write = vi.fn(); let locked = false;
    const run = async () => { if (locked) return null; locked = true; try { return await runSingleExport({ chooseDestination: vi.fn().mockResolvedValue(null), render, write, dispatch }); } finally { locked = false; } };
    expect(await run()).toBeNull(); expect(render).not.toHaveBeenCalled(); expect(write).not.toHaveBeenCalled(); expect(locked).toBe(false); expect(await run()).toBeNull();
  });

  it('fallo de write o close nunca marca written y libera para la siguiente operación', async () => {
    const dispatch = vi.fn(); let locked = false;
    const run = async (fail = true) => { if (locked) return null; locked = true; try { return await runSingleExport({ chooseDestination: vi.fn().mockResolvedValue({}), render: vi.fn().mockResolvedValue({ fileName: 'CaptionedVideo.mp4', url: '/video' }), write: fail ? vi.fn().mockRejectedValue(new Error('close failed')) : vi.fn().mockResolvedValue({ delivery: 'written' }), dispatch }); } finally { locked = false; } };
    await expect(run()).rejects.toThrow('close failed'); expect(locked).toBe(false); expect(dispatch.mock.calls.at(-1)?.[0]).toEqual({ type: 'failed', error: 'close failed' }); expect((await run(false))?.delivery).toBe('written');
  });
});
