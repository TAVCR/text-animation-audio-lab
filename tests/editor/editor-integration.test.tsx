import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AnimationProvider, useAnimation } from '@/lib/AnimationContext';
import { useDraftValue } from '@/lib/editor/useDraftValue';

function Harness() {
  const { props, setProps, undo, redo, selectTextTemplate, selectBackgroundPreset } = useAnimation();
  const speed = useDraftValue(props.speed, (value) => setProps((p) => ({ ...p, speed: Number(value) })));
  return <>
    <input aria-label="slider" type="range" value={props.particleCount} onChange={(e) => setProps((p) => ({ ...p, particleCount: Number(e.target.value) }))} />
    <input aria-label="text" value={props.text} onChange={(e) => setProps((p) => ({ ...p, text: e.target.value }))} />
    <input aria-label="number" value={speed.draft} onFocus={speed.begin} onChange={(e) => speed.setDraft(e.target.value)} onBlur={speed.confirm} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); speed.confirm(); e.currentTarget.blur(); } if (e.key === 'Escape') { e.preventDefault(); speed.cancel(); e.currentTarget.blur(); } }} />
    <button onClick={undo}>undo</button><button onClick={redo}>redo</button>
    <button onClick={() => selectTextTemplate('glitch')}>glitch</button>
    <button onClick={() => selectBackgroundPreset('starfield')}>starfield</button>
  </>;
}

describe('editor integration through the real document provider', () => {
  afterEach(() => cleanup());
  beforeEach(() => window.localStorage.clear());
  it('groups a real range gesture and supports undo/redo', () => {
    render(<AnimationProvider initialProps={{ particleCount: 90 }}><Harness /></AnimationProvider>);
    const slider = screen.getByLabelText('slider');
    act(() => fireEvent.pointerDown(slider));
    fireEvent.change(slider, { target: { value: '20' } });
    fireEvent.change(slider, { target: { value: '30' } });
    fireEvent.change(slider, { target: { value: '40' } });
    act(() => fireEvent.pointerUp(slider));
    expect((slider as HTMLInputElement).value).toBe('40');
    fireEvent.click(screen.getByText('undo'));
    expect((slider as HTMLInputElement).value).toBe('90');
    fireEvent.click(screen.getByText('redo'));
    expect((slider as HTMLInputElement).value).toBe('40');
  });

  it('closes cancelled gestures and keeps consecutive drags independent', () => {
    render(<AnimationProvider initialProps={{ particleCount: 90 }}><Harness /></AnimationProvider>);
    const slider = screen.getByLabelText('slider');
    fireEvent.pointerDown(slider);
    fireEvent.change(slider, { target: { value: '20' } });
    fireEvent.pointerCancel(slider);
    fireEvent.pointerDown(slider);
    fireEvent.change(slider, { target: { value: '30' } });
    fireEvent.pointerUp(slider);
    fireEvent.pointerDown(slider);
    fireEvent.change(slider, { target: { value: '40' } });
    fireEvent.pointerUp(slider);
    fireEvent.click(screen.getByText('undo'));
    expect((slider as HTMLInputElement).value).toBe('30');
    fireEvent.click(screen.getByText('undo'));
    expect((slider as HTMLInputElement).value).toBe('90');
  });

  it('keeps real text and number controls editable through the provider', () => {
    render(<AnimationProvider><Harness /></AnimationProvider>);
    const text = screen.getByLabelText('text');
    fireEvent.change(text, { target: { value: 'Hola mundo' } });
    expect((text as HTMLInputElement).value).toBe('Hola mundo');
    const number = screen.getByLabelText('number');
    fireEvent.change(number, { target: { value: '1.5' } });
    expect((number as HTMLInputElement).value).toBe('1.5');
    fireEvent.click(screen.getByText('undo'));
    fireEvent.click(screen.getByText('undo'));
    expect((text as HTMLInputElement).value).toBe('TEXT');
    fireEvent.click(screen.getByText('redo'));
    expect((text as HTMLInputElement).value).toBe('Hola mundo');
  });

  it('commits speed once across Enter followed by blur, then supports undo and redo', () => {
    render(<AnimationProvider initialProps={{ speed: 1 }}><Harness /></AnimationProvider>);
    const number = screen.getByLabelText('number') as HTMLInputElement;
    fireEvent.focus(number);
    fireEvent.change(number, { target: { value: '2' } });
    fireEvent.keyDown(number, { key: 'Enter' });
    fireEvent.blur(number);
    expect(number.value).toBe('2');
    fireEvent.click(screen.getByText('undo'));
    expect(number.value).toBe('1');
    fireEvent.click(screen.getByText('redo'));
    expect(number.value).toBe('2');
  });

  it('does not commit escaped, invalid, or unchanged speed drafts', () => {
    render(<AnimationProvider initialProps={{ speed: 1 }}><Harness /></AnimationProvider>);
    const number = screen.getByLabelText('number') as HTMLInputElement;
    fireEvent.focus(number); fireEvent.change(number, { target: { value: '2' } }); fireEvent.keyDown(number, { key: 'Escape' }); fireEvent.blur(number);
    expect(number.value).toBe('1');
    fireEvent.focus(number); fireEvent.change(number, { target: { value: 'bad' } }); fireEvent.blur(number);
    expect(number.value).toBe('1');
    fireEvent.focus(number); fireEvent.change(number, { target: { value: '1' } }); fireEvent.keyDown(number, { key: 'Enter' });
    fireEvent.click(screen.getByText('undo'));
    expect(number.value).toBe('1');
  });

  it('makes template and background selection atomic and reversible', () => {
    window.localStorage.setItem('remotion-fx:template-props:v1', JSON.stringify({ glitch: { animationStyle: 'glitch', color: '#f00' } }));
    window.localStorage.setItem('remotion-fx:particle-preset-props:v1', JSON.stringify({ starfield: { particlePreset: 'starfield', particleCount: 12 } }));
    render(<AnimationProvider initialProps={{ animationStyle: 'typewriter', particlePreset: 'light-orbs', text: 'KEEP', motionDurationFrames: 150 }}><Harness /></AnimationProvider>);
    fireEvent.click(screen.getByText('glitch'));
    expect(screen.getByLabelText('text')).toHaveProperty('value', 'KEEP');
    fireEvent.click(screen.getByText('undo'));
    expect(screen.getByLabelText('text')).toHaveProperty('value', 'KEEP');
    fireEvent.click(screen.getByText('redo'));
    fireEvent.click(screen.getByText('starfield'));
    fireEvent.click(screen.getByText('undo'));
    expect(screen.getByLabelText('slider')).toHaveProperty('value', '90');
  });


});
