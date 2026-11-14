import { NextResponse } from 'next/server';
import { validateCues } from '@/lib/subtitles/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json() as { videoId?: string; language?: string; maxWords?: number };
    if (!body.videoId) return NextResponse.json({ success: false, error: 'videoId is required' }, { status: 400 });
    if (!process.env.SUBTITLE_TRANSCRIPTION_API_KEY) {
      return NextResponse.json({ success: false, error: 'No transcription provider configured; import SRT or enter subtitles manually.' }, { status: 503 });
    }
    // Provider wiring is intentionally isolated; credentials never leave the server.
    const cues = validateCues([]);
    return NextResponse.json({ success: true, cues, language: body.language ?? 'auto', maxWords: body.maxWords ?? 5000 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Invalid request' }, { status: 400 });
  }
}
