import { describe, expect, it } from 'vitest';
import { getResolvedDurationInFrames, REMOTION_FPS, setDisplayedDurationSeconds } from '@/lib/videoConfig';

describe('edición de duración visible', () => {
  it('mantiene la duración del clip independiente de la velocidad del efecto', () => {
    const slow = setDisplayedDurationSeconds({ motionDurationFrames: 150, speed: 0.2, speedControlsDuration: true }, 10);
    const fast = setDisplayedDurationSeconds({ motionDurationFrames: 150, speed: 3, speedControlsDuration: true }, 10);
    expect(slow.motionDurationFrames).toBe(300);
    expect(fast.motionDurationFrames).toBe(300);
    expect(slow.effectiveDurationInFrames).toBe(300);
    expect(fast.effectiveDurationInFrames).toBe(300);
  });

  it('mantiene el clip Typewriter aunque cambien grafemas y CPS', () => {
    const short = getResolvedDurationInFrames({ animationStyle: 'typewriter', text: 'A', typewriterCharactersPerSecond: 1, motionDurationFrames: 1, speed: 1 }, REMOTION_FPS);
    const long = getResolvedDurationInFrames({ animationStyle: 'typewriter', text: 'A'.repeat(10), typewriterCharactersPerSecond: 1, motionDurationFrames: 1, speed: 1 }, REMOTION_FPS);
    expect(short).toBe(15);
    expect(long).toBe(15);
  });

  it('mantiene el clip Kinetic aunque cambie la cantidad de contenido', () => {
    const one = getResolvedDurationInFrames({ animationStyle: 'kinetic-box-sequence', text: 'A', boxSequenceDurationOne: 1 }, REMOTION_FPS);
    const two = getResolvedDurationInFrames({ animationStyle: 'kinetic-box-sequence', text: 'A B', boxSequenceDurationOne: 1, boxSequenceDurationTwo: 2 }, REMOTION_FPS);
    expect(one).toBe(150);
    expect(two).toBe(150);
  });
  it.each([
    [10, 1, true, 300, 300],
    [10, 2, true, 300, 300],
    [10, 2, false, 300, 300],
    [0.5, 1, true, 15, 15],
  ] as const)('%s s a %s×, vínculo %s', (seconds, speed, linked, base, effective) => {
    const result = setDisplayedDurationSeconds(
      { motionDurationFrames: 150, speed, speedControlsDuration: linked },
      seconds,
    );
    expect(result.motionDurationFrames).toBe(base);
    expect(result.effectiveDurationInFrames).toBe(effective);
    expect(result.error).toBeNull();
  });

  it('conserva duración ante NaN', () => {
    const result = setDisplayedDurationSeconds(
      { motionDurationFrames: 150, speed: 1, speedControlsDuration: true },
      Number.NaN,
    );
    expect(result.motionDurationFrames).toBe(150);
    expect(result.error).not.toBeNull();
  });

  it('informa el límite de duración base', () => {
    const result = setDisplayedDurationSeconds(
      { motionDurationFrames: 150, speed: 3, speedControlsDuration: true },
      120,
    );
    expect(result.motionDurationFrames).toBe(3600);
    expect(result.effectiveDurationInFrames).toBe(3600);
    expect(result.error).toBeNull();
  });
});
