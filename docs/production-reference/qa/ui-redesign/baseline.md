# F0 — Línea base de UI

Fecha: 2026-09-05
Proyecto: `K:/ANTIGRAVITY/HABILIDADES/TEXT ANIMATION`

## Entorno

- Node: `v22.17.0`
- npm: `11.18.0`
- Git disponible en `C:/Program Files/Git/cmd/git.exe`, pero la carpeta no contiene `.git`.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: PASS.
- `node node_modules/next/dist/bin/next lint`: PASS, sin warnings ni errores.
- Servidor Next probado en `http://localhost:3000/`: compilación inicial y respuesta `GET / 200`.

## Inventario de la ruta activa

- 27 plantillas de texto en `src/remotion/templates/registry.ts`.
- 34 fondos en `src/components/inspector/ParticlesTab.tsx`.
- La página activa monta `PreviewContainer` e `InspectorPanel`.
- Los wrappers de pestaña montan `InspectorPanelLegacy` con `forcedTab`; el estado de exportación y lote vive dentro de esa instancia.
- `TopPrimaryControls` no forma parte de la ruta de `src/app/page.tsx`; `FontSection.tsx` devuelve `null`.

## Observaciones reproducidas

1. En la UI de `http://localhost:3000/`, abrir Export, seleccionar “Render por lotes”, salir a Global y regresar a Export devuelve “Render único”.
2. La pestaña Text muestra “3D y material” aun con Typewriter seleccionado y comunica que los controles avanzados solo aparecen para Impacto 3D Real.
3. La pestaña Particles muestra 34 presets y, para `light-orbs`, expone un bloque “3D Lighting & Material” aunque esos valores no llegan a un consumidor 3D en la rama principal.
4. En Text, la edición por palabra está desactivada inicialmente y el modo de selección por carácter se anuncia con clic derecho.

## Límites de F0

Todavía no se han renderizado individualmente los 61 elementos ni se ha ejecutado un build de producción. No se borraron renders, `.backup`, `NEW APPROACH` ni dependencias. No se generan commits porque no existe repositorio Git.
