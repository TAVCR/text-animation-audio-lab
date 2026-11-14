import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import BackgroundBasicTab from '@/components/inspector/tabs/BackgroundBasicTab';
import { AnimationProvider } from '@/lib/AnimationContext';

beforeEach(cleanup);

describe('BackgroundBasicTab', () => {
  it('muestra controles propios de Retro Grid Forward en la pestaña Fondo', () => {
    render(<AnimationProvider initialProps={{ particlePreset: 'retro-grid-forward' }}><BackgroundBasicTab /></AnimationProvider>);
    expect(screen.getByLabelText('Dirección de flujo')).toBeTruthy();
    expect(screen.getByLabelText('Ángulo de cuadrícula')).toBeTruthy();
    expect(screen.getByLabelText('Grosor de línea')).toBeTruthy();
  });

  it('oculta los controles de Retro Grid para otros fondos', () => {
    render(<AnimationProvider initialProps={{ particlePreset: 'light-orbs' }}><BackgroundBasicTab /></AnimationProvider>);
    expect(screen.queryByLabelText('Dirección de flujo')).toBeNull();
    expect(screen.queryByLabelText('Ángulo de cuadrícula')).toBeNull();
    expect(screen.queryByLabelText('Grosor de línea')).toBeNull();
  });

  it('ofrece tamaños mínimo y máximo como sliders en fondos 3D', () => {
    render(<AnimationProvider initialProps={{ particlePreset: 'prism-sphere-shimmer-3d' }}><BackgroundBasicTab /></AnimationProvider>);
    expect((screen.getByLabelText('Tamaño mínimo deslizador') as HTMLInputElement).type).toBe('range');
    expect((screen.getByLabelText('Tamaño máximo deslizador') as HTMLInputElement).type).toBe('range');
  });

  it('presenta Grosor de línea como un único slider en Retro Grid Forward', () => {
    render(<AnimationProvider initialProps={{ particlePreset: 'retro-grid-forward', particleLineThickness: 1 }}><BackgroundBasicTab /></AnimationProvider>);
    const control = screen.getByLabelText('Grosor de línea') as HTMLInputElement;
    expect(control.type).toBe('range');
    expect(screen.queryByRole('spinbutton', { name: 'Grosor de línea' })).toBeNull();
  });

  it('expone el segundo color que Solar Wind Streaks realmente consume', () => {
    render(<AnimationProvider initialProps={{ particlePreset: 'solar-wind-streaks' }}><BackgroundBasicTab /></AnimationProvider>);
    expect(screen.getByLabelText('Color principal')).toBeTruthy();
    expect(screen.getByLabelText('Color secundario')).toBeTruthy();
  });
});
