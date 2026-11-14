# Rescate de características de TEXT ANIMATION_OPTIMIZACION — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Incorporar en la versión actual la captura PNG del fotograma pausado, la plantilla `Tres Líneas + Marco`, diagnósticos y control GPU útiles, y un módulo de subtítulos corregido, sin recuperar animaciones BNCR ni alterar el render de vídeo de una sola pasada.

**Architecture:** La versión actual sigue siendo la autoridad. Cada característica se reimplementa sobre sus contratos, estado, Inspector, exportación, pruebas y empaquetado actuales; el árbol `TEXT ANIMATION_OPTIMIZACION` se usa únicamente como fuente de comportamiento y algoritmos. El vídeo normal y el vídeo subtitulado se generan con una única llamada final a `renderMedia`; no se permite crear un vídeo intermedio para volver a codificarlo.

**Tech Stack:** Next.js 14, React 18, TypeScript, Remotion 4.0.520, Electron 35, Vitest, Testing Library, WebGL/Chromium GPU y FFmpeg/NVENC cuando esté disponible.

## Global Constraints

- Proyecto canónico: `K:/ANTIGRAVITY/HABILIDADES/TEXT ANIMATION`.
- Fuente de rescate: `K:/ANTIGRAVITY/HABILIDADES/TEXT ANIMATION_OPTIMIZACION`.
- No copiar ni registrar `BncrLogoEffect`, recursos BNCR, tipos BNCR ni controles BNCR.
- No sustituir la API, autoridad compartida ni máquina de estados de exportación actuales.
- Render de vídeo normal: exactamente una llamada efectiva a `renderMedia` por archivo.
- Render de vídeo subtitulado: exactamente una llamada efectiva a `renderMedia` por archivo; el vídeo fuente se compone con los subtítulos dentro de esa llamada.
- `renderFrames` se admite solamente para producir una imagen PNG; nunca como primera etapa de un vídeo.
- Mantener exclusión mutua, cancelación, errores, nombres finales, `delivery` y guardado del flujo F5 actual.
- La GPU es una optimización con diagnóstico y fallback; nunca debe cambiar el resultado visual determinista.
- Todos los controles numéricos nuevos deben usar `NumberField` con `slider`.
- Todo control de color nuevo debe usar `ColorField`.
- Doble clic en sliders debe restaurar el default mediante el comportamiento canónico de `NumberField`.
- La plantilla nueva debe respetar posición global X/Y, tipografía instalada, relleno, borde, sombra y duración actuales.
- Los subtítulos no deben depender obligatoriamente de una API remota: SRT/JSON/manual deben funcionar sin clave.
- No introducir secretos en el cliente, presets ni persistencia.
- No borrar archivos del árbol antiguo durante el rescate.
- Cada tarea termina con pruebas dirigidas y un commit independiente cuando exista repositorio Git; este workspace actualmente no contiene `.git`, por lo que se debe registrar “commit omitido: workspace sin repositorio” hasta que exista uno.

---

## Mapa de archivos

### Captura PNG

- Crear `src/lib/editor/stillExport.ts`: contrato y normalización del fotograma solicitado.
- Modificar `src/lib/hooks/useRenderExport.ts`: operación pública de PNG dentro de la autoridad F5.
- Modificar `src/app/api/render/route.ts`: rama de una sola imagen con `renderFrames`.
- Modificar `src/components/PreviewContainer.tsx`: publicar el frame actual sin capturar el DOM.
- Modificar `src/components/inspector/InspectorPanelLegacy.tsx`: opción y acción visibles en Exportar.
- Modificar `electron/main.cjs` y `electron/preload.cjs` solo si el contrato actual de guardado no admite `.png`.
- Crear `tests/editor/still-export.test.ts` y `tests/editor/still-export-integration.test.tsx`.

### Tres Líneas + Marco

- Crear `src/remotion/templates/MultiLineFrameEffect.tsx` adaptado a los tipos actuales.
- Modificar `src/lib/types/animation.ts`, `src/lib/AnimationContext.tsx`, `src/lib/editor/catalog.ts`, `src/lib/editor/selection.ts`, `src/lib/editor/templateControlContracts.ts`, `src/remotion/templates/registry.ts` y `src/remotion/MainComposition.tsx`.
- Crear `src/components/inspector/templates/MultiLineFrameControls.tsx` para evitar ampliar aún más `TextBasicTab.tsx`.
- Modificar `src/components/inspector/tabs/TextBasicTab.tsx` para montar ese panel únicamente con la plantilla activa.
- Crear `tests/editor/multi-line-frame.test.tsx` y `tests/editor/multi-line-frame-render.test.tsx`.

### GPU

