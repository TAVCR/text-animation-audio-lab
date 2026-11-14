import type { SubtitleCue } from './types';

export const validateCues = (cues: SubtitleCue[]): SubtitleCue[] => cues
  .filter((cue) => Number.isFinite(cue.start) && Number.isFinite(cue.end) && cue.end > cue.start && cue.text.trim())
  .map((cue, index) => ({ ...cue, id: cue.id || String(index + 1), text: cue.text.trim() }))
  .sort((a, b) => a.start - b.start);

export const timeToSeconds = (value: string): number => {
  const match = value.trim().replace(',', '.').match(/^(\d+):(\d{2}):(\d{2})\.(\d{3})$/);
  if (!match) return Number.NaN;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
};
