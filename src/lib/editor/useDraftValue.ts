import React from 'react';

export const useDraftValue = (value: number | string, commit: (value: number | string) => void) => {
  const [draft, setDraft] = React.useState(String(value));
  const origin = React.useRef(String(value));
  React.useEffect(() => {
    const external = String(value);
    if (external !== origin.current) {
      origin.current = external;
      setDraft(external);
    }
  }, [value]);
  const begin = () => { origin.current = String(value); setDraft(origin.current); };
  const cancel = () => { setDraft(origin.current); };
  const confirm = () => {
    if (draft.trim() === '' || draft === '-') { setDraft(origin.current); return false; }
    const parsed = typeof value === 'number' ? Number(draft) : draft;
    if (typeof parsed === 'number' && !Number.isFinite(parsed)) { setDraft(origin.current); return false; }
    const nextDraft = String(parsed);
    if (nextDraft !== origin.current) commit(parsed);
    origin.current = nextDraft;
    setDraft(nextDraft);
    return true;
  };
  return { draft, setDraft, begin, cancel, confirm };
};
