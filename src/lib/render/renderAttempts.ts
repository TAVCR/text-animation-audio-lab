export type RenderPipelinePreference = 'auto' | 'gpu' | 'cpu';

export interface RenderAttemptDescriptor { label: string; renderMode: 'gpu' | 'cpu'; encodeMode: 'nvenc' | 'standard'; glBackend?: string; }
export interface RenderAttemptResult { attempt: RenderAttemptDescriptor; fallbackUsed: boolean; }
export class RenderCancelledError extends Error { constructor() { super('Render cancelled'); this.name = 'RenderCancelledError'; } }

export interface RenderAttemptOptions { preference: RenderPipelinePreference; codec: 'h264' | 'h265' | 'prores' | 'vp9'; transparent: boolean; platform: NodeJS.Platform; preferredGl?: string; }

export const buildRenderAttemptDescriptors = ({ preference, codec, transparent, platform, preferredGl = 'angle' }: RenderAttemptOptions): RenderAttemptDescriptor[] => {
  const allowNvenc = platform === 'win32' && !transparent && (codec === 'h264' || codec === 'h265');
  const gpu: RenderAttemptDescriptor[] = [
    ...(allowNvenc ? [{ label: `gpu:${preferredGl}:nvenc`, renderMode: 'gpu' as const, encodeMode: 'nvenc' as const, glBackend: preferredGl }] : []),
    { label: `gpu:${preferredGl}:standard`, renderMode: 'gpu', encodeMode: 'standard', glBackend: preferredGl },
  ];
  if (preference === 'cpu') return [{ label: 'cpu-standard', renderMode: 'cpu', encodeMode: 'standard' }];
  return preference === 'gpu' ? gpu : [...gpu, { label: 'cpu-standard', renderMode: 'cpu', encodeMode: 'standard' }];
};

export const executeRenderAttempts = async (
  attempts: RenderAttemptDescriptor[],
  run: (attempt: RenderAttemptDescriptor) => Promise<void>,
  isCancelled: () => boolean = () => false,
): Promise<RenderAttemptResult> => {
  let lastError: unknown;
  for (let index = 0; index < attempts.length; index += 1) {
    if (isCancelled()) throw new RenderCancelledError();
    const attempt = attempts[index];
    try {
      await run(attempt);
      return { attempt, fallbackUsed: index > 0 };
    } catch (error) {
      if (error instanceof RenderCancelledError || isCancelled()) throw error instanceof RenderCancelledError ? error : new RenderCancelledError();
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('All render attempts failed');
};
