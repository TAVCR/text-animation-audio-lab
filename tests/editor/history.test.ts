import { describe, expect, it } from 'vitest';
import { createHistory, pushHistory, redoHistory, replaceCurrentHistory, undoHistory } from '@/lib/editor/history';

describe('editor history', () => {
  it('supports undo and redo without mutating snapshots', () => {
    const initial = { text: 'A', nested: { size: 10 } };
    const state = pushHistory(createHistory(initial), { text: 'B', nested: { size: 12 } });
    const undone = undoHistory(state);
    expect(undone.current).toEqual(initial);
    expect(redoHistory(undone).current).toEqual({ text: 'B', nested: { size: 12 } });
    expect(initial.nested.size).toBe(10);
  });

  it('clears the redo branch after a new edit', () => {
    const history = pushHistory(pushHistory(createHistory('A'), 'B'), 'C');
    const branched = pushHistory(undoHistory(history), 'D');
    expect(branched.current).toBe('D');
    expect(redoHistory(branched).current).toBe('D');
  });

  it('keeps at most 50 undo entries', () => {
    let history = createHistory(0);
    for (let value = 1; value <= 75; value += 1) history = pushHistory(history, value);
    expect(history.past).toHaveLength(50);
    expect(undoHistory(history).current).toBe(74);
  });

  it('replaces the current snapshot for grouped intermediate updates', () => {
    const history = replaceCurrentHistory(pushHistory(createHistory(0), 1), 3);
    expect(history.past).toEqual([0]);
    expect(undoHistory(history).current).toBe(0);
  });
});
