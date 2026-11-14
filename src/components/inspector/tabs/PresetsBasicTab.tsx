'use client';

import React from 'react';
import { useAnimation } from '@/lib/AnimationContext';

export default function PresetsBasicTab() {
  const { userPresets, saveNamedPreset, loadNamedPreset, deleteNamedPreset } = useAnimation();
  const [name, setName] = React.useState('');
  const [selected, setSelected] = React.useState('');
  const [message, setMessage] = React.useState('');
  const save = () => {
    const result = saveNamedPreset(name);
    setMessage(result.ok ? (result.error === 'replaced' ? 'Preset actualizado.' : 'Preset guardado.') : (result.error || 'Escribe un nombre válido.'));
    if (result.ok) setName('');
  };
  return <div className="h-full overflow-y-auto p-3 space-y-4"><h2 className="text-sm font-semibold text-neutral-100">Mis presets</h2><label htmlFor="preset-name" className="text-xs text-neutral-300">Nombre del preset</label><input id="preset-name" value={name} onChange={(event) => setName(event.target.value)} className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100" /><button type="button" className="h-9 rounded-md bg-emerald-600 px-3 text-sm font-semibold text-white" onClick={save}>Guardar preset</button><label htmlFor="preset-select" className="text-xs text-neutral-300">Preset guardado</label><select id="preset-select" value={selected} onChange={(event) => setSelected(event.target.value)} className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100"><option value="">Selecciona un preset</option>{userPresets.map((preset) => <option key={preset.name} value={preset.name}>{preset.name}</option>)}</select><div className="flex gap-2"><button type="button" disabled={!selected} className="h-9 rounded-md border border-neutral-700 px-3 text-sm text-neutral-200 disabled:opacity-40" onClick={() => setMessage(loadNamedPreset(selected) ? 'Preset cargado.' : 'No se pudo cargar el preset.')}>Cargar preset</button><button type="button" disabled={!selected} aria-label="Eliminar preset" className="h-9 rounded-md border border-red-700/70 px-3 text-sm text-red-300 disabled:opacity-40" onClick={() => { setMessage(deleteNamedPreset(selected) ? 'Preset eliminado.' : 'No se pudo eliminar el preset.'); setSelected(''); }}>Eliminar preset</button></div>{message ? <p role="status" className="text-xs text-cyan-300">{message}</p> : null}</div>;
}
