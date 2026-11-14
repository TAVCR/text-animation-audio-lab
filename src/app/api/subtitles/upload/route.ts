import { promises as fs } from 'node:fs';
import { NextResponse } from 'next/server';
import { createSubtitleMediaId, extensionForUpload, getSubtitleMediaPath, SUBTITLE_VIDEO_DIR } from '@/lib/subtitles/mediaPaths';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('video');
    if (!(file instanceof File)) return NextResponse.json({ success: false, error: 'Video file is required' }, { status: 400 });
    const extension = extensionForUpload(file.name);
    if (file.size <= 0 || file.size > 512 * 1024 * 1024) return NextResponse.json({ success: false, error: 'Invalid video size' }, { status: 400 });
    const id = createSubtitleMediaId();
    await fs.mkdir(SUBTITLE_VIDEO_DIR, { recursive: true });
    await fs.writeFile(getSubtitleMediaPath(id, extension), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ success: true, id, storedName: `${id}${extension}` });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Upload failed' }, { status: 400 });
  }
}
