const DEFAULT_CHARACTERS_PER_SECOND = 15;
const MIN_CHARACTERS_PER_SECOND = 1;
const MAX_CHARACTERS_PER_SECOND = 60;

export function sanitizeCharactersPerSecond(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_CHARACTERS_PER_SECOND;
  return Math.max(MIN_CHARACTERS_PER_SECOND, Math.min(MAX_CHARACTERS_PER_SECOND, numeric));
}

export function getTypewriterRevealFrames(graphemeCount: number, charactersPerSecond: unknown, fps: number): number {
  const count = Math.max(0, Math.floor(Number.isFinite(graphemeCount) ? graphemeCount : 0));
  if (count === 0) return 1;
  const safeFps = Number.isFinite(fps) && fps > 0 ? fps : 30;
  return Math.max(1, Math.ceil((count / sanitizeCharactersPerSecond(charactersPerSecond)) * safeFps));
}

export function segmentGraphemes(value: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(value), ({ segment }) => segment);
  }
  return Array.from(value);
}
