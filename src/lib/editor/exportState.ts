export type ExportStatus = 'idle' | 'selecting-destination' | 'rendering' | 'writing' | 'completed' | 'failed';

export type ExportResult = { fileName: string; url: string; delivery?: 'written' | 'download-requested' };

export type ExportState = {
  status: ExportStatus;
  result: ExportResult | null;
  error: string | null;
};

export type ExportAction =
  | { type: 'destination-selecting' }
  | { type: 'destination-cancelled' }
  | { type: 'rendering' }
  | { type: 'rendered'; result: ExportResult }
  | { type: 'writing' }
  | { type: 'completed'; result: ExportResult }
  | { type: 'failed'; error: string };

export const createInitialExportState = (): ExportState => ({ status: 'idle', result: null, error: null });

export const exportReducer = (state: ExportState, action: ExportAction): ExportState => {
  switch (action.type) {
    case 'destination-selecting': return { ...state, status: 'selecting-destination', error: null };
    case 'destination-cancelled': return { ...state, status: 'idle', result: null, error: null };
    case 'rendering': return { ...state, status: 'rendering', error: null };
    case 'rendered': return { ...state, status: 'writing', result: action.result, error: null };
    case 'writing': return { ...state, status: 'writing', error: null };
    case 'completed': return { ...state, status: 'completed', result: action.result, error: null };
    case 'failed': return { ...state, status: 'failed', error: action.error };
    default: return state;
  }
};
