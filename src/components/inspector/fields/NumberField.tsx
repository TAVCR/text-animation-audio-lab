'use client';

import React from 'react';
import { useDraftValue } from '@/lib/editor/useDraftValue';

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  help?: string;
  error?: string;
  defaultValue: number;
  /** @deprecated Numeric fields always include a slider. */
  slider?: boolean;
  onChange: (value: number) => void;
}

export function NumberField({ id, label, value, min, max, step, unit = '', help, error, defaultValue, onChange }: NumberFieldProps) {
  const draft = useDraftValue(value, (next) => onChange(Math.min(max, Math.max(min, Number(next)))));
  const effectiveMax = max;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = error ? `${helpId} ${errorId}` : helpId;
  const commit = () => draft.confirm();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs text-neutral-200">{label}</label>
        {unit ? <span className="text-[11px] text-neutral-500">{unit}</span> : null}
      </div>
      <div className="flex items-center gap-2">
        <input
          id={id} type="number" inputMode="decimal" value={draft.draft} min={min} max={max} step={step}
          aria-describedby={describedBy} aria-invalid={Boolean(error)}
          onChange={(event) => draft.setDraft(event.target.value)} onFocus={draft.begin}
          onBlur={commit} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); commit(); } if (event.key === 'Escape') { event.preventDefault(); draft.cancel(); event.currentTarget.blur(); } }}
          className="h-9 min-w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-emerald-500"
        />
        <button type="button" className="h-9 rounded-md border border-neutral-700 px-2 text-xs text-neutral-300 hover:text-white" onClick={() => { onChange(defaultValue); draft.setDraft(String(defaultValue)); }} aria-label={`Restablecer ${label}`}>↺</button>
      </div>
      <input aria-label={`${label} deslizador`} type="range" min={min} max={effectiveMax} step={step} value={Number(draft.draft) || 0} onChange={(event) => { const next = Number(event.target.value); draft.setDraft(String(next)); onChange(next); }} onDoubleClick={() => { draft.setDraft(String(defaultValue)); onChange(defaultValue); }} className="w-full accent-emerald-500" />
      {help ? <p id={helpId} className="text-xs text-neutral-500">{help}</p> : <span id={helpId} className="sr-only">Valor entre {min} y {effectiveMax}{unit ? ` ${unit}` : ''}</span>}
      {error ? <p id={errorId} className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
