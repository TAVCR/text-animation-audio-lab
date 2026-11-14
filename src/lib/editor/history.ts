export const MAX_HISTORY_ENTRIES = 50;

export type EditorHistory<T> = {
  past: T[];
  current: T;
  future: T[];
};

const snapshot = <T>(value: T): T => {
  if (value === undefined || value === null || typeof value !== 'object') return value;
  return JSON.parse(JSON.stringify(value)) as T;
};

export const createHistory = <T>(initial: T): EditorHistory<T> => ({
  past: [],
  current: snapshot(initial),
  future: [],
});

export const pushHistory = <T>(history: EditorHistory<T>, next: T): EditorHistory<T> => ({
  past: [...history.past, snapshot(history.current)].slice(-MAX_HISTORY_ENTRIES),
  current: snapshot(next),
  future: [],
});

export const replaceCurrentHistory = <T>(history: EditorHistory<T>, next: T): EditorHistory<T> => ({
  ...history,
  current: snapshot(next),
});

export const undoHistory = <T>(history: EditorHistory<T>): EditorHistory<T> => {
  if (!history.past.length) return history;
  const past = history.past.slice(0, -1);
  const previous = history.past[history.past.length - 1];
  return { past, current: snapshot(previous), future: [snapshot(history.current), ...history.future] };
};

export const redoHistory = <T>(history: EditorHistory<T>): EditorHistory<T> => {
  if (!history.future.length) return history;
  const [next, ...future] = history.future;
  return { past: [...history.past, snapshot(history.current)].slice(-MAX_HISTORY_ENTRIES), current: snapshot(next), future };
};
