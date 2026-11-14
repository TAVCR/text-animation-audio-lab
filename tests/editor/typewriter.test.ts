import { describe, expect, it } from 'vitest';
import { getTypewriterRevealFrames, sanitizeCharactersPerSecond, segmentGraphemes } from '@/remotion/templates/typewriterUtils';

describe('Typewriter grafemas', () => {
  it('trata el emoji compuesto como una sola unidad visible', () => {
    expect(segmentGraphemes('¡Hola! 👩🏽‍💻')).toEqual(['¡', 'H', 'o', 'l', 'a', '!', ' ', '👩🏽‍💻']);
  });

  it('calcula la duración intrínseca con CPS y normaliza valores inválidos', () => {
    expect(getTypewriterRevealFrames(15, 15, 30)).toBe(30);
    expect(getTypewriterRevealFrames(15, 30, 30)).toBe(15);
    expect(sanitizeCharactersPerSecond(undefined)).toBe(15);
    expect(sanitizeCharactersPerSecond(0)).toBe(1);
    expect(sanitizeCharactersPerSecond(Infinity)).toBe(15);
  });

  it('escala la duración requerida para contenido largo', () => {
    expect(getTypewriterRevealFrames(60, 1, 30)).toBe(1800);
    expect(getTypewriterRevealFrames(60, 60, 30)).toBe(30);
  });
});
