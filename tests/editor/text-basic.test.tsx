import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import TextBasicTab from '@/components/inspector/tabs/TextBasicTab';
import { AnimationProvider } from '@/lib/AnimationContext';

beforeEach(() => { cleanup(); localStorage.clear(); });

describe('TextBasicTab', () => {
  it('exposes essential content, typography, color, and template controls', () => {
    render(<AnimationProvider><TextBasicTab /></AnimationProvider>);
    expect(screen.getByLabelText('Texto principal')).toBeTruthy();
    expect(screen.getByLabelText('Familia tipográfica')).toBeTruthy();
    expect(screen.getByLabelText('Tamaño de texto')).toBeTruthy();
    expect(screen.getByLabelText('Color')).toBeTruthy();
    expect(screen.getByLabelText('Relleno')).toBeTruthy();
    expect(screen.getByRole('listbox', { name: 'Plantilla de texto' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Texto principal'), { target: { value: 'Hola' } });
    expect(screen.getByLabelText('Texto principal')).toHaveProperty('value', 'Hola');
  });

  it('ofrece un rango amplio para el tamaño de texto y sus capas', () => {
    render(<AnimationProvider initialProps={{ animationStyle: 'dual-text-layers' }}><TextBasicTab /></AnimationProvider>);
    expect(screen.getByRole('slider', { name: 'Tamaño de texto deslizador' }).getAttribute('max')).toBe('2048');
    expect(screen.getByRole('slider', { name: 'Tamaño de capa 1 deslizador' }).getAttribute('max')).toBe('2048');
    expect(screen.getByRole('slider', { name: 'Tamaño de capa 2 deslizador' }).getAttribute('max')).toBe('2048');
  });

  it('exposes the real fill toggle so outlined text can be filled', () => {
    render(<AnimationProvider><TextBasicTab /></AnimationProvider>);
    const fill = screen.getByLabelText('Relleno');
    fireEvent.click(fill);
    expect((fill as HTMLInputElement).checked).toBe(false);
  });

  it('expone velocidad independiente para el efecto de texto', () => {
    render(<AnimationProvider><TextBasicTab /></AnimationProvider>);
    const speed = screen.getByLabelText('Velocidad del efecto');
    expect(speed).toHaveProperty('value', '1');
    fireEvent.change(speed, { target: { value: '2' } });
    expect(speed).toHaveProperty('value', '2');
    expect(screen.getByLabelText('Velocidad del efecto deslizador')).toHaveProperty('value', '2');
  });

  it('shows Typewriter cadence only for Typewriter and resets to 15', () => {
    render(<AnimationProvider><TextBasicTab /></AnimationProvider>);
    const cps = screen.getByLabelText('Caracteres por segundo');
    expect(cps).toHaveProperty('value', '15');
    fireEvent.change(cps, { target: { value: '30' } });
    fireEvent.keyDown(cps, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer Caracteres por segundo' }));
    expect(cps).toHaveProperty('value', '15');
    fireEvent.click(screen.getByRole('option', { name: /Slide In/i }));
    expect(screen.queryByLabelText('Caracteres por segundo')).toBeNull();
  });

  it('explains and clears range overrides before global appearance editing', () => {
    render(<AnimationProvider initialProps={{ textRangeStyles: [{ id: 'word-1', start: 0, end: 4, mode: 'stroke' }] }}><TextBasicTab /></AnimationProvider>);
    expect(screen.getAllByText(/estilos por palabra/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Quitar estilos por palabra' }));
    expect(screen.queryByText(/estilos por palabra/i)).toBeNull();
  });

  it('shows the real Bar Reveal color control only for Bar Reveal', () => {
    render(<AnimationProvider initialProps={{ animationStyle: 'bar-reveal' }}><TextBasicTab /></AnimationProvider>);
    expect(screen.getByLabelText('Color de la barra')).toBeTruthy();
  });
});
