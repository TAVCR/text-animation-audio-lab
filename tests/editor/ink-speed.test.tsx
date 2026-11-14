import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { defaultAnimationProps } from '@/lib/AnimationContext';
import { InkStampPrint } from '@/remotion/templates/InkStampPrint';

const clock = vi.hoisted(() => ({ frame: 3, fps: 30 }));
vi.mock('remotion', async () => ({
  ...await vi.importActual<typeof import('remotion')>('remotion'),
  useCurrentFrame: () => clock.frame,
  useVideoConfig: () => ({ fps: clock.fps, width: 1920, height: 1080, durationInFrames: 300 }),
}));
const renderStamp = (speed: number) => renderToStaticMarkup(<InkStampPrint {...defaultAnimationProps} text="STAMP" inkStampFrames={12} speed={speed} inkStampFloatAmplitude={24} />);

describe('reloj real Ink Stamp', () => {
  it('aplica el rango de escala hasta seis sin saturarlo en tres', () => {
    clock.frame = 0;
    const initial = renderToStaticMarkup(<InkStampPrint {...defaultAnimationProps} inkStampStartScale={6} />);
    expect(initial).toContain('scale(6)');
    clock.frame = 90;
    const final = renderToStaticMarkup(<InkStampPrint {...defaultAnimationProps} inkStampEndScale={6} />);
    expect(final).toContain('scale(6)');
  });
  it('duplica progreso con velocidad 2 sin modificar el frame del clip', () => {
    clock.frame = 3;
    clock.fps = 30;
    const normal = renderStamp(1);
    const fast = renderStamp(2);
    expect(fast).not.toBe(normal);
    clock.frame = 6;
    expect(renderStamp(1)).toBe(fast);
    clock.frame = 3;
    expect(renderStamp(1)).toBe(normal);
  });

  it('mantiene frecuencia de levitación en segundos a 30 y 60 FPS', () => {
    clock.fps = 30;
    clock.frame = 42;
    const at30 = renderStamp(1);
    clock.fps = 60;
    clock.frame = 72;
    expect(renderStamp(1)).toBe(at30);
  });
});
