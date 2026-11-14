import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { AnimationProvider, useAnimation } from '@/lib/AnimationContext';
import TextBasicTab from '@/components/inspector/tabs/TextBasicTab';
function Duration() { const { props } = useAnimation(); return <output data-testid="frames">{props.motionDurationFrames}</output>; }
beforeEach(() => { cleanup(); localStorage.clear(); });
it('advierte Typewriter truncado y aumenta duración únicamente al pedirlo', () => {
  render(<AnimationProvider initialProps={{ animationStyle: 'typewriter', text: 'ABCDEFGHIJ', typewriterCharactersPerSecond: 1, motionDurationFrames: 150, speed: 1 }}><TextBasicTab /><Duration /></AnimationProvider>);
  expect(screen.getByTestId('frames').textContent).toBe('150');
  expect(screen.getByText(/secuencia excede/i)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ajustar duración a la secuencia' }));
  expect(screen.getByTestId('frames').textContent).toBe('300');
});
it('cambiar velocidad por slider no ajusta duración automáticamente', () => {
  render(<AnimationProvider initialProps={{ animationStyle: 'typewriter', text: 'ABCDEFGHIJ', typewriterCharactersPerSecond: 1, motionDurationFrames: 300, speed: 1 }}><TextBasicTab /><Duration /></AnimationProvider>);
  fireEvent.change(screen.getByRole('slider', { name: 'Velocidad del efecto deslizador' }), { target: { value: '0.5' } });
  expect(screen.getByTestId('frames').textContent).toBe('300');
  expect(screen.getByText(/secuencia excede/i)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ajustar duración a la secuencia' }));
  expect(screen.getByTestId('frames').textContent).toBe('600');
});
