import { buildRenderAttemptDescriptors } from './renderAttempts';
import type { CaptionedVideoProps } from '@/remotion/CaptionedVideoComposition';

export type CaptionedRenderRequest = CaptionedVideoProps & { outputPath: string; serveUrl: string; width: number; height: number; durationInFrames: number; fps: number; preference?: 'auto' | 'gpu' | 'cpu'; isCancelled?: () => boolean; cleanup?: (outputPath: string) => Promise<void> };
export type CaptionedRenderDependencies = { getCompositions: (url: string, options: { inputProps: unknown; chromiumOptions?: unknown }) => Promise<Array<{ id: string; width: number; height: number; durationInFrames: number }>>; renderMedia: (options: Record<string, unknown>) => Promise<void> };

export async function renderCaptionedVideo(request: CaptionedRenderRequest, deps: CaptionedRenderDependencies) {
  const attempts = buildRenderAttemptDescriptors({ preference: request.preference ?? 'auto', codec: 'h264', transparent: false, platform: process.platform });
  let lastError: unknown;
  for (let index = 0; index < attempts.length; index += 1) {
    const attempt = attempts[index];
    try {
      if (request.isCancelled?.()) throw new Error('Render cancelled');
      const compositions = await deps.getCompositions(request.serveUrl, { inputProps: request, chromiumOptions: attempt.glBackend ? { gl: attempt.glBackend } : undefined });
      const composition = compositions.find((item) => item.id === 'CaptionedVideo');
      if (!composition) throw new Error('CaptionedVideo composition not found');
      await deps.renderMedia({ composition: { ...composition, width: request.width, height: request.height, durationInFrames: request.durationInFrames }, serveUrl: request.serveUrl, codec: 'h264', outputLocation: request.outputPath, inputProps: request, chromiumOptions: attempt.glBackend ? { gl: attempt.glBackend } : undefined, fps: request.fps });
      if (request.isCancelled?.()) throw new Error('Render cancelled');
      return { fileName: request.outputPath.split(/[\\/]/).pop() ?? 'captioned-video.mp4', delivery: 'written' as const, renderMode: attempt.renderMode, glBackend: attempt.glBackend ?? 'default', encodeMode: attempt.encodeMode, fallbackUsed: index > 0 };
    } catch (error) { lastError = error; await request.cleanup?.(request.outputPath); if (request.isCancelled?.() || attempt.renderMode === 'cpu') break; }
  }
  throw lastError instanceof Error ? lastError : new Error('Captioned render failed');
}
