import { describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/subtitles/transcribe/route';
describe('transcripción opcional', () => {
  it('devuelve error recuperable sin proveedor y no rompe importación local', async () => {
    vi.stubEnv('SUBTITLE_TRANSCRIPTION_API_KEY', '');
    const response = await POST(new Request('http://localhost/api/subtitles/transcribe', { method: 'POST', body: JSON.stringify({ videoId: 'id' }) }));
    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain('SRT');
    vi.unstubAllEnvs();
  });
});
