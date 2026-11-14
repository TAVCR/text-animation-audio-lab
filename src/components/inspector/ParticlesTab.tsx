'use client';

import React from 'react';
import { defaultAnimationProps, useAnimation } from '@/lib/AnimationContext';
import { Accordion, CompactCheckbox, FieldRow, InlineNumberRow, InlineRangeRow, compactInputClass, compactSelectClass } from './primitives';

const PARTICLE_PRESETS = [
  'floating-dust',
  'light-orbs',
  'starfield',
  'geometric-flow',
  'nebula-cinematic',
  'fluid-ribbons',
  'tech-network',
  'inferno-tracer-burst',
  'neon-data-vortex',
  'hud-command-center',
  'cyan-system-matrix',
  'neural-circuit-core',
  'quantum-lattice-flow',
  'aurora-silk-waves',
  'ember-spark-rain',
  'plasma-ring-tunnel',
  'obsidian-gold-luxe',
  'bio-lumina-veins',
  'radar-sweep-grid',
  'matrix-code-rain',
  'matrix-tunnel-flow',
  'metaball-reactor',
  'wireframe-constellation',
  'prism-noise-shimmer',
  'prism-sphere-shimmer-3d',
  'solar-wind-streaks',
  'crystal-shard-drift',
  'monochrome-moire',
  'electro-silk-tendrils',
  'bg3d-lowpoly-terrain',
  'bg3d-crystal-shards',
  'retro-grid-forward',
] as const;

const PARTICLE_PRESET_DEFAULTS = {
  'retro-grid-forward': {
    particleColorA: '#1f6bff',
    particleColorB: '#1f6bff',
    particleBackdropColor: '#000000',
    particleBackdropOpacity: 0,
    particleOpacity: 0.9,
    particleCount: 96,
    particleSpeed: 0.45,
    particleFlowDirection: 'forward',
    particleBlur: 0,
    particleSizeMin: 22,
    particleSizeMax: 22,
    particleLineThickness: 1,
    particleGridAngle: 82,
  },
} as const;

