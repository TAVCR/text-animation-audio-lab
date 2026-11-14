import { describe, expect, it } from 'vitest';
import { orderAvailableFontFamilies } from '@/lib/fonts/availableFonts';

describe('orderAvailableFontFamilies', () => {
  it('preserva todas las familias detectadas y prioriza las fuentes habituales', () => {
    const result = orderAvailableFontFamilies([
      'Zilla Slab',
      'Montserrat',
      'Arial',
      'Arial',
      '  Cascadia Code  ',
      'Papyrus',
    ]);

    expect(result).toEqual([
      'Arial',
      'Montserrat',
      'Cascadia Code',
      'Papyrus',
      'Zilla Slab',
    ]);
  });
});
