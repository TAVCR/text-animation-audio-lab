export const finishSliderTransaction = <T>(before: T, after: T): { changed: boolean; snapshot: T } => {
  const changed = JSON.stringify(before) !== JSON.stringify(after);
  return { changed, snapshot: after };
};

export const confirmDraft = <T>(draft: string, parse: (value: string) => T): { changed: boolean; value: T | null } => {
  try {
    const value = parse(draft);
    if (value === null || value === undefined || (typeof value === 'number' && !Number.isFinite(value))) return { changed: false, value: null };
    return { changed: true, value };
  } catch { return { changed: false, value: null }; }
};
