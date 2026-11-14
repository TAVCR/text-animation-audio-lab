'use client';
import React from 'react';
import { parseSrt } from '@/lib/subtitles/segmentation';
import type { SubtitleCue, SubtitleStyle } from '@/lib/subtitles/types';
import { SubtitleCueEditor } from './SubtitleCueEditor';
import { SubtitlePreview } from './SubtitlePreview';
import { SubtitlePresetPicker } from './SubtitlePresetPicker';
export function AutoSubtitlesTool({ onRender, busy = false }: { onRender?: (cues: SubtitleCue[], style: Partial<SubtitleStyle>) => void; busy?: boolean }) { const [cues, setCues] = React.useState<SubtitleCue[]>([]); const [style, setStyle] = React.useState<Partial<SubtitleStyle>>({}); return <section aria-label="Herramienta de subtítulos"><h2>Subtítulos</h2><textarea aria-label="SRT o texto manual" placeholder="Pega SRT o escribe texto manual" onChange={(e) => setCues(parseSrt(e.target.value))} /><SubtitlePresetPicker onSelect={setStyle} /><SubtitleCueEditor cues={cues} onChange={setCues} /><SubtitlePreview cues={cues} style={style} />{onRender ? <button type="button" disabled={busy || cues.length === 0} onClick={() => onRender(cues, style)}>{busy ? 'Renderizando subtítulos…' : 'Renderizar subtítulos'}</button> : null}</section>; }
