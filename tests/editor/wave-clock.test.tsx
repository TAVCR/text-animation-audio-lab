import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { defaultAnimationProps } from '@/lib/AnimationContext';
import { VariableWeightWave } from '@/remotion/templates/VariableWeightWave';
const clock = vi.hoisted(() => ({ frame: 15, fps: 30 }));
vi.mock('remotion', async () => ({ ...await vi.importActual<typeof import('remotion')>('remotion'), useCurrentFrame: () => clock.frame, useVideoConfig: () => ({ fps: clock.fps, width: 1920, height: 1080, durationInFrames: 300 }) }));
const wave = (speed: number) => renderToStaticMarkup(<VariableWeightWave {...defaultAnimationProps} text="WAVE" variableWeightCycleSeconds={2} speed={speed} />);
describe('reloj Variable Weight Wave', () => {
  it('cambia ritmo con speed y reproduce la misma fase tras seek', () => {
    clock.frame = 15;
    const normal = wave(1);
    const fast = wave(2);
    expect(fast).not.toBe(normal);
    clock.frame = 30;
    expect(wave(1)).toBe(fast);
    clock.frame = 15;
    expect(wave(1)).toBe(normal);
  });
  it('repite el ciclo durante todo el clip y usa FPS reales', () => {
    clock.fps = 30;
    clock.frame = 15;
    const initial = wave(1);
    clock.frame = 75;
    expect(wave(1)).toBe(initial);
    clock.fps = 60;
    clock.frame = 150;
    expect(wave(1)).toBe(initial);
  });
});
