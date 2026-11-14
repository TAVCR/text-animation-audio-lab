import path from 'node:path';
import { NextResponse } from 'next/server';
import { AutomationCore } from '@/automation/core';
import type { HostContext } from '@/automation/contracts';
import { createRemotionRenderer } from '@/automation/remotion-adapter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const host: HostContext = {
      outputRoot: path.resolve(process.cwd(), 'public', 'renders'),
      tempRoot: path.resolve(process.cwd(), '.automation-runtime', 'jobs'),
      signal: req.signal,
      platform: process.platform,
      gpuEnabled: !['0', 'false'].includes((process.env.REMOTION_USE_GPU ?? '').toLowerCase()),
    };
    const core = new AutomationCore({ renderer: await createRemotionRenderer() });
    const {
      animationStyle,
      text,
      batchTexts,
      aspectRatio,
      resolutionPreset,
      motionDurationFrames,
      renderPipelinePreference,
      outputProfile,
      transparentCodec,
      outputName,
      pngFrame,
      isTransparent,
      ...parameters
    } = raw;
    const common = {
      schemaVersion: 1 as const,
      animationId: animationStyle,
      text: text ?? '',
      parameters,
      aspectRatio: aspectRatio ?? '16:9',
      resolutionPreset: resolutionPreset ?? '1080p',
      durationInFrames: motionDurationFrames ?? 150,
      gpuPolicy: renderPipelinePreference ?? 'auto',
      outputName,
    };
    const renderOne = (value: string) =>
      outputProfile === 'png-paused-frame-alpha'
        ? core.still({ ...common, text: value, profile: 'png-alpha', frameIndex: pngFrame ?? 0 }, host)
        : core.render(
            {
              ...common,
              text: value,
              profile: isTransparent ? (transparentCodec === 'vp9' ? 'vp9-alpha' : 'prores4444-alpha') : 'h264-opaque',
            },
            host
          );
    const lines = Array.isArray(batchTexts)
      ? batchTexts.map(String).map((line: string) => line.trim()).filter(Boolean)
      : [];
    if (lines.length) {
      const results = [];
      for (const entry of Array.from(lines.entries())) {
        const [index, line] = entry;
        const item = await renderOne(line);
        results.push(
          item.status === 'succeeded'
            ? {
                lineNumber: index + 1,
                text: line,
                fileName: path.basename(item.artifact.outputPath),
                url: `/renders/${path.basename(item.artifact.outputPath)}`,
                diagnostics: item.diagnostics,
              }
            : {
                lineNumber: index + 1,
                text: line,
                error: item.error?.message ?? 'Render failed',
                errorCode: item.error?.code,
                diagnostics: item.diagnostics,
              }
        );
        if (item.status !== 'succeeded') break;
      }
      const ok = results.length === lines.length && results.every((item) => !('error' in item));
      const failedItem = results.find((item) => 'error' in item);
      const topLevelError = !ok ? (failedItem && 'error' in failedItem ? failedItem.error : 'Batch render failed') : undefined;
      return NextResponse.json(
        {
          success: ok,
          batch: true,
          renders: results,
          total: results.length,
          ...(topLevelError ? { error: String(topLevelError) } : {}),
          diagnostics: results[0]?.diagnostics,
        },
        { status: ok ? 200 : 500 }
      );
    }
    const result = await renderOne(text ?? '');
    if (result.status !== 'succeeded') {
      const errorMessage = typeof result.error === 'object' && result.error?.message
        ? result.error.message
        : 'Error al renderizar';
      return NextResponse.json(
        {
          success: false,
          schemaVersion: result.schemaVersion,
          jobId: result.jobId,
          status: result.status,
          error: errorMessage,
          errorCode: result.error?.code,
          errorStage: result.error?.stage,
          details: result.error,
          diagnostics: result.diagnostics,
        },
        { status: result.status === 'cancelled' ? 499 : 500 }
      );
    }
    const fileName = path.basename(result.artifact.outputPath);
    return NextResponse.json({
      success: true,
      ...result.artifact,
      durationInFrames: result.artifact.compositionDurationInFrames,
      fileName,
      url: `/renders/${fileName}`,
      outputKind: result.artifact.profile === 'png-alpha' ? 'png-still' : 'video',
      frame: result.artifact.frameIndex,
      renderMode: result.diagnostics.effectiveRenderMode,
      diagnostics: {
        ...result.diagnostics,
        renderMode: result.diagnostics.effectiveRenderMode,
        glBackend: result.diagnostics.configuredGlBackend,
        encodeMode: result.diagnostics.configuredEncoder,
      },
    });
  } catch (error) {
    console.error('Automation adapter error', error);
    const message = error instanceof Error ? error.message : 'Invalid request';
    return NextResponse.json(
      {
        success: false,
        schemaVersion: 1,
        status: 'failed',
        error: message,
      },
      { status: 400 }
    );
  }
}

