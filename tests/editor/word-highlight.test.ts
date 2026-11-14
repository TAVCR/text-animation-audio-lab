import { describe, expect, it } from 'vitest';
import { getWordHighlightIndex } from '@/remotion/templates/wordHighlightUtils';

describe('word highlight tracker', () => {
  it('activa una palabra por intervalo de tiempo y conserva el límite final', () => {
    expect(getWordHighlightIndex(0, 5, 0.4)).toBe(0);
    expect(getWordHighlightIndex(12, 5, 0.4)).toBe(1);
    expect(getWordHighlightIndex(24, 5, 0.4)).toBe(2);
    expect(getWordHighlightIndex(36, 5, 0.4)).toBe(3);
    expect(getWordHighlightIndex(48, 5, 0.4)).toBe(4);
    expect(getWordHighlightIndex(90, 5, 0.4)).toBe(4);
  });
});
