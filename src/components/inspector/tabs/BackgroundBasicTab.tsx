'use client';

import React from 'react';
import { defaultAnimationProps, useAnimation } from '@/lib/AnimationContext';
import { backgroundCatalog } from '@/lib/editor/catalog';
import { NumberField } from '../fields/NumberField';
import { ColorField } from '../fields/ColorField';
import { TemplatePicker } from '../TemplatePicker';
import { isImportedVideoPreset } from '@/remotion/backgrounds/ImportedVideoBackground';

const neonPatterns = [
  ['organic', 'Aleatorio orgánico'], ['horizontal', 'Onda horizontal'], ['vertical', 'Onda vertical'],
  ['diagonal-down', 'Diagonal descendente'], ['diagonal-up', 'Diagonal ascendente'], ['radial', 'Radial'],
  ['spiral', 'Espiral'], ['angular', 'Barrido angular'],
] as const;

export default function BackgroundBasicTab() {
  const { props, setProps, selectBackgroundPreset } = useAnimation();
  const isRetroGrid = props.particlePreset === 'retro-grid-forward';
  const isSolarWind = props.particlePreset === 'solar-wind-streaks';
  const isHalftone = props.particlePreset === 'halftone-wave-field';
  const isNeonBulb = props.particlePreset === 'neon-bulb-alternation';
  const isStellar = props.particlePreset === 'stellar-depth-field';
  const isImportedVideo = isImportedVideoPreset(props.particlePreset);
  const stellarHasAdvance = props.stellarMotionMode === 'advance' || props.stellarMotionMode === 'drift-advance';
  const hasAngularPattern = props.neonBulbPattern === 'angular' || (props.neonBulbCombinePattern && props.neonBulbSecondaryPattern === 'angular');
  const hasCenteredPattern = ['radial', 'spiral'].includes(props.neonBulbPattern) || (props.neonBulbCombinePattern && ['radial', 'spiral'].includes(props.neonBulbSecondaryPattern));
  const update = <K extends keyof typeof props>(key: K, value: (typeof props)[K]) => setProps((prev) => ({ ...prev, [key]: value }));
  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      <TemplatePicker label="Fondo" entries={Object.values(backgroundCatalog)} value={props.particlePreset} onChange={selectBackgroundPreset} />
      {!isNeonBulb && !isStellar && !isImportedVideo ? <>
        <NumberField id="particle-count" label="Número de partículas" value={props.particleCount} defaultValue={defaultAnimationProps.particleCount} min={12} max={240} step={1} unit="partículas" slider onChange={(value) => update('particleCount', value)} />
        <NumberField id="particle-opacity" label="Opacidad" value={props.particleOpacity} defaultValue={defaultAnimationProps.particleOpacity} min={0.05} max={1} step={0.01} unit="×" slider onChange={(value) => update('particleOpacity', value)} />
        <NumberField id="particle-speed" label="Velocidad" value={props.particleSpeed} defaultValue={defaultAnimationProps.particleSpeed} min={0.01} max={3} step={0.01} unit="×" slider onChange={(value) => update('particleSpeed', value)} />
        <NumberField id="particle-size-min" label="Tamaño mínimo" value={props.particleSizeMin} defaultValue={defaultAnimationProps.particleSizeMin} min={0} max={100} step={0.1} unit="px" slider onChange={(value) => update('particleSizeMin', value)} />
        <NumberField id="particle-size-max" label="Tamaño máximo" value={props.particleSizeMax} defaultValue={defaultAnimationProps.particleSizeMax} min={0} max={100} step={0.1} unit="px" slider onChange={(value) => update('particleSizeMax', value)} />
      </> : null}
      {!isStellar && !isNeonBulb && !isImportedVideo ? <ColorField id="particle-color-a" label="Color principal" value={props.particleColorA} defaultValue="#1f6bff" onChange={(value) => update('particleColorA', value)} /> : null}
      {isSolarWind ? <ColorField id="particle-color-b" label="Color secundario" value={props.particleColorB} defaultValue="#ffffff" onChange={(value) => update('particleColorB', value)} /> : null}
      {isHalftone ? <>
        <NumberField id="halftone-spacing" label="Espaciado" value={props.halftoneSpacingPx} defaultValue={defaultAnimationProps.halftoneSpacingPx} min={12} max={60} step={2} unit="px" slider onChange={(value) => update('halftoneSpacingPx', value)} />
        <NumberField id="halftone-radius-min" label="Radio mínimo" value={props.halftoneRadiusMinPx} defaultValue={defaultAnimationProps.halftoneRadiusMinPx} min={0.5} max={4} step={0.5} unit="px" slider onChange={(value) => update('halftoneRadiusMinPx', value)} />
        <NumberField id="halftone-radius-max" label="Radio máximo" value={props.halftoneRadiusMaxPx} defaultValue={defaultAnimationProps.halftoneRadiusMaxPx} min={2} max={12} step={0.5} unit="px" slider onChange={(value) => update('halftoneRadiusMaxPx', value)} />
        <NumberField id="halftone-wave-length" label="Longitud de onda" value={props.halftoneWaveLengthPx} defaultValue={defaultAnimationProps.halftoneWaveLengthPx} min={80} max={600} step={10} unit="px" slider onChange={(value) => update('halftoneWaveLengthPx', value)} />
        <NumberField id="halftone-direction" label="Dirección de onda" value={props.halftoneDirectionDegrees} defaultValue={defaultAnimationProps.halftoneDirectionDegrees} min={0} max={360} step={5} unit="°" slider onChange={(value) => update('halftoneDirectionDegrees', value)} />
        <NumberField id="halftone-center-clear" label="Despeje central" value={props.halftoneCenterClearPercent} defaultValue={defaultAnimationProps.halftoneCenterClearPercent} min={0} max={60} step={5} unit="%" slider onChange={(value) => update('halftoneCenterClearPercent', value)} />
      </> : null}
      {isNeonBulb ? <>
        <ColorField id="neon-bulb-color-a" label="Color A" value={props.neonBulbColorA} defaultValue="#22d3ee" onChange={(value) => update('neonBulbColorA', value)} />
        <ColorField id="neon-bulb-color-b" label="Color B" value={props.neonBulbColorB} defaultValue="#8b5cf6" onChange={(value) => update('neonBulbColorB', value)} />
        <div className="space-y-1.5">
          <label htmlFor="neon-bulb-pattern" className="text-xs text-neutral-200">Patrón principal</label>
          <select id="neon-bulb-pattern" value={props.neonBulbPattern} onChange={(event) => {
            const pattern = event.target.value as typeof props.neonBulbPattern;
            setProps((current) => ({
              ...current,
              neonBulbPattern: pattern,
              neonBulbSecondaryPattern: current.neonBulbSecondaryPattern === pattern ? (pattern === 'organic' ? 'horizontal' : 'organic') : current.neonBulbSecondaryPattern,
            }));
          }} className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100">
            {neonPatterns.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-xs text-neutral-200">
          <input type="checkbox" checked={props.neonBulbCombinePattern} onChange={(event) => update('neonBulbCombinePattern', event.target.checked)} />
          Combinar segundo patrón
        </label>
        {props.neonBulbCombinePattern ? <>
          <div className="space-y-1.5">
            <label htmlFor="neon-bulb-secondary-pattern" className="text-xs text-neutral-200">Patrón secundario</label>
            <select id="neon-bulb-secondary-pattern" value={props.neonBulbSecondaryPattern} onChange={(event) => update('neonBulbSecondaryPattern', event.target.value as typeof props.neonBulbSecondaryPattern)} className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100">
              {neonPatterns.map(([value, label]) => <option key={value} value={value} disabled={value === props.neonBulbPattern}>{label}</option>)}
            </select>
          </div>
          <NumberField id="neon-bulb-pattern-mix" label="Mezcla de patrones" value={props.neonBulbPatternMix} defaultValue={0.5} min={0} max={1} step={0.01} unit="×" slider onChange={(value) => update('neonBulbPatternMix', value)} />
        </> : null}
        <NumberField id="neon-bulb-homogeneity" label="Homogeneidad" value={props.neonBulbHomogeneity} defaultValue={0.75} min={0} max={1} step={0.01} unit="×" slider onChange={(value) => update('neonBulbHomogeneity', value)} />
        <NumberField id="neon-bulb-wave-length" label="Longitud de onda" value={props.neonBulbWaveLength} defaultValue={0.45} min={0.08} max={2} step={0.01} unit="×" slider onChange={(value) => update('neonBulbWaveLength', value)} />
        <NumberField id="neon-bulb-pattern-speed" label="Velocidad del patrón" value={props.neonBulbPatternSpeed} defaultValue={1} min={0} max={6} step={0.05} unit="×" slider onChange={(value) => update('neonBulbPatternSpeed', value)} />
        <NumberField id="neon-bulb-contrast" label="Contraste luminoso" value={props.neonBulbContrast} defaultValue={1.35} min={0.2} max={4} step={0.05} unit="×" slider onChange={(value) => update('neonBulbContrast', value)} />
        <NumberField id="neon-bulb-softness" label="Suavidad" value={props.neonBulbSoftness} defaultValue={0.65} min={0} max={1} step={0.01} unit="×" slider onChange={(value) => update('neonBulbSoftness', value)} />
        <label className="flex items-center gap-2 text-xs text-neutral-200">
          <input type="checkbox" checked={props.neonBulbReverse} onChange={(event) => update('neonBulbReverse', event.target.checked)} />
          Dirección inversa
        </label>
        {hasAngularPattern ? <NumberField id="neon-bulb-pattern-angle" label="Ángulo" value={props.neonBulbPatternAngle} defaultValue={45} min={0} max={360} step={1} unit="°" slider onChange={(value) => update('neonBulbPatternAngle', value)} /> : null}
        {hasCenteredPattern ? <>
          <NumberField id="neon-bulb-center-x" label="Centro X" value={props.neonBulbCenterX} defaultValue={0.5} min={0} max={1} step={0.01} unit="×" slider onChange={(value) => update('neonBulbCenterX', value)} />
          <NumberField id="neon-bulb-center-y" label="Centro Y" value={props.neonBulbCenterY} defaultValue={0.5} min={0} max={1} step={0.01} unit="×" slider onChange={(value) => update('neonBulbCenterY', value)} />
        </> : null}
        <NumberField id="neon-bulb-density" label="Densidad" value={props.neonBulbDensity} defaultValue={defaultAnimationProps.neonBulbDensity} min={10} max={70} step={1} slider onChange={(value) => update('neonBulbDensity', value)} />
        <NumberField id="neon-bulb-size" label="Tamaño" value={props.neonBulbSizePx} defaultValue={defaultAnimationProps.neonBulbSizePx} min={1} max={12} step={0.5} unit="px" slider onChange={(value) => update('neonBulbSizePx', value)} />
        <NumberField id="neon-bulb-brightness" label="Brillo" value={props.neonBulbBrightness} defaultValue={defaultAnimationProps.neonBulbBrightness} min={0.2} max={2} step={0.05} slider onChange={(value) => update('neonBulbBrightness', value)} />
        <NumberField id="neon-bulb-speed" label="Velocidad" value={props.neonBulbSpeed} defaultValue={defaultAnimationProps.neonBulbSpeed} min={0.1} max={4} step={0.1} slider onChange={(value) => update('neonBulbSpeed', value)} />
        <ColorField id="neon-bulb-backdrop" label="Color de fondo difuminado" value={props.particleBackdropColor} defaultValue="#2c7be5" onChange={(value) => update('particleBackdropColor', value)} />
      </> : null}
      {isStellar ? <>
        <fieldset className="space-y-3 rounded-md border border-neutral-800 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">Campo</legend>
          <NumberField id="stellar-density" label="Densidad" value={props.stellarDensity} defaultValue={defaultAnimationProps.stellarDensity} min={40} max={900} step={10} slider onChange={(value) => update('stellarDensity', value)} />
          <div className="space-y-1.5">
            <label htmlFor="stellar-distribution" className="text-xs text-neutral-200">Distribución</label>
            <select id="stellar-distribution" value={props.stellarDistribution} onChange={(event) => update('stellarDistribution', event.target.value as typeof props.stellarDistribution)} className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100">
              <option value="uniform">Uniforme</option><option value="far">Lejana</option><option value="balanced">Equilibrada</option><option value="near">Cercana</option>
            </select>
          </div>
          <NumberField id="stellar-size" label="Tamaño" value={props.stellarSize} defaultValue={defaultAnimationProps.stellarSize} min={0.3} max={8} step={0.1} unit="px" slider onChange={(value) => update('stellarSize', value)} />
          <NumberField id="stellar-size-variation" label="Variación de tamaño" value={props.stellarSizeVariation} defaultValue={defaultAnimationProps.stellarSizeVariation} min={0} max={1} step={0.01} unit="×" slider onChange={(value) => update('stellarSizeVariation', value)} />
          <NumberField id="stellar-depth" label="Profundidad" value={props.stellarDepth} defaultValue={defaultAnimationProps.stellarDepth} min={0.5} max={4} step={0.05} unit="×" slider onChange={(value) => update('stellarDepth', value)} />
          <NumberField id="stellar-perspective" label="Perspectiva" value={props.stellarPerspective} defaultValue={defaultAnimationProps.stellarPerspective} min={0.25} max={3} step={0.05} unit="×" slider onChange={(value) => update('stellarPerspective', value)} />
        </fieldset>

        <fieldset className="space-y-3 rounded-md border border-neutral-800 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">Movimiento</legend>
          <div className="space-y-1.5">
            <label htmlFor="stellar-motion-mode" className="text-xs text-neutral-200">Movimiento espacial</label>
            <select id="stellar-motion-mode" value={props.stellarMotionMode} onChange={(event) => update('stellarMotionMode', event.target.value as typeof props.stellarMotionMode)} className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100">
              <option value="drift">Deriva</option><option value="advance">Avance</option><option value="orbit">Órbita suave</option><option value="drift-advance">Deriva + Avance</option>
            </select>
          </div>
          <NumberField id="stellar-speed" label="Velocidad" value={props.stellarSpeed} defaultValue={defaultAnimationProps.stellarSpeed} min={0} max={3} step={0.05} unit="×" slider onChange={(value) => update('stellarSpeed', value)} />
          <NumberField id="stellar-drift-angle" label="Ángulo de deriva" value={props.stellarDriftAngle} defaultValue={defaultAnimationProps.stellarDriftAngle} min={0} max={360} step={1} unit="°" slider onChange={(value) => update('stellarDriftAngle', value)} />
          <NumberField id="stellar-parallax" label="Parallax" value={props.stellarParallax} defaultValue={defaultAnimationProps.stellarParallax} min={0} max={1.5} step={0.01} unit="×" slider onChange={(value) => update('stellarParallax', value)} />
          <NumberField id="stellar-camera-motion" label="Movimiento de cámara" value={props.stellarCameraMotion} defaultValue={defaultAnimationProps.stellarCameraMotion} min={0} max={1} step={0.01} unit="×" slider onChange={(value) => update('stellarCameraMotion', value)} />
          <NumberField id="stellar-sway" label="Balanceo" value={props.stellarSway} defaultValue={defaultAnimationProps.stellarSway} min={0} max={1} step={0.01} unit="×" slider onChange={(value) => update('stellarSway', value)} />
          <NumberField id="stellar-rotation" label="Rotación espacial" value={props.stellarRotation} defaultValue={defaultAnimationProps.stellarRotation} min={-1} max={1} step={0.01} unit="×" slider onChange={(value) => update('stellarRotation', value)} />
          {stellarHasAdvance ? <>
            <NumberField id="stellar-z-speed" label="Velocidad Z" value={props.stellarZSpeed} defaultValue={defaultAnimationProps.stellarZSpeed} min={-2} max={2} step={0.02} unit="×" slider onChange={(value) => update('stellarZSpeed', value)} />
            <NumberField id="stellar-streaks" label="Estelas" value={props.stellarStreaks} defaultValue={defaultAnimationProps.stellarStreaks} min={0} max={1} step={0.01} unit="×" slider onChange={(value) => update('stellarStreaks', value)} />
          </> : null}
        </fieldset>

        <fieldset className="space-y-3 rounded-md border border-neutral-800 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">Luz</legend>
          <NumberField id="stellar-brightness" label="Brillo" value={props.stellarBrightness} defaultValue={defaultAnimationProps.stellarBrightness} min={0.2} max={2.5} step={0.05} unit="×" slider onChange={(value) => update('stellarBrightness', value)} />
          <NumberField id="stellar-glow" label="Halo" value={props.stellarGlow} defaultValue={defaultAnimationProps.stellarGlow} min={0} max={2} step={0.02} unit="×" slider onChange={(value) => update('stellarGlow', value)} />
          <NumberField id="stellar-twinkle" label="Centelleo" value={props.stellarTwinkle} defaultValue={defaultAnimationProps.stellarTwinkle} min={0} max={1} step={0.01} unit="×" slider onChange={(value) => update('stellarTwinkle', value)} />
          <div className="space-y-1.5">
            <label htmlFor="stellar-color-mode" className="text-xs text-neutral-200">Color estelar</label>
            <select id="stellar-color-mode" value={props.stellarColorMode} onChange={(event) => update('stellarColorMode', event.target.value as typeof props.stellarColorMode)} className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100">
              <option value="monochrome">Monocromático</option><option value="bicolor">Bicolor</option><option value="temperature">Temperatura estelar</option><option value="custom">Paleta personalizada</option>
            </select>
          </div>
          {props.stellarColorMode !== 'temperature' ? <ColorField id="stellar-color-a" label="Color A" value={props.stellarColorA} defaultValue={defaultAnimationProps.stellarColorA} onChange={(value) => update('stellarColorA', value)} /> : null}
          {props.stellarColorMode === 'bicolor' || props.stellarColorMode === 'custom' ? <ColorField id="stellar-color-b" label="Color B" value={props.stellarColorB} defaultValue={defaultAnimationProps.stellarColorB} onChange={(value) => update('stellarColorB', value)} /> : null}
          {props.stellarColorMode === 'temperature' ? <NumberField id="stellar-temperature" label="Variación térmica" value={props.stellarTemperatureVariation} defaultValue={defaultAnimationProps.stellarTemperatureVariation} min={0} max={1} step={0.01} unit="×" slider onChange={(value) => update('stellarTemperatureVariation', value)} /> : null}
        </fieldset>

        <fieldset className="space-y-3 rounded-md border border-neutral-800 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">Profundidad</legend>
          <NumberField id="stellar-dof" label="Profundidad de campo" value={props.stellarDof} defaultValue={defaultAnimationProps.stellarDof} min={0} max={1} step={0.01} unit="×" slider onChange={(value) => update('stellarDof', value)} />
          {props.stellarDof > 0 ? <NumberField id="stellar-focus" label="Plano de enfoque" value={props.stellarFocusPlane} defaultValue={defaultAnimationProps.stellarFocusPlane} min={0} max={1} step={0.01} unit="Z" slider onChange={(value) => update('stellarFocusPlane', value)} /> : null}
          <NumberField id="stellar-depth-fog" label="Niebla de profundidad" value={props.stellarDepthFog} defaultValue={defaultAnimationProps.stellarDepthFog} min={0} max={1} step={0.01} unit="×" slider onChange={(value) => update('stellarDepthFog', value)} />
        </fieldset>

        <fieldset className="space-y-3 rounded-md border border-neutral-800 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">Ambiente</legend>
          <NumberField id="stellar-dust" label="Polvo" value={props.stellarDust} defaultValue={defaultAnimationProps.stellarDust} min={0} max={1} step={0.01} unit="×" slider onChange={(value) => update('stellarDust', value)} />
          <NumberField id="stellar-nebula" label="Nebulosa" value={props.stellarNebula} defaultValue={defaultAnimationProps.stellarNebula} min={0} max={1} step={0.01} unit="×" slider onChange={(value) => update('stellarNebula', value)} />
          {props.stellarNebula > 0 ? <>
            <NumberField id="stellar-nebula-scale" label="Escala nebulosa" value={props.stellarNebulaScale} defaultValue={defaultAnimationProps.stellarNebulaScale} min={0.4} max={3} step={0.05} unit="×" slider onChange={(value) => update('stellarNebulaScale', value)} />
            <NumberField id="stellar-nebula-speed" label="Velocidad nebulosa" value={props.stellarNebulaSpeed} defaultValue={defaultAnimationProps.stellarNebulaSpeed} min={0} max={2} step={0.02} unit="×" slider onChange={(value) => update('stellarNebulaSpeed', value)} />
            <NumberField id="stellar-nebula-intensity" label="Intensidad nebulosa" value={props.stellarNebulaIntensity} defaultValue={defaultAnimationProps.stellarNebulaIntensity} min={0} max={1} step={0.01} unit="×" slider onChange={(value) => update('stellarNebulaIntensity', value)} />
            <ColorField id="stellar-nebula-color" label="Color nebulosa" value={props.stellarNebulaColor} defaultValue={defaultAnimationProps.stellarNebulaColor} onChange={(value) => update('stellarNebulaColor', value)} />
          </> : null}
        </fieldset>

        <fieldset className="space-y-3 rounded-md border border-neutral-800 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">Sistema</legend>
          <NumberField id="stellar-seed" label="Seed" value={props.stellarSeed} defaultValue={defaultAnimationProps.stellarSeed} min={1} max={9999} step={1} slider onChange={(value) => update('stellarSeed', value)} />
        </fieldset>
      </> : null}
      {isRetroGrid ? <>
        <label htmlFor="retro-flow-direction" className="text-xs text-neutral-300">Dirección de flujo</label>
        <select id="retro-flow-direction" value={props.particleFlowDirection} onChange={(event) => update('particleFlowDirection', event.target.value as typeof props.particleFlowDirection)} className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100">
          <option value="forward">Forward</option>
          <option value="backward">Backward</option>
        </select>
        <NumberField id="retro-grid-angle" label="Ángulo de cuadrícula" value={props.particleGridAngle} defaultValue={defaultAnimationProps.particleGridAngle} min={35} max={88} step={1} unit="°" slider onChange={(value) => update('particleGridAngle', value)} />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="retro-line-thickness" className="text-xs text-neutral-200">Grosor de línea</label>
            <span className="text-[11px] text-neutral-500">{props.particleLineThickness.toFixed(2)}×</span>
          </div>
          <input id="retro-line-thickness" aria-label="Grosor de línea" type="range" min="0.4" max="3" step="0.05" value={props.particleLineThickness} onChange={(event) => update('particleLineThickness', Number(event.target.value))} className="w-full accent-emerald-500" />
        </div>
      </> : null}
    </div>
  );
}
