import { describe, expect, it } from 'vitest';
import { createInitialExportState, exportReducer } from '@/lib/editor/exportState';

describe('export state machine', () => {
  it('transitions from idle to destination, rendering, writing and completed', () => {
    let state = createInitialExportState();
    expect(state.status).toBe('idle');
    state = exportReducer(state, { type: 'destination-selecting' });
    expect(state.status).toBe('selecting-destination');
    state = exportReducer(state, { type: 'rendering' });
    expect(state.status).toBe('rendering');
    state = exportReducer(state, { type: 'writing' });
    expect(state.status).toBe('writing');
    state = exportReducer(state, { type: 'completed', result: { fileName: 'video.mp4', url: '/renders/video.mp4' } });
    expect(state.status).toBe('completed');
    expect(state.result?.fileName).toBe('video.mp4');
  });

  it('returns to idle without error when destination selection is cancelled', () => {
    const selecting = exportReducer(createInitialExportState(), { type: 'destination-selecting' });
    const cancelled = exportReducer(selecting, { type: 'destination-cancelled' });
    expect(cancelled.status).toBe('idle');
    expect(cancelled.error).toBeNull();
  });

  it('preserves the rendered result when writing fails', () => {
    let state = exportReducer(createInitialExportState(), { type: 'rendered', result: { fileName: 'video.mp4', url: '/renders/video.mp4' } });
    state = exportReducer(state, { type: 'writing' });
    state = exportReducer(state, { type: 'failed', error: 'No se pudo escribir el archivo.' });
    expect(state.status).toBe('failed');
    expect(state.result?.url).toBe('/renders/video.mp4');
    expect(state.error).toBe('No se pudo escribir el archivo.');
  });
});
