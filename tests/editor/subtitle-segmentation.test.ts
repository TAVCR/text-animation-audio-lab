import { describe, expect, it } from 'vitest';
import { cueAtFrame, parseSrt } from '@/lib/subtitles/segmentation';
describe('subtítulos deterministas', () => {
  it('parsea SRT y encuentra el cue por frame', () => {
    const cues = parseSrt('1\n00:00:01,000 --> 00:00:02,500\nHola mundo');
    expect(cues).toHaveLength(1);
    expect(cueAtFrame(cues, 45, 30)?.text).toBe('Hola mundo');
  });
});
