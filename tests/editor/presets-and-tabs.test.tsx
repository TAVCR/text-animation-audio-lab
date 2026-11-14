import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import { AnimationProvider, deleteNamedPresetFromStorage, saveNamedPresetToStorage, useAnimation } from '@/lib/AnimationContext';
import { EditorSessionProvider } from '@/lib/editor/EditorSessionContext';
import { ExportProvider } from '@/lib/editor/ExportContext';
import { useExportSession } from '@/lib/editor/ExportContext';
import PresetsBasicTab from '@/components/inspector/tabs/PresetsBasicTab';
import InspectorPanel from '@/components/inspector/InspectorPanel';
import TextBasicTab from '@/components/inspector/tabs/TextBasicTab';
import BackgroundBasicTab from '@/components/inspector/tabs/BackgroundBasicTab';

beforeEach(() => { cleanup(); window.localStorage.clear(); });

const AppProviders = ({ children }: { children: React.ReactNode }) => <AnimationProvider><EditorSessionProvider><ExportProvider>{children}</ExportProvider></EditorSessionProvider></AnimationProvider>;

const PresetProbe = () => {
  const { props, setProps } = useAnimation();
  return <><output data-testid="preset-text">{props.text}</output><button onClick={() => setProps((current) => ({ ...current, text: 'A' }))}>set A</button><button onClick={() => setProps((current) => ({ ...current, text: 'B' }))}>set B</button><button onClick={() => setProps((current) => ({ ...current, text: 'C' }))}>set C</button></>;
};

