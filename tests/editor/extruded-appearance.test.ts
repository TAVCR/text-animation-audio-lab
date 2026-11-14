import { describe, expect, it } from 'vitest';
import { resolveExtrudedAppearance } from '@/remotion/templates/extrudedAppearance';

describe('apariencia global de Extruded 3D', () => {
  const base = { color: '#112233', borderColor: '#445566', shadowColor: '#778899', enableFill: true, enableBorder: false, enableShadow: false } as const;

  it('usa el color y relleno globales', () => {
    expect(resolveExtrudedAppearance(base)).toMatchObject({ color: '#112233', transparent: false, opacity: 1 });
  });

  it('hace visible el borde cuando el relleno está desactivado', () => {
    expect(resolveExtrudedAppearance({ ...base, enableFill: false, enableBorder: true })).toMatchObject({ color: '#445566', transparent: true });
  });

  it('aplica la sombra global como emisión del material', () => {
    expect(resolveExtrudedAppearance({ ...base, enableShadow: true })).toMatchObject({ emissive: '#778899', emissiveIntensity: 0.28 });
  });
});
