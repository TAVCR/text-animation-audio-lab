import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { defaultAnimationProps } from '@/lib/AnimationContext';
import { ParticleBackground } from '@/remotion/backgrounds/ParticleBackground';
import { StellarDepthField } from '@/remotion/backgrounds/StellarDepthFieldCanvas';

vi.mock('remotion', async () => {
  const actual = await vi.importActual<typeof import('remotion')>('remotion');
  return {
    ...actual,
    useCurrentFrame: () => 30,
    useVideoConfig: () => ({ fps: 30, width: 1920, height: 1080, durationInFrames: 120 }),
  };
});

const props = {
  enabled: true,
  count: defaultAnimationProps.particleCount,
  opacity: defaultAnimationProps.particleOpacity,
  speed: defaultAnimationProps.particleSpeed,
  flowDirection: defaultAnimationProps.particleFlowDirection,
  sizeMin: defaultAnimationProps.particleSizeMin,
  sizeMax: defaultAnimationProps.particleSizeMax,
  lineThickness: defaultAnimationProps.particleLineThickness,
  gridAngle: defaultAnimationProps.particleGridAngle,
  blur: defaultAnimationProps.particleBlur,
  colorA: defaultAnimationProps.particleColorA,
  colorB: defaultAnimationProps.particleColorB,
  backdropColor: defaultAnimationProps.particleBackdropColor,
  backdropOpacity: defaultAnimationProps.particleBackdropOpacity,
  lightIntensityA: defaultAnimationProps.particleLightIntensityA,
  lightIntensityB: defaultAnimationProps.particleLightIntensityB,
  lightIntensityC: defaultAnimationProps.particleLightIntensityC,
  metalness: defaultAnimationProps.particleMetalness,
  roughness: defaultAnimationProps.particleRoughness,
  transparentBackground: false,
  lowpolyLightA: defaultAnimationProps.lowpolyLightA,
  lowpolyLightB: defaultAnimationProps.lowpolyLightB,
  lowpolyLightC: defaultAnimationProps.lowpolyLightC,
  lowpolyDustA: defaultAnimationProps.lowpolyDustA,
  lowpolyDustB: defaultAnimationProps.lowpolyDustB,
  lowpolyShowMirror: defaultAnimationProps.lowpolyShowMirror,
};

describe('representantes de familias de fondos F4', () => {
  it.each(['light-orbs', 'tech-network', 'nebula-cinematic', 'fluid-ribbons'])('%s monta salida canvas sin valores inválidos', (preset) => {
    const html = renderToStaticMarkup(<ParticleBackground {...props} preset={preset as typeof defaultAnimationProps.particlePreset} />);
    expect(html).toContain('<canvas');
    expect(html).not.toMatch(/NaN|Infinity/);
  });

  it('Stellar Depth Field monta su renderer Canvas especializado', () => {
    const html = renderToStaticMarkup(<StellarDepthField />);
    expect(html).toContain('data-stellar-depth-field="true"');
    expect(html).toContain('<canvas');
    expect(html).not.toMatch(/NaN|Infinity/);
  });

  it('ParticleBackground enruta Stellar Depth Field al renderer especializado', () => {
    const html = renderToStaticMarkup(<ParticleBackground {...props} preset="stellar-depth-field" />);
    expect(html).toContain('data-stellar-depth-field="true"');
  });
});
