export type RenderMode = 'gpu' | 'cpu';
export type EncodeMode = 'nvenc' | 'standard';

export interface GpuDiagnostics {
  renderMode: RenderMode;
  glBackend: string;
  encodeMode: EncodeMode;
  gpuAvailable: boolean;
  fallbackUsed: boolean;
}

export const createGpuDiagnostics = (input: Partial<GpuDiagnostics> = {}): GpuDiagnostics => ({
  renderMode: input.renderMode ?? 'cpu',
  glBackend: input.glBackend ?? 'default',
  encodeMode: input.encodeMode ?? 'standard',
  gpuAvailable: input.gpuAvailable ?? false,
  fallbackUsed: input.fallbackUsed ?? false,
});