- Crear `src/lib/render/gpuDiagnostics.ts` y `src/lib/render/renderAttempts.ts` para separar detección, política y fallback.
- Modificar `src/app/api/render/route.ts`, `src/lib/hooks/useRenderExport.ts`, `src/components/inspector/InspectorPanelLegacy.tsx`, `electron/main.cjs` y `electron/preload.cjs`.
- Crear `tests/editor/gpu-render-policy.test.ts` y `tests/editor/gpu-render-integration.test.ts`.

### Subtítulos

- Crear `src/lib/subtitles/types.ts`, `validation.ts`, `segmentation.ts`, `presets.ts` y `mediaPaths.ts`.
- Crear `src/components/subtitles/AutoSubtitlesTool.tsx`, `SubtitlePreview.tsx`, `SubtitleCueEditor.tsx` y `SubtitlePresetPicker.tsx`.
- Crear `src/app/api/subtitles/upload/route.ts` y `transcribe/route.ts`.
- Crear `src/remotion/CaptionedVideoComposition.tsx` y registrarla en `src/remotion/Root.tsx`.
- Crear `src/lib/render/renderCaptionedVideo.ts`; no crear un segundo pipeline autónomo que duplique la política de render.
- Crear `src/app/api/subtitles/render/route.ts` como adaptador del servicio compartido.
- Modificar `src/app/page.tsx` para alternar entre Animación y Subtítulos.
- Crear `tests/editor/subtitle-segmentation.test.ts`, `subtitle-validation.test.ts`, `subtitle-upload.test.ts`, `subtitle-transcription.test.ts`, `subtitle-composition.test.tsx`, `subtitle-ui.test.tsx` y `subtitle-render.test.ts`.

---

### Task 1: Congelar contratos y baseline

**Files:**
- Create: `docs/qa/rescue-optimization-baseline.md`
- Test: `tests/editor/render-single-pass-contract.test.ts`

**Interfaces:**
- Consumes: `POST` actual de `src/app/api/render/route.ts` y `useRenderExport`.
- Produces: contrato probado de una sola llamada efectiva a `renderMedia` por vídeo.

- [ ] **Step 1: Documentar el baseline sin copiar código antiguo**

Registrar versiones, número actual de tests, comandos verdes y el comportamiento de exportación individual, batch, guardado y GPU. Anotar explícitamente que `TEXT ANIMATION_OPTIMIZACION` no es autoridad.

- [ ] **Step 2: Escribir la prueba de una sola pasada**

```ts
it('renderiza cada video en una sola llamada efectiva a renderMedia', async () => {
  const renderMedia = vi.fn().mockResolvedValue(undefined);
  const response = await invokeCurrentRenderRoute({renderMedia}, validVideoRequest());
  expect(response.status).toBe(200);
  expect(renderMedia).toHaveBeenCalledTimes(1);
});
```

Añadir variante batch que exija una llamada por elemento, no dos llamadas por elemento.

- [ ] **Step 3: Ejecutar baseline**

Run: `npm run test:editor -- tests/editor/render-single-pass-contract.test.ts tests/editor/export-orchestration.test.ts tests/editor/batch-orchestration.test.ts`

Expected: PASS sin cambios funcionales.

- [ ] **Step 4: Gate P01**

No continuar si la versión actual ya realiza dos renders por archivo; diagnosticar y corregir ese baseline antes de rescatar nada.

---

### Task 2: Contrato de captura PNG del fotograma pausado

**Files:**
- Create: `src/lib/editor/stillExport.ts`
- Modify: `src/lib/AnimationContext.tsx`
- Modify: `src/components/PreviewContainer.tsx`
- Test: `tests/editor/still-export.test.ts`

**Interfaces:**
- Produces: `StillExportRequest { frame: number; transparent: true }` y `normalizeStillFrame(frame, durationInFrames): number`.
- Produces desde contexto: `setPreviewFrame(frame: number)` y `getPreviewFrame(): number`.

- [ ] **Step 1: Escribir pruebas de normalización**

```ts
expect(normalizeStillFrame(17.6, 120)).toBe(18);
expect(normalizeStillFrame(-4, 120)).toBe(0);
expect(normalizeStillFrame(999, 120)).toBe(119);
expect(normalizeStillFrame(Number.NaN, 120)).toBe(119);
```

- [ ] **Step 2: Implementar contrato mínimo**

```ts
export type StillExportRequest = {frame: number; transparent: true};
export const normalizeStillFrame = (frame: number, duration: number) =>
  Number.isFinite(frame)
    ? Math.max(0, Math.min(Math.max(0, duration - 1), Math.round(frame)))
    : Math.max(0, duration - 1);
```

- [ ] **Step 3: Sincronizar Preview con el contexto**

