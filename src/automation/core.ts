/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { dimensionsFor, normalizeRenderRequest, normalizeStillRequest, REMOTION_FPS_V1 } from './normalize';
import { buildAttempts, emptyDiagnostics, profileInfo } from './policy';
import { cleanupJob, createJobPaths, publish } from './filesystem';
import { createLifecycle } from './lifecycle';
import type { AutomationRenderRequest, AutomationRenderResult, AutomationStillRequest, HostContext, OutputProfile } from './contracts';
import type { Renderer } from './renderer';
export interface CoreDependencies { renderer: Renderer }
const ext = (p: OutputProfile) => p === 'h264-opaque' ? '.mp4' : p === 'prores4444-alpha' ? '.mov' : p === 'vp9-alpha' ? '.webm' : '.png';
const propsFor = (r: AutomationRenderRequest | AutomationStillRequest) => ({ animationStyle: r.animationId, text: r.text, ...r.parameters, aspectRatio: r.aspectRatio, resolutionPreset: r.resolutionPreset, motionDurationFrames: r.durationInFrames, isTransparent: r.profile !== 'h264-opaque', ...(r.profile === 'png-alpha' ? { frameIndex: r.frameIndex } : {}) });
export class AutomationCore {
  constructor(private readonly deps: CoreDependencies) {}
  async render(raw: unknown, host: HostContext): Promise<AutomationRenderResult> { try { return await this.run(normalizeRenderRequest(raw), host, false); } catch (error) { return this.invalid(error); } }
  async still(raw: unknown, host: HostContext): Promise<AutomationRenderResult> { try { return await this.run(normalizeStillRequest(raw), host, true); } catch (error) { return this.invalid(error); } }
  private invalid(error: unknown): AutomationRenderResult {
    const code = (error as { code?: import('./contracts').ErrorCode })?.code ?? 'INVALID_REQUEST';
    return { schemaVersion: 1, jobId: crypto.randomUUID(), status: 'failed', error: { code, message: error instanceof Error ? error.message : 'Invalid request', stage: 'validation', retryable: false }, diagnostics: { requestedGpuPolicy: 'auto', configuredRenderMode: null, effectiveRenderMode: null, configuredGlBackend: null, observedGlBackend: null, requestedEncoder: null, configuredEncoder: null, observedEncoder: null, policyOverrideReason: null, fallbackUsed: false, attempts: [] } };
  }
  private async run(request: AutomationRenderRequest | AutomationStillRequest, host: HostContext, still: boolean): Promise<AutomationRenderResult> {
    const policy = buildAttempts(request, host); const diagnostics: any = emptyDiagnostics(request as AutomationRenderRequest, policy.override); const jobId = crypto.randomUUID();
    if (!policy.attempts.length) return { schemaVersion: 1, jobId, status: 'failed', error: { code: 'GPU_UNAVAILABLE', message: 'GPU is disabled by host policy', stage: 'policy', retryable: false }, diagnostics };
    const lifecycle = createLifecycle(host); const info = profileInfo(request.profile as any); let paths: Awaited<ReturnType<typeof createJobPaths>> | null = null;
    const controller = new AbortController();
    const abortState: { cause: 'cancelled' | 'timeout' | null } = { cause: null };
    const onHostAbort = () => { if (!abortState.cause) abortState.cause = 'cancelled'; controller.abort(); };
    if (host.signal?.aborted) { abortState.cause = 'cancelled'; controller.abort(); } else { host.signal?.addEventListener('abort', onHostAbort, { once: true }); }
    const timer = host.timeoutMs ? setTimeout(() => { if (!abortState.cause) abortState.cause = 'timeout'; controller.abort(); }, host.timeoutMs) : undefined;
    const isAborted = () => controller.signal.aborted || lifecycle.isCancelled();
    const makeCancelledResult = (stage: string = 'lifecycle'): AutomationRenderResult => {
      lifecycle.cancel();
      const isTimeout = abortState.cause === 'timeout';
      return {
        schemaVersion: 1,
        jobId,
        status: 'cancelled',
        error: {
          code: isTimeout ? 'TIMEOUT' : 'CANCELLED',
          message: isTimeout ? 'Render timed out' : 'Job cancelled',
          stage,
          retryable: false,
        },
        diagnostics,
      };
    };
    try {
      lifecycle.start();
      if (isAborted()) return makeCancelledResult('lifecycle');
      paths = await createJobPaths(host, request.outputName ?? `text-animation-${jobId}`, ext(request.profile));
      if (isAborted()) return makeCancelledResult('lifecycle');
      const inputProps = propsFor(request); const dimensions = dimensionsFor(request as AutomationRenderRequest);
      let last: unknown;
      let renderedAny = false;
      for (let i = 0; i < policy.attempts.length; i += 1) {
        const attempt = policy.attempts[i];
        if (isAborted()) break;
        let rendered = false;
        try {
          if (isAborted()) break;
          const comps = await this.deps.renderer.getCompositions(inputProps, attempt, controller.signal);
          if (isAborted()) break;
          const found = comps.find((item) => item.id === 'Main');
          if (!found) throw Object.assign(new Error('Composition Main not found'), { code: 'RENDER_FAILED' as const });
          const composition = { ...found, width: dimensions.width, height: dimensions.height, durationInFrames: request.durationInFrames };
          const outputPath = path.join(paths.staging, `artifact${ext(request.profile)}`);
          if (isAborted()) break;
          if (still) {
            await this.deps.renderer.renderStill({ request: request as AutomationStillRequest, inputProps, composition, outputDir: paths.staging, fileName: path.basename(paths.finalPath), attempt, signal: controller.signal });
          } else {
            await this.deps.renderer.renderVideo({ request: request as AutomationRenderRequest, inputProps, composition, outputPath, attempt, signal: controller.signal });
          }
          if (isAborted()) {
            throw Object.assign(new Error(abortState.cause === 'timeout' ? 'Render timed out' : 'Job cancelled'), {
              code: (abortState.cause === 'timeout' ? 'TIMEOUT' : 'CANCELLED') as import('./contracts').ErrorCode,
              stage: 'render',
            });
          }
          rendered = true;
          renderedAny = true;
          if (isAborted()) {
            throw Object.assign(new Error(abortState.cause === 'timeout' ? 'Render timed out' : 'Job cancelled'), {
              code: (abortState.cause === 'timeout' ? 'TIMEOUT' : 'CANCELLED') as import('./contracts').ErrorCode,
              stage: 'publish',
            });
          }
          const source = still ? path.join(paths.staging, path.basename(paths.finalPath)) : outputPath;
          let stat: import('node:fs').Stats;
          try {
            stat = await fs.stat(source);
          } catch {
            throw Object.assign(new Error('Artifact inspection failed'), { code: 'INSPECTION_FAILED' as const, stage: 'inspection' });
          }
          if (isAborted()) {
            throw Object.assign(new Error(abortState.cause === 'timeout' ? 'Render timed out' : 'Job cancelled'), {
              code: (abortState.cause === 'timeout' ? 'TIMEOUT' : 'CANCELLED') as import('./contracts').ErrorCode,
              stage: 'publish',
            });
          }
          const published = await publish(source, paths.finalPath, paths.reservation);
          if (isAborted()) {
            throw Object.assign(new Error(abortState.cause === 'timeout' ? 'Render timed out' : 'Job cancelled'), {
              code: (abortState.cause === 'timeout' ? 'TIMEOUT' : 'CANCELLED') as import('./contracts').ErrorCode,
              stage: 'publish',
            });
          }
          diagnostics.attempts.push({ label: attempt.label, configuredRenderMode: attempt.mode, configuredGlBackend: attempt.gl, configuredEncoder: attempt.encoder, outcome: 'succeeded', stage: 'render' });
          diagnostics.configuredRenderMode = attempt.mode; diagnostics.effectiveRenderMode = attempt.mode; diagnostics.configuredGlBackend = attempt.gl; diagnostics.configuredEncoder = attempt.encoder; diagnostics.fallbackUsed = i > 0;
          lifecycle.succeed();
          return { schemaVersion: 1, jobId, status: 'succeeded', artifact: { artifactId: crypto.randomUUID(), outputPath: published, mediaType: info.mediaType, bytes: stat.size, width: dimensions.width, height: dimensions.height, compositionFps: REMOTION_FPS_V1, compositionDurationInFrames: request.durationInFrames, durationSeconds: request.durationInFrames / REMOTION_FPS_V1, profile: request.profile, codec: info.codec, container: info.container, pixelFormat: info.pixelFormat, alpha: info.alpha, ...(still ? { frameIndex: request.frameIndex } : {}) }, diagnostics };
        } catch (error) {
          last = error;
          const isErrAborted = isAborted();
          const defaultCode: import('./contracts').ErrorCode = isErrAborted
            ? (abortState.cause === 'timeout' ? 'TIMEOUT' : 'CANCELLED')
            : (rendered ? 'PUBLICATION_FAILED' : 'RENDER_FAILED');
          const errCode = (error as { code?: import('./contracts').ErrorCode })?.code ?? defaultCode;
          const errStage = (error as { stage?: string })?.stage ?? (rendered ? 'publish' : 'render');
          diagnostics.attempts.push({ label: attempt.label, configuredRenderMode: attempt.mode, configuredGlBackend: attempt.gl, configuredEncoder: attempt.encoder, outcome: isErrAborted ? 'cancelled' : 'failed', stage: errStage, error: { code: errCode, message: error instanceof Error ? error.message : 'Render failed' } });
          if (rendered || isErrAborted) break;
        }
      }
      if (isAborted()) return makeCancelledResult('lifecycle');
      lifecycle.fail();
      const finalCode = (last as { code?: import('./contracts').ErrorCode })?.code ?? 'RENDER_FAILED';
      const finalStage = (last as { stage?: string })?.stage ?? (renderedAny ? 'publish' : 'render');
      return { schemaVersion: 1, jobId, status: 'failed', error: { code: finalCode, message: last instanceof Error ? last.message : 'Render failed', stage: finalStage, retryable: false }, diagnostics };
    } catch (error) {
      if (isAborted()) return makeCancelledResult('lifecycle');
      lifecycle.fail();
      const code = (error as { code?: import('./contracts').ErrorCode })?.code ?? 'FILESYSTEM_ERROR';
      return { schemaVersion: 1, jobId, status: 'failed', error: { code, message: error instanceof Error ? error.message : 'Filesystem error', stage: 'core', retryable: false }, diagnostics };
    } finally {
      if (timer) clearTimeout(timer);
      if (host.signal) host.signal.removeEventListener('abort', onHostAbort);
      if (paths) await cleanupJob(paths.staging, paths.reservation, paths.tempRoot, paths.outputRoot).catch(() => undefined);
    }
  }
}
