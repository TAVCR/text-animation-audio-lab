'use client';

import React from 'react';
import type { BatchRenderResult } from '@/lib/hooks/useRenderExport';
import { createInitialExportState, exportReducer, type ExportAction, type ExportResult, type ExportState } from './exportState';

type ExportSession = {
  exportMode: 'single' | 'batch';
  setExportMode: React.Dispatch<React.SetStateAction<'single' | 'batch'>>;
  batchTextInput: string;
  setBatchTextInput: React.Dispatch<React.SetStateAction<string>>;
  batchRenderResults: BatchRenderResult[];
  setBatchRenderResults: React.Dispatch<React.SetStateAction<BatchRenderResult[]>>;
  transparentCodec: 'vp9' | 'prores';
  setTransparentCodec: React.Dispatch<React.SetStateAction<'vp9' | 'prores'>>;
  exportState: ExportState;
  dispatchExport: React.Dispatch<ExportAction>;
  batchProgress: { current: number; total: number; phase: 'rendering' | 'writing' } | null;
  setBatchProgress: React.Dispatch<React.SetStateAction<{ current: number; total: number; phase: 'rendering' | 'writing' } | null>>;
  tryAcquireExport: () => boolean;
  releaseExport: () => void;
};

const EXPORT_SESSION_KEY = 'remotion-fx:export-session:v2';

const toPersistedBatchResult = (value: unknown): BatchRenderResult | null => {
  if (!value || typeof value !== 'object') return null;
  const result = value as Partial<BatchRenderResult>;
  if (typeof result.url !== 'string' || typeof result.fileName !== 'string' || typeof result.lineNumber !== 'number' || typeof result.text !== 'string') return null;
  return {
    url: result.url,
    fileName: result.fileName,
    lineNumber: result.lineNumber,
    text: result.text,
    ...(result.status === 'completed' || result.status === 'failed' ? { status: result.status } : {}),
    ...(result.delivery === 'written' || result.delivery === 'download-requested' ? { delivery: result.delivery } : {}),
    ...(typeof result.error === 'string' ? { error: result.error } : {}),
  };
};

const toPersistedExportResult = (value: unknown): ExportResult | null => {
  if (!value || typeof value !== 'object') return null;
  const result = value as Partial<ExportResult>;
  if (typeof result.fileName !== 'string' || typeof result.url !== 'string') return null;
  return {
    fileName: result.fileName,
    url: result.url,
    ...(result.delivery === 'written' || result.delivery === 'download-requested' ? { delivery: result.delivery } : {}),
  };
};

const ExportContext = React.createContext<ExportSession | undefined>(undefined);

export const ExportProvider = ({ children }: { children: React.ReactNode }) => {
  const [exportMode, setExportMode] = React.useState<'single' | 'batch'>('single');
  const [batchTextInput, setBatchTextInput] = React.useState('');
  const [batchRenderResults, setBatchRenderResults] = React.useState<BatchRenderResult[]>([]);
  const [transparentCodec, setTransparentCodec] = React.useState<'vp9' | 'prores'>('prores');
  const [exportState, dispatchExport] = React.useReducer(exportReducer, undefined, createInitialExportState);
  const [batchProgress, setBatchProgress] = React.useState<ExportSession['batchProgress']>(null);
  const exportLock = React.useRef(false);
  const tryAcquireExport = React.useCallback(() => {
    if (exportLock.current || exportState.status === 'selecting-destination' || exportState.status === 'rendering' || exportState.status === 'writing') return false;
    exportLock.current = true;
    return true;
  }, [exportState.status]);
  const releaseExport = React.useCallback(() => { exportLock.current = false; }, []);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(EXPORT_SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ExportSession> & { exportState?: Partial<ExportState> };
      if (parsed.exportMode === 'single' || parsed.exportMode === 'batch') setExportMode(parsed.exportMode);
      if (typeof parsed.batchTextInput === 'string') setBatchTextInput(parsed.batchTextInput);
      if (parsed.transparentCodec === 'vp9' || parsed.transparentCodec === 'prores') setTransparentCodec(parsed.transparentCodec);
      if (Array.isArray(parsed.batchRenderResults)) setBatchRenderResults(parsed.batchRenderResults.map(toPersistedBatchResult).filter((result): result is BatchRenderResult => result !== null));
      if (parsed.exportState && typeof parsed.exportState === 'object') {
        const restored = parsed.exportState as Partial<ExportState>;
        if (['idle', 'selecting-destination', 'rendering', 'writing', 'completed', 'failed'].includes(String(restored.status))) {
          const result = toPersistedExportResult(restored.result);
          dispatchExport({ type: restored.status === 'completed' && result ? 'completed' : restored.status === 'failed' ? 'failed' : 'destination-cancelled', ...(restored.status === 'failed' ? { error: restored.error || 'Error de exportación.' } : {}), ...(restored.status === 'completed' && result ? { result } : {}) } as ExportAction);
        }
      }
    } catch {
      // Continue with in-memory defaults when storage is unavailable or malformed.
    }
  }, []);

  React.useEffect(() => {
    try {
      const result = toPersistedExportResult(exportState.result);
      const persistedExportState = (exportState.status === 'completed' && result) || exportState.status === 'failed'
        ? { ...exportState, result }
        : { status: 'idle' as const, result: null, error: null };
      window.localStorage.setItem(EXPORT_SESSION_KEY, JSON.stringify({ exportMode, batchTextInput, batchRenderResults: batchRenderResults.map(toPersistedBatchResult).filter((result): result is BatchRenderResult => result !== null), transparentCodec, exportState: persistedExportState }));
    } catch {
      // Keep the working session in memory when storage is unavailable.
    }
  }, [exportMode, batchTextInput, batchRenderResults, transparentCodec, exportState]);

  return (
    <ExportContext.Provider value={{
      exportMode,
      setExportMode,
      batchTextInput,
      setBatchTextInput,
      batchRenderResults,
      setBatchRenderResults,
      transparentCodec,
      setTransparentCodec,
      exportState,
      dispatchExport,
      batchProgress,
      setBatchProgress,
      tryAcquireExport,
      releaseExport,
    }}>
      {children}
    </ExportContext.Provider>
  );
};

export const useExportSession = (): ExportSession => {
  const context = React.useContext(ExportContext);
  if (!context) throw new Error('useExportSession must be used within ExportProvider');
  return context;
};

export const useOptionalExportSession = (): ExportSession | undefined => React.useContext(ExportContext);
