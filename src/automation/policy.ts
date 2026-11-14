import type { AutomationRenderRequest, AutomationStillRequest, DiagnosticsAttempt, HostContext, OutputProfile, RenderMode } from './contracts';
export interface AttemptConfig { label: string; mode: RenderMode; gl: string | null; encoder: string | null }
export const profileInfo = (profile: OutputProfile) => ({
  'h264-opaque': { codec: 'h264', container: 'mp4', pixelFormat: 'yuv420p', mediaType: 'video/mp4', alpha: 'not-configured' as const },
  'prores4444-alpha': { codec: 'prores', container: 'mov', pixelFormat: 'yuva444p10le', mediaType: 'video/quicktime', alpha: 'configured' as const },
  'vp9-alpha': { codec: 'vp9', container: 'webm', pixelFormat: 'yuva420p', mediaType: 'video/webm', alpha: 'configured' as const },
  'png-alpha': { codec: 'png', container: null, pixelFormat: null, mediaType: 'image/png', alpha: 'configured' as const },
}[profile]);
export const buildAttempts = (request: AutomationRenderRequest | AutomationStillRequest, host: HostContext): { attempts: AttemptConfig[]; override: string | null } => {
  if (request.profile === 'png-alpha') return { attempts: [{ label: 'cpu-standard', mode: 'cpu', gl: null, encoder: null }], override: request.gpuPolicy === 'cpu' ? null : 'LEGACY_PNG_CPU_POLICY' };
  const gpu = host.gpuEnabled !== false;
  const gl = 'angle';
  const gpuAttempts: AttemptConfig[] = request.profile === 'h264-opaque' && host.platform === 'win32'
    ? [{ label: `gpu:${gl}:nvenc`, mode: 'gpu', gl, encoder: 'nvenc' }, { label: `gpu:${gl}:standard`, mode: 'gpu', gl, encoder: 'standard' }]
    : [{ label: `gpu:${gl}:standard`, mode: 'gpu', gl, encoder: null }];
  if (request.gpuPolicy === 'cpu') return { attempts: [{ label: 'cpu-standard', mode: 'cpu', gl: null, encoder: null }], override: null };
  if (request.gpuPolicy === 'gpu' && !gpu) return { attempts: [], override: 'GPU_DISABLED_BY_HOST' };
  if (request.gpuPolicy === 'gpu') return { attempts: gpu ? gpuAttempts : [], override: gpu ? null : 'GPU_DISABLED_BY_HOST' };
  return { attempts: gpu ? [...gpuAttempts, { label: 'cpu-standard', mode: 'cpu', gl: null, encoder: null }] : [{ label: 'cpu-standard', mode: 'cpu', gl: null, encoder: null }], override: null };
};
export const emptyDiagnostics = (request: AutomationRenderRequest, override: string | null = null) => ({ requestedGpuPolicy: request.gpuPolicy, configuredRenderMode: null, effectiveRenderMode: null, configuredGlBackend: null, observedGlBackend: null, requestedEncoder: null, configuredEncoder: null, observedEncoder: null, policyOverrideReason: override, fallbackUsed: false, attempts: [] as DiagnosticsAttempt[] });
