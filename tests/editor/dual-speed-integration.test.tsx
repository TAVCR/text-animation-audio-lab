import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Player } from '@remotion/player';
import { AnimationProvider, useAnimation } from '@/lib/AnimationContext';
import TextBasicTab from '@/components/inspector/tabs/TextBasicTab';
import { MainComposition } from '@/remotion/MainComposition';
import { createDisabledSecondaryTextLayer } from '@/lib/editor/dualTextLayers';
import { defaultAnimationProps } from '@/lib/AnimationContext';

function Preview() {
  const { props } = useAnimation();
  return <Player component={Composition} inputProps={{ document: props }} compositionWidth={1920} compositionHeight={1080} fps={30} durationInFrames={300} initialFrame={3} />;
}
const Composition = ({ document }: { document: typeof defaultAnimationProps }) => <MainComposition {...document} />;
beforeEach(() => { cleanup(); localStorage.clear(); });
describe('velocidades de capas desde Inspector hasta composición real', () => {
  it('cambia solo la segunda estampación mediante su slider y restablece su velocidad', () => {
    render(<AnimationProvider initialProps={{ animationStyle: 'dual-text-layers', text: 'PRIMARY', enableParticles: false, inkStampFrames: 12, secondaryTextLayer: { ...createDisabledSecondaryTextLayer(defaultAnimationProps), enabled: true, text: 'SECONDARY', animationStyle: 'ink-stamp-print' } }}><TextBasicTab /><Preview /></AnimationProvider>);
    const primary = screen.getByText('PRIMARY', { selector: 'div' });
    const secondary = screen.getByText('SECONDARY', { selector: 'div' });
    const originalPrimary = primary.style.transform;
    const originalSecondary = secondary.style.transform;
    const slider = screen.getByRole('slider', { name: 'Velocidad de capa 2 deslizador' });
    fireEvent.change(slider, { target: { value: '2' } });
    expect(primary.style.transform).toBe(originalPrimary);
    expect(secondary.style.transform).not.toBe(originalSecondary);
    fireEvent.doubleClick(slider);
    expect(secondary.style.transform).toBe(originalSecondary);
  });
});
