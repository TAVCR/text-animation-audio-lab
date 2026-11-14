import { describe, expect, it } from 'vitest';
import { confirmDraft, finishSliderTransaction } from '@/lib/editor/grouping';

describe('editor grouping', () => {
  it('commits a slider drag once and ignores unchanged values', () => {
    expect(finishSliderTransaction({ value: 10 }, { value: 20 })).toEqual({ changed: true, snapshot: { value: 20 } });
    expect(finishSliderTransaction({ value: 10 }, { value: 10 })).toEqual({ changed: false, snapshot: { value: 10 } });
  });
  it('confirms one text/number draft and rejects invalid values', () => {
    expect(confirmDraft('120', (value) => Number(value))).toEqual({ changed: true, value: 120 });
    expect(confirmDraft('bad', (value) => Number(value))).toEqual({ changed: false, value: null });
  });
});
