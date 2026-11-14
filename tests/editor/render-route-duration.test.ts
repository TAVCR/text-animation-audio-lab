import { beforeEach, describe, expect, it, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const getCompositions = vi.fn();
const renderMedia = vi.fn();
renderMedia.mockImplementation(async (options: { outputLocation: string }) => { await fs.mkdir(path.dirname(options.outputLocation), { recursive: true }); await fs.writeFile(options.outputLocation, 'mock-video'); });

vi.mock('@remotion/bundler', () => ({ bundle: vi.fn(async () => 'mock-serve-url') }));
vi.mock('@remotion/renderer', () => ({ getCompositions, renderMedia }));

import { POST } from '@/app/api/render/route';

describe('POST /api/render duración efectiva', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCompositions.mockResolvedValue([{ id: 'Main', width: 1920, height: 1080, durationInFrames: 150 }]);
    renderMedia.mockImplementation(async (options: { outputLocation: string }) => { await fs.mkdir(path.dirname(options.outputLocation), { recursive: true }); await fs.writeFile(options.outputLocation, 'mock-video'); });
  });

  it('resuelve Typewriter corto y largo dentro del handler real antes de renderMedia', async () => {
    const base = { animationStyle: 'typewriter', typewriterCharactersPerSecond: 1, motionDurationFrames: 15, speed: 1, speedControlsDuration: true, text: 'A' };
    const shortResponse = await POST(new Request('http://localhost/api/render', { method: 'POST', body: JSON.stringify(base) }));
    const shortPayload = await shortResponse.json();
    const shortDuration = renderMedia.mock.calls[0][0].composition.durationInFrames;

    const longResponse = await POST(new Request('http://localhost/api/render', { method: 'POST', body: JSON.stringify({ ...base, text: 'A'.repeat(10) }) }));
    const longPayload = await longResponse.json();
    const longDuration = renderMedia.mock.calls[1][0].composition.durationInFrames;

    expect(shortResponse.status).toBe(200);
    expect(longResponse.status).toBe(200);
    expect(shortPayload.durationInFrames).toBe(shortDuration);
    expect(longPayload.durationInFrames).toBe(longDuration);
    expect(shortDuration).toBe(15);
    expect(longDuration).toBe(15);
    expect(getCompositions).toHaveBeenCalledWith('mock-serve-url', expect.objectContaining({ inputProps: expect.objectContaining({ text: 'A'.repeat(10) }) }));
  });

  it('resuelve la duración de Kinetic Box Sequence por contenido efectivo en el endpoint real', async () => {
    const first = { animationStyle: 'kinetic-box-sequence', text: 'A', boxSequenceDurationOne: 1, motionDurationFrames: 15 };
    const second = { ...first, text: 'A B', boxSequenceDurationTwo: 2 };
    await POST(new Request('http://localhost/api/render', { method: 'POST', body: JSON.stringify(first) }));
    await POST(new Request('http://localhost/api/render', { method: 'POST', body: JSON.stringify(second) }));

    const firstDuration = renderMedia.mock.calls[0][0].composition.durationInFrames;
    const secondDuration = renderMedia.mock.calls[1][0].composition.durationInFrames;
    expect(firstDuration).toBe(15);
    expect(secondDuration).toBe(15);
  });
});
