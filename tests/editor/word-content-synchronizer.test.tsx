import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AnimationProvider, useAnimation } from '@/lib/AnimationContext';
import { WordContentSynchronizer } from '@/components/inspector/WordContentSynchronizer';

let observed: unknown;
function Observer() { const { props, setProps } = useAnimation(); observed = props; return <WordContentSynchronizer text={props.text} setProps={setProps} />; }

describe('WordContentSynchronizer remount', () => {
  afterEach(() => cleanup());
  it('preserves secondary ranges and styles through mount/unmount', () => {
    const initial = { text: 'Hola verde mundo', wordTwo: 'verde', showWordTwo: true, colorTwo: '#00ff00', textRangeStyles: [{ id: 'word-style-2-fill', mode: 'fill' as const, start: 5, end: 10, color: '#00ff00' }] };
    const first = render(<AnimationProvider initialProps={initial}><Observer /></AnimationProvider>);
    const before = JSON.stringify(observed);
    first.unmount();
    render(<AnimationProvider initialProps={initial}><Observer /></AnimationProvider>);
    expect(JSON.stringify(observed)).toBe(before);
  });
});