Usar `frameupdate`, `seeked` y `player.getCurrentFrame()` como en la versión antigua. Limpiar listeners al desmontar. No usar screenshot del canvas, `toDataURL` ni DOM rasterization.

- [ ] **Step 4: Ejecutar prueba dirigida**

Run: `npm run test:editor -- tests/editor/still-export.test.ts`

Expected: PASS.

---

### Task 3: Render y guardado PNG mediante la exportación actual

**Files:**
- Modify: `src/app/api/render/route.ts`
- Modify: `src/lib/hooks/useRenderExport.ts`
- Modify: `src/lib/editor/exportOrchestration.ts`
- Modify: `src/lib/editor/exportFilesystem.ts`
- Modify if required: `electron/main.cjs`
- Modify if required: `electron/preload.cjs`
- Test: `tests/editor/still-export-integration.test.tsx`

**Interfaces:**
- Consumes: `StillExportRequest`.
- Produces: `{ outputKind: 'png-still'; fileName; delivery; frame; url? }`.

- [ ] **Step 1: Escribir prueba API fallida**

Mockear `renderFrames` y demostrar que una solicitud PNG:

```ts
expect(renderFrames).toHaveBeenCalledWith(expect.objectContaining({
  imageFormat: 'png',
  frameRange: [42, 42],
}));
expect(renderMedia).not.toHaveBeenCalled();
```

- [ ] **Step 2: Implementar la rama PNG**

Aceptar `outputProfile: 'png-paused-frame-alpha'` y `pngFrame`. Generar exactamente un archivo con patrón `TextAnim_frame_[frame].[ext]`; devolver nombre real y delivery. No llamar `renderMedia` en esta rama.

- [ ] **Step 3: Integrar autoridad compartida**

El click de PNG debe adquirir el mismo lock de F5. Mientras escribe, bloquear individual, batch, guardar resultados anteriores y una segunda captura PNG. Liberar en success, cancel y failure.

- [ ] **Step 4: Integrar guardado web y Electron**

En Electron, usar el selector de guardado actual con filtro PNG. En navegador compatible, usar File System Access; como fallback, emitir descarga solicitada con nombre `.png`. No pedir una carpeta para una sola imagen.

- [ ] **Step 5: Escribir integración UI real**

```ts
it('exporta el frame pausado y conserva el lock compartido hasta terminar la escritura', async () => {
  // Providers reales, Inspector real y Preview/frame authority real.
  // Click real, renderFrames pendiente, exclusión de acciones y liberación final.
});
```

- [ ] **Step 6: Ejecutar gate P02**

Run: `npm run test:editor -- tests/editor/still-export.test.ts tests/editor/still-export-integration.test.tsx tests/editor/export-orchestration.test.ts tests/editor/export-filesystem.test.ts`

Expected: todos PASS y la prueba de una sola pasada de Task 1 permanece PASS.

---

### Task 4: UI de captura PNG

**Files:**
- Modify: `src/components/inspector/InspectorPanelLegacy.tsx`
- Test: `tests/editor/still-export-integration.test.tsx`

**Interfaces:**
- Consumes: `getPreviewFrame()` y operación PNG de `useRenderExport`.

- [ ] **Step 1: Añadir perfil y texto inequívocos**

Usar etiqueta `PNG transparente del fotograma actual` y ayuda `Pausa o mueve la línea de tiempo y exporta exactamente ese fotograma`. Evitar los nombres antiguos `PNG Final` y `png-last-frame-alpha`.

- [ ] **Step 2: Añadir aserciones accesibles**

Probar nombre accesible, frame enviado, estado busy, éxito, cancelación, error y restauración del botón.

- [ ] **Step 3: Gate manual P03**

En 16:9 y 9:16, pausar en tres frames distintos y comprobar que cada PNG coincide con el Preview, conserva transparencia y resolución seleccionada.

---

### Task 5: Tipos, defaults y catálogo de Tres Líneas + Marco

**Files:**
- Modify: `src/lib/types/animation.ts`
- Modify: `src/lib/AnimationContext.tsx`
- Modify: `src/lib/editor/catalog.ts`
- Modify: `src/lib/editor/selection.ts`
- Modify: `src/lib/editor/templateControlContracts.ts`
- Test: `tests/editor/multi-line-frame.test.tsx`

**Interfaces:**
- Produces: `animationStyle: 'multi-line-frame'`.
- Produces: `MultiLineFrameProps` con `multiLineFrameStart`, `multiLineFrameDuration`, `multiLineFrameSpeed`, `multiLineFrameColor`, `multiLineFrameStrokeWidth`, `multiLineFrameRadius`, `multiLineFrameExpandX`, `multiLineFrameExpandY`, `multiLineFrameCrossFirstLine`, `multiLineFrameTopOverlap`, `multiLineFrameGapPadding`, `multiLineFrameDrawDirection` y `multiLineFrameAnchorLine`.

