# P16 — Resultados de rescate y optimización

Estado: `P16 — CERRADO` para los gates automatizables. La validación visual y la QA del instalador permanecen explícitamente pendientes; no sustituyen esta evidencia terminal.

## Alcance del rescate

Se cerró exclusivamente `Task 17 — Suite terminal y documentación → P16`. No se añadieron features ni refactors oportunistas. Se retiró `Tres Líneas + Marco` durante QA final por decisión de producto y se ajustó el catálogo a sus plantillas activas. También se excluyeron los artefactos generados `release-p16-*` del `tsconfig` para que TypeScript no analizara staging empaquetado.

## Gates P01–P16

| Gate | Estado | Evidencia |
|---|---|---|
| P01 | CERRADO | Estado canónico previo |
| P02 | CERRADO | Estado canónico previo |
| P03 | PENDIENTE QA MANUAL | PNG: lista exacta abajo |
| P04 | EXCLUIDO POR DECISIÓN DE PRODUCTO | Tres Líneas + Marco retirada |
| P05 | EXCLUIDO POR DECISIÓN DE PRODUCTO | Tres Líneas + Marco retirada |
| P06 | EXCLUIDO POR DECISIÓN DE PRODUCTO | Tres Líneas + Marco retirada |
| P07 | CERRADO | Estado canónico previo |
| P08 | CERRADO | Estado canónico previo |
| P09 | CERRADO | Estado canónico previo |
| P10 | CERRADO | Estado canónico previo |
| P11 | CERRADO | Estado canónico previo |
| P12 | CERRADO | Estado canónico previo |
| P13 | CERRADO | Estado canónico previo |
| P14 | CERRADO | Estado canónico previo |
| P15 | CERRADO | Evidencia canónica previa; no reabierto |
| P16 | CERRADO | Todos los gates automatizables de este informe pasan |

## PNG

`PASS` en la suite completa: el contrato usa `renderFrames`, produce el frame solicitado, no llama `renderMedia` y conserva el lock de exportación. La comprobación visual queda en QA manual P03.

## Decisión de producto

`Tres Líneas + Marco fue retirada durante QA final por decisión de producto; no forma parte del alcance final entregado.`

## GPU

`PASS` en política e integración: Auto/GPU/CPU, diagnóstico, fallback GPU→CPU y bloqueo de GPU estricta están cubiertos por la suite. La observación con hardware real queda en QA manual.

## Subtitles

`PASS` en validación, upload, transcripción opcional, composición `CaptionedVideo`, edición/UI, lock, cancelación, delivery y render de una sola pasada. La suite confirma SRT/manual y presets; Whisper JSON no se documenta como función verificada porque no existe un parser activo en el runtime actual. La prueba con video real queda en QA manual.

## Single-pass

`PASS` estructural y en tests:

- PNG: rama separada con una llamada a `renderFrames` y cero llamadas a `renderMedia`.
- Video normal individual: una llamada exitosa a `renderMedia` con `outputLocation` final.
- Batch: una llamada por elemento.
- Subtítulos: `CaptionedVideo` y una llamada exitosa a `renderMedia` con `outputLocation` final.
- Los reintentos GPU solo ocurren tras fallo y limpian el candidato antes de continuar.

No existe una cadena `renderFrames → FFmpeg` ni `renderMedia → intermedio → segundo renderMedia` en una ruta exitosa.

## Persistence

`PASS` en la suite completa para persistencia, migraciones, presets y restauración de estado. No se persisten File handles, Blob, streams, paths temporales ni estado busy.

## Packaging

Staging nuevo y autoridad de esta ejecución:

