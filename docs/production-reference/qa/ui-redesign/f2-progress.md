# F2 — Inspector accesible y controles básicos

Estado: F2 — COMPLETADA.

## Validación automatizada

- `npm run test:editor`: PASS — 15 archivos, 43 tests.
- TypeScript (`tsc --noEmit --incremental false`): PASS.
- ESLint (`next lint`): PASS, 0 warnings/errors.
- `npm run build`: PASS.

## Validación manual

- Prueba Manual 1 — Exportar/sesión: PASS.
- Prueba Manual 2 — Navegación del Inspector: PASS.
- Navegación `Tab` / `Shift+Tab`: PASS dentro de la aplicación; el navegador puede recuperar el foco fuera del documento, comportamiento aceptado.
- Prueba Manual 3 — Restauración de fondo: PASS. `Tech Network` conserva sus controles propios de tamaño como excepción aceptada.
- Prueba Manual 4 — Controles de previsualización: PASS. Barra centrada, controles homogéneos, outline y fondo transparente.
- Prueba Manual 5 — Responsive/redimensionamiento: NO APLICA. La ventana no es redimensionable y este feature fue considerado innecesario.
- Prueba Manual 6 — Presets: PASS.

## Alcance

F2 queda cerrada. No se inicia F3, F4 ni F5 automáticamente.
