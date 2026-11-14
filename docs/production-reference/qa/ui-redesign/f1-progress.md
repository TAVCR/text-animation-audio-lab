# F1 — Progreso de ejecución

Fecha: 2026-09-05
Estado: F1 — COMPLETADA.

## Completado

- Añadido `src/lib/editor/EditorSessionContext.tsx` para conservar idioma y modo de edición mientras se navega entre pestañas.
- Añadido `src/lib/editor/ExportContext.tsx` para conservar modo único/lote, texto del lote, codec y resultados.
- Registrados ambos proveedores en `src/app/layout.tsx` por encima de la página.
- `InspectorPanelLegacy` consume el estado compartido; Exportar ya no depende de una instancia montada solamente en la pestaña actual.
- Añadida `setDisplayedDurationSeconds` a `src/lib/videoConfig.ts`.
- Reemplazado el cálculo proporcional defectuoso del inspector por la función pura.
- Añadido arnés Vitest/jsdom/Testing Library y script `npm run test:editor`.
- Prueba RED observada: seis fallos por función ausente. Prueba GREEN posterior: seis casos pasan.
- Añadida infraestructura base de historial en `src/lib/editor/history.ts`: snapshots JSON-safe, undo/redo, ramificación y límite de 50 entradas.
- Añadido contrato versionado en `src/lib/editor/persistence.ts` y escritura de selección `v2` desde `AnimationContext`.
- Añadidas pruebas automatizadas para historial y persistencia.
- Eliminado el efecto Legacy que copiaba estilos principales a palabras secundarias y borraba rangos de palabra al desactivar el modo palabra por palabra.
- Añadidas funciones puras de selección por dominio en `src/lib/editor/selection.ts`.
- Añadida migración v1→v2 con respaldo `remotion-fx:backup-before-v2`, idempotencia y manejo de errores de storage.
- Conectado `AnimationContext.setProps` al historial documental; expone `undo`, `redo`, `canUndo` y `canRedo`, excluyendo sesión/exportación.
- Añadidas reglas puras de agrupación para transacciones de slider y confirmación de drafts.

## Verificación ejecutada

- `npm run test:editor`: PASS, 9 archivos, 27 tests.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: PASS.
- `node node_modules/next/dist/bin/next lint`: PASS, sin warnings ni errores.
- `npm run build`: PASS.

## Estado histórico

Las iteraciones anteriores listaron como pendientes la limpieza Legacy, la migración, la selección por dominio y los tests base. Esos puntos ya fueron implementados y verificados; se conservan arriba como historial de ejecución.

## Estado actual

- La agrupación está conectada a eventos DOM reales (`pointerdown/pointerup/pointercancel`) y la confirmación de drafts cubre Enter/blur/Escape, inválido y mismo valor.
- La sesión de exportación persiste entre navegación y remontaje; está cubierta por `session-persistence.test.tsx`.
- La sincronización de contenido de palabras y el remount de la ruta de producción están cubiertos por `word-content-synchronizer.test.tsx`.
- La validación manual final fue completada: Exportar/sesión, restauración de plantilla y restauración de fondo.
- `ExportContext` ahora persiste modo Lote, texto de lote, codec y resultados bajo `remotion-fx:export-session:v2`.
- La agrupación histórica rápida está conectada al `setProps` documental común; el test de agrupación cubre reemplazo de snapshots.
- El ciclo de slider se conecta ahora por delegación DOM en `AnimationContext`: `pointerdown` inicia transacción sobre `input[type=range]`, los cambios mantienen preview vivo y `pointerup`/`pointercancel` cierran la transacción.
- Se añadió `session-persistence.test.tsx` para el contrato de sesión independiente del documento.

La integración DOM de inputs de texto/número, el test de remount con el componente completo y las pruebas de integración de atomicidad siguen requiriendo cobertura adicional antes del cierre definitivo.

## Evidencia manual adicional

- Prueba Manual 1 — Exportar/sesión: PASS.
  - Persistencia modo lote: PASS.
  - Persistencia de textos A/B: PASS.
  - Persistencia del codec cambiado: PASS.
  - Navegación `EXPORT → GLOBAL → EXPORT`: PASS.
- Selección `ESTILO MASTER`: funcional.
- Prueba Manual 2 — restauración de plantilla: PASS.
  - `Typewriter (Clásico)` y `Cyberpunk Glitch` funcionan visualmente y el selector no presenta regresión.
- Prueba Manual 3 — restauración de fondo: PASS.
  - Al alternar partículas, `Size Min` y `Size Max` permanecieron conservados.
- El navegador normal hidrató correctamente; Computer Use automatizado quedó limitado externamente en hidratación/accesibilidad.
- Observación UX para una fase posterior: en `light-orbs`, los controles de partículas mezclan sliders y campos numéricos, y `Line` no produce un cambio visual perceptible.
- No se observó regresión al alternar estilos.
- La restauración interna por dominio de plantilla está verificada automáticamente; la UI no necesita un control exclusivo artificial para demostrarla.

## Nota de dependencias

La instalación inicial de Vitest 5 falló por incompatibilidad con `@types/node` 20. Se instaló Vitest 2.1.9, compatible con el árbol actual. npm reportó 16 vulnerabilidades en el árbol instalado (1 low, 4 moderate, 9 high, 2 critical); no se ejecutó `npm audit fix` porque podría modificar dependencias fuera del alcance de F0/F1.
