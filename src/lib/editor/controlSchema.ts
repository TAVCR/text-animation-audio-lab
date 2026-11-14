export type ControlDefault = number | string | boolean;

export interface ControlSchema {
  key: string;
  label: string;
  description: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  default: ControlDefault;
  advanced: boolean;
  requiredCapability: string;
}

export const basicControlSchema = [
  { key: 'fontSize', label: 'Tamaño de texto', description: 'Tamaño de la tipografía principal', unit: 'px', min: 8, max: 2048, step: 1, default: 120, advanced: false, requiredCapability: 'typography' },
  { key: 'letterSpacing', label: 'Espaciado entre letras', description: 'Separación horizontal entre caracteres', unit: 'px', min: -20, max: 100, step: 0.5, default: 0, advanced: false, requiredCapability: 'typography' },
  { key: 'lineHeight', label: 'Interlineado', description: 'Altura relativa entre líneas', unit: '×', min: 0.5, max: 3, step: 0.05, default: 1.2, advanced: false, requiredCapability: 'typography' },
  { key: 'textPositionX', label: 'Posición horizontal', description: 'Desplazamiento horizontal del texto', unit: '%', min: -100, max: 100, step: 1, default: 0, advanced: false, requiredCapability: 'position' },
  { key: 'textPositionY', label: 'Posición vertical', description: 'Desplazamiento vertical del texto', unit: '%', min: -100, max: 100, step: 1, default: 0, advanced: false, requiredCapability: 'position' },
  { key: 'shadowBlur', label: 'Desenfoque de sombra', description: 'Suavidad de la sombra del texto', unit: 'px', min: 0, max: 100, step: 1, default: 0, advanced: true, requiredCapability: 'shadow' },
] satisfies readonly ControlSchema[];
