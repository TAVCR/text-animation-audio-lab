import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { Player } from '@remotion/player';
import { defaultAnimationProps } from '@/lib/AnimationContext';
import { MainComposition } from '@/remotion/MainComposition';

const Composition = ({ document }: { document: typeof defaultAnimationProps }) => <MainComposition {...document} />;
afterEach(cleanup);
it('da tamaño de composición al contenedor de opacidad de Kinetic', () => {
  render(<Player component={Composition} inputProps={{ document: { ...defaultAnimationProps, animationStyle: 'kinetic-box-sequence', text: 'ALPHA BETA GAMMA', enableParticles: false } }} compositionWidth={1920} compositionHeight={1080} fps={30} durationInFrames={150} initialFrame={30} />);
  const text = screen.getByText(/^(ALPHA|BETA|GAMMA)$/);
  let node: HTMLElement | null = text.parentElement;
  while (node && !(node.style.opacity === '1' && !node.style.position && !node.style.background)) node = node.parentElement;
  expect(node).not.toBeNull();
  expect(node!.style.width).toBe('100%');
  expect(node!.style.height).toBe('100%');
});
