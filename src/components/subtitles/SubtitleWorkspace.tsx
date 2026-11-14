'use client';
import React from 'react';
import { useAnimation } from '@/lib/AnimationContext';
import { useExportSession } from '@/lib/editor/ExportContext';
import { useRenderExport } from '@/lib/hooks/useRenderExport';
import { AutoSubtitlesTool } from './AutoSubtitlesTool';
import type { SubtitleCue, SubtitleStyle } from '@/lib/subtitles/types';
export function SubtitleWorkspace() {
  const { props, setProps } = useAnimation();
  const session = useExportSession();
  const { chooseDestination, writeVideo } = useRenderExport({ props, setProps, exportSession: session });
  const [videoId, setVideoId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const upload = async (file: File) => { const form = new FormData(); form.append('video', file); const response = await fetch('/api/subtitles/upload', { method: 'POST', body: form }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setVideoId(data.id); };
  const render = async (cues: SubtitleCue[], style: Partial<SubtitleStyle>) => { if (!videoId || !session.tryAcquireExport()) return; let cancelled = false; try { session.dispatchExport({ type: 'destination-selecting' }); const destination = await chooseDestination('mp4', 'CaptionedVideo'); if (!destination) { cancelled = true; return; } session.dispatchExport({ type: 'rendering' }); setBusy(true); const response = await fetch('/api/subtitles/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId, cues, style, aspectRatio: props.aspectRatio, resolutionPreset: props.resolutionPreset }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); session.dispatchExport({ type: 'writing' }); const written = await writeVideo(destination, data.url, 'mp4', data.fileName); session.dispatchExport({ type: 'completed', result: { fileName: written.fileName, url: data.url, delivery: written.delivery } }); } catch (error) { session.dispatchExport({ type: 'failed', error: error instanceof Error ? error.message : String(error) }); } finally { setBusy(false); if (cancelled) session.dispatchExport({ type: 'destination-cancelled' }); session.releaseExport(); } };
  return <div className="space-y-3"><label className="block text-xs">Vídeo fuente<input aria-label="Vídeo fuente para subtítulos" type="file" accept="video/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); }} /></label><p className="text-xs text-neutral-400">{videoId ? 'Vídeo cargado.' : 'Carga un vídeo para comenzar.'}</p><AutoSubtitlesTool onRender={render} busy={busy || session.exportState.status !== 'idle'} /></div>;
}
