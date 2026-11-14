"use client";

import React from "react";
import { defaultAnimationProps, useAnimation } from "@/lib/AnimationContext";
import { useOptionalExportSession } from "@/lib/editor/ExportContext";
import { textTemplateCatalog } from "@/lib/editor/catalog";
import { NumberField } from "../fields/NumberField";
import { ColorField } from "../fields/ColorField";
import { TemplatePicker } from "../TemplatePicker";
import { useAvailableFontFamilies } from "@/lib/fonts/availableFonts";
import { MAX_DURATION_IN_FRAMES, REMOTION_FPS, sanitizeSpeedMultiplier } from "@/lib/videoConfig";
import { getTypewriterRevealFrames, sanitizeCharactersPerSecond, segmentGraphemes } from "@/remotion/templates/typewriterUtils";

export default function TextBasicTab() {
  const { props, setProps, selectTextTemplate } = useAnimation();
  const fonts = useAvailableFontFamilies();
  const requestedTextFrames = props.animationStyle === 'typewriter'
    ? Math.ceil(getTypewriterRevealFrames(segmentGraphemes(props.text).length, sanitizeCharactersPerSecond(props.typewriterCharactersPerSecond), REMOTION_FPS) / sanitizeSpeedMultiplier(props.speed))
    : 0;
  const isDual = props.animationStyle === "dual-text-layers";
  const isInkStamp = props.animationStyle === "ink-stamp-print";
  const hidesGlobalAppearance = ["word-highlight-tracker", "paper-cutout-assemble", "variable-weight-wave", "glyph-tile-assemble"].includes(props.animationStyle);
  const secondary = props.secondaryTextLayer;
  const updateSecondary = (patch: Partial<NonNullable<typeof secondary>>) =>
    setProps((prev) => ({
      ...prev,
      secondaryTextLayer: {
        enabled: true,
        text: "DEPTH",
        animationStyle: "ink-stamp-print",
        fontFamily: "Montserrat",
        fontWeight: "400",
        fontSize: 120,
        positionX: 0,
        positionY: 0,
        color: "#8b5cf6",
        opacity: 0.45,
        enableFill: true,
        enableBorder: false,
        borderColor: "#ffffff",
        borderWidth: 4,
        enableShadow: false,
        shadowColor: "#000000",
        shadowBlur: 12,
        motionDurationFrames: prev.motionDurationFrames,
        speed: prev.speed,
        templateOptions: {},
        ...prev.secondaryTextLayer,
        ...patch,
        delayFrames: patch.delayFrames ?? prev.secondaryTextLayer?.delayFrames ?? 0,
      },
    }));
  const exportSession = useOptionalExportSession();
  const batchTextInput = exportSession?.batchTextInput ?? "";
  const setBatchTextInput =
    exportSession?.setBatchTextInput ?? (() => undefined);
  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      <section className="space-y-2 pb-2 border-b border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-100">
          Plantilla
        </h2>
        <TemplatePicker
          label="Plantilla de texto"
          entries={Object.values(textTemplateCatalog)}
          value={props.animationStyle}
          onChange={selectTextTemplate}
        />
      </section>
      {props.animationStyle === "bar-reveal" ? (
        <ColorField
          id="bar-color"
          label="Color de la barra"
          value={props.boxColor}
          defaultValue="#ff0055"
          onChange={(boxColor) => setProps((prev) => ({ ...prev, boxColor }))}
        />
      ) : null}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-100">Contenido</h2>
        {requestedTextFrames > props.motionDurationFrames && <div className="rounded border border-amber-700 p-2 text-xs text-amber-200">
          <p>La secuencia excede la duración del video: necesita {(requestedTextFrames / REMOTION_FPS).toFixed(1)} s para completar el texto.</p>
          {requestedTextFrames <= MAX_DURATION_IN_FRAMES
            ? <button type="button" className="mt-2 rounded border border-amber-600 p-2" onClick={() => setProps(prev => ({ ...prev, motionDurationFrames: requestedTextFrames }))}>Ajustar duración a la secuencia</button>
            : <p>Aumenta la velocidad o reduce el texto para completar la secuencia dentro del máximo de 120 s.</p>}
        </div>}
        <label htmlFor="text-main" className="text-xs text-neutral-300">
          Texto principal
        </label>
        <textarea
          id="text-main"
          value={props.text}
          onChange={(event) =>
            setProps((prev) => ({ ...prev, text: event.target.value }))
          }
          rows={3}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 p-2 text-sm text-neutral-100 outline-none focus:border-emerald-500"
        />
        {!isDual ? (
          <div className="mt-3 space-y-1">
            <label htmlFor="batch-lines" className="text-xs text-neutral-300">
              Líneas para lote
            </label>
            <textarea
              id="batch-lines"
              value={batchTextInput}
              onChange={(event) => setBatchTextInput(event.target.value)}
              rows={6}
              placeholder={"Línea 1\nLínea 2\nLínea 3"}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 p-2 text-sm text-neutral-100 outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-neutral-500">
              Una línea por texto. Se renderizan en secuencia cuando eliges
              Render por Lotes.
            </p>
          </div>
        ) : null}
      </section>
      {isDual ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-100">
            Capas de texto
          </h2>
          <div className="rounded-md border border-neutral-700 p-2 space-y-3">
            <h3 className="text-xs font-semibold text-neutral-200">Capa 1</h3>
            <label htmlFor="layer1-font-family" className="text-xs text-neutral-300">Fuente de capa 1</label>
            <select id="layer1-font-family" value={props.fontFamily} onChange={(event) => setProps((prev) => ({ ...prev, fontFamily: event.target.value }))} className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100">
              {fonts.map((font) => <option key={font}>{font}</option>)}
            </select>
             <NumberField id="layer1-size" label="Tamaño de capa 1" value={props.fontSize} defaultValue={120} min={8} max={2048} step={1} unit="px" slider onChange={(value) => setProps((prev) => ({ ...prev, fontSize: value }))} />
             <NumberField id="layer1-delay" label="Retraso de capa 1" value={props.dualPrimaryDelayFrames ?? 0} defaultValue={0} min={0} max={240} step={1} unit="frames" slider onChange={(value) => setProps((prev) => ({ ...prev, dualPrimaryDelayFrames: value }))} />
            <NumberField
              id="layer1-position-x"
              label="Posición X de capa 1"
              value={props.textPositionX}
              defaultValue={0}
              min={-1000}
              max={1000}
              step={1}
              unit="px"
              slider
              onChange={(value) =>
                setProps((prev) => ({ ...prev, textPositionX: value }))
              }
            />
            <NumberField
              id="layer1-position-y"
              label="Posición Y de capa 1"
              value={props.textPositionY}
              defaultValue={0}
              min={-1000}
              max={1000}
              step={1}
              unit="px"
              slider
              onChange={(value) =>
                setProps((prev) => ({ ...prev, textPositionY: value }))
              }
            />
            <NumberField
              id="layer1-opacity"
              label="Opacidad de capa 1"
              value={props.opacity ?? 1}
              defaultValue={1}
              min={0}
              max={1}
              step={0.01}
              slider
              onChange={(value) =>
                setProps((prev) => ({ ...prev, opacity: value }))
              }
            />
          </div>
          <div className="rounded-md border border-neutral-700 p-2 space-y-3">
            <h3 className="text-xs font-semibold text-neutral-200">Capa 2</h3>
            <NumberField id="layer2-speed" label="Velocidad de capa 2" value={secondary?.speed ?? defaultAnimationProps.speed} defaultValue={defaultAnimationProps.speed} min={0.2} max={3} step={0.05} unit="×" onChange={(speed) => updateSecondary({ speed })} />
            <label htmlFor="layer2-text" className="text-xs text-neutral-300">
              Texto de capa 2
            </label>
            <textarea
              id="layer2-text"
              value={secondary?.text ?? "DEPTH"}
              onChange={(event) =>
                updateSecondary({ text: event.target.value })
              }
              rows={2}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 p-2 text-sm text-neutral-100"
            />
            <label htmlFor="layer2-font" className="text-xs text-neutral-300">
              Fuente de capa 2
            </label>
            <select
              id="layer2-font"
              value={secondary?.fontFamily ?? "Montserrat"}
              onChange={(event) =>
                updateSecondary({ fontFamily: event.target.value })
              }
              className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100"
            >
              {fonts.map((font) => (
                <option key={font}>{font}</option>
              ))}
            </select>
            <NumberField
              id="layer2-size"
              defaultValue={120}
              label="Tamaño de capa 2"
              value={secondary?.fontSize ?? 120}
              min={8}
              max={2048}
              step={1}
              unit="px"
              slider
              onChange={(value) => updateSecondary({ fontSize: value })}
            />
            <NumberField
              id="layer2-position-x"
              label="Posición X de capa 2"
              value={secondary?.positionX ?? 0}
              defaultValue={0}
              min={-1000}
              max={1000}
              step={1}
              unit="px"
              slider
              onChange={(value) => updateSecondary({ positionX: value })}
            />
            <NumberField
              id="layer2-position-y"
              label="Posición Y de capa 2"
              value={secondary?.positionY ?? 0}
              defaultValue={0}
              min={-1000}
              max={1000}
              step={1}
              unit="px"
              slider
              onChange={(value) => updateSecondary({ positionY: value })}
            />
            <NumberField
              id="layer2-opacity"
              label="Opacidad de capa 2"
              value={secondary?.opacity ?? 0.45}
              defaultValue={0.45}
              min={0}
              max={1}
              step={0.01}
              slider
              onChange={(value) => updateSecondary({ opacity: value })}
            />
            <ColorField
              id="layer2-color"
              label="Color de capa 2"
              value={secondary?.color ?? "#8b5cf6"}
              defaultValue="#8b5cf6"
              onChange={(value) => updateSecondary({ color: value })}
            />
            <label className="flex min-h-9 items-center gap-2 text-sm text-neutral-200">
              <input
                type="checkbox"
                checked={secondary?.enableFill ?? true}
                onChange={(event) =>
                  updateSecondary({ enableFill: event.target.checked })
                }
              />{" "}
              Relleno capa 2
            </label>
            <label className="flex min-h-9 items-center gap-2 text-sm text-neutral-200">
              <input
                type="checkbox"
                checked={secondary?.enableBorder ?? false}
                onChange={(event) =>
                  updateSecondary({ enableBorder: event.target.checked })
                }
              />{" "}
              Borde capa 2
            </label>
            <label className="flex min-h-9 items-center gap-2 text-sm text-neutral-200">
              <input
                type="checkbox"
                checked={secondary?.enableShadow ?? false}
                onChange={(event) =>
                  updateSecondary({ enableShadow: event.target.checked })
                }
              />{" "}
              Sombra capa 2
            </label>
          </div>
        </section>
      ) : null}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-100">Tipografía</h2>
        <label htmlFor="font-family" className="text-xs text-neutral-300">
          Familia tipográfica
        </label>
        <select
          id="font-family"
          value={props.fontFamily}
          onChange={(event) =>
            setProps((prev) => ({ ...prev, fontFamily: event.target.value }))
          }
          className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100"
        >
          {fonts.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
        <NumberField
          id="basic-font-size"
          defaultValue={120}
          label="Tamaño de texto"
          value={props.fontSize}
          min={8}
          max={2048}
          step={1}
          unit="px"
          slider
          onChange={(fontSize) => setProps((prev) => ({ ...prev, fontSize }))}
        />
        <NumberField
          id="text-effect-speed"
          label="Velocidad del efecto"
          value={props.speed}
          defaultValue={1}
          min={0.2}
          max={3}
          step={0.05}
          unit="×"
          slider
          onChange={(speed) => setProps((prev) => ({ ...prev, speed }))}
        />
        {isDual ? <ColorField id="layer1-color" label="Color de capa 1" value={props.inkStampColor} defaultValue="#ff593c" onChange={(inkStampColor) => setProps((prev) => ({ ...prev, inkStampColor }))} /> : !isInkStamp ? <ColorField id="basic-color" label="Color" value={props.color} defaultValue="#ffffff" onChange={(color) => setProps((prev) => ({ ...prev, color }))} /> : null}
      </section>
      {!isDual ? <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-100">Posición original</h2>
        <p className="text-xs text-neutral-500">Desplaza el texto desde el centro del lienzo. Doble clic en un control restaura su valor.</p>
        <NumberField id="text-position-x" label="Posición X" value={props.textPositionX ?? 0} defaultValue={0} min={-100} max={100} step={1} unit="%" slider onChange={(textPositionX) => setProps((prev) => ({ ...prev, textPositionX }))} />
        <NumberField id="text-position-y" label="Posición Y" value={props.textPositionY ?? 0} defaultValue={0} min={-100} max={100} step={1} unit="%" slider onChange={(textPositionY) => setProps((prev) => ({ ...prev, textPositionY }))} />
      </section> : null}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-100">Apariencia</h2>
        {hidesGlobalAppearance ? <p className="text-xs text-neutral-500">Esta plantilla define su propia apariencia visual.</p> : null}
        {!hidesGlobalAppearance ? <>
        {props.textRangeStyles.length > 0 ? (
          <div className="rounded-md border border-amber-700/60 bg-amber-950/30 p-2 text-xs text-amber-200">
            <p>
              Hay estilos por palabra que sobrescriben el relleno y el borde de
              esta plantilla.
            </p>
            <p className="mt-1 text-amber-300/80">
              Quitarlos aplica la apariencia base de esta plantilla; no iguala
              sus valores con otras plantillas.
            </p>
            <button
              type="button"
              className="mt-2 h-9 rounded-md border border-amber-600/70 px-2 text-amber-100"
              onClick={() =>
                setProps((prev) => ({ ...prev, textRangeStyles: [] }))
              }
            >
              Quitar estilos por palabra
            </button>
          </div>
        ) : null}
        <label
          htmlFor="fill-toggle"
          className="flex min-h-9 items-center gap-2 text-sm text-neutral-200"
        >
          <input
            id="fill-toggle"
            type="checkbox"
            checked={props.enableFill}
            onChange={(event) =>
              setProps((prev) => ({
                ...prev,
                enableFill: event.target.checked,
              }))
            }
          />{" "}
          Relleno
        </label>
        <label className="flex min-h-9 items-center gap-2 text-sm text-neutral-200">
          <input
            type="checkbox"
            checked={props.enableBorder}
            onChange={(event) =>
              setProps((prev) => ({
                ...prev,
                enableBorder: event.target.checked,
              }))
            }
          />{" "}
          Borde
        </label>
        {props.enableBorder ? (
          <ColorField
            id="border-color"
            label="Color del borde"
            value={props.borderColor}
            defaultValue="#ffffff"
            onChange={(borderColor) =>
              setProps((prev) => ({ ...prev, borderColor }))
            }
          />
        ) : null}
        <label className="flex min-h-9 items-center gap-2 text-sm text-neutral-200">
          <input
            type="checkbox"
            checked={props.enableShadow}
            onChange={(event) =>
              setProps((prev) => ({
                ...prev,
                enableShadow: event.target.checked,
              }))
            }
          />{" "}
          Sombra (combinable con Borde)
        </label>
        {props.enableShadow ? (
          <ColorField
            id="shadow-color"
            label="Color de sombra"
            value={props.shadowColor}
            defaultValue="#000000"
            onChange={(shadowColor) =>
              setProps((prev) => ({ ...prev, shadowColor }))
            }
          />
         ) : null}
         </> : null}
       </section>
       {props.animationStyle === "typewriter" ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-100">
            Escritura y cursor
          </h2>
          <NumberField
            id="typewriter-cps"
            label="Caracteres por segundo"
            value={props.typewriterCharactersPerSecond ?? 15}
            min={1}
            max={60}
            step={1}
            unit="car/s"
            defaultValue={15}
            slider
            help="Controla la velocidad con la que aparece el texto."
            onChange={(value) =>
              setProps((prev) => ({
                ...prev,
                typewriterCharactersPerSecond: value,
              }))
            }
          />
          <label className="flex min-h-9 items-center gap-2 text-sm text-neutral-200">
            <input
              type="checkbox"
              checked={props.typewriterShowCursor ?? true}
              onChange={(event) =>
                setProps((prev) => ({
                  ...prev,
                  typewriterShowCursor: event.target.checked,
                }))
              }
            />{" "}
            Mostrar cursor
          </label>
          <label
            htmlFor="typewriter-cursor-style"
            className="text-xs text-neutral-300"
          >
            Estilo del cursor
          </label>
          <select
            id="typewriter-cursor-style"
            value={props.typewriterCursorStyle ?? "bar"}
            onChange={(event) =>
              setProps((prev) => ({
                ...prev,
                typewriterCursorStyle: event.target
                  .value as typeof prev.typewriterCursorStyle,
              }))
            }
            className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100"
          >
            <option value="bar">Barra</option>
            <option value="underscore">Guion bajo</option>
            <option value="block">Bloque</option>
          </select>
          <label
            htmlFor="typewriter-cursor-after-end"
            className="text-xs text-neutral-300"
          >
            Cursor al terminar
          </label>
          <select
            id="typewriter-cursor-after-end"
            value={props.typewriterCursorAfterEnd ?? "blink"}
            onChange={(event) =>
              setProps((prev) => ({
                ...prev,
                typewriterCursorAfterEnd: event.target
                  .value as typeof prev.typewriterCursorAfterEnd,
              }))
            }
            className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100"
          >
            <option value="blink">Seguir parpadeando</option>
            <option value="hide">Ocultar</option>
            <option value="hold">Mantener visible</option>
           </select>
         </section>
       ) : null}
      {props.animationStyle === "word-highlight-tracker" ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-100">
            Resaltado por palabra
          </h2>
          <NumberField
            id="word-highlight-seconds"
            label="Tiempo por palabra"
            value={props.wordHighlightSeconds ?? 0.4}
            min={0.1}
            max={2}
            step={0.05}
            unit="s"
            defaultValue={0.4}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, wordHighlightSeconds: value }))
            }
          />
          <NumberField
            id="word-highlight-radius"
            label="Redondeo"
            value={props.wordHighlightCornerRadiusPx ?? 12}
            min={0}
            max={40}
            step={1}
            unit="px"
            defaultValue={12}
            slider
            onChange={(value) =>
              setProps((prev) => ({
                ...prev,
                wordHighlightCornerRadiusPx: value,
              }))
            }
          />
        </section>
      ) : null}
      {props.animationStyle === "paper-cutout-assemble" ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-100">
            Recortes de papel
          </h2>
          <ColorField
            id="paper-cutout-color"
            label="Color del papel"
            value={props.paperCutoutColor ?? "#fff1cf"}
            defaultValue="#fff1cf"
            onChange={(value) =>
              setProps((prev) => ({ ...prev, paperCutoutColor: value }))
            }
          />
          <ColorField
            id="paper-cutout-ink"
            label="Color de la tinta"
            value={props.paperCutoutInkColor ?? "#202020"}
            defaultValue="#202020"
            onChange={(value) =>
              setProps((prev) => ({ ...prev, paperCutoutInkColor: value }))
            }
          />
          <NumberField
            id="paper-cutout-delay"
            label="Retraso entre palabras"
            value={props.paperCutoutWordDelayFrames ?? 4}
            min={0}
            max={15}
            step={1}
            unit="frames"
            defaultValue={4}
            slider
            onChange={(value) =>
              setProps((prev) => ({
                ...prev,
                paperCutoutWordDelayFrames: value,
              }))
            }
          />
          <NumberField
            id="paper-cutout-settle"
            label="Asentamiento"
            value={props.paperCutoutSettleFrames ?? 12}
            min={6}
            max={30}
            step={1}
            unit="frames"
            defaultValue={12}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, paperCutoutSettleFrames: value }))
            }
          />
          <NumberField
            id="paper-cutout-padding"
            label="Margen del recorte"
            value={props.paperCutoutPaddingPx ?? 12}
            min={4}
            max={30}
            step={1}
            unit="px"
            defaultValue={12}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, paperCutoutPaddingPx: value }))
            }
          />
          <NumberField
            id="paper-cutout-shadow"
            label="Opacidad de sombra"
            value={props.paperCutoutShadowOpacity ?? 0.18}
            min={0}
            max={0.4}
            step={0.02}
            defaultValue={0.18}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, paperCutoutShadowOpacity: value }))
            }
          />
          <NumberField
            id="paper-cutout-float-amplitude"
            label="Intensidad de levitación"
            value={props.paperCutoutFloatAmplitudePx ?? 48}
            min={0}
            max={96}
            step={1}
            unit="px"
            defaultValue={48}
            slider
            onChange={(value) =>
              setProps((prev) => ({
                ...prev,
                paperCutoutFloatAmplitudePx: value,
              }))
            }
          />
          <NumberField
            id="paper-cutout-float-speed"
            label="Velocidad de levitación"
            value={props.paperCutoutFloatSpeed ?? 1}
            min={0}
            max={6}
            step={0.1}
            unit="x"
            defaultValue={1}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, paperCutoutFloatSpeed: value }))
            }
          />
          <label
            htmlFor="paper-cutout-seed"
            className="text-xs text-neutral-300"
          >
            Semilla
          </label>
          <input
            id="paper-cutout-seed"
            value={props.paperCutoutSeed ?? "paper-cutout-assemble-1"}
            onChange={(event) =>
              setProps((prev) => ({
                ...prev,
                paperCutoutSeed: event.target.value,
              }))
            }
            className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100"
          />
        </section>
      ) : null}
      {props.animationStyle === "ink-stamp-print" ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-100">
            Sello de tinta
          </h2>
          <ColorField
            id="ink-stamp-color"
            label="Color de tinta"
            value={props.inkStampColor ?? "#ff593c"}
            defaultValue="#ff593c"
            onChange={(value) =>
              setProps((prev) => ({ ...prev, inkStampColor: value }))
            }
          />
          <NumberField
            id="ink-stamp-frames"
            label="Duración del sello"
            value={props.inkStampFrames ?? 6}
            min={3}
            max={60}
            step={1}
            unit="frames"
            defaultValue={6}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, inkStampFrames: value }))
            }
          />
          <NumberField
            id="ink-stamp-coverage"
            label="Cobertura"
            value={props.inkStampCoverage ?? 0.9}
            min={0}
            max={1}
            step={0.01}
            defaultValue={0.9}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, inkStampCoverage: value }))
            }
          />
          <NumberField
            id="ink-stamp-roughness"
            label="Imperfección"
            value={props.inkStampRoughness ?? 0.35}
            min={0}
            max={3}
            step={0.05}
            defaultValue={0.35}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, inkStampRoughness: value }))
            }
          />
          <NumberField
            id="ink-stamp-pressure"
            label="Intensidad del sello"
            value={props.inkStampPressure ?? 1.5}
            min={0}
            max={6}
            step={0.05}
            defaultValue={1.5}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, inkStampPressure: value }))
            }
          />
          <NumberField
            id="ink-stamp-angle"
            label="Inclinación inicial"
            value={props.inkStampInitialAngle ?? 18}
            min={0}
            max={90}
            step={1}
            unit="°"
            defaultValue={18}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, inkStampInitialAngle: value }))
            }
          />
          <NumberField
            id="ink-stamp-start-scale"
            label="Tamaño inicial"
            value={props.inkStampStartScale ?? 0.45}
            min={0.05}
            max={6}
            step={0.05}
            unit="x"
            defaultValue={0.45}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, inkStampStartScale: value }))
            }
          />
          <NumberField
            id="ink-stamp-end-scale"
            label="Tamaño final"
            value={props.inkStampEndScale ?? 1}
            min={0.05}
            max={6}
            step={0.05}
            unit="x"
            defaultValue={1}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, inkStampEndScale: value }))
            }
          />
          <NumberField
            id="ink-stamp-float-amplitude"
            label="Amplitud de levitación"
            value={props.inkStampFloatAmplitudePx ?? 24}
            min={0}
            max={120}
            step={1}
            unit="px"
            defaultValue={24}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, inkStampFloatAmplitudePx: value, inkStampFloatAmplitude: value }))
            }
          />
          <NumberField
            id="ink-stamp-float-speed"
            label="Velocidad de levitación"
            value={props.inkStampFloatSpeed ?? 1}
            min={0}
            max={6}
            step={0.1}
            unit="x"
            defaultValue={1}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, inkStampFloatSpeed: value }))
            }
          />
          <label htmlFor="ink-stamp-seed" className="text-xs text-neutral-300">
            Semilla
          </label>
          <input
            id="ink-stamp-seed"
            value={props.inkStampSeed ?? "ink-stamp-print-1"}
            onChange={(event) =>
              setProps((prev) => ({
                ...prev,
                inkStampSeed: event.target.value,
              }))
            }
            className="h-9 w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-100"
          />
        </section>
      ) : null}
      {props.animationStyle === "variable-weight-wave" ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-100">
            Onda de peso tipográfico
          </h2>
          <NumberField
            id="variable-weight-base"
            label="Peso base"
            value={props.variableWeightBaseWeight ?? 400}
            min={100}
            max={700}
            step={50}
            defaultValue={400}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, variableWeightBaseWeight: value }))
            }
          />
          <NumberField
            id="variable-weight-peak"
            label="Peso máximo"
            value={props.variableWeightPeakWeight ?? 850}
            min={400}
            max={900}
            step={50}
            defaultValue={850}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, variableWeightPeakWeight: value }))
            }
          />
          <NumberField
            id="variable-weight-width"
            label="Ancho de onda"
            value={props.variableWeightWaveWidth ?? 3}
            min={1}
            max={8}
            step={0.5}
            unit="letras"
            defaultValue={3}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, variableWeightWaveWidth: value }))
            }
          />
          <NumberField
            id="variable-weight-cycle"
            label="Duración del ciclo"
            value={props.variableWeightCycleSeconds ?? 2.4}
            min={1}
            max={6}
            step={0.1}
            unit="s"
            defaultValue={2.4}
            slider
            onChange={(value) =>
              setProps((prev) => ({
                ...prev,
                variableWeightCycleSeconds: value,
              }))
            }
          />
        </section>
      ) : null}
      {props.animationStyle === "glyph-tile-assemble" ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-100">
            Mosaico de glifos
          </h2>
          <NumberField
            id="glyph-tile-size"
            label="Tamaño de fragmento"
            value={props.glyphTileSizePx ?? 20}
            min={8}
            max={48}
            step={2}
            unit="px"
            defaultValue={20}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, glyphTileSizePx: value }))
            }
          />
          <NumberField
            id="glyph-tile-scatter"
            label="Dispersión"
            value={props.glyphTileScatterPx ?? 100}
            min={0}
            max={240}
            step={5}
            unit="px"
            defaultValue={100}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, glyphTileScatterPx: value }))
            }
          />
          <NumberField
            id="glyph-tile-assembly"
            label="Duración de ensamblaje"
            value={props.glyphTileAssemblySeconds ?? 0.8}
            min={0.2}
            max={2}
            step={0.05}
            unit="s"
            defaultValue={0.8}
            slider
            onChange={(value) =>
              setProps((prev) => ({ ...prev, glyphTileAssemblySeconds: value }))
            }
          />
        </section>
      ) : null}
    </div>
  );
}
