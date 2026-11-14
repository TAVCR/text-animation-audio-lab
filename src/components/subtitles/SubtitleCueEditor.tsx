'use client';
import React from 'react';
import type { SubtitleCue } from '@/lib/subtitles/types';
export function SubtitleCueEditor({ cues, onChange }: { cues: SubtitleCue[]; onChange: (cues: SubtitleCue[]) => void }) {
  return <div aria-label="Editor de subtítulos" className="space-y-2">{cues.map((cue, index) => <div key={cue.id} className="grid grid-cols-[70px_70px_1fr] gap-1"><input aria-label={`Inicio ${index + 1}`} type="number" min="0" step="0.001" value={cue.start} onChange={(e) => onChange(cues.map((item, i) => i === index ? { ...item, start: Number(e.target.value) } : item))} /><input aria-label={`Fin ${index + 1}`} type="number" min="0" step="0.001" value={cue.end} onChange={(e) => onChange(cues.map((item, i) => i === index ? { ...item, end: Number(e.target.value) } : item))} /><input aria-label={`Texto ${index + 1}`} value={cue.text} onChange={(e) => onChange(cues.map((item, i) => i === index ? { ...item, text: e.target.value } : item))} /></div>)}</div>;
}