- [ ] **Step 1: Escribir prueba de catálogo/defaults**

Exigir que la plantilla aparezca al final del catálogo por antigüedad, se seleccione y reciba defaults canónicos. Exigir que no aparezca ningún identificador BNCR nuevo.

- [ ] **Step 2: Añadir tipos y defaults adaptados**

Partir de los defaults antiguos comprobados: inicio `0.15`, duración `0.85`, velocidad `1`, color `#b8c400`, grosor `4`, radio `18`, expansión X `34`, expansión Y `24`, cruce `false`, solapamiento `0.48`, padding `0`, dirección `counterclockwise`, ancla `1`.

- [ ] **Step 3: Integrar selección, reset y persistencia**

Usar los mecanismos actuales de estado por plantilla, reset y presets. Probar selección A → modificar → B → volver a A, reset y preset save/load.

- [ ] **Step 4: Ejecutar gate P04**

Run: `npm run test:editor -- tests/editor/multi-line-frame.test.tsx tests/editor/catalog.test.ts tests/editor/template-contract.test.ts tests/editor/presets-and-tabs.test.tsx`

Expected: PASS.

---

### Task 6: Composición determinista de Tres Líneas + Marco

**Files:**
- Create: `src/remotion/templates/MultiLineFrameEffect.tsx`
- Modify: `src/remotion/templates/registry.ts`
- Modify: `src/remotion/MainComposition.tsx`
- Test: `tests/editor/multi-line-frame-render.test.tsx`

**Interfaces:**
- Consumes: `AnimationProps & MultiLineFrameProps`.
- Produces: componente registrado bajo `multi-line-frame`.

- [ ] **Step 1: Portar solamente el algoritmo visual**

Conservar división de hasta tres líneas, medición determinista, trazado SVG progresivo, hueco de la línea ancla y dirección horaria/antihoraria. Reemplazar cualquier dependencia del estado antiguo por `AnimationProps` actual.

- [ ] **Step 2: Aplicar contratos globales actuales**

La composición debe obedecer `text`, fuente instalada, `fontSize`, colores, relleno, borde, sombra, opacidad, X/Y, aspect ratio, resolución, velocidad y duración. El marco usa su color/grosor/radio propios.

- [ ] **Step 3: Escalar correctamente**

Escalar grosor, radio, expansión y padding con el factor canónico de `MainComposition`; no mutar props ni asumir 1920×1080.

- [ ] **Step 4: Pruebas visuales estructurales**

Probar 1, 2 y 3 líneas; 16:9, 9:16 y 1:1; ambas direcciones; línea ancla 1–3; frame inicial, medio y final; texto Unicode completo.

- [ ] **Step 5: Gate P05**

Run: `npm run test:editor -- tests/editor/multi-line-frame-render.test.tsx tests/editor/template-control-contracts.test.ts`

Expected: PASS y sin timers, aleatoriedad no sembrada ni transiciones CSS.

---

### Task 7: Inspector de Tres Líneas + Marco

**Files:**
- Create: `src/components/inspector/templates/MultiLineFrameControls.tsx`
- Modify: `src/components/inspector/tabs/TextBasicTab.tsx`
- Test: `tests/editor/multi-line-frame.test.tsx`

**Interfaces:**
- Consumes: props/defaults canónicos y `setProps`.

- [ ] **Step 1: Montar controles exclusivos**

Mostrar únicamente con `animationStyle === 'multi-line-frame'`: color, grosor, radio, expansión X/Y, inicio, duración, velocidad, cruce, solapamiento, padding, dirección y línea ancla.

- [ ] **Step 2: Cumplir controles globales**

Mantener visibles los controles globales de texto, incluidos X/Y. Cada número usa `NumberField slider`; color usa `ColorField`; enums usan select; cruce usa switch.

- [ ] **Step 3: Probar extremo a extremo**

Inspector real → modificar control → contexto real → `MultiLineFrameEffect` recibe valor; reset y preset restauran exactamente.

- [ ] **Step 4: Gate P06**

Run: `npm run test:editor -- tests/editor/multi-line-frame.test.tsx tests/editor/editor-integration.test.tsx`

Expected: PASS.

---

### Task 8: Política GPU sin cambiar el pipeline

**Files:**
- Create: `src/lib/render/gpuDiagnostics.ts`
- Create: `src/lib/render/renderAttempts.ts`
- Modify: `src/app/api/render/route.ts`
- Modify: `electron/main.cjs`
- Modify: `electron/preload.cjs`
- Test: `tests/editor/gpu-render-policy.test.ts`