- `K:\ANTIGRAVITY\HABILIDADES\TEXT ANIMATION\release-p16-product-staging\win-unpacked`
- Staging limpio: 10.711 archivos; runtime resources presentes.
- Limpieza PASS: sin `public/renders`, `public/tmp`, `tmp`, `.next/cache`, `.next/standalone`, `node_modules/.cache` ni artefactos de release del proyecto anidados.
- Recursos runtime PASS: server, server/node_modules, src, public, `.next`, `MainComposition`, `CaptionedVideoComposition`, `Root`, catálogo y dependencias Next/React/Remotion/esbuild resolvieron desde staging.
- Smoke server PASS: `/` `200`; `/api/render`, `/api/subtitles/upload`, `/api/subtitles/transcribe` y `/api/subtitles/render` `405` en GET; proceso detenido y puerto cerrado.

Instalador final nuevo de esta ejecución:

- `K:\ANTIGRAVITY\HABILIDADES\TEXT ANIMATION\release-p16-product-final\Text Animation Setup 0.1.4.exe`
- electron-builder `26.15.3`, NSIS exit `0` — `NSIS PASS`.
- Tamaño: `1,906,881,102` bytes.
- Timestamp: `2026-09-07T03:14:34.3528247-06:00`.
- Blockmap: `Text Animation Setup 0.1.4.exe.blockmap`, `1,981,495` bytes, gzip JSON legible, versión `2` — `BLOCKMAP PASS`.

Este instalador reemplaza `release-p16-qa001-final` como autoridad de QA. Se conservaron las autoridades anteriores.

## Exclusiones y auditorías

- BNCR: `PASS` en árbol canónico de implementación. No existen `BncrLogoEffect`, `bncr-logo`, tipos, controles, presets ni assets BNCR. Las coincidencias restantes están limitadas a la aserción de exclusión del test y a documentación histórica de planes/QA; no son runtime.
- Secretos: `PASS`. No se encontraron literales de API keys, tokens, credenciales o secretos. `SUBTITLE_TRANSCRIPTION_API_KEY` aparece únicamente como variable server-side opcional y en su test; no se expone al cliente, presets ni persistencia.
- Rutas absolutas: `PASS` en source/runtime empaquetado. No hay dependencia hardcoded de `K:/ANTIGRAVITY/HABILIDADES/TEXT ANIMATION`, `TEXT ANIMATION_OPTIMIZACION` ni otra ruta de desarrollo. La documentación puede mencionar rutas de workspace.
- Artefactos históricos: se conservaron todos los staging y salidas P15; no se eliminó `TEXT ANIMATION_OPTIMIZACION`.

## Terminal suite

Resultados finales verificados:

- `npm run test:editor` — exit `0`; `59/59` archivos PASS; `366/366` tests PASS; skipped `0`.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false` — exit `0`.
- `node node_modules/next/dist/bin/next lint` — exit `0`; sin warnings ni errores ESLint.
- `npm run build` — exit `0`; build standalone Next completado con editor, APIs, Remotion y subtitles.

La suite conserva avisos de entorno esperados: CJS de Vite deprecado, instancias múltiples de Three.js, `useLayoutEffect`/AudioContext de jsdom y errores simulados de cancelación/permisos/disco lleno. No son tests fallidos.

## Documentación actualizada

`README.md` documenta únicamente funciones verificadas: PNG del frame pausado, Auto/GPU/CPU con diagnóstico y fallback, y subtítulos SRT/manual/presets con transcripción opcional server-side.

## QA manual pendiente

Se conserva exactamente `P03 — PENDIENTE QA MANUAL`:

- PNG: 16:9; 9:16; tres frames distintos; PNG igual a Preview; transparencia visual; resolución seleccionada.
- GPU: Auto/GPU/CPU reales; diagnósticos observados; fallback real cuando sea disparable.
- Subtitles: cargar video; importar SRT; input manual; transcripción opcional; editar cue; preview; render; inspeccionar video final.
- Installer: instalar; iniciar; servidor interno; fonts; PNG; video; GPU; upload; subtitles; render subtitulado.

P16 automatizable: `CERRADO`. P04–P06: `EXCLUIDOS POR DECISIÓN DE PRODUCTO`. QA visual y de instalador: `PENDIENTE QA MANUAL`.

## Git

`commit omitido: workspace sin repositorio`.