export default function ParticlesTab() {
  const { props, setProps, selectBackgroundPreset } = useAnimation();
  const isRetroGridPreset = props.particlePreset === 'retro-grid-forward';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const { name, type } = target;

    if (name === 'particlePreset') {
      const selected = target.value as typeof PARTICLE_PRESETS[number];
      selectBackgroundPreset(selected);
      const patch = PARTICLE_PRESET_DEFAULTS[selected as keyof typeof PARTICLE_PRESET_DEFAULTS] ?? {};
      if (Object.keys(patch).length) setProps((prev) => ({ ...prev, ...patch }));
      return;
    }

    if (type === 'checkbox' && target instanceof HTMLInputElement) {
      setProps((prev) => ({ ...prev, [name]: target.checked }));
      return;
    }

    const raw = target.value;
    const defaultValue = defaultAnimationProps[name as keyof typeof defaultAnimationProps];

    let value: unknown = raw;
    if (typeof defaultValue === 'number') {
      const parsed = Number(raw);
      value = Number.isFinite(parsed) ? parsed : defaultValue;
    }

    setProps((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-2">
      <Accordion title="Core" storageKey="particles-core">
        <CompactCheckbox
          checked={props.enableParticles}
          onChange={(e) => setProps((prev) => ({ ...prev, enableParticles: e.target.checked }))}
          label="Enable Particles"
        />

        <FieldRow label="Preset">
          <select name="particlePreset" value={props.particlePreset} onChange={handleChange} className={compactSelectClass}>
            {PARTICLE_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>
        </FieldRow>

        {!isRetroGridPreset ? (
          <InlineRangeRow axis="N" value={`${Math.round(props.particleCount)}`}>
            <input type="range" min="12" max="240" step="1" name="particleCount" value={props.particleCount} onChange={handleChange} className="w-full" />
          </InlineRangeRow>
        ) : null}
        <InlineRangeRow axis="O" value={props.particleOpacity.toFixed(2)}>
          <input type="range" min="0.05" max="1" step="0.01" name="particleOpacity" value={props.particleOpacity} onChange={handleChange} className="w-full" />
        </InlineRangeRow>
        <InlineRangeRow axis="S" value={props.particleSpeed.toFixed(2)}>
          <input type="range" min="0.01" max="3" step="0.01" name="particleSpeed" value={props.particleSpeed} onChange={handleChange} className="w-full" />
        </InlineRangeRow>

        <div className="grid grid-cols-2 gap-1.5">
          {isRetroGridPreset ? (
            <FieldRow label="Flow">
              <select name="particleFlowDirection" value={props.particleFlowDirection} onChange={handleChange} className={compactSelectClass}>
                <option value="forward">Forward</option>
                <option value="backward">Backward</option>
              </select>
            </FieldRow>
          ) : null}
          {!isRetroGridPreset ? (
            <FieldRow label="Blur">
              <input type="number" step="0.1" name="particleBlur" value={props.particleBlur} onChange={handleChange} className={compactInputClass} />
            </FieldRow>
          ) : null}
        </div>

        {isRetroGridPreset ? (
          <>
            <InlineRangeRow axis="G" value={props.particleSizeMax.toFixed(0)}>
              <input
                type="range"
                min="8"
                max="64"
                step="1"
                value={props.particleSizeMax}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setProps((prev) => ({ ...prev, particleSizeMin: next, particleSizeMax: next }));
                }}
                className="w-full"
              />
            </InlineRangeRow>
            <InlineRangeRow axis="A" value={`${props.particleGridAngle.toFixed(0)}°`}>
              <input type="range" min="35" max="88" step="1" name="particleGridAngle" value={props.particleGridAngle} onChange={handleChange} className="w-full" />
            </InlineRangeRow>
            <InlineRangeRow axis="T" value={`${props.particleLineThickness.toFixed(2)}x`}>
              <input type="range" min="0.4" max="3" step="0.05" name="particleLineThickness" value={props.particleLineThickness} onChange={handleChange} className="w-full" />
            </InlineRangeRow>
          </>
        ) : (
          <InlineNumberRow
            items={[
              {
                label: 'Size Min',
                control: <input type="number" step="0.1" name="particleSizeMin" value={props.particleSizeMin} onChange={handleChange} className={compactInputClass} />,
              },
              {
                label: 'Size Max',
                control: <input type="number" step="0.1" name="particleSizeMax" value={props.particleSizeMax} onChange={handleChange} className={compactInputClass} />,
              },
            ]}
          />
        )}
      </Accordion>

      <Accordion title="Color & Backdrop" storageKey="particles-color">
        <InlineNumberRow
          items={[
            { label: 'Color A', control: <input type="color" name="particleColorA" value={props.particleColorA} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" /> },
            { label: 'Color B', control: <input type="color" name="particleColorB" value={props.particleColorB} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" disabled={isRetroGridPreset} /> },
            { label: 'Backdrop', control: <input type="color" name="particleBackdropColor" value={props.particleBackdropColor} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" /> },
          ]}
        />

        <FieldRow label="Backdrop Opacity">
          <input type="number" min="0" max="1" step="0.01" name="particleBackdropOpacity" value={props.particleBackdropOpacity} onChange={handleChange} className={compactInputClass} />
        </FieldRow>
      </Accordion>

      <Accordion title="3D Lighting & Material" storageKey="particles-3d">
        <InlineNumberRow
          items={[
            {
              label: 'Light A',
              control: <input type="number" step="0.1" name="particleLightIntensityA" value={props.particleLightIntensityA} onChange={handleChange} className={compactInputClass} />,
            },
            {
              label: 'Light B',
              control: <input type="number" step="0.1" name="particleLightIntensityB" value={props.particleLightIntensityB} onChange={handleChange} className={compactInputClass} />,
            },
            {
              label: 'Light C',
              control: <input type="number" step="0.1" name="particleLightIntensityC" value={props.particleLightIntensityC} onChange={handleChange} className={compactInputClass} />,
            },
          ]}
        />

        <InlineNumberRow
          items={[
            {
              label: 'Metalness',
              control: <input type="number" min="0" max="1" step="0.01" name="particleMetalness" value={props.particleMetalness} onChange={handleChange} className={compactInputClass} />,
            },
            {
              label: 'Roughness',
              control: <input type="number" min="0" max="1" step="0.01" name="particleRoughness" value={props.particleRoughness} onChange={handleChange} className={compactInputClass} />,
            },
            {
              label: 'Grid Angle',
              control: <input type="number" step="1" name="particleGridAngle" value={props.particleGridAngle} onChange={handleChange} className={compactInputClass} />,
            },
          ]}
        />

        <InlineNumberRow
          items={[
            { label: 'Lowpoly A', control: <input type="color" name="lowpolyLightA" value={props.lowpolyLightA} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" /> },
            { label: 'Lowpoly B', control: <input type="color" name="lowpolyLightB" value={props.lowpolyLightB} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" /> },
            { label: 'Lowpoly C', control: <input type="color" name="lowpolyLightC" value={props.lowpolyLightC} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" /> },
          ]}
        />

        <InlineNumberRow
          items={[
            { label: 'Dust A', control: <input type="color" name="lowpolyDustA" value={props.lowpolyDustA} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" /> },
            { label: 'Dust B', control: <input type="color" name="lowpolyDustB" value={props.lowpolyDustB} onChange={handleChange} className="h-7 w-full rounded-md border border-neutral-700 bg-neutral-900 p-1" /> },
            {
              label: 'Mirror',
              control: (
                <div className="h-7 flex items-center">
                  <CompactCheckbox
                    checked={props.lowpolyShowMirror}
                    onChange={(e) => setProps((prev) => ({ ...prev, lowpolyShowMirror: e.target.checked }))}
                    label="On"
                  />
                </div>
              ),
            },
          ]}
        />
      </Accordion>
    </div>
  );
}
