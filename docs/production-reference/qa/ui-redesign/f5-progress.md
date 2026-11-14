# F5 — Exportación y presets

## Estado

**F5 — CIERRE FORENSE F5.4 COMPLETO / LISTA PARA ASTRA**

F1–F4 permanecen cerradas. Este documento registra únicamente el estado de F5.

## Implementación verificada

- Flujo individual: selecciona el destino antes de renderizar, renderiza una vez, escribe el resultado automáticamente y expone estados explícitos de selección, renderizado, escritura, finalización y error.
- Cancelación del selector: no inicia render ni escritura y no deja un resultado parcial.
- File System Access API: usa `showSaveFilePicker` para exportación individual y `showDirectoryPicker` para lote cuando están disponibles.
- Fallback: cuando el navegador no ofrece esas APIs, solicita la descarga mediante el navegador con el nombre saneado; la UI no lo trata como confirmación física de escritura.
- Flujo batch: selecciona directorio una sola vez, procesa las líneas secuencialmente, conserva el número de línea original y el resultado por item, y continúa tras fallos individuales. La sesión presenta únicamente los resultados del último batch; una exportación individual no los borra.
- Sesión: persiste únicamente datos serializables de exportación; handles del sistema de archivos y estados transitorios no se serializan ni se restauran como operaciones activas.
- Presets: crear, cargar, persistir y eliminar presets nombrados mediante la fuente de estado compartida; la eliminación tiene control accesible y no duplica controles Legacy.
- Correcciones post-reauditoría: resultado renderizado conservado antes de escritura para diagnóstico, sin reintento desde UI; exclusión compartida, acciones de resultados bloqueadas durante operaciones, nombres case-insensitive con extensión normalizada, errores de selector batch recuperables y fallos de storage de presets propagados. Los presets duplicados reemplazan el valor existente.

## Verificación automatizada

- `npm run test:editor`: **216/216 PASS** (29 archivos).
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: **PASS**.
- `node node_modules/next/dist/bin/next lint`: **PASS**, sin warnings ni errores.
- `npm run build`: **PASS**.

## Cobertura final registrada

- La exclusión compartida incluye guardado de resultados, exportación individual y batch; el estado busy sobrevive al desmontaje y remontaje físico de Export.
- El progreso batch usa `executionIndex/totalExecutableItems`; los resultados conservan `originalLineNumber`, incluido el caso de líneas vacías.
- Un resultado batch fallido muestra siempre su error; si conserva URL, ofrece una acción separada de recuperación.
- El fallback diferencia `written` de `download-requested`, usa nombres saneados y evita extensiones duplicadas.
- Los presets duplicados reemplazan el valor anterior y la UI comunica `Preset actualizado`; los errores de storage se distinguen de nombres inválidos.
- La persistencia v2 conserva preferencias, textos y resultados serializables; estados transitorios vuelven a `idle` y no se persisten handles, streams ni blobs.
- La cobertura automatizada incluye integración de UI, escritor real mediante el hook, reducer/orquestación, duración por contenido, progreso, fallback, presets y restauración del proveedor.

## Verificación final

- Suite editor: **216/216 PASS**.
- TypeScript: **PASS**.
- ESLint: **PASS**.
- Build: **PASS**.
- QA manual: pendiente; F5 queda lista para el gate final, sin iniciar QA desde esta ejecución.

## Matriz de evidencia forense Q2–Q9

| Requisito | Archivo de test | Nombre exacto del test |
|---|---|---|
| Q2 — save-first y exclusión compartida | `tests/editor/presets-and-tabs.test.tsx` | `bloquea las acciones de resultados mientras un guardado iniciado desde UI sigue pendiente`; `libera save-first después de que writable.write(blob) falla sin anunciar éxito`; `mantiene el Guardar previo conectado y bloqueado mientras una exportación individual real espera writable.write(blob)` |
| Q3 — endpoint real y duración efectiva | `tests/editor/render-route-duration.test.ts` | `resuelve Typewriter corto y largo dentro del handler real antes de renderMedia`; `resuelve la duración de Kinetic Box Sequence por contenido efectivo en el endpoint real` |
| Q4 — selectores UI 4/4 | `tests/editor/presets-and-tabs.test.tsx` | `cancela exportación individual desde el selector real sin renderizar ni escribir`; `rechaza selector individual desde la UI real y deja estado failed sin render ni escritura`; `cancela selector batch desde la UI real y vuelve a idle sin render ni escritura`; `rechaza selector batch desde la UI real y no deja estado ocupado` |
| Q5 — writer integrado | `tests/editor/export-filesystem.test.ts`, `tests/editor/presets-and-tabs.test.tsx` | `propaga un error de existencia distinto de NotFound desde el writer sin crear un writable`; `propaga un fallo real al obtener Blob sin escribir ni cerrar como éxito`; `aplica permisos desde chooseDestination y permite fallback cuando la API no los expone`; `sanea un nombre reservado y propaga el nombre final desde el writer público`; `escribe mediante el hook real y resuelve colisiones sucesivas`; `propaga al resultado visible el nombre final elegido por el writer tras una colisión` |
| Q6 — progreso visible del Inspector | `tests/editor/presets-and-tabs.test.tsx` | `muestra progreso real de lote por ejecutables y conserva la línea original` |
| Q7 — delivery E2E | `tests/editor/presets-and-tabs.test.tsx` | `preserva download-requested y el nombre real al guardar desde la UI un resultado previo con fallback`; `preserva written y el nombre real al guardar desde la UI un resultado previo`; `muestra progreso real de lote por ejecutables y conserva la línea original` (assert explícito `delivery: written`); `conserva delivery download-requested en cada resultado batch mostrado por la UI` |
| Q8 — presets desde UI y error de storage | `tests/editor/presets-and-tabs.test.tsx` | `reemplaza Prueba de A a B, carga B después de C y la elimina desde la UI real`; `muestra error de almacenamiento al fallar Guardar desde la UI sin falso éxito` |
| Q9 — persistencia v2 real | `tests/editor/session-persistence.test.tsx` | `proyecta resultados runtime a v2 JSON-safe y no rehidrata handles, Blob ni streams` (provider nuevo observado mediante consumidor); `acepta payload legacy de sesión sin delivery y conserva sus campos compatibles`; `restaura selecting-destination como idle en un nuevo proveedor v2`; `restaura rendering como idle en un nuevo proveedor v2`; `restaura writing como idle en un nuevo proveedor v2` |
