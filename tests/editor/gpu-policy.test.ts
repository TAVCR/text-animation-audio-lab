import { describe, expect, it } from 'vitest';
import { buildRenderAttemptDescriptors } from '@/lib/render/renderAttempts';

describe('política de pipeline GPU', () => {
  it('CPU no intenta GPU y GPU estricta no incluye fallback CPU', () => {
    const base = { codec: 'h264' as const, transparent: false, platform: 'win32' as const };
    expect(buildRenderAttemptDescriptors({ ...base, preference: 'cpu' })[0].renderMode).toBe('cpu');
    expect(buildRenderAttemptDescriptors({ ...base, preference: 'cpu' })).toHaveLength(1);
    expect(buildRenderAttemptDescriptors({ ...base, preference: 'gpu' }).every((attempt) => attempt.renderMode === 'gpu')).toBe(true);
  });
  it('auto conserva fallback CPU después del intento GPU', () => {
    const attempts = buildRenderAttemptDescriptors({ preference: 'auto', codec: 'h264', transparent: false, platform: 'win32' });
    expect(attempts.map((attempt) => attempt.encodeMode)).toEqual(['nvenc', 'standard', 'standard']);
    expect(attempts.map((attempt) => attempt.renderMode)).toEqual(['gpu', 'gpu', 'cpu']);
  });
  it('filtra NVENC cuando transparencia o codec lo hacen incompatible', () => {
    expect(buildRenderAttemptDescriptors({ preference: 'auto', codec: 'vp9', transparent: true, platform: 'win32' }).map((a) => a.encodeMode)).toEqual(['standard', 'standard']);
    expect(buildRenderAttemptDescriptors({ preference: 'auto', codec: 'prores', transparent: true, platform: 'win32' }).every((a) => a.encodeMode === 'standard')).toBe(true);
  });
  it('es determinista', () => {
    const options = { preference: 'auto' as const, codec: 'h264' as const, transparent: false, platform: 'win32' as const, preferredGl: 'angle' };
    expect(buildRenderAttemptDescriptors(options)).toEqual(buildRenderAttemptDescriptors(options));
  });
});
