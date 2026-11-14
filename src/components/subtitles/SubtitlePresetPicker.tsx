'use client';
import React from 'react';
import { subtitlePresets } from '@/lib/subtitles/presets';
export function SubtitlePresetPicker({ onSelect }: { onSelect: (style: (typeof subtitlePresets)[string]) => void }) {
  return <label>Preset de subtítulos <select aria-label="Preset de subtítulos" defaultValue="" onChange={(e) => { const style = subtitlePresets[e.target.value]; if (style) onSelect(style); }}><option value="">Selecciona</option>{Object.keys(subtitlePresets).map((key) => <option key={key} value={key}>{key}</option>)}</select></label>;
}
