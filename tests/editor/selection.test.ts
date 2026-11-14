import { describe, expect, it } from 'vitest';
import { selectBackgroundPreset, selectTextTemplate } from '@/lib/editor/selection';

const base = { text: 'KEEP', motionDurationFrames: 240, resolutionPreset: '1080p', color: '#fff', particlePreset: 'a', particleCount: 10, textRangeStyles: [{ id: 'word-style-2-fill', start: 5, end: 9, color: '#00ff00' }] } as unknown as import('@/lib/types/animation').AnimationProps;

describe('domain selection', () => {
  it('restores text-template settings while preserving content, duration and background', () => {
    const next = selectTextTemplate(base, 'glitch', { glitch: { animationStyle: 'glitch', color: '#f00' } });
    expect(next.text).toBe('KEEP');
    expect(next.motionDurationFrames).toBe(240);
    expect(next.particlePreset).toBe('a');
    expect(next.animationStyle).toBe('glitch');
    expect(next.color).toBe('#fff');
    expect(next.textRangeStyles).toEqual(base.textRangeStyles);
  });

  it('keeps shared typography and appearance global when changing templates', () => {
    const next = selectTextTemplate({ ...base, fontFamily: 'Montserrat', fontSize: 128, enableFill: true, enableBorder: false, shadowColor: '#123456' }, 'glitch', { glitch: { animationStyle: 'glitch', fontFamily: 'Poppins', fontSize: 64, enableFill: false, enableBorder: true, shadowColor: '#abcdef' } });
    expect(next.fontFamily).toBe('Montserrat');
    expect(next.fontSize).toBe(128);
    expect(next.enableFill).toBe(true);
    expect(next.enableBorder).toBe(false);
    expect(next.shadowColor).toBe('#123456');
  });

  it('keeps shared particle controls global when changing backgrounds', () => {
    const next = selectBackgroundPreset({ ...base, particleOpacity: 0.4, particleSpeed: 1.2 }, 'b', { b: { particlePreset: 'b' as never, particleCount: 90, particleOpacity: 0.9, particleSpeed: 2.4 } });
    expect(next.particlePreset).toBe('b');
    expect(next.particleCount).toBe(10);
    expect(next.particleOpacity).toBe(0.4);
    expect(next.particleSpeed).toBe(1.2);
    expect(next.text).toBe('KEEP');
    expect(next.color).toBe('#fff');
    expect(next.motionDurationFrames).toBe(240);
  });

  it('falls back safely when a retired background id is persisted', () => {
    const next = selectBackgroundPreset({ ...base, particlePreset: 'light-orbs' }, 'bg3d-dna-helix', {});
    expect(next.particlePreset).toBe('light-orbs');
  });

  it('maps the redundant falling-particles id to Floating Dust', () => {
    const next = selectBackgroundPreset({ ...base, particlePreset: 'light-orbs' }, 'falling-particles', {});
    expect(next.particlePreset).toBe('floating-dust');
  });
  it('initializes the secondary layer when Dual Text Layers is selected', () => {
    const next = selectTextTemplate({ ...base, animationStyle: 'typewriter' }, 'dual-text-layers', {});
    expect(next.secondaryTextLayer?.enabled).toBe(true);
    expect(next.secondaryTextLayer?.text).toBe('DEPTH');
  });

  it('migrates the retired confetti id and restores its saved bulb settings', () => {
    const next = selectBackgroundPreset({ ...base, particlePreset: 'light-orbs' }, 'paper-confetti-settle', {
      'paper-confetti-settle': { neonBulbDensity: 55, neonBulbColorA: '#123456' },
    });
    expect(next.particlePreset).toBe('neon-bulb-alternation');
    expect(next.neonBulbDensity).toBe(55);
    expect(next.neonBulbColorA).toBe('#123456');
  });

  it('restaura la configuración específica de Stellar Depth Field sin afectar texto', () => {
    const next = selectBackgroundPreset({ ...base, particlePreset: 'light-orbs' }, 'stellar-depth-field', {
      'stellar-depth-field': { stellarDensity: 480, stellarMotionMode: 'orbit', stellarNebula: 0.65 },
    });
    expect(next.particlePreset).toBe('stellar-depth-field');
    expect(next.stellarDensity).toBe(480);
    expect(next.stellarMotionMode).toBe('orbit');
    expect(next.stellarNebula).toBe(0.65);
    expect(next.text).toBe('KEEP');
  });
});
