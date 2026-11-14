import type { AnimationStyle, ParticlePreset } from '@/lib/types/animation';
import { backgroundCatalog, textTemplateCatalog } from './catalog';

export type TemplateControlType = 'number' | 'color' | 'boolean' | 'select' | 'text';
export type TemplateControlScope = 'main' | 'secondary' | 'background';

export interface TemplateControlContract {
  key: string;
  label: string;
  type: TemplateControlType;
  scope: TemplateControlScope;
  renderer: string;
  min?: number;
  max?: number;
  step?: number;
  default?: number | string | boolean;
}

export interface TemplateContract {
  controls: readonly TemplateControlContract[];
  immutableResource?: boolean;
}

const number = (
  key: string,
  label: string,
  min: number,
  max: number,
  step: number,
  defaultValue: number,
  scope: TemplateControlScope = 'main',
): TemplateControlContract => ({
  key, label, type: 'number', scope, renderer: 'MainComposition', min, max, step, default: defaultValue,
});

const textAppearanceControls: readonly TemplateControlContract[] = [
  { key: 'fontFamily', label: 'Familia tipográfica', type: 'select', scope: 'main', renderer: 'MainComposition' },
  number('fontSize', 'Tamaño de texto', 8, 2048, 1, 120),
  { key: 'color', label: 'Color', type: 'color', scope: 'main', renderer: 'MainComposition' },
  { key: 'enableFill', label: 'Relleno', type: 'boolean', scope: 'main', renderer: 'MainComposition' },
  { key: 'enableBorder', label: 'Borde', type: 'boolean', scope: 'main', renderer: 'MainComposition' },
  number('borderWidth', 'Grosor del borde', 0, 40, 0.1, 4),
  { key: 'borderColor', label: 'Color del borde', type: 'color', scope: 'main', renderer: 'MainComposition' },
  { key: 'enableShadow', label: 'Sombra', type: 'boolean', scope: 'main', renderer: 'MainComposition' },
  number('shadowBlur', 'Desenfoque de sombra', 0, 160, 1, 12),
  { key: 'shadowColor', label: 'Color de sombra', type: 'color', scope: 'main', renderer: 'MainComposition' },
  number('opacity', 'Opacidad', 0, 1, 0.01, 1),
  number('letterSpacing', 'Espaciado entre letras', -20, 100, 0.5, 0),
  number('lineHeight', 'Interlineado', 0.5, 3, 0.05, 1.2),
  number('speed', 'Velocidad del efecto', 0.2, 3, 0.05, 1),
];

const textControlsFor = (id: AnimationStyle): TemplateContract => {
  const controls = [...textAppearanceControls];
  const add = (...items: TemplateControlContract[]) => controls.push(...items);
  if (['slide-reveal'].includes(id)) add({ key: 'boxColor', label: 'Color de franja', type: 'color', scope: 'main', renderer: 'SlideRevealEffect' });
  if (['shape-reveal'].includes(id)) add(
    { key: 'gradientStart', label: 'Color inicial del degradado', type: 'color', scope: 'main', renderer: 'ShapeRevealEffect' },
    { key: 'gradientEnd', label: 'Color final del degradado', type: 'color', scope: 'main', renderer: 'ShapeRevealEffect' },
    number('gradientSoftness', 'Suavidad del degradado', 0, 100, 1, 100),
    number('shapeBorderRadius', 'Radio de la caja', 0, 120, 1, 10),
  );
  if (['blur-cascade'].includes(id)) add(
    { key: 'enableGradient', label: 'Degradado', type: 'boolean', scope: 'main', renderer: 'BlurringTextCascade' },
    { key: 'gradientStart', label: 'Color inicial del degradado', type: 'color', scope: 'main', renderer: 'BlurringTextCascade' },
    { key: 'gradientEnd', label: 'Color final del degradado', type: 'color', scope: 'main', renderer: 'BlurringTextCascade' },
    number('gradientSoftness', 'Suavidad del degradado', 0, 100, 1, 100),
  );
  if (id === 'bar-reveal') add(
    { key: 'wordTwo', label: 'Texto revelado', type: 'text', scope: 'secondary', renderer: 'BarRevealEffect' },
    { key: 'boxColor', label: 'Color de la barra', type: 'color', scope: 'main', renderer: 'BarRevealEffect' },
    number('barWidthPx', 'Grosor de la barra', 1, 100, 1, 4),
  );
  if (id === 'kinetic-box-sequence') add(
    number('boxSequenceWidth', 'Ancho de caja', 10, 100, 1, 62),
    number('boxSequenceHeightScale', 'Altura de caja', 0.25, 4, 0.05, 1.25),
    number('boxSequenceBorderRadius', 'Radio de caja', 0, 120, 1, 12),
  );
  if (id === 'word-highlight-tracker') add(number('wordHighlightSeconds', 'Duración por palabra', 0.1, 3, 0.05, 0.4));
  if (id === 'variable-weight-wave') add(
    number('variableWeightBaseWeight', 'Peso base', 100, 700, 50, 400),
    number('variableWeightPeakWeight', 'Peso máximo', 400, 900, 50, 850),
    number('variableWeightCycleSeconds', 'Duración del ciclo', 1, 6, 0.1, 2.4),
  );
  return { controls };
};

export const textControlContracts: Record<AnimationStyle, TemplateContract> = Object.fromEntries(
  Object.keys(textTemplateCatalog).map((id) => [id, textControlsFor(id as AnimationStyle)])
) as Record<AnimationStyle, TemplateContract>;

const immutableVideoIds: readonly ParticlePreset[] = ['imported-video-1', 'imported-video-2', 'imported-video-3', 'imported-video-4', 'imported-video-5', 'imported-video-6'];
export const backgroundControlContracts: Record<ParticlePreset, TemplateContract> = Object.fromEntries(
  Object.keys(backgroundCatalog).map((id) => [id, immutableVideoIds.includes(id as ParticlePreset) ? { controls: [], immutableResource: true } : { controls: [number('particleSpeed', 'Velocidad', 0.05, 6, 0.05, 1, 'background')] }])
) as unknown as Record<ParticlePreset, TemplateContract>;