**Interfaces:**
- Produces: `RenderPipelinePreference = 'auto' | 'gpu' | 'cpu'`.
- Produces: `buildRenderAttempts({preference, codec, transparent, platform})`.
- Produce diagnóstico serializable: `{renderMode, glBackend, encodeMode, gpuAvailable, fallbackUsed}`.

- [ ] **Step 1: Caracterizar la política actual**

Probar el orden real de intentos y NVENC actual antes de mover código. Mantener los backends que ya estén demostrados en Windows; no copiar a ciegas todos los antiguos.

- [ ] **Step 2: Extraer política pura**

`auto`: GPU render + NVENC compatible, GPU render + encoder estándar, CPU + encoder estándar. `gpu`: mismos intentos GPU y error explícito si todos fallan. `cpu`: solo CPU estándar.

- [ ] **Step 3: Mantener una sola llamada exitosa**

Los intentos fallidos pueden reintentar, pero una ejecución exitosa de vídeo contiene una sola llamada efectiva que produce el archivo final. Nunca renderizar frames intermedios para pasarlos a FFmpeg.

- [ ] **Step 4: Electron GPU**

Aplicar `ignore-gpu-blocklist` y `enable-gpu-rasterization` antes de `app.whenReady()`. Exponer diagnóstico de `app.getGPUFeatureStatus()` por preload sin exponer APIs arbitrarias.

- [ ] **Step 5: Gate P07**

Run: `npm run test:editor -- tests/editor/gpu-render-policy.test.ts tests/editor/gpu-render-integration.test.ts tests/editor/render-single-pass-contract.test.ts`

Expected: PASS; resultados visuales iguales entre GPU y CPU para frames de referencia.

---

### Task 9: UI y diagnóstico GPU

**Files:**
- Modify: `src/lib/hooks/useRenderExport.ts`
- Modify: `src/components/inspector/InspectorPanelLegacy.tsx`
- Test: `tests/editor/gpu-render-integration.test.ts`

**Interfaces:**
- Consumes: preferencia y diagnóstico de Task 8.

- [ ] **Step 1: Añadir selector Auto/GPU/CPU**

Default `auto`; persistencia JSON-safe; cambiarlo no modifica plantilla ni composición.

- [ ] **Step 2: Mostrar diagnóstico después de exportar**

Mostrar render GPU/CPU, backend, NVENC/estándar y si hubo fallback. No afirmar GPU basándose solo en que el usuario la eligió.

- [ ] **Step 3: Probar fallback y GPU estricta**

Probar auto GPU→CPU, GPU estricta sin fallback CPU, CPU sin flags GPU y ausencia de lock fantasma tras failure.

- [ ] **Step 4: Gate P08**

Run: `npm run test:editor -- tests/editor/gpu-render-policy.test.ts tests/editor/gpu-render-integration.test.ts tests/editor/export-state.test.ts`

Expected: PASS.

---

### Task 10: Núcleo seguro de subtítulos

**Files:**
- Create: `src/lib/subtitles/types.ts`
- Create: `src/lib/subtitles/validation.ts`
- Create: `src/lib/subtitles/segmentation.ts`
- Create: `src/lib/subtitles/presets.ts`
- Test: `tests/editor/subtitle-segmentation.test.ts`
- Test: `tests/editor/subtitle-validation.test.ts`

**Interfaces:**
- Produces: `SubtitleWord`, `SubtitleCue`, `SubtitlePreset`, `SubtitlePresetId`.
- Produces: `normalizeSubtitleCues`, `parseSrt`, `parseWhisperJson`, `distributePlainTextIntoCues`, `cuesToSrt`.

- [ ] **Step 1: Portar parsers con límites**

Validar `maxWords` entre 1 y 12, tiempos finitos/no negativos, `end > start`, orden cronológico, duración máxima del vídeo, texto no vacío, máximo de cues y máximo de caracteres.

- [ ] **Step 2: Corregir errores observados**

No aceptar `maxWords <= 0` porque produce un bucle infinito; normalizar milisegundos SRT con carry cuando redondeen a 1000; ordenar palabras; rechazar solapamientos inválidos o normalizarlos con una regla probada.

- [ ] **Step 3: Presets sin fuentes inexistentes**

Resolver cada familia mediante el catálogo de fuentes instaladas de la app y conservar fallback CSS. Mantener los cinco conceptos visuales antiguos, pero permitir personalización posterior.

- [ ] **Step 4: Pruebas exhaustivas**

Cubrir SRT CRLF/LF, coma/punto, bloques sin índice, Unicode, JSON por palabras, JSON por segmentos, texto plano, entradas vacías, tiempos invertidos, NaN, overlap, cue fuera de duración y round-trip SRT.

- [ ] **Step 5: Gate P09**

