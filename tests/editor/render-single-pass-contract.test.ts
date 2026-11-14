import { beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const getCompositions = vi.fn();
const renderMedia = vi.fn();
const renderFrames = vi.fn();

vi.mock('@remotion/bundler', () => ({ bundle: vi.fn(async () => 'mock-serve-url') }));
vi.mock('@remotion/renderer', () => ({ getCompositions, renderMedia, renderFrames }));

import { POST } from '@/app/api/render/route';

describe('contrato de render de una sola pasada', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCompositions.mockResolvedValue([{ id: 'Main', width: 1920, height: 1080, durationInFrames: 150 }]);
    renderMedia.mockImplementation(async (options: { outputLocation: string }) => { await fs.mkdir(path.dirname(options.outputLocation), { recursive: true }); await fs.writeFile(options.outputLocation, Buffer.from('video')); });
    renderFrames.mockImplementation(async (options: { outputDir: string; imageSequencePattern: string }) => {
      await fs.writeFile(path.join(options.outputDir, options.imageSequencePattern), Buffer.from('png'));
    });
  });

  it('hace exactamente un renderMedia por vídeo individual', async () => {
    const response = await POST(new Request('http://localhost/api/render', {
      method: 'POST',
      body: JSON.stringify({ animationStyle: 'typewriter', text: 'UNO' }),
    }));
    expect(response.status).toBe(200);
    expect(renderMedia).toHaveBeenCalledTimes(1);
    expect(renderFrames).not.toHaveBeenCalled();
  });

  it('hace exactamente un renderMedia por elemento en batch', async () => {
    const response = await POST(new Request('http://localhost/api/render', {
      method: 'POST',
      body: JSON.stringify({ animationStyle: 'typewriter', batchTexts: ['A', 'B', 'C'] }),
    }));
    expect(response.status).toBe(200);
    expect(renderMedia).toHaveBeenCalledTimes(3);
    expect(renderFrames).not.toHaveBeenCalled();
  });

  it('renderiza un único PNG del frame solicitado con renderFrames y nunca renderMedia', async () => {
    const response = await POST(new Request('http://localhost/api/render', {
      method: 'POST',
      body: JSON.stringify({ animationStyle: 'typewriter', text: 'PNG', outputProfile: 'png-paused-frame-alpha', pngFrame: 37 }),
    }));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ success: true, outputKind: 'png-still', frame: 37 });
    expect(payload.fileName).toMatch(/\.png$/);
    expect(renderFrames).toHaveBeenCalledTimes(1);
    expect(renderMedia).not.toHaveBeenCalled();
  });

  it('usa la ruta GPU real y reporta el diagnóstico de la tentativa efectiva', async () => {
    const response = await POST(new Request('http://localhost/api/render', {
      method: 'POST',
      body: JSON.stringify({ animationStyle: 'typewriter', text: 'GPU', renderPipelinePreference: 'gpu' }),
    }));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(renderMedia).toHaveBeenCalledTimes(1);
    expect(renderMedia.mock.calls[0][0].chromiumOptions).toBeTruthy();
    expect(payload.diagnostics.renderMode).toBe('gpu');
    expect(payload.diagnostics.fallbackUsed).toBe(false);
  });

  it('mantiene el fallback GPU→CPU en auto y no entrega un render parcial', async () => {
    renderMedia
      .mockRejectedValueOnce(new Error('GPU unavailable'))
      .mockRejectedValueOnce(new Error('GPU unavailable'));
    const response = await POST(new Request('http://localhost/api/render', {
      method: 'POST',
      body: JSON.stringify({ animationStyle: 'typewriter', text: 'FALLBACK', renderPipelinePreference: 'auto' }),
    }));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(renderMedia).toHaveBeenCalledTimes(3);
    expect(renderMedia.mock.calls[0][0].chromiumOptions).toBeTruthy();
    expect(payload.diagnostics.renderMode).toBe('cpu');
    expect(payload.diagnostics.fallbackUsed).toBe(true);
  });

  it('propagates NVENC encoder configuration to renderer arguments', async () => {
    // When attempt specifies nvenc, encoderOverride maps libx264 to h264_nvenc
    const fn = (await import('@/automation/renderer')).encoderOverride('nvenc');
    expect(fn).toBeTypeOf('function');
    if (fn) {
      const transformed = fn({ type: 'stitcher', args: ['-c:v', 'libx264', '-pix_fmt', 'yuv420p'] });
      expect(transformed).toEqual(['-c:v', 'h264_nvenc', '-pix_fmt', 'yuv420p']);
      const transformedHevc = fn({ type: 'stitcher', args: ['-c:v', 'libx265'] });
      expect(transformedHevc).toEqual(['-c:v', 'hevc_nvenc']);
    }

    // When encoder is not nvenc (e.g. null or cpu standard), returns undefined
    const fnNull = (await import('@/automation/renderer')).encoderOverride(null);
    expect(fnNull).toBeUndefined();

    // Verify through the route POST endpoint that NVENC override is supplied to renderMedia on GPU attempt
    const response = await POST(new Request('http://localhost/api/render', {
      method: 'POST',
      body: JSON.stringify({ animationStyle: 'typewriter', text: 'NVENC_TEST', renderPipelinePreference: 'gpu' }),
    }));
    expect(response.status).toBe(200);
    const mediaOptions = renderMedia.mock.calls[0][0];
    if (process.platform === 'win32') {
      expect(mediaOptions.ffmpegOverride).toBeTypeOf('function');
      const overriddenArgs = mediaOptions.ffmpegOverride({ type: 'stitcher', args: ['-c:v', 'libx264'] });
      expect(overriddenArgs).toEqual(['-c:v', 'h264_nvenc']);
    }
  });

  it('adapts structured Core error to textual string error for useRenderExport', async () => {
    // Request with invalid parameter will trigger Core validation failure
    const response = await POST(new Request('http://localhost/api/render', {
      method: 'POST',
      body: JSON.stringify({ animationStyle: 'non-existent-style', text: 'BAD' }),
    }));
    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.success).toBe(false);
    expect(typeof payload.error).toBe('string');
    expect(payload.error.length).toBeGreaterThan(0);
    expect(payload.errorCode).toBe('INVALID_REQUEST');
  });

  it('adapts batch partial failure and provides top-level string error', async () => {
    renderMedia
      .mockImplementationOnce(async (options: { outputLocation: string }) => {
        await fs.mkdir(path.dirname(options.outputLocation), { recursive: true });
        await fs.writeFile(options.outputLocation, Buffer.from('video1'));
      })
      .mockRejectedValueOnce(new Error('Render media failed on line 2'));

    const response = await POST(new Request('http://localhost/api/render', {
      method: 'POST',
      body: JSON.stringify({
        animationStyle: 'typewriter',
        batchTexts: ['Line 1 OK', 'Line 2 FAIL', 'Line 3 SKIPPED'],
        renderPipelinePreference: 'cpu',
      }),
    }));

    expect(response.status).toBe(500);
    const payload = await response.json();
    expect(payload.success).toBe(false);
    expect(payload.batch).toBe(true);
    expect(typeof payload.error).toBe('string');
    expect(payload.renders).toHaveLength(2); // Stopped at failed item
    expect(payload.renders[0]).toMatchObject({ lineNumber: 1, text: 'Line 1 OK' });
    expect(payload.renders[0].url).toBeTruthy();
    expect(payload.renders[1]).toMatchObject({ lineNumber: 2, text: 'Line 2 FAIL' });
    expect(typeof payload.renders[1].error).toBe('string');
  });

  it('adapts cancel signal correctly with callback-based CancelSignal shape', async () => {
    const { toCancelSignal } = await import('@/automation/renderer');
    const controller = new AbortController();
    const cancelSignal = toCancelSignal(controller.signal);

    expect(cancelSignal).toBeTypeOf('function');

    let callbackCalled = false;
    cancelSignal?.(() => {
      callbackCalled = true;
    });

    expect(callbackCalled).toBe(false);
    controller.abort();
    expect(callbackCalled).toBe(true);

    // Also verify pre-aborted signal calls callback immediately
    const preAborted = new AbortController();
    preAborted.abort();
    const preSignal = toCancelSignal(preAborted.signal);
    let preCalled = false;
    preSignal?.(() => {
      preCalled = true;
    });
    expect(preCalled).toBe(true);
  });
});

