import path from 'node:path';
import { promises as fs } from 'node:fs';
import { NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import { getSubtitleMediaPath, SUBTITLE_VIDEO_DIR } from '@/lib/subtitles/mediaPaths';
import { renderCaptionedVideo } from '@/lib/render/renderCaptionedVideo';
import { getCompositionDimensions, REMOTION_FPS } from '@/lib/videoConfig';
import type { SubtitleCue, SubtitleStyle } from '@/lib/subtitles/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const resolveStoredVideo = async (id: string): Promise<string> => {
  const safeIdPath = getSubtitleMediaPath(id);
  const base = path.basename(safeIdPath, '.media');
  const entries = await fs.readdir(SUBTITLE_VIDEO_DIR, { withFileTypes: true });
  const match = entries.find((entry) => entry.isFile() && entry.name.startsWith(`${base}.`));
  if (!match) throw new Error('Uploaded video not found');
  return path.join(SUBTITLE_VIDEO_DIR, match.name);
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as { videoId?: string; cues?: SubtitleCue[]; style?: Partial<SubtitleStyle>; aspectRatio?: '16:9' | '9:16' | '1:1'; resolutionPreset?: '1080p' | '1440p' | '4k' | '8k'; durationInFrames?: number; renderPipelinePreference?: 'auto' | 'gpu' | 'cpu' };
    if (!body.videoId || !Array.isArray(body.cues)) return NextResponse.json({ success: false, error: 'videoId and cues are required' }, { status: 400 });
    const sourcePath = await resolveStoredVideo(body.videoId);
    const serveUrl = await bundle({ entryPoint: path.resolve(process.cwd(), 'src/remotion/index.ts') });
    const dims = getCompositionDimensions(body.aspectRatio ?? '16:9', body.resolutionPreset ?? '1080p');
    const fileName = `Captioned_${Date.now()}.mp4`;
    const outputPath = path.resolve(process.cwd(), 'public', 'renders', fileName);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    const result = await renderCaptionedVideo({ src: sourcePath, cues: body.cues, style: body.style, outputPath, serveUrl, width: dims.width, height: dims.height, durationInFrames: body.durationInFrames ?? REMOTION_FPS * 5, fps: REMOTION_FPS, preference: body.renderPipelinePreference }, { getCompositions: getCompositions as never, renderMedia: renderMedia as never });
    return NextResponse.json({ success: true, url: `/renders/${fileName}`, ...result, diagnostics: { renderMode: result.renderMode, glBackend: result.glBackend, encodeMode: result.encodeMode, fallbackUsed: result.fallbackUsed } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Captioned render failed' }, { status: 500 });
  }
}