Run: `npm run test:editor -- tests/editor/subtitle-segmentation.test.ts tests/editor/subtitle-validation.test.ts`

Expected: PASS.

---

### Task 11: Ingesta y ciclo de vida del vídeo para subtítulos

**Files:**
- Create: `src/lib/subtitles/mediaPaths.ts`
- Create: `src/app/api/subtitles/upload/route.ts`
- Test: `tests/editor/subtitle-upload.test.ts`

**Interfaces:**
- Produces: `UploadedSubtitleVideo` con `id`, `storedName`, `previewUrl`, dimensiones, duración, FPS y aspect ratio; no devuelve ruta absoluta al navegador.

- [ ] **Step 1: Escribir pruebas de seguridad y límites**

Probar extensión/MIME, límite de tamaño configurable, nombre saneado, traversal, symlinks/reparse points, directorios con prefijo parecido y archivo inexistente.

- [ ] **Step 2: Corregir exposición de rutas**

El cliente recibe `id` y `storedName`, nunca `filePath`. El servidor resuelve el archivo por identificador dentro de `tmp/subtitle-videos` usando `path.relative`, no `startsWith`.

- [ ] **Step 3: Evitar lectura completa innecesaria**

Transmitir el upload a disco con límite; no convertir vídeos grandes completos a `Buffer` si el runtime permite streaming. Obtener metadata después de cerrar la escritura.

- [ ] **Step 4: Implementar limpieza**

Eliminar upload y outputs temporales al cancelar, tras expiración y al cerrar la app. Nunca borrar archivos elegidos por el usuario.

- [ ] **Step 5: Gate P10**

Run: `npm run test:editor -- tests/editor/subtitle-upload.test.ts`

Expected: PASS y ningún path absoluto en respuestas JSON.

---

### Task 12: Transcripción opcional y modo completamente local/manual

**Files:**
- Create: `src/app/api/subtitles/transcribe/route.ts`
- Modify: `src/lib/subtitles/validation.ts`
- Test: `tests/editor/subtitle-transcription.test.ts`

**Interfaces:**
- Consumes: `videoId`, idioma y `maxWords`.
- Produces: cues normalizados; error recuperable cuando no exista proveedor.

- [ ] **Step 1: Mantener tres entradas independientes**

SRT, Whisper JSON y texto manual deben funcionar sin red ni clave. “Transcribir automáticamente” es una acción opcional separada.

- [ ] **Step 2: Abstraer proveedor**

Definir `SubtitleTranscriber.transcribe(input): Promise<SubtitleWord[]>`. La implementación remota vive solo en servidor y lee la clave desde entorno. No persistir ni mostrar la clave.

- [ ] **Step 3: Manejar medios correctamente**

Enviar MIME real y nombre real saneado; si el proveedor no acepta el contenedor/tamaño, devolver un error accionable. No instalar un conversor o modelo local como sustitución silenciosa.

- [ ] **Step 4: Probar éxito y fallos**

Cubrir sin clave, timeout, 401, rate limit, respuesta sin timestamps, cancelación y éxito por palabras. Tras failure, importación SRT/manual sigue disponible.

- [ ] **Step 5: Gate P11**

Run: `npm run test:editor -- tests/editor/subtitle-transcription.test.ts tests/editor/subtitle-segmentation.test.ts`

Expected: PASS.

---

### Task 13: Composición Remotion determinista de subtítulos

**Files:**
- Create: `src/remotion/CaptionedVideoComposition.tsx`
- Modify: `src/remotion/Root.tsx`
- Test: `tests/editor/subtitle-composition.test.tsx`

**Interfaces:**
- Consumes: `CaptionedVideoProps { videoSrc; cues; style; lowerThirdMode }`.
- Produces: composición `CaptionedVideo` con metadata del vídeo fuente.

- [ ] **Step 1: Escribir pruebas por frame**

En frames antes/durante/después del cue, comprobar visibilidad; en timing por palabra, comprobar palabra activa exacta; en 9:16 y 16:9, comprobar safe zones.

- [ ] **Step 2: Portar composición sin transiciones CSS**

Reemplazar `transition: transform 90ms linear` por `interpolate()` o `spring()` dependiente de `useCurrentFrame()`. Toda animación debe producir el mismo resultado al renderizar frames fuera de orden.

- [ ] **Step 3: Corregir layout**

Aplicar límite real de líneas, wrapping determinista, zonas inferiores/derechas, `objectFit` configurable (`contain`/`cover`) y estilo editable. No imponer fondo negro cuando el vídeo no cubra el lienzo sin que el usuario lo elija.

- [ ] **Step 4: Soportar controles visuales**

Fuente instalada, tamaño, peso, color normal/activo, borde, grosor, sombra, fondo, opacidad, padding, radio, posición X/Y, ancho máximo, alineación, mayúsculas, highlight y pop/intensidad. Todos los números en UI serán sliders.

