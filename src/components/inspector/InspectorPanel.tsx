'use client';

import React from 'react';
import ExportTab from './tabs/ExportTab';
import GlobalTab from './tabs/GlobalTab';
import ParticlesTab from './tabs/ParticlesTab';
import PresetsTab from './tabs/PresetsTab';
import TextTab from './tabs/TextTab';

type InspectorShellTab = 'global' | 'text' | 'particles' | 'presets' | 'export';

const SHELL_TABS: Array<{ id: InspectorShellTab; label: string }> = [
  { id: 'global', label: 'Composición' },
  { id: 'text', label: 'Texto' },
  { id: 'particles', label: 'Fondo' },
  { id: 'presets', label: 'Mis presets' },
  { id: 'export', label: 'Exportar' },
];

export default function InspectorPanel() {
  const [activeTab, setActiveTab] = React.useState<InspectorShellTab>('global');

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div role="tablist" aria-label="Secciones del inspector" className="px-2.5 py-2 border-b border-neutral-800 bg-neutral-900/95 shrink-0">
        <div className="space-y-1">
          <div className="grid grid-cols-3 gap-1">
            {SHELL_TABS.slice(0, 3).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`inspector-tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`inspector-panel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
                  event.preventDefault();
                  const offset = event.key === 'ArrowRight' ? 1 : -1;
                  const next = (SHELL_TABS.findIndex((item) => item.id === activeTab) + offset + SHELL_TABS.length) % SHELL_TABS.length;
                  setActiveTab(SHELL_TABS[next].id);
                  document.getElementById(`inspector-tab-${SHELL_TABS[next].id}`)?.focus();
                }}
                className={`h-7 rounded-md border text-[10px] font-semibold uppercase tracking-[0.06em] transition-all flex items-center justify-center ${
                  activeTab === tab.id
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 shadow-sm'
                    : 'border-neutral-800 bg-neutral-950/70 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 hover:bg-neutral-800/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {SHELL_TABS.slice(3).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`inspector-tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`inspector-panel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
                  event.preventDefault();
                  const offset = event.key === 'ArrowRight' ? 1 : -1;
                  const next = (SHELL_TABS.findIndex((item) => item.id === activeTab) + offset + SHELL_TABS.length) % SHELL_TABS.length;
                  setActiveTab(SHELL_TABS[next].id);
                  document.getElementById(`inspector-tab-${SHELL_TABS[next].id}`)?.focus();
                }}
                className={`h-7 rounded-md border text-[10px] font-semibold uppercase tracking-[0.06em] transition-all flex items-center justify-center ${
                  activeTab === tab.id
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 shadow-sm'
                    : 'border-neutral-800 bg-neutral-950/70 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 hover:bg-neutral-800/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div role="tabpanel" id={`inspector-panel-${activeTab}`} aria-labelledby={`inspector-tab-${activeTab}`} className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'global' ? <GlobalTab /> : null}
        {activeTab === 'text' ? <TextTab /> : null}
        {activeTab === 'particles' ? <ParticlesTab /> : null}
        {activeTab === 'presets' ? <PresetsTab /> : null}
        {activeTab === 'export' ? <ExportTab /> : null}
      </div>
    </div>
  );
}
