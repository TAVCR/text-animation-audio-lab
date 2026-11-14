import { describe, expect, it } from 'vitest';
import { getPaperConfettiState } from '@/remotion/backgrounds/paperConfettiSettle';

describe('paper-confetti-settle', () => {
  it('cae, se asienta y reinicia de forma determinista', () => {
    const start = getPaperConfettiState(0, 0, 0.7, 0.1, 1.2, 0.6);
    const falling = getPaperConfettiState(1, 0, 0.7, 0.1, 1.2, 0.6);
    const settled = getPaperConfettiState(3.1, 0, 0.7, 0.1, 1.2, 0.6);
    expect(start.y).toBeLessThan(falling.y);
    expect(settled.y).toBeGreaterThan(falling.y);
    expect(getPaperConfettiState(0, 0, 0.7, 0.1, 1.2, 0.6)).toEqual(start);
  });
});