- [ ] **Step 5: Gate P12**

Run: `npm run test:editor -- tests/editor/subtitle-composition.test.tsx`

Expected: PASS, sin timers ni aleatoriedad no sembrada.

---

### Task 14: Editor y Preview de subtítulos

**Files:**
- Create: `src/components/subtitles/AutoSubtitlesTool.tsx`
- Create: `src/components/subtitles/SubtitlePreview.tsx`
- Create: `src/components/subtitles/SubtitleCueEditor.tsx`
- Create: `src/components/subtitles/SubtitlePresetPicker.tsx`
- Modify: `src/app/page.tsx`
- Test: `tests/editor/subtitle-ui.test.tsx`

**Interfaces:**
- Consumes: APIs y tipos de Tasks 10–13.

- [ ] **Step 1: Integrar modo separado**

Añadir navegación `Animación de texto | Subtítulos`. Entrar o salir no destruye el documento de animación ni sus presets.

- [ ] **Step 2: Flujo UI completo**

Seleccionar vídeo → importar/transcribir → editar cues y tiempos → elegir preset → personalizar → previsualizar → renderizar. Deshabilitar únicamente acciones incompatibles durante busy.

- [ ] **Step 3: Edición segura**

Validar tiempos al perder foco y antes de render; seleccionar cue busca el vídeo; mover el vídeo actualiza cue/palabra activa; eliminar último cue deja estado válido; no usar índices inestables como identidad.

- [ ] **Step 4: Accesibilidad**

Labels, foco visible, botones con nombres explícitos, errores `role=alert`, estado busy y navegación por teclado. No focus trap permanente.

- [ ] **Step 5: Pruebas UI reales**

Cubrir upload, SRT, texto manual, preset, edición, seek, validación, cancelación, error y preparación de render. Comprobar que el modo Animación conserva su estado.

- [ ] **Step 6: Gate P13**

Run: `npm run test:editor -- tests/editor/subtitle-ui.test.tsx tests/editor/editor-integration.test.tsx tests/editor/session-persistence.test.tsx`

Expected: PASS.

---

### Task 15: Render subtitulado de una sola pasada

**Files:**
- Create: `src/lib/render/renderCaptionedVideo.ts`
- Create: `src/app/api/subtitles/render/route.ts`
- Refactor: `src/app/api/render/route.ts`
- Test: `tests/editor/subtitle-render.test.ts`
- Test: `tests/editor/render-single-pass-contract.test.ts`

**Interfaces:**
- Consumes: política GPU compartida de Task 8 y `CaptionedVideoProps` validado.
- Produces: resultado F5 compatible con `delivery`, `fileName`, diagnóstico y estado.

- [ ] **Step 1: Extraer infraestructura compartida**

Compartir resolución del bundle, selección de composición, intentos GPU/CPU, rutas de salida y delivery. Mantener adaptadores HTTP separados, pero una sola implementación de política.

- [ ] **Step 2: Prueba crítica antes de implementar**

```ts
it('compone video fuente y subtitulos en una sola llamada a renderMedia', async () => {
  const renderMedia = vi.fn().mockResolvedValue(undefined);
  await renderCaptionedVideo(validCaptionRequest(), deps({renderMedia}));
  expect(renderMedia).toHaveBeenCalledTimes(1);
  expect(renderFrames).not.toHaveBeenCalled();
  expect(runFfmpegIntermediate).not.toHaveBeenCalled();
});
```

- [ ] **Step 3: Implementar render final**

`CaptionedVideo` usa `OffthreadVideo` con el archivo fuente y superpone subtítulos dentro de Remotion. La única salida es el MP4 final; no generar vídeo base ni archivo intermedio codificado.

- [ ] **Step 4: Integrar exclusión y guardado F5**

Render subtitulado usa el lock compartido. Mientras escribe, bloquear PNG, vídeo normal, batch y guardados anteriores. Liberar en success, cancel y failure.

- [ ] **Step 5: Pruebas de entrega**

Cubrir Electron written, navegador download-requested, cancelación del selector, failure de writer, nombre final y ausencia de lock fantasma.

- [ ] **Step 6: Gate P14**

Run: `npm run test:editor -- tests/editor/subtitle-render.test.ts tests/editor/render-single-pass-contract.test.ts tests/editor/export-state.test.ts tests/editor/export-filesystem.test.ts`

Expected: PASS y una sola llamada efectiva por vídeo.

---

### Task 16: Migración, empaquetado y limpieza controlada

**Files:**
- Modify: `src/lib/editor/persistence.ts`
- Modify: `electron/main.cjs`
- Modify: `electron/preload.cjs`
- Modify: `package.json`
- Test: `tests/editor/preset-migration.test.ts`
- Test: `tests/editor/desktop-package-config.test.ts`

