import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { AutomationCore } from '@/automation/core';
import type { Renderer } from '@/automation/renderer';

const request = (extra: Record<string, unknown> = {}) => ({ schemaVersion: 1, animationId: 'typewriter', text: 'A  B', parameters: {}, aspectRatio: '16:9', resolutionPreset: '1080p', durationInFrames: 150, gpuPolicy: 'auto', profile: 'h264-opaque', ...extra });
async function setup(renderer: Renderer) { const root = await mkdtemp(path.join(os.tmpdir(), 'automation-core-')); return { root, core: new AutomationCore({ renderer }), host: { outputRoot: path.join(root, 'out'), tempRoot: path.join(root, 'tmp'), gpuEnabled: true } }; }
const renderer = (overrides: Partial<Renderer> = {}): Renderer => ({ getCompositions: vi.fn(async () => [{ id: 'Main', width: 1920, height: 1080, durationInFrames: 150 }]), renderVideo: vi.fn(async ({ outputPath }) => { const { writeFile, mkdir } = await import('node:fs/promises'); await mkdir(path.dirname(outputPath), { recursive: true }); await writeFile(outputPath, 'mock-video'); }), renderStill: vi.fn(async ({ outputDir, fileName }) => { const { writeFile, mkdir } = await import('node:fs/promises'); await mkdir(outputDir, { recursive: true }); await writeFile(path.join(outputDir, fileName), 'mock-png'); }), ...overrides });

describe('N02 characterization and Automation Core', () => {
  it('normalizes through one Core and preserves significant whitespace', async () => { const r = renderer(); const s = await setup(r); const result = await s.core.render(request(), s.host); expect(result.status).toBe('succeeded'); expect((r.getCompositions as any).mock.calls[0][0].text).toBe('A  B'); expect(result.status === 'succeeded' && result.artifact.width).toBe(1920); await rm(s.root, { recursive: true, force: true }); });
  it('returns structured validation failures before renderer', async () => { const r = renderer(); const s = await setup(r); await expect(s.core.render(request({ animationId: 'nope' }), s.host)).resolves.toMatchObject({ status: 'failed', error: { code: 'INVALID_REQUEST' } }); await expect(s.core.render(request({ unexpected: true }), s.host)).resolves.toMatchObject({ status: 'failed', error: { code: 'INVALID_REQUEST' } }); await expect(s.core.render(request({ parameters: { noSuchKey: 1 } }), s.host)).resolves.toMatchObject({ status: 'failed', error: { code: 'INVALID_REQUEST' } }); expect(r.getCompositions).not.toHaveBeenCalled(); await rm(s.root, { recursive: true, force: true }); });
  it('uses declared profiles and PNG CPU override without real renderer', async () => { const r = renderer(); const s = await setup(r); const result = await s.core.still({ ...request({ profile: 'png-alpha', gpuPolicy: 'gpu', frameIndex: 4 }), }, s.host); expect(result.status).toBe('succeeded'); expect(result.status === 'succeeded' && result.artifact.profile).toBe('png-alpha'); expect(result.diagnostics.policyOverrideReason).toBe('LEGACY_PNG_CPU_POLICY'); expect(r.renderVideo).not.toHaveBeenCalled(); await rm(s.root, { recursive: true, force: true }); });
  it('falls back once and records ordered attempts', async () => { const r = renderer({ renderVideo: vi.fn().mockRejectedValueOnce(new Error('gpu')).mockImplementationOnce(async ({ outputPath }) => { const { writeFile, mkdir } = await import('node:fs/promises'); await mkdir(path.dirname(outputPath), { recursive: true }); await writeFile(outputPath, 'cpu'); }) }); const s = await setup(r); const result = await s.core.render(request(), s.host); expect(result.status).toBe('succeeded'); expect(result.diagnostics.attempts).toHaveLength(2); expect(result.diagnostics.fallbackUsed).toBe(true); await rm(s.root, { recursive: true, force: true }); });
  it('cancels before renderer and does not publish partial output', async () => { const r = renderer(); const controller = new AbortController(); controller.abort(); const s = await setup(r); const result = await s.core.render(request(), { ...s.host, signal: controller.signal }); expect(result.status).toBe('cancelled'); expect(r.getCompositions).not.toHaveBeenCalled(); await rm(s.root, { recursive: true, force: true }); });
  it('rejects strict GPU when host disables GPU without CPU fallback', async () => { const r = renderer(); const s = await setup(r); const result = await s.core.render(request({ gpuPolicy: 'gpu' }), { ...s.host, gpuEnabled: false }); expect(result.status).toBe('failed'); expect(result.status === 'failed' && result.error.code).toBe('GPU_UNAVAILABLE'); expect(r.getCompositions).not.toHaveBeenCalled(); await rm(s.root, { recursive: true, force: true }); });
});

