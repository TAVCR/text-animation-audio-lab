'use client';

import dynamic from 'next/dynamic';
import React from 'react';
const PreviewContainer = dynamic(() => import('@/components/PreviewContainer'), { ssr: false });
const InspectorPanel = dynamic(() => import('@/components/inspector/InspectorPanel'), { ssr: false });
const SubtitleWorkspace = dynamic(() => import('@/components/subtitles/SubtitleWorkspace').then((mod) => mod.SubtitleWorkspace), { ssr: false });

export default function Home() {
  const [mode, setMode] = React.useState<'animation' | 'subtitles'>('animation');
  return (
    <main className="min-h-screen w-screen overflow-y-auto bg-neutral-950 text-neutral-100 font-sans">
      <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px] lg:h-screen">
        <section className="min-w-0 h-[clamp(220px,38vh,420px)] lg:h-full border-r border-neutral-800/70 bg-neutral-950 p-3">
          <div className="h-full w-full rounded-lg border border-neutral-800/80 bg-neutral-900/45 shadow-2xl shadow-black/40 overflow-hidden">
            <PreviewContainer />
          </div>
        </section>

        <aside className="min-h-[520px] lg:h-full min-w-0 bg-neutral-900 border-l border-neutral-800/40 overflow-hidden flex flex-col">
          <div className="shrink-0 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur px-3 py-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-300">
              Inspector
            </h2>
            <div className="mt-2 grid grid-cols-2 gap-1" role="tablist" aria-label="Modo de trabajo">
              <button role="tab" aria-selected={mode === 'animation'} onClick={() => setMode('animation')} className="rounded border border-neutral-700 px-2 py-1 text-[10px] uppercase">Animación de texto</button>
              <button role="tab" aria-selected={mode === 'subtitles'} onClick={() => setMode('subtitles')} className="rounded border border-neutral-700 px-2 py-1 text-[10px] uppercase">Subtítulos</button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {mode === 'animation' ? <InspectorPanel /> : <SubtitleWorkspace />}
          </div>
        </aside>
      </div>
    </main>
  );
}
