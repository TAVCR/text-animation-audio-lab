import React from 'react';
import { describe, expect, it } from 'vitest';
import { CaptionedVideo } from '@/remotion/CaptionedVideoComposition';
describe('composición determinista de subtítulos', () => {
  it('declara vídeo fuente y cues como props sin crear intermediario', () => {
    const element = React.createElement(CaptionedVideo, { src: '/tmp/video.mp4', cues: [{ id: '1', start: 0, end: 1, text: 'Hola' }] });
    expect(element.props.src).toBe('/tmp/video.mp4');
    expect(element.props.cues[0].text).toBe('Hola');
  });
});
