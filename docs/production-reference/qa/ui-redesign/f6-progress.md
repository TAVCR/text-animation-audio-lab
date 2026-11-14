# F6 — Nuevos efectos de texto

## Estado

- N-T01 `word-highlight-tracker`: PASS
- N-T02 `paper-cutout-assemble`: PASS
- N-T03 `ink-stamp-print`: PASS
- N-T04 `variable-weight-wave`: PASS
- N-T05 `glyph-tile-assemble`: PASS

## Integración

Los cinco efectos están tipados en `AnimationProps`, incluidos en el catálogo y registry, reciben defaults JSON-safe, exponen controles contextuales en `TextBasicTab` y se renderizan desde `MainComposition` mediante el registry real. Los presets existentes serializan/restauran las opciones porque guardan el documento completo.

- N-T01: resaltado determinista por palabra, 0.4 s por palabra por defecto.
- N-T02: piezas de papel por palabra con retraso, asentamiento, colores, sombra y semilla.
- N-T02: tras el asentamiento, cada pieza mantiene levitación vertical sinusoidal determinista; amplitud y velocidad son controles contextuales.
- N-T03: sello de tinta con entrada breve, cobertura, imperfección procedural determinista y color propio.
- N-T04: onda de peso usando el eje `wght` de `public/fonts/ttf/Inter-Var.ttf`; no se instaló ninguna fuente.
- N-T05: ensamblaje determinista de caracteres con dispersión y convergencia al texto final.

## Verificación

- `npm run test:editor`: 232/232 PASS.
- TypeScript: PASS.
- ESLint: PASS.
- Build: PASS.

La validación visual manual y la revisión de miniaturas permanecen fuera de esta verificación automatizada.
