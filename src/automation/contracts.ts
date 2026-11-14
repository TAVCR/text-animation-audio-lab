import type { AnimationStyle } from '@/lib/types/animation';
import type { AspectRatio, ResolutionPreset } from '@/lib/videoConfig';

export const SCHEMA_VERSION = 1 as const;
export type GpuPolicy = 'auto' | 'gpu' | 'cpu';
export type OutputProfile = 'h264-opaque' | 'prores4444-alpha' | 'vp9-alpha' | 'png-alpha';
export type JobStatus = 'succeeded' | 'failed' | 'cancelled';
export type RenderMode = 'gpu' | 'cpu';
export type ErrorCode = 'INVALID_REQUEST' | 'UNKNOWN_ANIMATION' | 'UNSUPPORTED_PROFILE' | 'OUTPUT_OUTSIDE_ROOT' | 'OUTPUT_COLLISION' | 'GPU_UNAVAILABLE' | 'RENDER_FAILED' | 'INSPECTION_FAILED' | 'PUBLICATION_FAILED' | 'CANCELLED' | 'TIMEOUT' | 'FILESYSTEM_ERROR';

export interface AutomationRenderRequest {
  schemaVersion: 1; animationId: AnimationStyle; text: string; parameters: Record<string, unknown>;
  aspectRatio: AspectRatio; resolutionPreset: ResolutionPreset; durationInFrames: number;
  gpuPolicy: GpuPolicy; profile: Exclude<OutputProfile, 'png-alpha'>; outputName?: string; frameIndex?: number;
}
export interface AutomationStillRequest extends Omit<AutomationRenderRequest, 'profile'> {
  profile: 'png-alpha'; frameIndex: number;
}
export interface DiagnosticsAttempt { label: string; configuredRenderMode: RenderMode; configuredGlBackend: string | null; configuredEncoder: string | null; outcome: 'succeeded' | 'failed' | 'cancelled'; stage: string; error?: { code: string; message: string } }
export interface Diagnostics { requestedGpuPolicy: GpuPolicy; configuredRenderMode: RenderMode | null; effectiveRenderMode: RenderMode | null; configuredGlBackend: string | null; observedGlBackend: string | null; requestedEncoder: string | null; configuredEncoder: string | null; observedEncoder: string | null; policyOverrideReason: string | null; fallbackUsed: boolean; attempts: DiagnosticsAttempt[] }
export interface AutomationError { code: ErrorCode; message: string; stage: string; retryable: boolean; details?: Record<string, string | number | boolean | null> }
export interface ArtifactMetadata { artifactId: string; outputPath: string; mediaType: string; bytes: number; width: number; height: number; compositionFps: number; compositionDurationInFrames: number; durationSeconds: number; profile: OutputProfile; codec: string | null; container: string | null; pixelFormat: string | null; alpha: 'configured' | 'not-configured' | null; frameIndex?: number }
export type AutomationRenderResult = { schemaVersion: 1; jobId: string; status: 'succeeded'; artifact: ArtifactMetadata; diagnostics: Diagnostics } | { schemaVersion: 1; jobId: string; status: 'failed' | 'cancelled'; error: AutomationError; diagnostics: Diagnostics };
export type AutomationStillResult = AutomationRenderResult;

export interface HostContext { outputRoot: string; tempRoot: string; signal?: AbortSignal; timeoutMs?: number; platform?: NodeJS.Platform; gpuEnabled?: boolean; now?: () => Date; }