**Interfaces:**
- Produces: persistencia compatible y recursos accesibles dentro del instalador.

- [ ] **Step 1: Versionar únicamente estado persistente necesario**

Añadir migración para `multi-line-frame`, preferencia GPU y estado editable de subtítulos si se decide persistir. Excluir File handles, Blob, streams, paths temporales y estado busy.

- [ ] **Step 2: Empaquetar Remotion y APIs**

Confirmar que standalone incluye rutas de subtítulos, composición, fuentes, assets y bundle requerido. No copiar `public/renders`, uploads ni temporales al instalador.

- [ ] **Step 3: Probar arranque instalado**

Verificar que Electron espera al servidor, abre la UI, detecta fuentes, carga vídeo, exporta PNG y renderiza un subtitulado sin depender del directorio fuente.

- [ ] **Step 4: Gate P15**

Run: `npm run test:editor -- tests/editor/preset-migration.test.ts tests/editor/persistence.test.ts tests/editor/desktop-package-config.test.ts`

Expected: PASS.

---

### Task 17: Suite terminal y documentación

**Files:**
- Create: `docs/qa/rescue-optimization-results.md`
- Modify: documentación de usuario existente de Exportar, plantillas, GPU y subtítulos.

**Interfaces:**
- Produces: evidencia terminal y checklist manual.

- [ ] **Step 1: Ejecutar suite completa**

Run: `npm run test:editor`

Expected: 100% PASS.

- [ ] **Step 2: TypeScript**

Run: `node node_modules/typescript/bin/tsc --noEmit --incremental false`

Expected: PASS.

- [ ] **Step 3: ESLint**

Run: `node node_modules/next/dist/bin/next lint`

Expected: PASS.

- [ ] **Step 4: Build web**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 5: Instalador**

Run: `npm run desktop:package`

Expected: instalador NSIS creado y aplicación arrancable.

- [ ] **Step 6: QA manual final**

Validar PNG del frame actual en 16:9/9:16; Tres Líneas + Marco con presets/reset/render; Auto/GPU/CPU y diagnóstico; subtítulos por SRT, manual y transcripción opcional; render subtitulado de una sola pasada; cancelaciones y errores; fuentes instaladas en plantilla y subtítulos.

- [ ] **Step 7: Registrar exclusiones**

Confirmar por búsqueda que no se incorporaron `BncrLogoEffect`, `bncr-logo`, assets BNCR ni una ruta de doble render.

---

## Gates de aceptación

- **P01:** baseline y una sola pasada protegidos.
- **P02–P03:** PNG del fotograma pausado, guardado y QA.
- **P04–P06:** Tres Líneas + Marco completo.
- **P07–P08:** GPU diagnosticable con fallback y sin cambiar resultado.
- **P09–P14:** subtítulos seguros, editables, deterministas y renderizados en una sola pasada.
- **P15:** persistencia e instalador.
- **P16:** suite terminal y QA manual.

Un gate fallido detiene solamente el subsistema correspondiente. PNG, Tres Líneas + Marco y GPU pueden aprobarse aunque subtítulos necesite correcciones adicionales; subtítulos no se declara incorporado hasta superar P09–P15 completos.

## Conclusión técnica sobre subtítulos

La característica es viable y merece incorporarse, pero la versión antigua no está libre de errores y no debe copiarse literalmente. Los defectos observados que este plan corrige son: ausencia de pruebas, exposición de rutas absolutas al cliente, comprobación de confinamiento basada en `startsWith`, upload completo en memoria sin límite explícito, falta de limpieza de temporales, validación insuficiente de cues y tiempos, posible bucle con `maxWords <= 0`, dependencia opcional mal separada de una clave remota, límite de líneas no aplicado y uso de transiciones CSS no deterministas dentro de Remotion.

La arquitectura aprobada conserva su valor: entrada SRT/JSON/manual, transcripción opcional por palabra, presets, editor visual y composición sobre vídeo. El render final se reconstruye sobre la política actual y produce el archivo final en una sola llamada a `renderMedia`.

## Self-review

- Cobertura del requerimiento: PNG, Tres Líneas + Marco, GPU, subtítulos, exclusión BNCR y preservación del render de una sola pasada tienen gate propio.
- No se propone recuperar el pipeline antiguo completo ni el render en dos pasos.
- No hay placeholders de implementación.
- Los contratos `StillExportRequest`, `RenderPipelinePreference`, `SubtitleCue`, `CaptionedVideoProps` y el resultado F5 se mantienen consistentes entre tareas.
- La suite terminal incluye tests, TypeScript, ESLint, build e instalador.
