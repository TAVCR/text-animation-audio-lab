import type { ExportAction } from './exportState';

export type SingleExportResult = { fileName: string; url: string; delivery?: 'written' | 'download-requested' };

type SingleExportDeps = {
  chooseDestination: () => Promise<unknown | null>;
  render: () => Promise<SingleExportResult>;
  write: (destination: unknown, result: SingleExportResult) => Promise<{ delivery?: 'written' | 'download-requested' } | void>;
  dispatch: (action: ExportAction) => void;
};

export const runSingleExport = async ({ chooseDestination, render, write, dispatch }: SingleExportDeps): Promise<SingleExportResult | null> => {
  dispatch({ type: 'destination-selecting' });
  let destination: unknown | null;
  try {
    destination = await chooseDestination();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'No se pudo seleccionar el destino.';
    dispatch({ type: 'failed', error: message });
    throw error;
  }
  if (!destination) {
    dispatch({ type: 'destination-cancelled' });
    return null;
  }

  try {
    dispatch({ type: 'rendering' });
    const result = await render();
    dispatch({ type: 'rendered', result });
    const delivery = await write(destination, result);
    const finalResult = { ...result, delivery: delivery?.delivery };
    dispatch({ type: 'completed', result: finalResult });
    return finalResult;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error de exportación.';
    dispatch({ type: 'failed', error: message });
    throw error;
  }
};
