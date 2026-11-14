import { describe, expect, it, vi } from 'vitest';
import { runSingleExport } from '@/lib/editor/exportOrchestration';
import { createInitialExportState, exportReducer } from '@/lib/editor/exportState';

describe('single export orchestration', () => {
  it('selects destination before one render and one write', async () => {
    const render = vi.fn().mockResolvedValue({ fileName: 'video.mp4', url: '/renders/video.mp4' });
    const write = vi.fn().mockResolvedValue(undefined);
    const dispatch = vi.fn();
    await expect(runSingleExport({ chooseDestination: vi.fn().mockResolvedValue({}), render, write, dispatch })).resolves.toEqual({ fileName: 'video.mp4', url: '/renders/video.mp4' });
    expect(render).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual(['destination-selecting', 'rendering', 'rendered', 'completed']);
  });

  it('does not render or write when destination selection is cancelled', async () => {
    const render = vi.fn(); const write = vi.fn(); const dispatch = vi.fn();
    await expect(runSingleExport({ chooseDestination: vi.fn().mockResolvedValue(null), render, write, dispatch })).resolves.toBeNull();
    expect(render).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual(['destination-selecting', 'destination-cancelled']);
  });

  it('fails without writing when render fails', async () => {
    const error = new Error('render failed'); const render = vi.fn().mockRejectedValue(error); const write = vi.fn(); const dispatch = vi.fn();
    await expect(runSingleExport({ chooseDestination: vi.fn().mockResolvedValue({}), render, write, dispatch })).rejects.toThrow('render failed');
    expect(write).not.toHaveBeenCalled();
    expect(dispatch.mock.calls.at(-1)?.[0]).toEqual({ type: 'failed', error: 'render failed' });
  });

  it('fails after render when writing fails', async () => {
    const error = new Error('write failed'); const render = vi.fn().mockResolvedValue({ fileName: 'video.mp4', url: '/video.mp4' }); const write = vi.fn().mockRejectedValue(error); const dispatch = vi.fn();
    await expect(runSingleExport({ chooseDestination: vi.fn().mockResolvedValue({}), render, write, dispatch })).rejects.toThrow('write failed');
    expect(render).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls.at(-1)?.[0]).toEqual({ type: 'failed', error: 'write failed' });
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual(['destination-selecting', 'rendering', 'rendered', 'failed']);
    expect(dispatch.mock.calls[2][0]).toEqual({ type: 'rendered', result: { fileName: 'video.mp4', url: '/video.mp4' } });
  });

  it('transitions to failed when destination selection rejects', async () => {
    const dispatch = vi.fn();
    await expect(runSingleExport({ chooseDestination: vi.fn().mockRejectedValue(new Error('picker failed')), render: vi.fn(), write: vi.fn(), dispatch })).rejects.toThrow('picker failed');
    expect(dispatch.mock.calls.map(([action]) => action.type)).toEqual(['destination-selecting', 'failed']);
  });

  it('preserves the rendered result through the real reducer when writing fails', async () => {
    const resultA = { fileName: 'A.mp4', url: '/A.mp4' };
    let state = createInitialExportState();
    const dispatch = (action: Parameters<typeof exportReducer>[1]) => { state = exportReducer(state, action); };
    await expect(runSingleExport({ chooseDestination: vi.fn().mockResolvedValue({}), render: vi.fn().mockResolvedValue(resultA), write: vi.fn().mockRejectedValue(new Error('write failed')), dispatch })).rejects.toThrow('write failed');
    expect(state.status).toBe('failed');
    expect(state.result).toEqual(resultA);
  });
});
