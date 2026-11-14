import { describe, expect, it, vi } from 'vitest';
import { runBatchExport, resolveBatchFileNames } from '@/lib/editor/batchOrchestration';

describe('batch export orchestration', () => {
  it('chooses one destination, processes items sequentially and summarizes success', async () => {
    const events: string[] = [];
    const result = await runBatchExport({
      lines: ['A', 'B'],
      chooseDestination: vi.fn().mockResolvedValue({}),
      render: vi.fn(async (line) => { events.push(`render:${line}`); return { url: `/${line}.mp4` }; }),
      write: vi.fn(async (_destination, rendered) => { events.push(`write:${rendered.url}`); }),
      extension: 'mp4',
    });
    expect(events).toEqual(['render:A', 'write:/A.mp4', 'render:B', 'write:/B.mp4']);
    expect(result.completed).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.items.every((item) => item.status === 'completed')).toBe(true);
  });

  it('does not render when folder selection is cancelled', async () => {
    const render = vi.fn();
    const result = await runBatchExport({ lines: ['A', 'B'], chooseDestination: vi.fn().mockResolvedValue(null), render, write: vi.fn(), extension: 'mp4' });
    expect(render).not.toHaveBeenCalled();
    expect(result.cancelled).toBe(true);
  });

  it('continues after render and write failures and reports each item', async () => {
    const result = await runBatchExport({
      lines: ['A', 'B', 'C'],
      chooseDestination: vi.fn().mockResolvedValue({}),
      render: vi.fn(async (line) => { if (line === 'A') throw new Error('render A'); return { url: `/${line}.mp4` }; }),
      write: vi.fn(async (_destination, rendered) => { if (rendered.url === '/B.mp4') throw new Error('write B'); }),
      extension: 'mp4',
    });
    expect(result.completed).toBe(1);
    expect(result.failed).toBe(2);
    expect(result.items.map((item) => item.status)).toEqual(['failed', 'failed', 'completed']);
    expect(result.items[0].error).toBe('render A');
    expect(result.items[1].error).toBe('write B');
  });

  it('sanitizes names and resolves duplicate names deterministically', () => {
    expect(resolveBatchFileNames(['A/B', 'A B', 'A/B'], 'webm')).toEqual(['A_B.webm', 'A_B-2.webm', 'A_B-3.webm']);
  });

  it('treats case variants as the same Windows-compatible batch name', () => {
    expect(resolveBatchFileNames(['A', 'a'], 'mp4')).toEqual(['A.mp4', 'a-2.mp4']);
  });

  it('preserves original line numbers when empty source lines are omitted before export', async () => {
    const progress: string[] = [];
    const result = await runBatchExport({
      lines: [{ text: 'A', lineNumber: 1 }, { text: 'B', lineNumber: 3 }],
      chooseDestination: vi.fn().mockResolvedValue({}),
      render: vi.fn(async (line) => ({ url: `/${line}.mp4` })),
      write: vi.fn(async () => undefined),
      extension: 'mp4',
      onProgress: ({ current, total }) => progress.push(`${current} de ${total}`),
    });
    expect(result.items.map((item) => item.lineNumber)).toEqual([1, 3]);
    expect(result.items.map((item) => [item.executionIndex, item.totalExecutableItems])).toEqual([[1, 2], [2, 2]]);
    expect(progress).toEqual(['1 de 2', '1 de 2', '2 de 2', '2 de 2']);
  });

  it('returns the actual filename supplied by the writer after a filesystem collision', async () => {
    const result = await runBatchExport({ lines: ['A'], chooseDestination: vi.fn().mockResolvedValue({}), render: vi.fn().mockResolvedValue({ url: '/A.mp4' }), write: vi.fn().mockResolvedValue({ fileName: 'A-2.mp4' }), extension: 'mp4' });
    expect(result.items[0].fileName).toBe('A-2.mp4');
  });

  it('emits shared progress for each item render and write phase', async () => {
    const progress: string[] = [];
    await runBatchExport({ lines: ['A', 'B', 'C'], chooseDestination: vi.fn().mockResolvedValue({}), render: vi.fn().mockResolvedValue({ url: '/x.mp4' }), write: vi.fn().mockResolvedValue(undefined), extension: 'mp4', onProgress: ({ current, total, phase }) => progress.push(`${current} de ${total} — ${phase}`) });
    expect(progress).toEqual(['1 de 3 — rendering', '1 de 3 — writing', '2 de 3 — rendering', '2 de 3 — writing', '3 de 3 — rendering', '3 de 3 — writing']);
  });
});