describe('PresetsBasicTab', () => {
  it('guarda y restaura una combinación Neon Bulb desde la UI real', () => {
    const Probe = () => { const { props } = useAnimation(); return <output data-testid="neon-pattern-state">{`${props.neonBulbPattern}:${props.neonBulbSecondaryPattern}:${props.neonBulbPatternMix}`}</output>; };
    render(<AnimationProvider initialProps={{ particlePreset: 'neon-bulb-alternation' }}><BackgroundBasicTab /><PresetsBasicTab /><Probe /></AnimationProvider>);
    fireEvent.change(screen.getByLabelText('Patrón principal'), { target: { value: 'diagonal-down' } });
    fireEvent.click(screen.getByLabelText('Combinar segundo patrón'));
    fireEvent.change(screen.getByLabelText('Patrón secundario'), { target: { value: 'radial' } });
    fireEvent.change(screen.getByRole('slider', { name: 'Mezcla de patrones deslizador' }), { target: { value: '0.72' } });
    fireEvent.change(screen.getByLabelText('Nombre del preset'), { target: { value: 'Ondas neón' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar preset' }));
    expect(() => JSON.parse(window.localStorage.getItem('remotion-fx:user-presets') || '')).not.toThrow();
    fireEvent.change(screen.getByLabelText('Patrón principal'), { target: { value: 'vertical' } });
    fireEvent.change(screen.getByRole('slider', { name: 'Mezcla de patrones deslizador' }), { target: { value: '0.1' } });
    fireEvent.change(screen.getByLabelText('Preset guardado'), { target: { value: 'Ondas neón' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cargar preset' }));
    expect(screen.getByTestId('neon-pattern-state').textContent).toBe('diagonal-down:radial:0.72');
  });

  it('guarda y restaura opciones Stellar Depth Field desde la UI real', () => {
    const Probe = () => { const { props } = useAnimation(); return <output data-testid="stellar-preset-state">{`${props.stellarDensity}:${props.stellarMotionMode}:${props.stellarNebulaColor}`}</output>; };
    render(<AnimationProvider initialProps={{ particlePreset: 'stellar-depth-field' }}><BackgroundBasicTab /><PresetsBasicTab /><Probe /></AnimationProvider>);
    fireEvent.change(screen.getByRole('slider', { name: 'Densidad deslizador' }), { target: { value: '510' } });
    fireEvent.change(screen.getByLabelText('Movimiento espacial'), { target: { value: 'orbit' } });
    fireEvent.change(screen.getByLabelText('Color nebulosa'), { target: { value: '#663399' } });
    fireEvent.blur(screen.getByLabelText('Color nebulosa'));
    fireEvent.change(screen.getByLabelText('Nombre del preset'), { target: { value: 'Galaxia profunda' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar preset' }));
    expect(() => JSON.parse(window.localStorage.getItem('remotion-fx:user-presets') || '')).not.toThrow();
    fireEvent.change(screen.getByRole('slider', { name: 'Densidad deslizador' }), { target: { value: '120' } });
    fireEvent.change(screen.getByLabelText('Movimiento espacial'), { target: { value: 'drift' } });
    fireEvent.change(screen.getByLabelText('Preset guardado'), { target: { value: 'Galaxia profunda' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cargar preset' }));
    expect(screen.getByTestId('stellar-preset-state').textContent).toBe('510:orbit:#663399');
  });

  it('elimina un preset persistido sin afectar otro', () => {
    window.localStorage.setItem('remotion-fx:user-presets', JSON.stringify({ A: { props: {}, updatedAt: 1 }, B: { props: {}, updatedAt: 2 } }));
    expect(deleteNamedPresetFromStorage('A')).toBe(true);
    const remaining = JSON.parse(window.localStorage.getItem('remotion-fx:user-presets') || '{}');
    expect(remaining.A).toBeUndefined();
    expect(remaining.B.updatedAt).toBe(2);
  });

  it('renders labelled real controls and saves/loads through the shared context', () => {
    render(<AnimationProvider><PresetsBasicTab /></AnimationProvider>);
    expect(screen.getByLabelText('Nombre del preset')).toBeTruthy();
    expect(screen.getByLabelText('Preset guardado')).toBeTruthy();
    const save = screen.getByRole('button', { name: 'Guardar preset' });
    fireEvent.change(screen.getByLabelText('Nombre del preset'), { target: { value: 'Mi look' } });
    fireEvent.click(save);
    expect(screen.getByRole('option', { name: 'Mi look' })).toBeTruthy();
    const select = screen.getByLabelText('Preset guardado');
    fireEvent.change(select, { target: { value: 'Mi look' } });
    expect(screen.getByRole('button', { name: 'Cargar preset' }).hasAttribute('disabled')).toBe(false);
  });

  it('offers an accessible delete action for the selected preset', () => {
    window.localStorage.setItem('remotion-fx:user-presets', JSON.stringify({ 'Mi look': { props: {}, updatedAt: 1 } }));
    render(<AnimationProvider><PresetsBasicTab /></AnimationProvider>);
    expect(screen.getByRole('button', { name: 'Eliminar preset' })).toBeTruthy();
  });

  it('loads a saved preset through the UI and removes it through the UI', () => {
    render(<AnimationProvider><PresetsBasicTab /><PresetProbe /></AnimationProvider>);
    fireEvent.click(screen.getByText('set A'));
    fireEvent.change(screen.getByLabelText('Nombre del preset'), { target: { value: 'Prueba' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar preset' }));
    fireEvent.click(screen.getByText('set B'));
    fireEvent.change(screen.getByLabelText('Preset guardado'), { target: { value: 'Prueba' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cargar preset' }));
    expect(screen.getByTestId('preset-text').textContent).toBe('A');
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar preset' }));
    expect(screen.queryByRole('option', { name: 'Prueba' })).toBeNull();
  });

  it('does not report saved when preset storage rejects the write', () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('quota'); };
    expect(saveNamedPresetToStorage('Prueba', {} as never)).toEqual({ error: 'storage' });
    Storage.prototype.setItem = original;
  });

  it('comunica actualización al reemplazar un preset desde la UI', () => {
    render(<AnimationProvider><PresetsBasicTab /></AnimationProvider>);
    const name = screen.getByLabelText('Nombre del preset');
    const save = screen.getByRole('button', { name: 'Guardar preset' });
    fireEvent.change(name, { target: { value: 'Prueba' } });
    fireEvent.click(save);
    fireEvent.change(name, { target: { value: 'Prueba' } });
    fireEvent.click(save);
    expect(screen.getByRole('status').textContent).toBe('Preset actualizado.');
    expect(screen.getAllByRole('option', { name: 'Prueba' })).toHaveLength(1);
  });

  it('reemplaza Prueba de A a B, carga B después de C y la elimina desde la UI real', () => {
    render(<AnimationProvider><PresetsBasicTab /><PresetProbe /></AnimationProvider>);
    const name = screen.getByLabelText('Nombre del preset');
    const saved = screen.getByLabelText('Preset guardado');
    const save = screen.getByRole('button', { name: 'Guardar preset' });
    fireEvent.click(screen.getByText('set A'));
    fireEvent.change(name, { target: { value: 'Prueba' } });
    fireEvent.click(save);
    fireEvent.click(screen.getByText('set B'));
    fireEvent.change(name, { target: { value: 'Prueba' } });
    fireEvent.click(save);
    expect(screen.getAllByRole('option', { name: 'Prueba' })).toHaveLength(1);
    expect(screen.getAllByRole('status').some((status) => status.textContent === 'Preset actualizado.')).toBe(true);
    fireEvent.click(screen.getByText('set C'));
    fireEvent.change(saved, { target: { value: 'Prueba' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cargar preset' }));
    expect(screen.getByTestId('preset-text').textContent).toBe('B');
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar preset' }));
    expect(screen.queryByRole('option', { name: 'Prueba' })).toBeNull();
  });

  it('muestra error de almacenamiento al fallar Guardar desde la UI sin falso éxito', () => {
    render(<AnimationProvider><PresetsBasicTab /></AnimationProvider>);
    const original = Storage.prototype.setItem;
    try {
      Storage.prototype.setItem = () => { throw new Error('quota'); };
      fireEvent.change(screen.getByLabelText('Nombre del preset'), { target: { value: 'Error' } });
      fireEvent.click(screen.getByRole('button', { name: 'Guardar preset' }));
      expect(screen.getByRole('status').textContent).toMatch(/almacenamiento|storage/i);
      expect(screen.queryByText('Preset guardado.')).toBeNull();
      expect(screen.queryByText('Preset actualizado.')).toBeNull();
    } finally { Storage.prototype.setItem = original; }
  });
});

describe('batch text input placement', () => {
  it('expone las líneas para lote en Texto y no dentro de Exportar', () => {
    render(<AppProviders><InspectorPanel /></AppProviders>);
    fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Render por Lotes' })[0]);
    expect(screen.queryByLabelText('Líneas para lote')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Texto' }));
    expect(screen.getByLabelText('Líneas para lote')).toBeTruthy();
  });
});

describe('paper cutout controls', () => {
  it('muestra controles solo para N-T02 y actualiza las props compartidas', () => {
    const Probe = () => { const { props } = useAnimation(); return <output data-testid="paper-props">{`${props.paperCutoutSettleFrames}:${props.paperCutoutColor}`}</output>; };
    render(<AppProviders><TextBasicTab /><Probe /></AppProviders>);
    expect(screen.queryByLabelText('Asentamiento')).toBeNull();
    fireEvent.click(screen.getByRole('option', { name: /Paper Cutout Assemble/i }));
    expect(screen.getByLabelText('Asentamiento')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Asentamiento'), { target: { value: '20' } });
    fireEvent.blur(screen.getByLabelText('Asentamiento'));
    expect(screen.getByTestId('paper-props').textContent).toContain('20');
    expect(screen.queryByLabelText('Tiempo por palabra')).toBeNull();
  });

  it('expone un slider de intensidad de levitacion que actualiza la prop real', () => {
    const Probe = () => { const { props } = useAnimation(); return <output data-testid="float-amplitude">{props.paperCutoutFloatAmplitudePx}</output>; };
    render(<AppProviders><TextBasicTab /><Probe /></AppProviders>);
    fireEvent.click(screen.getByRole('option', { name: /Paper Cutout Assemble/i }));
    const slider = screen.getByRole('slider', { name: 'Intensidad de levitación deslizador' });
    expect(slider.getAttribute('max')).toBe('96');
    fireEvent.change(slider, { target: { value: '72' } });
    expect(screen.getByTestId('float-amplitude').textContent).toBe('72');
  });

  it('expone la velocidad de levitacion como slider con su rango real', () => {
    render(<AppProviders><TextBasicTab /></AppProviders>);
    fireEvent.click(screen.getByRole('option', { name: /Paper Cutout Assemble/i }));
    const slider = screen.getByRole('slider', { name: 'Velocidad de levitación deslizador' });
    expect(slider.getAttribute('min')).toBe('0');
    expect(slider.getAttribute('max')).toBe('6');
    expect(slider.getAttribute('step')).toBe('0.1');
  });

  it('restaura un control N-T02 a su default y conserva opciones en preset', () => {
    const Probe = () => { const { props } = useAnimation(); return <output data-testid="paper-options">{`${props.paperCutoutSettleFrames}:${props.paperCutoutColor}`}</output>; };
    render(<AppProviders><TextBasicTab /><PresetsBasicTab /><Probe /></AppProviders>);
    fireEvent.click(screen.getByRole('option', { name: /Paper Cutout Assemble/i }));
    fireEvent.change(screen.getByLabelText('Asentamiento'), { target: { value: '20' } });
    fireEvent.blur(screen.getByLabelText('Asentamiento'));
    expect(screen.getByTestId('paper-options').textContent).toContain('20');
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer Asentamiento' }));
    expect(screen.getByTestId('paper-options').textContent).toContain('12');
    fireEvent.change(screen.getByLabelText('Nombre del preset'), { target: { value: 'Papel' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar preset' }));
    fireEvent.change(screen.getByLabelText('Asentamiento'), { target: { value: '24' } });
    fireEvent.blur(screen.getByLabelText('Asentamiento'));
    fireEvent.change(screen.getByLabelText('Preset guardado'), { target: { value: 'Papel' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cargar preset' }));
    expect(screen.getByTestId('paper-options').textContent).toContain('12');
  });
});

describe('ink stamp controls', () => {
  it('expone intensidad como slider dentro de Ink Stamp Print', () => {
    render(<AppProviders><TextBasicTab /></AppProviders>);
    fireEvent.click(screen.getByRole('option', { name: /Ink Stamp Print/i }));
    const slider = screen.getByRole('slider', { name: 'Intensidad del sello deslizador' });
    expect(slider.getAttribute('min')).toBe('0');
    expect(slider.getAttribute('max')).toBe('6');
    expect(slider.getAttribute('step')).toBe('0.05');
  });

  it('expone duración, cobertura e imperfección como sliders', () => {
    render(<AppProviders><TextBasicTab /></AppProviders>);
    fireEvent.click(screen.getByRole('option', { name: /Ink Stamp Print/i }));
    expect(screen.getByRole('slider', { name: 'Duración del sello deslizador' }).getAttribute('max')).toBe('60');
    expect(screen.getByRole('slider', { name: 'Cobertura deslizador' }).getAttribute('max')).toBe('1');
    expect(screen.getByRole('slider', { name: 'Imperfección deslizador' }).getAttribute('max')).toBe('3');
  });

  it('no expone un control manual de dirección de profundidad', () => {
    render(<AppProviders><TextBasicTab /></AppProviders>);
    fireEvent.click(screen.getByRole('option', { name: /Ink Stamp Print/i }));
    expect(screen.queryByRole('checkbox', { name: 'Iniciar desde el frente' })).toBeNull();
    expect(screen.queryByRole('slider', { name: 'Dirección de profundidad deslizador' })).toBeNull();
  });

  it('expone la inclinación inicial como slider', () => {
    render(<AppProviders><TextBasicTab /></AppProviders>);
    fireEvent.click(screen.getByRole('option', { name: /Ink Stamp Print/i }));
    const slider = screen.getByRole('slider', { name: 'Inclinación inicial deslizador' });
    expect(slider.getAttribute('max')).toBe('90');
  });

  it('expone escalas inicial y final con rangos amplios', () => {
    render(<AppProviders><TextBasicTab /></AppProviders>);
    fireEvent.click(screen.getByRole('option', { name: /Ink Stamp Print/i }));
    expect(screen.getByRole('slider', { name: 'Tamaño inicial deslizador' }).getAttribute('max')).toBe('6');
    expect(screen.getByRole('slider', { name: 'Tamaño final deslizador' }).getAttribute('max')).toBe('6');
  });

  it('expone amplitud y velocidad de levitación final como sliders', () => {
    render(<AppProviders><TextBasicTab /></AppProviders>);
    fireEvent.click(screen.getByRole('option', { name: /Ink Stamp Print/i }));
    expect(screen.getByRole('slider', { name: 'Amplitud de levitación deslizador' }).getAttribute('max')).toBe('120');
    expect(screen.getByRole('slider', { name: 'Velocidad de levitación deslizador' }).getAttribute('max')).toBe('6');
  });
});

describe('video result playback', () => {
  it('abre el video renderizado desde el resultado real', async () => {
    const originalOpen = window.open;
    let openedUrl = '';
    window.open = ((url?: string | URL) => { openedUrl = String(url ?? ''); return null; }) as typeof window.open;
    window.localStorage.setItem('remotion-fx:export-session:v2', JSON.stringify({ exportMode: 'batch', batchTextInput: 'A', batchRenderResults: [{ url: 'https://example.test/A.mp4', fileName: 'A.mp4', lineNumber: 1, text: 'A', status: 'completed', delivery: 'written' }], transparentCodec: 'prores', exportState: { status: 'completed', result: { fileName: 'batch', url: '', delivery: 'written' }, error: null } }));
    try {
      render(<AppProviders><InspectorPanel /></AppProviders>);
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Abrir video' }));
      expect(openedUrl).toBe('https://example.test/A.mp4');
    } finally {
      window.open = originalOpen;
    }
  });
});

describe('InspectorPanel tabs', () => {
  it('mantiene bloqueada una Export real durante desmontaje y remontaje físico', async () => {
    let resolvePicker: ((value: unknown) => void) | undefined;
    const picker = new Promise((resolve) => { resolvePicker = resolve; });
    const originalPicker = (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;
    const originalFetch = window.fetch;
    (window as unknown as { showSaveFilePicker: () => Promise<unknown> }).showSaveFilePicker = () => picker;
    window.fetch = async (input) => String(input).endsWith('/api/render')
      ? new Response(JSON.stringify({ success: true, url: 'https://example.test/rendered.mp4' }), { status: 200 })
      : new Response(new Blob(['video']), { status: 200 });
    const writable = { write: async () => undefined, close: async () => undefined };
    const handle = { createWritable: async () => writable };
    function Harness() {
      const [mounted, setMounted] = React.useState(true);
      return <><button onClick={() => setMounted(false)}>otra vista</button><button onClick={() => setMounted(true)}>volver a Export</button>{mounted ? <InspectorPanel /> : <span>Vista alternativa</span>}</>;
    }
    try {
      render(<AppProviders><Harness /></AppProviders>);
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(screen.getByRole('button', { name: /exportar prores/i }));
      expect(screen.getByRole('button', { name: /seleccionando destino/i }).hasAttribute('disabled')).toBe(true);
      fireEvent.click(screen.getByText('otra vista'));
      expect(screen.getByText('Vista alternativa')).toBeTruthy();
      fireEvent.click(screen.getByText('volver a Export'));
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      expect(screen.getByRole('button', { name: /seleccionando destino/i }).hasAttribute('disabled')).toBe(true);
      fireEvent.click(screen.getByRole('button', { name: 'Render por Lotes' }));
      expect(screen.getByRole('button', { name: /seleccionando destino/i }).hasAttribute('disabled')).toBe(true);
      resolvePicker?.(handle);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(screen.getAllByRole('button', { name: 'Render por Lotes' }).at(-1)?.hasAttribute('disabled')).toBe(false);
      fireEvent.click(screen.getByRole('button', { name: 'Render Unico' }));
      expect(screen.getByRole('button', { name: /exportar prores/i }).hasAttribute('disabled')).toBe(false);
    } finally {
      (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker = originalPicker;
      window.fetch = originalFetch;
    }
  });

  it('bloquea las acciones de resultados mientras un guardado iniciado desde UI sigue pendiente', async () => {
    let pickerCalls = 0;
    let writeCalls = 0;
    let resolveSave: ((value: unknown) => void) | undefined;
    let resolveWrite: (() => void) | undefined;
    const originalPicker = (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;
    const originalDirectory = (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
    const originalFetch = window.fetch;
    const writable = { write: async () => undefined, close: async () => undefined };
    (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker = undefined;
    (window as unknown as { showSaveFilePicker: () => Promise<unknown> }).showSaveFilePicker = () => {
      pickerCalls += 1;
      return new Promise((resolve) => { resolveSave = () => resolve({ createWritable: async () => ({ write: async () => { writeCalls += 1; return new Promise<void>((done) => { resolveWrite = done; }); }, close: async () => undefined }) }); });
    };
    window.fetch = async (input, init) => {
      const requestUrl = typeof input === 'string' ? input : (input as Request).url;
      return requestUrl.endsWith('/api/render')
        ? new Response(JSON.stringify({ success: true, batch: true, renders: [{ url: 'https://example.test/rendered.mp4', fileName: 'A.mp4', lineNumber: 1, text: 'A' }] }), { status: 200 })
        : new Response(new Blob(['video']), { status: 200 });
    };
    try {
      window.localStorage.setItem('remotion-fx:export-session:v2', JSON.stringify({ exportMode: 'batch', batchTextInput: 'A', batchRenderResults: [{ url: 'https://example.test/rendered.mp4', fileName: 'A.mp4', lineNumber: 1, text: 'A', status: 'completed' }], transparentCodec: 'prores', exportState: { status: 'completed', result: { fileName: 'batch', url: '' }, error: null } }));
      render(<AppProviders><InspectorPanel /></AppProviders>);
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      await new Promise((resolve) => setTimeout(resolve, 0));
      const resultButton = await screen.findByRole('button', { name: /descargar resultado renderizado/i });
      fireEvent.click(resultButton);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(resultButton.hasAttribute('disabled')).toBe(true);
      expect(screen.getByRole('button', { name: 'Guardando...' }).hasAttribute('disabled')).toBe(true);
      resolveSave?.(null);
      await new Promise((resolve) => setTimeout(resolve, 0));
      await waitFor(() => expect(writeCalls).toBe(1));
      let individualRenderCalls = 0;
      let batchRenderCalls = 0;
      const countedFetch = window.fetch;
      window.fetch = async (input, init) => {
        const requestUrl = typeof input === 'string' ? input : (input as Request).url;
        if (requestUrl.endsWith('/api/render')) {
          const body = JSON.parse(String(init?.body || '{}')) as { batchTexts?: string[] };
          if (body.batchTexts) batchRenderCalls += 1; else individualRenderCalls += 1;
        }
        return countedFetch(input, init);
      };
      fireEvent.click(screen.getByRole('button', { name: 'Render Unico' }));
      fireEvent.click(screen.getByRole('button', { name: /guardando/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Render por Lotes' }));
      fireEvent.click(screen.getByRole('button', { name: /guardando/i }));
      expect(individualRenderCalls).toBe(0);
      expect(batchRenderCalls).toBe(0);
      expect(writeCalls).toBe(1);
      expect(screen.getByRole('button', { name: 'Guardando...' }).hasAttribute('disabled')).toBe(true);
      window.fetch = countedFetch;
      expect(screen.getByRole('button', { name: 'Guardando...' }).hasAttribute('disabled')).toBe(true);
      resolveWrite?.();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(resultButton.hasAttribute('disabled')).toBe(false);
    } finally {
      (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker = originalPicker;
      (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker = originalDirectory;
      window.fetch = originalFetch;
    }
  });

  it('libera save-first después de que writable.write(blob) falla sin anunciar éxito', async () => {
    let resolvePicker: ((value: unknown) => void) | undefined;
    let rejectWrite: ((reason?: unknown) => void) | undefined;
    let pickerCalls = 0;
    let writeCalls = 0;
    const originalPicker = (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;
    const originalFetch = window.fetch;
    const originalAlert = window.alert;
    const alerts: string[] = [];
    window.alert = (message?: string) => { alerts.push(String(message)); };
    (window as unknown as { showSaveFilePicker: () => Promise<unknown> }).showSaveFilePicker = () => {
      pickerCalls += 1;
      return new Promise((resolve) => { resolvePicker = resolve; });
    };
    window.fetch = async () => new Response(new Blob(['video']), { status: 200 });
    const Status = () => <output data-testid="export-status">{useExportSession().exportState.status}</output>;
    try {
      window.localStorage.setItem('remotion-fx:export-session:v2', JSON.stringify({ exportMode: 'batch', batchTextInput: 'A', batchRenderResults: [{ url: 'https://example.test/rendered.mp4', fileName: 'A.mp4', lineNumber: 1, text: 'A', status: 'completed' }], transparentCodec: 'prores', exportState: { status: 'completed', result: { fileName: 'batch', url: '' }, error: null } }));
      render(<AppProviders><InspectorPanel /><Status /></AppProviders>);
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      const save = await screen.findByRole('button', { name: /descargar resultado renderizado/i });
      fireEvent.click(save);
      resolvePicker?.({ createWritable: async () => ({ write: async () => { writeCalls += 1; await new Promise<void>((_, reject) => { rejectWrite = reject; }); }, close: async () => undefined }) });
      await waitFor(() => expect(writeCalls).toBe(1));
      expect(screen.getByTestId('export-status').textContent).toBe('writing');
      fireEvent.click(save);
      expect(pickerCalls).toBe(1);
      fireEvent.click(screen.getByRole('button', { name: 'Render Unico' }));
      expect(screen.getByRole('button', { name: /guardando/i }).hasAttribute('disabled')).toBe(true);
      rejectWrite?.(new Error('disk full'));
      await waitFor(() => expect(screen.getByTestId('export-status').textContent).toBe('failed'));
      expect(screen.getByRole('button', { name: /exportar prores/i }).hasAttribute('disabled')).toBe(false);
      expect(alerts.some((message) => /archivo guardado|descarga iniciada/i.test(message))).toBe(false);
      fireEvent.click(screen.getByRole('button', { name: /exportar prores/i }));
      await waitFor(() => expect(pickerCalls).toBe(2));
    } finally {
      (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker = originalPicker;
      window.fetch = originalFetch;
      window.alert = originalAlert;
    }
  });

  it('mantiene el Guardar previo conectado y bloqueado mientras una exportación individual real espera writable.write(blob)', async () => {
    let resolveWrite: (() => void) | undefined;
    let pickerCalls = 0;
    let writeCalls = 0;
    const originalPicker = (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;
    const originalFetch = window.fetch;
    const originalAlert = window.alert;
    window.alert = () => undefined;
    (window as unknown as { showSaveFilePicker: () => Promise<unknown> }).showSaveFilePicker = async () => {
      pickerCalls += 1;
      return { createWritable: async () => ({ write: async () => { writeCalls += 1; await new Promise<void>((resolve) => { resolveWrite = resolve; }); }, close: async () => undefined }) };
    };
    window.fetch = async (input) => String(input).endsWith('/api/render')
      ? new Response(JSON.stringify({ success: true, url: 'https://example.test/current.mp4' }), { status: 200 })
      : new Response(new Blob(['video']), { status: 200 });
    const Status = () => <output data-testid="export-status">{useExportSession().exportState.status}</output>;
    try {
      window.localStorage.setItem('remotion-fx:export-session:v2', JSON.stringify({ exportMode: 'batch', batchTextInput: 'A', batchRenderResults: [{ url: 'https://example.test/previous.mp4', fileName: 'A.mp4', lineNumber: 1, text: 'A', status: 'completed' }], transparentCodec: 'prores', exportState: { status: 'completed', result: { fileName: 'batch', url: '' }, error: null } }));
      render(<AppProviders><InspectorPanel /><Status /></AppProviders>);
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      await screen.findByRole('button', { name: /descargar resultado renderizado/i });
      fireEvent.click(screen.getByRole('button', { name: 'Render Unico' }));
      // A previous batch result remains a usable visible artifact while a new individual export starts.
      const previousSave = await screen.findByRole('button', { name: /guardar copia|descargar resultado renderizado/i });
      expect(document.body.contains(previousSave)).toBe(true);
      fireEvent.click(screen.getByRole('button', { name: /exportar prores/i }));
      await waitFor(() => expect(writeCalls).toBe(1));
      expect(screen.getByTestId('export-status').textContent).toBe('writing');
      const connectedPreviousSave = screen.getByRole('button', { name: /guardar copia|descargar resultado renderizado/i });
      expect(document.body.contains(connectedPreviousSave)).toBe(true);
      expect(connectedPreviousSave.hasAttribute('disabled')).toBe(true);
      fireEvent.click(connectedPreviousSave);
      expect(pickerCalls).toBe(1);
      expect(writeCalls).toBe(1);
      resolveWrite?.();
      await waitFor(() => expect(screen.getByTestId('export-status').textContent).toBe('completed'));
      expect(screen.getByRole('button', { name: /guardar copia|descargar resultado renderizado/i }).hasAttribute('disabled')).toBe(false);
    } finally {
      (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker = originalPicker;
      window.fetch = originalFetch;
      window.alert = originalAlert;
    }
  });

  it('preserva download-requested y el nombre real al guardar desde la UI un resultado previo con fallback', async () => {
    const originalPicker = (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;
    const originalFetch = window.fetch;
    const originalAlert = window.alert;
    const originalCreate = document.createElement;
    let downloadName = '';
    const messages: string[] = [];
    window.alert = (message?: string) => { messages.push(String(message)); };
    (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker = undefined;
    window.fetch = async () => new Response(new Blob(['video']), { status: 200 });
    document.createElement = ((tag: string) => {
      const node = originalCreate.call(document, tag);
      if (tag === 'a') Object.assign(node, { click: () => { downloadName = (node as HTMLAnchorElement).download; } });
      return node;
    }) as typeof document.createElement;
    const Status = () => {
      const { exportState } = useExportSession();
      return <output data-testid="saved-result">{JSON.stringify(exportState.result)}</output>;
    };
    try {
      window.localStorage.setItem('remotion-fx:export-session:v2', JSON.stringify({ exportMode: 'batch', batchTextInput: 'A', batchRenderResults: [{ url: 'https://example.test/previous.mov', fileName: 'previous.mov', lineNumber: 1, text: 'A', status: 'completed' }], transparentCodec: 'prores', exportState: { status: 'completed', result: { fileName: 'batch', url: '' }, error: null } }));
      render(<AppProviders><InspectorPanel /><Status /></AppProviders>);
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(await screen.findByRole('button', { name: /guardar copia|descargar resultado renderizado/i }));
      await waitFor(() => expect(screen.getByText('Descarga iniciada')).toBeTruthy());
      expect(screen.queryByText('Exportación completada')).toBeNull();
      expect(messages).toContain('Descarga iniciada');
      expect(downloadName).toBe('export.mov');
      expect(screen.getByTestId('saved-result').textContent).toContain('"delivery":"download-requested"');
      expect(screen.getByTestId('saved-result').textContent).toContain('"fileName":"export.mov"');
    } finally {
      (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker = originalPicker;
      window.fetch = originalFetch;
      window.alert = originalAlert;
      document.createElement = originalCreate;
    }
  });

  it('preserva written y el nombre real al guardar desde la UI un resultado previo', async () => {
    const originalPicker = (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;
    const originalFetch = window.fetch;
    const originalAlert = window.alert;
    const messages: string[] = [];
    window.alert = (message?: string) => { messages.push(String(message)); };
    (window as unknown as { showSaveFilePicker: () => Promise<unknown> }).showSaveFilePicker = async () => ({ createWritable: async () => ({ write: async () => undefined, close: async () => undefined }) });
    window.fetch = async () => new Response(new Blob(['video']), { status: 200 });
    const Status = () => {
      const { exportState } = useExportSession();
      return <output data-testid="saved-result">{JSON.stringify(exportState.result)}</output>;
    };
    try {
      window.localStorage.setItem('remotion-fx:export-session:v2', JSON.stringify({ exportMode: 'batch', batchTextInput: 'A', batchRenderResults: [{ url: 'https://example.test/previous.mov', fileName: 'previous.mov', lineNumber: 1, text: 'A', status: 'completed' }], transparentCodec: 'prores', exportState: { status: 'completed', result: { fileName: 'batch', url: '' }, error: null } }));
      render(<AppProviders><InspectorPanel /><Status /></AppProviders>);
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(await screen.findByRole('button', { name: /descargar resultado renderizado/i }));
      await waitFor(() => expect(screen.getByText('Exportación completada')).toBeTruthy());
      expect(messages).toContain('Archivo guardado');
      expect(screen.getByTestId('saved-result').textContent).toContain('"delivery":"written"');
      expect(screen.getByTestId('saved-result').textContent).toContain('"fileName":"export.mov"');
    } finally {
      (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker = originalPicker;
      window.fetch = originalFetch;
      window.alert = originalAlert;
    }
  });

  it('muestra progreso real de lote por ejecutables y conserva la línea original', async () => {
    let resolveRender: (() => void) | undefined;
    let resolveWrite: (() => void) | undefined;
    const originalDirectory = (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
    const originalFetch = window.fetch;
    const originalAlert = window.alert;
    window.alert = () => undefined;
    (window as unknown as { showDirectoryPicker: () => Promise<unknown> }).showDirectoryPicker = async () => ({
      getFileHandle: async (_name: string, options: { create: boolean }) => {
        if (!options.create) throw Object.assign(new Error('missing'), { name: 'NotFoundError' });
        return { createWritable: async () => ({ write: async () => { await new Promise<void>((resolve) => { resolveWrite = resolve; }); }, close: async () => undefined }) };
      },
    });
    window.fetch = async (input, init) => {
      const requestUrl = typeof input === 'string' ? input : (input as Request).url;
      if (!requestUrl.endsWith('/api/render')) return new Response(new Blob(['video']), { status: 200 });
      const body = JSON.parse(String(init?.body || '{}')) as { batchTexts?: string[] };
      const text = body.batchTexts?.[0] || 'A';
      await new Promise<void>((resolve) => { resolveRender = resolve; });
      return new Response(JSON.stringify({ success: true, batch: true, renders: [{ url: `https://example.test/${text}.mp4`, fileName: `${text}.mp4`, lineNumber: text === 'B' ? 3 : 1, text }] }), { status: 200 });
    };
    const BatchProbe = () => <output data-testid="batch-results">{JSON.stringify(useExportSession().batchRenderResults)}</output>;
    try {
      render(<AppProviders><InspectorPanel /><BatchProbe /></AppProviders>);
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(screen.getByRole('button', { name: 'Render por Lotes' }));
      fireEvent.click(screen.getByRole('tab', { name: 'Texto' }));
      fireEvent.change(screen.getByLabelText('Líneas para lote'), { target: { value: 'A\n\nB' } });
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(screen.getAllByRole('button', { name: 'Render por Lotes' }).at(-1)!);
      expect(await screen.findByText('1 de 2 · Renderizando...')).toBeTruthy();
      resolveRender?.();
      expect(await screen.findByText('1 de 2 · Guardando...')).toBeTruthy();
      resolveWrite?.();
      expect(await screen.findByText('2 de 2 · Renderizando...')).toBeTruthy();
      resolveRender?.();
      expect(await screen.findByText('2 de 2 · Guardando...')).toBeTruthy();
      resolveWrite?.();
      await waitFor(() => expect(screen.getByText(/#3 · B\.mov/)).toBeTruthy());
      expect(screen.getByText(/#1 · A\.mov · Exportación completada/)).toBeTruthy();
      expect(screen.getByText(/#3 · B\.mov · Exportación completada/)).toBeTruthy();
      expect(screen.getByTestId('batch-results').textContent).toContain('"delivery":"written"');
    } finally {
      (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker = originalDirectory;
      window.fetch = originalFetch;
      window.alert = originalAlert;
    }
  });

  it('propaga al resultado visible el nombre final elegido por el writer tras una colisión', async () => {
    const originalDirectory = (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
    const originalFetch = window.fetch;
    const originalAlert = window.alert;
    window.alert = () => undefined;
    (window as unknown as { showDirectoryPicker: () => Promise<unknown> }).showDirectoryPicker = async () => ({
      getFileHandle: async (name: string, options: { create: boolean }) => {
        if (!options.create && (name === 'A.mov' || name === 'A-2.mov')) return { createWritable: async () => ({ write: async () => undefined, close: async () => undefined }) };
        if (!options.create) throw Object.assign(new Error('missing'), { name: 'NotFoundError' });
        return { createWritable: async () => ({ write: async () => undefined, close: async () => undefined }) };
      },
    });
    window.fetch = async (input, init) => {
      const requestUrl = typeof input === 'string' ? input : (input as Request).url;
      if (requestUrl.endsWith('/api/render')) {
        const body = JSON.parse(String(init?.body || '{}')) as { batchTexts?: string[] };
        return new Response(JSON.stringify({ success: true, batch: true, renders: [{ url: 'https://example.test/A.mov', fileName: `${body.batchTexts?.[0] || 'A'}.mov`, lineNumber: 1, text: 'A' }] }), { status: 200 });
      }
      return new Response(new Blob(['video']), { status: 200 });
    };
    try {
      render(<AppProviders><InspectorPanel /></AppProviders>);
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(screen.getByRole('button', { name: 'Render por Lotes' }));
      fireEvent.click(screen.getByRole('tab', { name: 'Texto' }));
      fireEvent.change(screen.getByLabelText('Líneas para lote'), { target: { value: 'A' } });
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(screen.getAllByRole('button', { name: 'Render por Lotes' }).at(-1)!);
      await waitFor(() => expect(screen.getByText(/#1 · A-3\.mov/)).toBeTruthy());
      expect(screen.queryByText(/#1 · A\.mov/)).toBeNull();
      expect(screen.queryByText(/download|remotion-video/i)).toBeNull();
    } finally {
      (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker = originalDirectory;
      window.fetch = originalFetch;
      window.alert = originalAlert;
    }
  });

  it('comunica Exportación completada cuando la UI individual escribe mediante File System Access', async () => {
    const originalPicker = (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;
    const originalFetch = window.fetch;
    const originalAlert = window.alert;
    let writes = 0;
    const messages: string[] = [];
    window.alert = (message?: string) => { messages.push(String(message)); };
    (window as unknown as { showSaveFilePicker: () => Promise<unknown> }).showSaveFilePicker = async () => ({ createWritable: async () => ({ write: async () => { writes += 1; }, close: async () => undefined }) });
    window.fetch = async (input) => String(input).endsWith('/api/render')
      ? new Response(JSON.stringify({ success: true, url: 'https://example.test/individual.mp4' }), { status: 200 })
      : new Response(new Blob(['video']), { status: 200 });
    try {
      const Status = () => <output data-testid="export-status">{useExportSession().exportState.status}</output>;
      render(<AppProviders><InspectorPanel /><Status /></AppProviders>);
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(screen.getByRole('button', { name: /exportar prores/i }));
      await waitFor(() => expect(screen.getByTestId('export-status').textContent).toBe('completed'));
      expect(writes).toBe(1);
      expect(messages).toContain('Exportación completada');
      expect(screen.getAllByText('Exportación completada').length).toBeGreaterThanOrEqual(1);
    } finally {
      (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker = originalPicker;
      window.fetch = originalFetch;
      window.alert = originalAlert;
    }
  });

  it('comunica Descarga iniciada cuando la UI individual usa fallback sin File System Access', async () => {
    const originalPicker = (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;
    const originalFetch = window.fetch;
    const originalAlert = window.alert;
    const originalCreate = document.createElement;
    const messages: string[] = [];
    let downloadName = '';
    window.alert = (message?: string) => { messages.push(String(message)); };
    (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker = undefined;
    window.fetch = async () => new Response(JSON.stringify({ success: true, url: 'https://example.test/fallback.mp4' }), { status: 200 });
    document.createElement = ((tag: string) => {
      const node = originalCreate.call(document, tag);
      if (tag === 'a') Object.assign(node, { click: () => { downloadName = (node as HTMLAnchorElement).download; } });
      return node;
    }) as typeof document.createElement;
    try {
      const Status = () => <output data-testid="export-status">{useExportSession().exportState.status}</output>;
      render(<AppProviders><InspectorPanel /><Status /></AppProviders>);
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(screen.getByRole('button', { name: /exportar prores/i }));
      await waitFor(() => expect(screen.getByTestId('export-status').textContent).toBe('completed'));
      expect(downloadName).toMatch(/\.mov$/);
      expect(messages).toContain('Descarga iniciada');
    } finally {
      (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker = originalPicker;
      window.fetch = originalFetch;
      window.alert = originalAlert;
      document.createElement = originalCreate;
    }
  });

  it('conserva delivery download-requested en cada resultado batch mostrado por la UI', async () => {
    const originalDirectory = (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
    const originalFetch = window.fetch;
    const originalAlert = window.alert;
    const originalCreate = document.createElement;
    const messages: string[] = [];
    window.alert = (message?: string) => { messages.push(String(message)); };
    (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker = undefined;
    window.fetch = async (input, init) => {
      const requestUrl = typeof input === 'string' ? input : (input as Request).url;
      if (requestUrl.endsWith('/api/render')) {
        const body = JSON.parse(String(init?.body || '{}')) as { batchTexts?: string[] };
        const text = body.batchTexts?.[0] || 'A';
        return new Response(JSON.stringify({ success: true, batch: true, renders: [{ url: `https://example.test/${text}.mp4`, fileName: `${text}.mp4`, lineNumber: text === 'B' ? 2 : 1, text }] }), { status: 200 });
      }
      return new Response(new Blob(['video']), { status: 200 });
    };
    document.createElement = ((tag: string) => {
      const node = originalCreate.call(document, tag);
      if (tag === 'a') Object.assign(node, { click: () => undefined });
      return node;
    }) as typeof document.createElement;
    try {
      render(<AppProviders><InspectorPanel /></AppProviders>);
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(screen.getByRole('button', { name: 'Render por Lotes' }));
      fireEvent.click(screen.getByRole('tab', { name: 'Texto' }));
      fireEvent.change(screen.getByLabelText('Líneas para lote'), { target: { value: 'A\nB' } });
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(screen.getAllByRole('button', { name: 'Render por Lotes' }).at(-1)!);
      await waitFor(() => expect(screen.getByText(/#2 · B\.mov/)).toBeTruthy());
      expect(screen.getByText(/#1 · A\.mov · Descarga iniciada/)).toBeTruthy();
      expect(screen.getByText(/#2 · B\.mov · Descarga iniciada/)).toBeTruthy();
      expect(messages).toContain('2 completados · 0 fallidos');
    } finally {
      (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker = originalDirectory;
      window.fetch = originalFetch;
      window.alert = originalAlert;
      document.createElement = originalCreate;
    }
  });

  it('cancela exportación individual desde el selector real sin renderizar ni escribir', async () => {
    const originalPicker = (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;
    const originalFetch = window.fetch;
    const originalAlert = window.alert;
    const messages: string[] = [];
    let renderCalls = 0;
    let writeCalls = 0;
    window.alert = (message?: string) => { messages.push(String(message)); };
    (window as unknown as { showSaveFilePicker: () => Promise<never> }).showSaveFilePicker = () => Promise.reject(Object.assign(new Error('cancel'), { name: 'AbortError' }));
    window.fetch = async (input) => { if (String(input).endsWith('/api/render')) renderCalls += 1; else writeCalls += 1; throw new Error('unreachable'); };
    try {
      const Status = () => <output data-testid="export-status">{useExportSession().exportState.status}</output>;
      render(<AppProviders><InspectorPanel /><Status /></AppProviders>);
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(screen.getByRole('button', { name: /exportar prores/i }));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(screen.getByTestId('export-status').textContent).toBe('idle');
      expect(screen.queryByRole('alert')).toBeNull();
      expect(renderCalls).toBe(0);
      expect(writeCalls).toBe(0);
      expect(messages.some((message) => /exportación completada|archivo guardado|descarga iniciada/i.test(message))).toBe(false);
      expect(screen.getByRole('button', { name: /exportar prores/i }).hasAttribute('disabled')).toBe(false);
    } finally {
      (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker = originalPicker;
      window.fetch = originalFetch;
      window.alert = originalAlert;
    }
  });

  it('rechaza selector batch desde la UI real y no deja estado ocupado', async () => {
    const originalPicker = (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
    const originalFetch = window.fetch;
    const originalAlert = window.alert;
    const messages: string[] = [];
    let renderCalls = 0;
    let writeCalls = 0;
    window.alert = (message?: string) => { messages.push(String(message)); };
    (window as unknown as { showDirectoryPicker: () => Promise<never> }).showDirectoryPicker = () => Promise.reject(new Error('permission denied'));
    window.fetch = async (input) => { if (String(input).endsWith('/api/render')) renderCalls += 1; else writeCalls += 1; throw new Error('unreachable'); };
    try {
      const Status = () => <output data-testid="export-status">{useExportSession().exportState.status}</output>;
      render(<AppProviders><InspectorPanel /><Status /></AppProviders>);
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(screen.getByRole('button', { name: 'Render por Lotes' }));
      fireEvent.click(screen.getByRole('tab', { name: 'Texto' }));
      fireEvent.change(screen.getByLabelText('Líneas para lote'), { target: { value: 'A' } });
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(screen.getAllByRole('button', { name: 'Render por Lotes' }).at(-1)!);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(screen.getByTestId('export-status').textContent).toBe('failed');
      expect(screen.queryByRole('button', { name: 'Seleccionando destino...' })).toBeNull();
      expect(renderCalls).toBe(0);
      expect(writeCalls).toBe(0);
      expect(messages.some((message) => /exportación completada|archivo guardado|descarga iniciada/i.test(message))).toBe(false);
      expect(screen.getAllByRole('button', { name: 'Render por Lotes' }).at(-1)?.hasAttribute('disabled')).toBe(false);
    } finally {
      (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker = originalPicker;
      window.fetch = originalFetch;
      window.alert = originalAlert;
    }
  });

  it('rechaza selector individual desde la UI real y deja estado failed sin render ni escritura', async () => {
    const originalPicker = (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;
    const originalFetch = window.fetch;
    const originalAlert = window.alert;
    let renderCalls = 0;
    let writeCalls = 0;
    const messages: string[] = [];
    window.alert = (message?: string) => { messages.push(String(message)); };
    (window as unknown as { showSaveFilePicker: () => Promise<never> }).showSaveFilePicker = () => Promise.reject(new Error('permission denied'));
    window.fetch = async (input) => { if (String(input).endsWith('/api/render')) renderCalls += 1; else writeCalls += 1; throw new Error('unreachable'); };
    try {
      const Status = () => <output data-testid="export-status">{useExportSession().exportState.status}</output>;
      render(<AppProviders><InspectorPanel /><Status /></AppProviders>);
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(screen.getByRole('button', { name: /exportar prores/i }));
      await waitFor(() => expect(screen.getByTestId('export-status').textContent).toBe('failed'));
      expect(renderCalls).toBe(0);
      expect(writeCalls).toBe(0);
      expect(messages.some((message) => /exportación completada|archivo guardado|descarga iniciada/i.test(message))).toBe(false);
      expect(screen.queryByRole('button', { name: 'Seleccionando destino...' })).toBeNull();
      expect(screen.getByRole('button', { name: /exportar prores/i }).hasAttribute('disabled')).toBe(false);
    } finally {
      (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker = originalPicker;
      window.fetch = originalFetch;
      window.alert = originalAlert;
    }
  });

  it('cancela selector batch desde la UI real y vuelve a idle sin render ni escritura', async () => {
    const originalPicker = (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
    const originalFetch = window.fetch;
    const originalAlert = window.alert;
    let renderCalls = 0;
    let writeCalls = 0;
    const messages: string[] = [];
    window.alert = (message?: string) => { messages.push(String(message)); };
    (window as unknown as { showDirectoryPicker: () => Promise<never> }).showDirectoryPicker = () => Promise.reject(Object.assign(new Error('cancel'), { name: 'AbortError' }));
    window.fetch = async (input) => { if (String(input).endsWith('/api/render')) renderCalls += 1; else writeCalls += 1; throw new Error('unreachable'); };
    try {
      const Status = () => <output data-testid="export-status">{useExportSession().exportState.status}</output>;
      render(<AppProviders><InspectorPanel /><Status /></AppProviders>);
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(screen.getByRole('button', { name: 'Render por Lotes' }));
      fireEvent.click(screen.getByRole('tab', { name: 'Texto' }));
      fireEvent.change(screen.getByLabelText('Líneas para lote'), { target: { value: 'A' } });
      fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
      fireEvent.click(screen.getAllByRole('button', { name: 'Render por Lotes' }).at(-1)!);
      await waitFor(() => expect(screen.getByTestId('export-status').textContent).toBe('idle'));
      expect(renderCalls).toBe(0);
      expect(writeCalls).toBe(0);
      expect(messages.some((message) => /exportación completada|archivo guardado|descarga iniciada/i.test(message))).toBe(false);
      expect(screen.queryByRole('button', { name: 'Seleccionando destino...' })).toBeNull();
      expect(screen.getAllByRole('button', { name: 'Render por Lotes' }).at(-1)?.hasAttribute('disabled')).toBe(false);
    } finally {
      (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker = originalPicker;
      window.fetch = originalFetch;
      window.alert = originalAlert;
    }
  });

  it('exposes one active accessible panel and preserves session provider across tab changes', () => {
    render(<AppProviders><InspectorPanel /></AppProviders>);
    const tablist = screen.getByRole('tablist', { name: 'Secciones del inspector' });
    const tabs = within(tablist).getAllByRole('tab');
    expect(tabs).toHaveLength(5);
    for (const tab of tabs) expect(tab.getAttribute('aria-controls')).toBeTruthy();
    const textTab = screen.getByRole('tab', { name: 'Texto' });
    fireEvent.click(textTab);
    expect(textTab.getAttribute('aria-selected')).toBe('true');
    const panel = screen.getByRole('tabpanel');
    expect(panel.getAttribute('aria-labelledby')).toBe(textTab.id);
    expect(document.getElementById(textTab.getAttribute('aria-controls')!)).toBe(panel);
    expect(screen.getByLabelText('Texto principal')).toBeTruthy();
    fireEvent.keyDown(textTab, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Fondo' }).getAttribute('aria-selected')).toBe('true');
  });

  it('returns from Exportar to Texto and commits global size', () => {
    render(<AppProviders><InspectorPanel /></AppProviders>);
    fireEvent.click(screen.getByRole('tab', { name: 'Exportar' }));
    expect(screen.getByRole('tab', { name: 'Exportar' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getByRole('tab', { name: 'Texto' }));
    const size = screen.getByLabelText('Tamaño de texto');
    fireEvent.change(size, { target: { value: '128' } });
    fireEvent.keyDown(size, { key: 'Enter' });
    expect((size as HTMLInputElement).value).toBe('128');
    expect(screen.queryByText('PRESETS')).toBeNull();
  });
});
