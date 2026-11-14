import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import ParticlesTab from '@/components/inspector/ParticlesTab';
import { AnimationProvider } from '@/lib/AnimationContext';

beforeEach(cleanup);

describe('ParticlesTab', () => {
  it('no muestra Line para light-orbs porque no tiene consumidor 2D', () => {
    render(<AnimationProvider initialProps={{ particlePreset: 'light-orbs' }}><ParticlesTab /></AnimationProvider>);
    expect(screen.queryByDisplayValue('light-orbs')).toBeTruthy();
    expect(document.querySelector('input[name="particleLineThickness"]')).toBeNull();
  });

  it('no monta Line para otro fondo 2D común', () => {
    render(<AnimationProvider initialProps={{ particlePreset: 'tech-network' }}><ParticlesTab /></AnimationProvider>);
    expect(document.querySelector('input[name="particleLineThickness"]')).toBeNull();
  });

  it('muestra Line únicamente en Retro Grid Forward y escribe su propiedad real', () => {
    render(<AnimationProvider initialProps={{ particlePreset: 'retro-grid-forward', particleLineThickness: 1 }}><ParticlesTab /></AnimationProvider>);
    const control = document.querySelector('input[name="particleLineThickness"]');
    expect(control).toBeInstanceOf(HTMLInputElement);
    expect((control as HTMLInputElement).value).toBe('1');

    fireEvent.change(control as HTMLInputElement, { target: { value: '2' } });

    expect((control as HTMLInputElement).value).toBe('2');
  });
});
