# Baseline de rescate de optimización

Fecha: 2026-09-06

Proyecto canónico: `K:/ANTIGRAVITY/HABILIDADES/TEXT ANIMATION`

Fuente inspeccionada: `K:/ANTIGRAVITY/HABILIDADES/TEXT ANIMATION_OPTIMIZACION`

## Estado antes de P01–P03

- Suite inicial: 47 archivos, 323 tests PASS.
- TypeScript inicial: PASS.
- El render normal actual usa `renderMedia` y conserva el pipeline de vídeo existente.
- La versión actual no tenía captura PNG del frame pausado.
- La fuente antigua sí tenía esa característica, pero usaba el identificador confuso `png-last-frame-alpha`.
- La versión antigua también contenía funciones GPU adicionales, pero no se recuperan todavía.
- BNCR queda explícitamente fuera del rescate.

## Protección P01

`tests/editor/render-single-pass-contract.test.ts` protege:

- un `renderMedia` por vídeo individual;
- un `renderMedia` por elemento batch;
- cero `renderFrames` en las rutas normales de vídeo.

La regresión de duración existente en `tests/editor/render-route-duration.test.ts` permanece incluida en la verificación.

## Control de cambios

El commit fue omitido por workspace sin repositorio Git (`.git` no existe en el proyecto canónico).
