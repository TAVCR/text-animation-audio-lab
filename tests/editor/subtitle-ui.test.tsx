import React from 'react';
import { describe, expect, it } from 'vitest';
import { SubtitlePreview } from '@/components/subtitles/SubtitlePreview';
import { SubtitleCueEditor } from '@/components/subtitles/SubtitleCueEditor';
describe('UI de subtítulos', () => {
  it('expone preview y editor con cues editables', () => {
    const cues = [{ id: '1', start: 0, end: 2, text: 'Hola' }];
    expect(React.createElement(SubtitlePreview, { cues, time: 1 }).props.cues).toEqual(cues);
    expect(React.createElement(SubtitleCueEditor, { cues, onChange: () => undefined }).props.cues).toEqual(cues);
  });
});
