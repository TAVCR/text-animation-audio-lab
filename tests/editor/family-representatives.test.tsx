import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { defaultAnimationProps } from '@/lib/AnimationContext';
import { KineticSlideIn } from '@/remotion/templates/KineticSlideIn';
import { WipeRevealEffect } from '@/remotion/templates/WipeRevealEffect';
import { GlitchEffect } from '@/remotion/templates/GlitchEffect';
import { FlickerEffect } from '@/remotion/templates/FlickerEffect';
import { BarRevealEffect } from '@/remotion/templates/BarRevealEffect';
import { templateRegistry } from '@/remotion/templates/registry';
import { PaperCutoutAssemble } from '@/remotion/templates/PaperCutoutAssemble';

vi.mock('remotion', async () => {
  const actual = await vi.importActual<typeof import('remotion')>('remotion');
  return { ...actual, useCurrentFrame: () => 30, useVideoConfig: () => ({ fps: 30, width: 1920, height: 1080, durationInFrames: 120 }), spring: ({ frame }: { frame: number }) => Math.max(0, Math.min(1, frame / 30)), interpolate: (value: number, input: number[], output: number[]) => output[0] + ((Math.max(input[0], Math.min(input[1], value)) - input[0]) / (input[1] - input[0])) * (output[1] - output[0]) };
});

const props = { ...defaultAnimationProps, text: 'Alpha Beta', textRangeStyles: [] };

describe('representantes de familias F3', () => {
  it('slide-in mantiene el orden de palabras y alcanza estado final', () => {
    const html = renderToStaticMarkup(<KineticSlideIn {...props} slideDirection="left" />);
    expect(html.indexOf('Alpha')).toBeLessThan(html.indexOf('Beta'));
    expect(html).toContain('translate3d(0px, 0px, 0)');
  });

  it('wipe-reveal alcanza máscara completa sin NaN', () => {
    const html = renderToStaticMarkup(<WipeRevealEffect {...props} />);
    expect(html).toContain('100%');
    expect(html).not.toMatch(/NaN|Infinity/);
  });

  it.each([
    ['glitch', GlitchEffect],
    ['flicker', FlickerEffect],
    ['bar-reveal', BarRevealEffect],
  ])('%s produce markup finito y no vacío', (_id, Component) => {
    const html = renderToStaticMarkup(<Component {...props} />);
    expect(html.length).toBeGreaterThan(0);
    expect(html).not.toMatch(/NaN|Infinity/);
  });

  it.each(['bubble-pop', 'blur-reveal', 'neon-pulse', 'slide-reveal', 'smooth-sliding', 'clean-modern', 'follower-grow', 'blur-cascade', 'apple-style'])('%s conserva contrato compartido y salida finita', (id) => {
    const Component = templateRegistry[id as keyof typeof templateRegistry]!;
    const html = renderToStaticMarkup(<Component {...props} />);
    expect(html.length).toBeGreaterThan(0);
    expect(html).not.toMatch(/NaN|Infinity/);
  });

  it('extruded-3d conserva sus props específicas sin forzar WebGL en jsdom', () => {
    expect(typeof templateRegistry['extruded-3d']).toBe('function');
    expect(defaultAnimationProps.font3dPreset).toBe('auto');
    expect(Number.isFinite(defaultAnimationProps.extrudeDepth3d)).toBe(true);
    expect(Number.isFinite(defaultAnimationProps.letterSpacing3d)).toBe(true);
  });

  it('Paper Cutout recibe y aplica las props específicas del documento', () => {
    const html = renderToStaticMarkup(<PaperCutoutAssemble {...props} paperCutoutColor="#abc123" paperCutoutSettleFrames={20} />);
    expect(html).toContain('#abc123');
    expect(html).not.toMatch(/NaN|Infinity/);
  });

  it.each(['ink-stamp-print', 'variable-weight-wave', 'glyph-tile-assemble'])('%s está conectado al registry y produce salida finita', (id) => {
    const Component = templateRegistry[id as keyof typeof templateRegistry]!;
    const html = renderToStaticMarkup(<Component {...props} />);
    expect(html.length).toBeGreaterThan(0);
    expect(html).not.toMatch(/NaN|Infinity/);
  });

  it.each(['scramble', 'rotation', 'flicker-outline-fill', 'kinetic-box-sequence', 'shape-reveal', 'fly-through', 'viral-text', 'shake-flicker', 'cinematic'])('%s produce salida finita para su contrato individual', (id) => {
    const Component = templateRegistry[id as keyof typeof templateRegistry]!;
    const html = renderToStaticMarkup(<Component {...props} />);
    expect(html.length).toBeGreaterThan(0);
    expect(html).not.toMatch(/NaN|Infinity/);
  });
});
