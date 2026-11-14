'use client';

import React from 'react';
import { useAnimation } from '@/lib/AnimationContext';
import { NumberField } from '../fields/NumberField';
import { RESOLUTION_PRESETS, REMOTION_FPS, setDisplayedDurationSeconds, getCompositionDimensions } from '@/lib/videoConfig';

export default function CompositionBasicTab() {
  const { props, setProps } = useAnimation();
  const durationSeconds = props.motionDurationFrames / REMOTION_FPS;
  const dims = getCompositionDimensions(props.aspectRatio, props.resolutionPreset);

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-100">Formato del lienzo</h2>
        <div className="space-y-1.5">
          <label htmlFor="aspect-ratio" className="text-xs text-neutral-300">Relación de aspecto</label>
          <select
            id="aspect-ratio"
            value={props.aspectRatio}
            onChange={(event) => setProps((prev) => ({ ...prev, aspectRatio: event.target.value as typeof prev.aspectRatio }))}
            className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100"
          >
            {['16:9', '9:16', '1:1'].map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="resolution" className="text-xs text-neutral-300">Resolución</label>
          <select
            id="resolution"
            value={props.resolutionPreset}
            onChange={(event) => setProps((prev) => ({ ...prev, resolutionPreset: event.target.value as typeof prev.resolutionPreset }))}
            className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100"
          >
            {RESOLUTION_PRESETS.map((preset) => <option key={preset.value} value={preset.value}>{preset.label}</option>)}
          </select>
        </div>

        {/* Live Resolution & FPS Metrics */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-2.5 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-neutral-400 block tracking-wider">Dimensiones de salida</span>
            <span className="font-mono text-emerald-400 font-semibold text-sm">{dims.width} × {dims.height} px</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-neutral-400 block tracking-wider">Frecuencia</span>
            <span className="font-mono text-neutral-300 text-sm">{REMOTION_FPS} FPS</span>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-100">Tiempo de animación</h2>
        <NumberField
          id="duration"
          label="Duración"
          value={durationSeconds}
          defaultValue={5}
          min={0.5}
          max={120}
          step={0.1}
          unit="s"
          slider
          help={`${props.motionDurationFrames} frames en total (${REMOTION_FPS} fotogramas por segundo)`}
          onChange={(seconds) => {
            const edit = setDisplayedDurationSeconds({
              motionDurationFrames: props.motionDurationFrames,
              speed: props.speed,
              speedControlsDuration: props.speedControlsDuration,
            }, seconds);
            setProps((prev) => ({ ...prev, motionDurationFrames: edit.motionDurationFrames }));
          }}
        />
      </section>
    </div>
  );
}
