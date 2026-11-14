import { describe, expect, it, vi } from 'vitest';
import { buildRenderAttemptDescriptors, executeRenderAttempts, RenderCancelledError } from '@/lib/render/renderAttempts';
import { createGpuDiagnostics } from '@/lib/render/gpuDiagnostics';

const options = { preference: 'auto' as const, codec: 'h264' as const, transparent: false, platform: 'win32' as const, preferredGl: 'angle' };

describe('ejecución integrada de intentos GPU', () => {
  it('GPU/NVENC success no ejecuta fallback y diagnostica el intento real', async () => {
    const attempts = buildRenderAttemptDescriptors(options); const run = vi.fn(async () => undefined);
    const result = await executeRenderAttempts(attempts, run);
    expect(run).toHaveBeenCalledTimes(1); expect(result.fallbackUsed).toBe(false);
    expect(createGpuDiagnostics({ renderMode: result.attempt.renderMode, glBackend: result.attempt.glBackend, encodeMode: result.attempt.encodeMode, gpuAvailable: true, fallbackUsed: result.fallbackUsed })).toMatchObject({ renderMode: 'gpu', encodeMode: 'nvenc', fallbackUsed: false });
  });
  it('falla NVENC y completa con GPU estándar', async () => {
    const attempts = buildRenderAttemptDescriptors(options); const run = vi.fn().mockRejectedValueOnce(new Error('nvenc')).mockResolvedValueOnce(undefined);
    const result = await executeRenderAttempts(attempts, run); expect(run).toHaveBeenCalledTimes(2); expect(result.attempt.encodeMode).toBe('standard'); expect(result.fallbackUsed).toBe(true);
  });
  it('falla GPU y completa con CPU en auto', async () => {
    const attempts = buildRenderAttemptDescriptors(options); const run = vi.fn().mockRejectedValueOnce(new Error('gpu1')).mockRejectedValueOnce(new Error('gpu2')).mockResolvedValueOnce(undefined);
    const result = await executeRenderAttempts(attempts, run); expect(run.mock.calls.map(([a]) => a.renderMode)).toEqual(['gpu', 'gpu', 'cpu']); expect(result.attempt.renderMode).toBe('cpu'); expect(result.fallbackUsed).toBe(true);
  });
  it('GPU estricta nunca ejecuta CPU', async () => {
    const attempts = buildRenderAttemptDescriptors({ ...options, preference: 'gpu' }); const run = vi.fn().mockRejectedValue(new Error('gpu'));
    await expect(executeRenderAttempts(attempts, run)).rejects.toThrow('gpu'); expect(run.mock.calls.every(([a]) => a.renderMode === 'gpu')).toBe(true);
  });
  it('CPU estricta ejecuta exactamente CPU', async () => {
    const attempts = buildRenderAttemptDescriptors({ ...options, preference: 'cpu' }); const run = vi.fn(async () => undefined); const result = await executeRenderAttempts(attempts, run);
    expect(run).toHaveBeenCalledTimes(1); expect((run.mock.calls[0] as unknown[])[0]).toMatchObject({ renderMode: 'cpu' }); expect(result.fallbackUsed).toBe(false);
  });
  it('cancelación no hace fallback', async () => {
    const attempts = buildRenderAttemptDescriptors(options); const run = vi.fn(async () => { throw new RenderCancelledError(); });
    await expect(executeRenderAttempts(attempts, run)).rejects.toBeInstanceOf(RenderCancelledError); expect(run).toHaveBeenCalledTimes(1);
  });
  it('mantiene la secuencia bajo una única ejecución de exportación', async () => {
    const events: string[] = []; const attempts = buildRenderAttemptDescriptors(options);
    await executeRenderAttempts(attempts, async (attempt) => { events.push(`start:${attempt.renderMode}`); if (attempt.renderMode === 'gpu') throw new Error('gpu'); events.push('success'); });
    expect(events).toEqual(['start:gpu', 'start:gpu', 'start:cpu', 'success']);
  });
  it('failure total no entrega resultado y permite nueva ejecución', async () => {
    const attempts = buildRenderAttemptDescriptors(options); const run = vi.fn().mockRejectedValue(new Error('all failed'));
    await expect(executeRenderAttempts(attempts, run)).rejects.toThrow('all failed');
    await expect(executeRenderAttempts(attempts, vi.fn(async () => undefined))).resolves.toMatchObject({ fallbackUsed: false });
  });
});
