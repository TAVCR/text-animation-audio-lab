import type { AttemptConfig } from './policy';
import type { AutomationRenderRequest, AutomationStillRequest } from './contracts';
export interface RendererComposition { id: string; width: number; height: number; durationInFrames: number; fps?: number; props?: Record<string, unknown>; defaultProps?: Record<string, unknown> }
export interface Renderer { getCompositions(inputProps: Record<string, unknown>, attempt: AttemptConfig, signal?: AbortSignal): Promise<RendererComposition[]>; renderVideo(input: { request: AutomationRenderRequest; inputProps: Record<string, unknown>; composition: RendererComposition; outputPath: string; attempt: AttemptConfig; signal?: AbortSignal }): Promise<void>; renderStill(input: { request: AutomationStillRequest; inputProps: Record<string, unknown>; composition: RendererComposition; outputDir: string; fileName: string; attempt: AttemptConfig; signal?: AbortSignal }): Promise<void>; cancel?(jobId: string): Promise<void> }
export type CancelSignal = (callback: () => void) => void;

export const toCancelSignal = (signal?: AbortSignal): CancelSignal | undefined =>
  signal
    ? (callback: () => void) => {
        if (signal.aborted) callback();
        else signal.addEventListener('abort', callback, { once: true });
      }
    : undefined;

export const encoderOverride = (encoder: string | null) =>
  encoder === 'nvenc'
    ? ({ args }: { type: 'pre-stitcher' | 'stitcher'; args: string[] }) =>
        args.map((arg) => (arg === 'libx264' ? 'h264_nvenc' : arg === 'libx265' ? 'hevc_nvenc' : arg))
    : undefined;
