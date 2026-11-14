'use client';

import React from 'react';
import type { CatalogEntry } from '@/lib/editor/catalog';

interface TemplatePickerProps {
  label: string;
  entries: readonly CatalogEntry[];
  value: string;
  onChange: (id: string) => void;
}

export function TemplatePicker({ label, entries, value, onChange }: TemplatePickerProps) {
  const [query, setQuery] = React.useState('');
  const visible = entries.filter((entry) => `${entry.name} ${entry.id} ${entry.family} ${entry.description}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="space-y-2">
      <label htmlFor="template-search" className="text-xs text-neutral-300">{label}</label>
      <input id="template-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar plantilla…" className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100 outline-none focus:border-emerald-500" />
      <div role="listbox" aria-label={label} className="max-h-56 space-y-1 overflow-y-auto">
        {visible.map((entry) => <button key={entry.id} type="button" role="option" aria-selected={entry.id === value} onClick={() => onChange(String(entry.id))} className={`w-full rounded-md border p-2 text-left ${entry.id === value ? 'border-emerald-500 bg-emerald-500/10' : 'border-neutral-800 bg-neutral-900/60'}`}><span className="block text-sm text-neutral-100">{entry.name}</span><span className="block text-xs text-neutral-500">{entry.family} · {entry.description}</span></button>)}
      </div>
    </div>
  );
}
