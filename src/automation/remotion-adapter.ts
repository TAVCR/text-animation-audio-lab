import path from 'node:path';
import type { VideoConfig } from 'remotion/no-react';
import type { AttemptConfig } from './policy';
import type { AutomationRenderRequest, AutomationStillRequest } from './contracts';
import { type Renderer, type RendererComposition, toCancelSignal, encoderOverride } from './renderer';

type VideoInput = {
  request: AutomationRenderRequest;
  inputProps: Record<string, unknown>;
  composition: RendererComposition;
  outputPath: string;
  attempt: AttemptConfig;
  signal?: AbortSignal;
};

type StillInput = {
  request: AutomationStillRequest;
  inputProps: Record<string, unknown>;
  composition: RendererComposition;
  outputDir: string;
  fileName: string;
  attempt: AttemptConfig;
  signal?: AbortSignal;
};

export interface RemotionAdapterOptions {
  entryPoint?: string;
  rootDir?: string;
}

let cachedServeUrl: string | null = null;

export const bundleRemotionRoot = async (options?: RemotionAdapterOptions): Promise<string> => {
  if (cachedServeUrl) return cachedServeUrl;
  const rootDir = options?.rootDir ?? process.cwd();
  const entryPoint = options?.entryPoint ?? path.resolve(rootDir, 'src/remotion/index.ts');
  const { bundle } = await import('@remotion/bundler');
  cachedServeUrl = await bundle({
    entryPoint,
    webpackOverride: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...(config.resolve?.alias ?? {}),
          '@': path.resolve(rootDir, 'src'),
        },
      },
    }),
  });
  return cachedServeUrl;
};

export const createRemotionRenderer = async (options?: RemotionAdapterOptions): Promise<Renderer> => {
  const url = await bundleRemotionRoot(options);
  const renderer = await import('@remotion/renderer');
  return {
    getCompositions: async (inputProps: Record<string, unknown>, attempt: AttemptConfig) =>
      (await renderer.getCompositions(url, { inputProps, chromiumOptions: attempt.gl ? { gl: 'angle' } : undefined })).map((c) => ({
        id: c.id,
        width: c.width,
        height: c.height,
        durationInFrames: c.durationInFrames,
        fps: c.fps,
        props: c.props,
        defaultProps: c.defaultProps,
      })),
    renderVideo: async ({ request, inputProps, composition, outputPath, attempt, signal }: VideoInput) => {
      await renderer.renderMedia({
        composition: composition as unknown as VideoConfig,
        serveUrl: url,
        codec: request.profile === 'vp9-alpha' ? 'vp9' : request.profile === 'prores4444-alpha' ? 'prores' : 'h264',
        outputLocation: outputPath,
        inputProps,
        pixelFormat: request.profile === 'vp9-alpha' ? 'yuva420p' : request.profile === 'prores4444-alpha' ? 'yuva444p10le' : 'yuv420p',
        imageFormat: request.profile === 'h264-opaque' ? 'jpeg' : 'png',
        proResProfile: request.profile === 'prores4444-alpha' ? '4444' : undefined,
        chromiumOptions: attempt.gl ? { gl: 'angle' } : undefined,
        concurrency: 1,
        cancelSignal: toCancelSignal(signal),
        ffmpegOverride: encoderOverride(attempt.encoder),
      });
    },
    renderStill: async ({ inputProps, composition, outputDir, fileName, attempt, signal }: StillInput) => {
      const frame = typeof inputProps.frameIndex === 'number' ? inputProps.frameIndex : 0;
      await renderer.renderFrames({
        serveUrl: url,
        composition: composition as unknown as VideoConfig,
        inputProps,
        outputDir,
        imageFormat: 'png',
        frameRange: [frame, frame],
        imageSequencePattern: fileName,
        chromiumOptions: attempt.gl ? { gl: 'angle' } : undefined,
        concurrency: 1,
        onStart: () => undefined,
        onFrameUpdate: () => undefined,
        cancelSignal: toCancelSignal(signal),
      });
    },
  };
};
