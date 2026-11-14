import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { defaultAnimationProps } from '@/lib/AnimationContext';
import { PaperCutoutAssemble } from '@/remotion/templates/PaperCutoutAssemble';

const clock = vi.hoisted(() => ({ frame: 5, fps: 30 }));
vi.mock('remotion', async () => ({ ...await vi.importActual<typeof import('remotion')>('remotion'), useCurrentFrame: () => clock.frame, useVideoConfig: () => ({ fps: clock.fps, width: 1920, height: 1080, durationInFrames: 300 }) }));
const renderPaper = (speed: number) => {
  const div = document.createElement('div');
  div.innerHTML = renderToStaticMarkup(<PaperCutoutAssemble {...defaultAnimationProps} text="ALPHA BETA" paperCutoutWordDelayFrames={10} paperCutoutSettleFrames={12} speed={speed} />);
  return Array.from(div.querySelectorAll('span')).map(span => span.style.transform);
};
describe('reloj Paper Cutout', () => {
  it('mantiene el retraso de palabra en tiempo de clip al aumentar velocidad', () => {
    clock.frame = 5;
    const slow = renderPaper(0.5);
    const fast = renderPaper(3);
    expect(fast[1]).toBe(slow[1]);
    expect(fast[0]).not.toBe(slow[0]);
  });
  it('mantiene la frecuencia de levitación con el FPS real', () => {
    clock.fps = 30;
    clock.frame = 42;
    const at30 = renderPaper(1)[0];
    clock.fps = 60;
    clock.frame = 72;
    expect(renderPaper(1)[0]).toBe(at30);
  });
});
