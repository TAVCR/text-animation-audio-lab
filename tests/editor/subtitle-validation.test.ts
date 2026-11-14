import { describe, expect, it } from 'vitest';
import { validateCues } from '@/lib/subtitles/validation';
describe('validación de subtítulos', () => {
  it('descarta intervalos inválidos y ordena cues', () => {
    expect(validateCues([{ id: '', start: 2, end: 1, text: 'bad' }, { id: '', start: 0, end: 1, text: ' ok ' }])).toEqual([{ id: '1', start: 0, end: 1, text: 'ok' }]);
  });
});
