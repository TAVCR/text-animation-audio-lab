import { sanitizeExportFileName } from './exportFilesystem';

export type BatchItem = { line: string; lineNumber: number; executionIndex: number; totalExecutableItems: number; fileName: string; status: 'pending' | 'rendering' | 'writing' | 'completed' | 'failed'; delivery?: 'written' | 'download-requested'; url?: string; error?: string };
export type BatchResult = { items: BatchItem[]; completed: number; failed: number; cancelled: boolean };

type BatchDeps = {
  lines: Array<string | { text: string; lineNumber: number }>;
  chooseDestination: () => Promise<unknown | null>;
  render: (line: string) => Promise<{ url: string }>;
  write: (destination: unknown, result: { url: string }, fileName: string) => Promise<{ fileName?: string; delivery?: 'written' | 'download-requested' } | void>;
  extension: string;
  onProgress?: (progress: { current: number; total: number; phase: 'rendering' | 'writing' }) => void;
};

export const resolveBatchFileNames = (lines: Array<string | { text: string; lineNumber: number }>, extension: string): string[] => {
  const counts = new Map<string, number>();
  return lines.map((entry) => {
    const line = typeof entry === 'string' ? entry : entry.text;
    const base = sanitizeExportFileName(line, extension).replace(new RegExp(`\\.${extension}$`), '');
    const key = base.toLocaleLowerCase('en-US');
    const count = (counts.get(key) ?? 0) + 1;
    counts.set(key, count);
    return `${base}${count === 1 ? '' : `-${count}`}.${extension}`;
  });
};

export const runBatchExport = async ({ lines, chooseDestination, render, write, extension, onProgress }: BatchDeps): Promise<BatchResult> => {
  const fileNames = resolveBatchFileNames(lines, extension);
  const items: BatchItem[] = lines.map((entry, index) => ({ line: typeof entry === 'string' ? entry : entry.text, lineNumber: typeof entry === 'string' ? index + 1 : entry.lineNumber, executionIndex: index + 1, totalExecutableItems: lines.length, fileName: fileNames[index], status: 'pending' }));
  let destination: unknown | null;
  try { destination = await chooseDestination(); } catch (error) { throw error; }
  if (!destination) return { items, completed: 0, failed: 0, cancelled: true };

  for (const item of items) {
    try {
      item.status = 'rendering';
      onProgress?.({ current: item.executionIndex, total: item.totalExecutableItems, phase: 'rendering' });
      const result = await render(item.line);
      item.url = result.url;
      item.status = 'writing';
      onProgress?.({ current: item.executionIndex, total: item.totalExecutableItems, phase: 'writing' });
      const written = await write(destination, result, item.fileName);
      if (written?.fileName) item.fileName = written.fileName;
      if (written?.delivery) item.delivery = written.delivery;
      item.status = 'completed';
    } catch (error: unknown) {
      item.status = 'failed';
      item.error = error instanceof Error ? error.message : 'Error de exportación.';
    }
  }

  return {
    items,
    completed: items.filter((item) => item.status === 'completed').length,
    failed: items.filter((item) => item.status === 'failed').length,
    cancelled: false,
  };
};
