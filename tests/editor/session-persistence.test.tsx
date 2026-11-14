import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ExportProvider, useExportSession } from '@/lib/editor/ExportContext';

function Consumer() {
  const session = useExportSession();
  return <>
    <span data-testid="state">{session.exportMode}|{session.batchTextInput}|{session.transparentCodec}|{session.batchRenderResults.length}</span><output data-testid="restored-result">{JSON.stringify(session.batchRenderResults[0] || null)}</output>
    <span data-testid="export-status">{session.exportState.status}</span>
    <button onClick={() => session.setExportMode('batch')}>batch</button>
    <button onClick={() => session.setBatchTextInput('A\nB')}>text</button>
    <button onClick={() => session.setTransparentCodec('vp9')}>codec</button>
    <button onClick={() => session.setBatchRenderResults([{ url: '/renders/A.mov', fileName: 'A.mov', lineNumber: 1, text: 'A', status: 'completed', delivery: 'written' }, { url: '/renders/B.mov', fileName: 'B.mov', lineNumber: 3, text: 'B', status: 'completed', delivery: 'download-requested' }])}>results</button>
    <button onClick={() => session.setBatchRenderResults([{ url: '/renders/runtime.mov', fileName: 'runtime.mov', lineNumber: 7, text: 'Runtime', status: 'completed', delivery: 'written', error: 'metadata', handle: { kind: 'file' }, blob: new Blob(['video']), stream: new ReadableStream() } as never])}>runtime results</button>
    <button onClick={() => session.dispatchExport({ type: 'rendering' })}>rendering</button>
  </>;
}

function MountableExport({ onStart }: { onStart: () => void }) {
  const session = useExportSession();
  return <button disabled={session.exportState.status === 'rendering'} onClick={onStart}>Exportar prueba</button>;
}

