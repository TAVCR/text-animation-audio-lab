import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NumberField } from '@/components/inspector/fields/NumberField';
import { ColorField } from '@/components/inspector/fields/ColorField';

describe('NumberField', () => {
  it('always offers immediate slider editing and canonical double-click reset even for legacy callers', () => {
    const onChange = vi.fn();
    render(<NumberField id="legacy-number" label="Valor legacy" value={7} defaultValue={2} min={0} max={10} step={1} slider={false} onChange={onChange} />);
    const slider = screen.getByRole('slider', { name: 'Valor legacy deslizador' });
    fireEvent.change(slider, { target: { value: '9' } });
    expect(onChange).toHaveBeenLastCalledWith(9);
    fireEvent.doubleClick(slider);
    expect(onChange).toHaveBeenLastCalledWith(2);
    expect(screen.getByLabelText('Valor legacy')).toHaveProperty('value', '2');
    cleanup();
  });
  it('commits Enter once, supports zero and restores Escape', () => {
    const onChange = vi.fn();
    render(<NumberField id="size" label="Tamaño" value={2} defaultValue={2} min={0} max={10} step={1} unit="px" onChange={onChange} />);
    const input = screen.getByLabelText('Tamaño');
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(0);
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect((input as HTMLInputElement).value).toBe('0');
  });

  it('rejects invalid values and clamps limits', () => {
    const onChange = vi.fn();
    render(<NumberField id="size" label="Tamaño" value={2} defaultValue={2} min={0} max={10} step={1} unit="px" onChange={onChange} />);
    const input = screen.getByLabelText('Tamaño');
    fireEvent.change(input, { target: { value: 'Infinity' } });
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
    cleanup();
    render(<NumberField id="size" label="Tamaño" value={2} defaultValue={2} min={0} max={10} step={1} unit="px" onChange={onChange} />);
    const validInput = screen.getByLabelText('Tamaño');
    fireEvent.change(validInput, { target: { value: '9' } });
    fireEvent.blur(validInput);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(9);
    expect(screen.getByRole('spinbutton').getAttribute('aria-describedby')).toBe('size-help');
  });
});

describe('ColorField', () => {
  it('syncs picker and hex input, rejects invalid text, and resets', () => {
    const onChange = vi.fn();
    render(<ColorField id="fill" label="Color" value="#112233" defaultValue="#000000" onChange={onChange} />);
    const text = screen.getByLabelText('Color en hexadecimal');
    fireEvent.change(text, { target: { value: '#aabbcc' } });
    fireEvent.blur(text);
    expect(onChange).toHaveBeenCalledWith('#aabbcc');
    fireEvent.change(text, { target: { value: 'no-color' } });
    fireEvent.blur(text);
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer Color' }));
    expect(onChange).toHaveBeenLastCalledWith('#000000');
    expect(screen.getByLabelText('Color').getAttribute('aria-describedby')).toBe('fill-help');
  });
});
