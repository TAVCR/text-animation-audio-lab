import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AnimationProvider, useAnimation, LAST_PROPS_STORAGE_KEY, USER_PRESETS_STORAGE_KEY, loadNamedPresetFromStorage, saveNamedPresetToStorage } from '@/lib/AnimationContext';
import { getResolvedDurationInFrames } from '@/lib/videoConfig';

function State() {
  const { props } = useAnimation();
  return <output data-testid="state">{JSON.stringify(props)}</output>;
}

beforeEach(() => { cleanup(); localStorage.clear(); });

describe('migración de duración fija', () => {
  it.each([
    ['slide-in', 'A', 2, 300, 150],
    ['typewriter', 'ABCDEFGHIJ', 2, 150, 300],
    ['kinetic-box-sequence', 'A B', 2, 150, 90],
  ])('conserva la duración efectiva antigua de %s y no migra dos veces', (animationStyle, text, speed, motionDurationFrames, expected) => {
    localStorage.setItem(USER_PRESETS_STORAGE_KEY, JSON.stringify({ Antiguo: { props: {
      animationStyle, text, speed, motionDurationFrames, speedControlsDuration: true,
      typewriterCharactersPerSecond: 1, boxSequenceDurationOne: 1, boxSequenceDurationTwo: 2,
    } } }));
    const loaded = loadNamedPresetFromStorage('Antiguo')!;
    expect(loaded.motionDurationFrames).toBe(expected);
    expect(loaded.speedControlsDuration).toBe(false);
    expect(loaded.speed).toBe(speed);
    expect(getResolvedDurationInFrames(loaded)).toBe(expected);
    saveNamedPresetToStorage('Antiguo', loaded);
    expect(loadNamedPresetFromStorage('Antiguo')!.motionDurationFrames).toBe(expected);
  });

  it('migra la sesión real y conserva duración después de desmontar y montar el provider', () => {
    localStorage.setItem(LAST_PROPS_STORAGE_KEY, JSON.stringify({ animationStyle: 'slide-in', motionDurationFrames: 300, speed: 2, speedControlsDuration: true }));
    const first = render(<AnimationProvider><State /></AnimationProvider>);
    expect(JSON.parse(screen.getByTestId('state').textContent!).motionDurationFrames).toBe(150);
    first.unmount();
    render(<AnimationProvider><State /></AnimationProvider>);
    const state = JSON.parse(screen.getByTestId('state').textContent!);
    expect(state.motionDurationFrames).toBe(150);
    expect(state.speedControlsDuration).toBe(false);
  });

  it('crea documentos nuevos con duración fija', () => {
    render(<AnimationProvider><State /></AnimationProvider>);
    const state = JSON.parse(screen.getByTestId('state').textContent!);
    expect(state.speedControlsDuration).toBe(false);
    expect(state.motionDurationFrames).toBe(150);
  });
});