describe('N02 lifecycle, cancellation, timeout and structured errors', () => {
  it('A. cancel before getCompositions', async () => {
    const r = renderer();
    const controller = new AbortController();
    controller.abort();
    const s = await setup(r);
    const res = await s.core.render(request(), { ...s.host, signal: controller.signal });
    expect(res.status).toBe('cancelled');
    if (res.status === 'cancelled') {
      expect(res.error.code).toBe('CANCELLED');
    }
    expect(r.getCompositions).not.toHaveBeenCalled();
    await rm(s.root, { recursive: true, force: true });
  });

  it('B. cancel during getCompositions', async () => {
    const controller = new AbortController();
    const r = renderer({
      getCompositions: vi.fn(async () => {
        controller.abort();
        return [{ id: 'Main', width: 1920, height: 1080, durationInFrames: 150 }];
      }),
    });
    const s = await setup(r);
    const res = await s.core.render(request(), { ...s.host, signal: controller.signal });
    expect(res.status).toBe('cancelled');
    if (res.status === 'cancelled') {
      expect(res.error.code).toBe('CANCELLED');
    }
    expect(r.getCompositions).toHaveBeenCalledTimes(1);
    expect(r.renderVideo).not.toHaveBeenCalled();
    expect(r.renderStill).not.toHaveBeenCalled();
    await rm(s.root, { recursive: true, force: true });
  });

  it('C. cancel during renderer', async () => {
    const controller = new AbortController();
    const r = renderer({
      renderVideo: vi.fn(async ({ signal }) => {
        controller.abort();
        expect(signal?.aborted).toBe(true);
      }),
    });
    const s = await setup(r);
    const res = await s.core.render(request(), { ...s.host, signal: controller.signal });
    expect(res.status).toBe('cancelled');
    if (res.status === 'cancelled') {
      expect(res.error.code).toBe('CANCELLED');
    }
    await rm(s.root, { recursive: true, force: true });
  });

  it('D. renderer termination before cleanup', async () => {
    const order: string[] = [];
    const controller = new AbortController();
    const r = renderer({
      renderVideo: vi.fn(async ({ signal }) => {
        order.push('renderer:started');
        controller.abort();
        expect(signal?.aborted).toBe(true);
        await new Promise((resolve) => setTimeout(resolve, 20));
        order.push('renderer:terminated');
      }),
    });
    const s = await setup(r);
    const res = await s.core.render(request(), { ...s.host, signal: controller.signal });
    expect(res.status).toBe('cancelled');
    expect(order).toEqual(['renderer:started', 'renderer:terminated']);
    await rm(s.root, { recursive: true, force: true });
  });

  it('E. cancel before publication', async () => {
    const controller = new AbortController();
    const r = renderer({
      renderVideo: vi.fn(async ({ outputPath }) => {
        const { writeFile, mkdir } = await import('node:fs/promises');
        await mkdir(path.dirname(outputPath), { recursive: true });
        await writeFile(outputPath, 'pre-pub-video');
        controller.abort();
      }),
    });
    const s = await setup(r);
    const res = await s.core.render(request({ outputName: 'no-publish' }), { ...s.host, signal: controller.signal });
    expect(res.status).toBe('cancelled');
    if (res.status === 'cancelled') {
      expect(res.error.code).toBe('CANCELLED');
    }
    const finalFile = path.join(s.host.outputRoot, 'no-publish.mp4');
    expect(await readFile(finalFile).catch(() => null)).toBeNull();
    await rm(s.root, { recursive: true, force: true });
  });

  it('F. timeout', async () => {
    const r = renderer({
      renderVideo: vi.fn(async ({ signal }) => {
        await new Promise((resolve) => {
          if (signal?.aborted) resolve(undefined);
          else signal?.addEventListener('abort', () => resolve(undefined), { once: true });
        });
      }),
    });
    const s = await setup(r);
    const res = await s.core.render(request(), { ...s.host, timeoutMs: 25 });
    expect(res.status).toBe('cancelled');
    if (res.status === 'cancelled') {
      expect(res.error.code).toBe('TIMEOUT');
      expect(res.error.message).toBe('Render timed out');
    }
    await rm(s.root, { recursive: true, force: true });
  });

  it('G. cancel != timeout', async () => {
    const s = await setup(renderer());
    const controller = new AbortController();
    controller.abort();
    const cancelRes = await s.core.render(request(), { ...s.host, signal: controller.signal });

    const timeoutRenderer = renderer({
      renderVideo: vi.fn(async ({ signal }) => {
        await new Promise((resolve) => signal?.addEventListener('abort', () => resolve(undefined), { once: true }));
      }),
    });
    const s2 = await setup(timeoutRenderer);
    const timeoutRes = await s2.core.render(request(), { ...s2.host, timeoutMs: 20 });

    if (cancelRes.status === 'cancelled' && timeoutRes.status === 'cancelled') {
      expect(cancelRes.error.code).toBe('CANCELLED');
      expect(timeoutRes.error.code).toBe('TIMEOUT');
      expect(cancelRes.error.code).not.toBe(timeoutRes.error.code);
    } else {
      throw new Error('Expected both jobs to be cancelled');
    }

    await rm(s.root, { recursive: true, force: true });
    await rm(s2.root, { recursive: true, force: true });
  });

  it('H. no fallback after cancel', async () => {
    const controller = new AbortController();
    const r = renderer({
      renderVideo: vi.fn(async () => {
        controller.abort();
      }),
    });
    const s = await setup(r);
    const res = await s.core.render(request({ gpuPolicy: 'auto' }), { ...s.host, signal: controller.signal });
    expect(res.status).toBe('cancelled');
    expect(r.renderVideo).toHaveBeenCalledTimes(1);
    expect(res.diagnostics.attempts).toHaveLength(1);
    expect(res.diagnostics.fallbackUsed).toBe(false);
    await rm(s.root, { recursive: true, force: true });
  });

  it('I. no fallback after timeout', async () => {
    const r = renderer({
      renderVideo: vi.fn(async ({ signal }) => {
        await new Promise((resolve) => signal?.addEventListener('abort', resolve, { once: true }));
      }),
    });
    const s = await setup(r);
    const res = await s.core.render(request({ gpuPolicy: 'auto' }), { ...s.host, timeoutMs: 25 });
    expect(res.status).toBe('cancelled');
    if (res.status === 'cancelled') {
      expect(res.error.code).toBe('TIMEOUT');
    }
    expect(r.renderVideo).toHaveBeenCalledTimes(1);
    expect(res.diagnostics.attempts).toHaveLength(1);
    expect(res.diagnostics.fallbackUsed).toBe(false);
    await rm(s.root, { recursive: true, force: true });
  });

  it('J. inspection failure does not rerender', async () => {
    const r = renderer({
      renderVideo: vi.fn(async () => {
        // Does not write file -> stat fails
      }),
    });
    const s = await setup(r);
    const res = await s.core.render(request({ gpuPolicy: 'auto' }), s.host);
    expect(res.status).toBe('failed');
    if (res.status === 'failed') {
      expect(res.error.code).toBe('INSPECTION_FAILED');
    }
    expect(r.renderVideo).toHaveBeenCalledTimes(1);
    expect(res.diagnostics.fallbackUsed).toBe(false);
    await rm(s.root, { recursive: true, force: true });
  });

  it('K. publication failure does not rerender', async () => {
    const s = await setup(renderer());
    const target = path.join(s.host.outputRoot, 'existing-pub.mp4');
    const { mkdir, writeFile } = await import('node:fs/promises');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, 'already-published');

    const res = await s.core.render(request({ outputName: 'existing-pub', gpuPolicy: 'auto' }), s.host);
    expect(res.status).toBe('failed');
    if (res.status === 'failed') {
      expect(res.error.code).toBe('OUTPUT_COLLISION');
    }
    expect(res.diagnostics.fallbackUsed).toBe(false);
    await rm(s.root, { recursive: true, force: true });
  });

  it('L. OUTPUT_COLLISION preserved', async () => {
    const s = await setup(renderer());
    const target = path.join(s.host.outputRoot, 'collide.mp4');
    const { mkdir, writeFile } = await import('node:fs/promises');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, 'collision');

    const res = await s.core.render(request({ outputName: 'collide' }), s.host);
    expect(res.status).toBe('failed');
    if (res.status === 'failed') {
      expect(res.error.code).toBe('OUTPUT_COLLISION');
    }
    await rm(s.root, { recursive: true, force: true });
  });

  it('M. INSPECTION_FAILED preserved', async () => {
    const r = renderer({
      renderVideo: vi.fn(async () => {
        // Do not write output file to simulate missing file on stat
      }),
    });
    const s = await setup(r);
    const res = await s.core.render(request(), s.host);
    expect(res.status).toBe('failed');
    if (res.status === 'failed') {
      expect(res.error.code).toBe('INSPECTION_FAILED');
      expect(res.error.stage).toBe('inspection');
    }
    await rm(s.root, { recursive: true, force: true });
  });

  it('N. PUBLICATION_FAILED preserved if contract supports it', async () => {
    const fsMod = await import('@/automation/filesystem');
    const spy = vi.spyOn(fsMod, 'publish').mockRejectedValueOnce(
      Object.assign(new Error('Permission denied on publish'), { code: 'PUBLICATION_FAILED' as const })
    );
    const s = await setup(renderer());
    const res = await s.core.render(request(), s.host);
    expect(res.status).toBe('failed');
    if (res.status === 'failed') {
      expect(res.error.code).toBe('PUBLICATION_FAILED');
      expect(res.error.stage).toBe('publish');
    }
    spy.mockRestore();
    await rm(s.root, { recursive: true, force: true });
  });

  it('O. INVALID_REQUEST returned structurally', async () => {
    const s = await setup(renderer());
    const res = await s.core.render({ schemaVersion: 1, animationId: 'unknown-id' }, s.host);
    expect(res.status).toBe('failed');
    if (res.status === 'failed') {
      expect(res.error.code).toBe('INVALID_REQUEST');
      expect(res.error.stage).toBe('validation');
    }
    await rm(s.root, { recursive: true, force: true });
  });
});
