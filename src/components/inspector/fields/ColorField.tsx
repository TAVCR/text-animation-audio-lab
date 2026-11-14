'use client';

import React from 'react';

const normalizeHex = (input: string): string | null => {
  let hex = input.trim();
  if (!hex.startsWith('#')) hex = `#${hex}`;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase();
  }
  return null;
};

interface ColorFieldProps {
  id: string;
  label: string;
  value: string;
  defaultValue: string;
  help?: string;
  onChange: (value: string) => void;
}

export function ColorField({ id, label, value, defaultValue, help, onChange }: ColorFieldProps) {
  const [draft, setDraft] = React.useState(value);
  const [invalid, setInvalid] = React.useState(false);
  React.useEffect(() => { setDraft(value); setInvalid(false); }, [value]);
  const helpId = `${id}-help`;
  const commit = () => {
    const normalized = normalizeHex(draft);
    if (!normalized) {
      setInvalid(true);
      setDraft(value);
      return;
    }
    setInvalid(false);
    setDraft(normalized);
    if (normalized !== value.toLowerCase()) onChange(normalized);
  };
  const reset = () => { setDraft(defaultValue); setInvalid(false); onChange(defaultValue); };
  const safePickerValue = normalizeHex(draft) ?? (normalizeHex(value) ?? '#000000');

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs text-neutral-200">{label}</label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={safePickerValue}
          onChange={(event) => { setDraft(event.target.value); setInvalid(false); onChange(event.target.value); }}
          aria-describedby={helpId}
          aria-invalid={invalid}
          className="h-9 w-12 rounded border border-neutral-700 bg-neutral-900 cursor-pointer"
        />
        <input
          id={`${id}-hex`}
          aria-label="Color en hexadecimal"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') { event.preventDefault(); commit(); }
            if (event.key === 'Escape') { event.preventDefault(); setDraft(value); setInvalid(false); }
          }}
          className="h-9 min-w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 font-mono outline-none focus:border-emerald-500"
        />
        <button
          type="button"
          className="h-9 rounded-md border border-neutral-700 hover:border-neutral-500 hover:bg-neutral-800 px-2.5 text-xs text-neutral-400 hover:text-neutral-100 transition-colors"
          onClick={reset}
          aria-label={`Restablecer ${label}`}
          title={`Restablecer ${label}`}
        >
          ↺
        </button>
      </div>
      <p id={helpId} className={`text-xs ${invalid ? 'text-red-400' : 'text-neutral-500'}`}>
        {invalid ? 'Usa un color hexadecimal como #112233 o #fff.' : (help ?? 'Formato hexadecimal (#112233)')}
      </p>
    </div>
  );
}
