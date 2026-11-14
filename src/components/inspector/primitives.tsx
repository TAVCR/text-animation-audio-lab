'use client';

import React from 'react';

export const compactInputClass =
  'h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-xs text-neutral-100 outline-none focus:border-neutral-500';

export const compactSelectClass =
  'h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-xs text-neutral-100 outline-none focus:border-neutral-500';

export const Accordion = ({
  title,
  storageKey,
  children,
}: {
  title: string;
  storageKey: string;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = React.useState(true);
  const contentId = `accordion-${storageKey}`;

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`inspector-accordion-${storageKey}`);
      if (saved !== null) setOpen(saved === 'true');
    } catch {
      // ignore
    }
  }, [storageKey]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      window.localStorage.setItem(`inspector-accordion-${storageKey}`, String(next));
    } catch {
      // ignore
    }
  };

  return (
    <section className="rounded-md border border-neutral-800 bg-neutral-950/50 overflow-hidden">
      <button
      type="button"
      aria-expanded={open}
      aria-controls={contentId}
        onClick={toggle}
        className="w-full flex items-center justify-between px-2 py-1.5 text-left hover:bg-neutral-900/70 transition-colors"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-300">{title}</span>
        <span className={`text-[10px] text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open ? <div id={contentId} className="p-2 space-y-1.5">{children}</div> : null}
    </section>
  );
};

export const FieldRow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  return (
    <label className="block space-y-1">
      <span className="block text-[10px] uppercase tracking-[0.08em] text-neutral-400">{label}</span>
      {children}
    </label>
  );
};

export const InlineNumberRow = ({
  items,
}: {
  items: Array<{ label: string; control: React.ReactNode }>;
}) => {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <span className="block text-[10px] uppercase tracking-[0.08em] text-neutral-400">{item.label}</span>
          {item.control}
        </div>
      ))}
    </div>
  );
};

export const InlineRangeRow = ({
  axis,
  value,
  children,
}: {
  axis: string;
  value: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="grid grid-cols-[18px_minmax(0,1fr)_44px] items-center gap-1.5">
      <span className="text-[10px] uppercase text-neutral-400">{axis}</span>
      {children}
      <span className="text-xs text-emerald-400 text-right">{value}</span>
    </div>
  );
};

export const CompactCheckbox = ({
  checked,
  onChange,
  label,
  name,
}: {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  name?: string;
}) => {
  return (
    <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-neutral-300">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-900"
      />
      {label}
    </label>
  );
};