describe('export session persistence contract', () => {
  afterEach(() => cleanup());
  it('stores batch mode, A/B text, codec and results independently from document history', () => {
    const session = { exportMode: 'batch', batchTextInput: 'A\nB', transparentCodec: 'vp9', batchRenderResults: [{ url: '/renders/A.mov', fileName: 'A.mov', lineNumber: 1, text: 'A', status: 'completed', delivery: 'written' }] };
    const raw = JSON.stringify(session);
    const restored = JSON.parse(raw);
    expect(restored).toEqual(session);
    expect(restored).not.toHaveProperty('animationStyle');
  });

  it('preserves the export session while the consumer remounts', () => {
    const view = render(<ExportProvider><Consumer /></ExportProvider>);
    fireEvent.click(screen.getByText('batch')); fireEvent.click(screen.getByText('text')); fireEvent.click(screen.getByText('codec')); fireEvent.click(screen.getByText('results'));
    expect(screen.getByTestId('state').textContent).toBe('batch|A\nB|vp9|2');
    view.rerender(<ExportProvider><Consumer /></ExportProvider>);
    expect(screen.getByTestId('state').textContent).toBe('batch|A\nB|vp9|2');
  });

  it('exposes shared export status through the session context', () => {
    render(<ExportProvider><Consumer /></ExportProvider>);
    expect(screen.getByTestId('export-status').textContent).toBe('idle');
    fireEvent.click(screen.getByText('rendering'));
    expect(screen.getByTestId('export-status').textContent).toBe('rendering');
  });

  it('persists transient operations as idle while retaining export preferences', () => {
    render(<ExportProvider><Consumer /></ExportProvider>);
    fireEvent.click(screen.getByText('batch')); fireEvent.click(screen.getByText('text')); fireEvent.click(screen.getByText('codec')); fireEvent.click(screen.getByText('rendering'));
    const stored = JSON.parse(window.localStorage.getItem('remotion-fx:export-session:v2') || '{}');
    expect(stored.exportState.status).toBe('idle');
    expect(stored.exportMode).toBe('batch');
    expect(stored.transparentCodec).toBe('vp9');
    expect(stored.batchTextInput).toBe('A\nB');
  });

  it('proyecta resultados runtime a v2 JSON-safe y no rehidrata handles, Blob ni streams', async () => {
    const first = render(<ExportProvider><Consumer /></ExportProvider>);
    fireEvent.click(screen.getByText('batch')); fireEvent.click(screen.getByText('text')); fireEvent.click(screen.getByText('codec')); fireEvent.click(screen.getByText('runtime results'));
    const stored = JSON.parse(window.localStorage.getItem('remotion-fx:export-session:v2') || '{}');
    expect(stored.batchRenderResults).toEqual([expect.objectContaining({ url: '/renders/runtime.mov', fileName: 'runtime.mov', lineNumber: 7, text: 'Runtime', status: 'completed', delivery: 'written', error: 'metadata' })]);
    expect(stored.batchRenderResults[0]).not.toHaveProperty('handle');
    expect(stored.batchRenderResults[0]).not.toHaveProperty('stream');
    expect(stored.batchRenderResults[0]).not.toHaveProperty('blob');
    first.unmount();
    render(<ExportProvider><Consumer /></ExportProvider>);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByTestId('restored-result').textContent).toContain('runtime.mov');
    expect(screen.getByTestId('restored-result').textContent).toContain('"delivery":"written"');
    expect(screen.getByTestId('restored-result').textContent).not.toContain('handle');
    expect(screen.getByTestId('restored-result').textContent).not.toContain('blob');
    expect(screen.getByTestId('restored-result').textContent).not.toContain('stream');
    const restored = JSON.parse(window.localStorage.getItem('remotion-fx:export-session:v2') || '{}');
    expect(restored.batchRenderResults[0]).toEqual(expect.objectContaining({ fileName: 'runtime.mov', delivery: 'written' }));
    expect(restored.batchRenderResults[0]).not.toHaveProperty('handle');
    expect(restored.batchRenderResults[0]).not.toHaveProperty('stream');
    expect(restored.batchRenderResults[0]).not.toHaveProperty('blob');
  });

  it('acepta payload legacy de sesión sin delivery y conserva sus campos compatibles', async () => {
    window.localStorage.setItem('remotion-fx:export-session:v2', JSON.stringify({ exportMode: 'batch', batchTextInput: 'Legacy A\nLegacy B', transparentCodec: 'vp9', batchRenderResults: [{ url: '/renders/legacy.webm', fileName: 'legacy.webm', lineNumber: 1, text: 'Legacy A', status: 'completed' }] }));
    render(<ExportProvider><Consumer /></ExportProvider>);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByTestId('state').textContent).toBe('batch|Legacy A\nLegacy B|vp9|1');
    expect(screen.getByTestId('export-status').textContent).toBe('idle');
  });

  it('keeps shared busy state across a real unmount and remount', () => {
    function Harness() {
      const [mounted, setMounted] = React.useState(true);
      const session = useExportSession();
      return <><button onClick={() => session.dispatchExport({ type: 'rendering' })}>start shared export</button><button onClick={() => setMounted(false)}>unmount export</button><button onClick={() => setMounted(true)}>remount export</button>{mounted ? <MountableExport onStart={() => undefined} /> : <span>Otra pestaña</span>}</>;
    }
    render(<ExportProvider><Harness /></ExportProvider>);
    fireEvent.click(screen.getByText('start shared export'));
    expect(screen.getByRole('button', { name: 'Exportar prueba' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByText('unmount export'));
    expect(screen.getByText('Otra pestaña')).toBeTruthy();
    fireEvent.click(screen.getByText('remount export'));
    expect(screen.getByRole('button', { name: 'Exportar prueba' }).hasAttribute('disabled')).toBe(true);
  });

  it.each(['selecting-destination', 'rendering', 'writing'] as const)('restaura %s como idle en un nuevo proveedor v2', async (status) => {
    window.localStorage.setItem('remotion-fx:export-session:v2', JSON.stringify({ exportMode: 'batch', batchTextInput: 'A\nB', transparentCodec: 'vp9', batchRenderResults: [{ url: '/renders/A.mov', fileName: 'A.mov', lineNumber: 1, text: 'A', status: 'completed', delivery: 'written' }], exportState: { status, result: { fileName: 'A.mov', url: '/renders/A.mov', delivery: 'written' }, error: null } }));
    const first = render(<ExportProvider><Consumer /></ExportProvider>);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByTestId('export-status').textContent).toBe('idle');
    expect(screen.getByTestId('state').textContent).toContain('batch|A\nB|vp9|1');
    first.unmount();
    render(<ExportProvider><Consumer /></ExportProvider>);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByTestId('export-status').textContent).toBe('idle');
  });
});
