import { timeToSeconds, validateCues } from './validation';
import type { SubtitleCue } from './types';

export const parseSrt = (source: string): SubtitleCue[] => {
  const blocks = source.replace(/\r/g, '').trim().split(/\n\s*\n/);
  return validateCues(blocks.map((block, index) => {
    const lines = block.split('\n');
    const timingIndex = lines.findIndex((line) => line.includes('-->'));
    if (timingIndex < 0) return { id: String(index + 1), start: NaN, end: NaN, text: '' };
    const [start, end] = lines[timingIndex].split('-->').map((value) => timeToSeconds(value.trim().split(' ')[0]));
    return { id: lines[timingIndex - 1]?.trim() || String(index + 1), start, end, text: lines.slice(timingIndex + 1).join('\n') };
  }));
};

export const cueAtFrame = (cues: SubtitleCue[], frame: number, fps: number): SubtitleCue | null => {
  const seconds = frame / fps;
  return validateCues(cues).find((cue) => seconds >= cue.start && seconds < cue.end) ?? null;
};
