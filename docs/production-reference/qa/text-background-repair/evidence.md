# Evidencia P00 — Corrección de texto y fondos

Fecha de congelación: 2026-09-06 07:20 America/Costa_Rica  
Workspace: `K:/ANTIGRAVITY/HABILIDADES/TEXT ANIMATION`  
Repositorio Git: no existe en el workspace. No se creó una rama ni se alteraron historiales.

## Estado inicial observado

- package.json: versión 0.1.3.
- Catálogo: 32 plantillas de texto y 39 fondos registrados en `src/lib/editor/catalog.ts` (recontados el 2026-09-06).
- Plantillas importadas: 4 presets, con 8 archivos locales horizontal/vertical en `public/backgrounds/video-imports`.
- Fuentes empaquetadas en `public/fonts`: 25 archivos detectados en la inspección inicial.
- La compilación anterior del instalador 0.1.2 fue comprobada en una ejecución anterior; esta auditoría no la usa como prueba de los defectos visuales.

## Reproducción estática P00

Los siguientes defectos tienen evidencia directa en el código y pasan a corrección con regresión: controles de velocidad ausentes en el Inspector; degradados consumidos sin controles de extremos y suavidad; `boxSequenceWidth` ignorado por un ancho fijo; `boxSequenceCount` no gobierna la cantidad; `WordHighlightTracker` cambia índice sin interpolar posición; `VariableWeightWave` usa 30 FPS fijo y no repite el ciclo; `NumberField` permite resetear al valor actual por default implícito; y existen inputs numéricos directos en paneles legacy.

Los reportes “Fly Through no hace nada”, “Kinetic queda en blanco”, “Extruded 3D roto” y “Variable Weight Wave sin movimiento” requieren captura de frames y consola en la app instalada. Se mantienen como PENDIENTE hasta esa reproducción, sin convertirlos en PASS por inspección estática.

## Hashes de archivos congelados

| Archivo | SHA-256 |
|---|---|
| package.json | 92499958F6C2E5261CAC73E6FB3D59D24FE88CA74ECE054EBDF239CBCFDBF738 |
| src/lib/AnimationContext.tsx | DE9045289C3B570DD75A259EF0FAC571926313FE571461C8C548542B53B50F2B |
| src/lib/editor/catalog.ts | 31D46D8A5A32474E965048C809226EFBA9A7FD0FB030D005AA97CF6A183A0BEC |
| src/lib/editor/selection.ts | AA3448E4E6507AA0E8DC299150A4A0402DA18D0C269A91DD74D2970657A11316 |
| src/components/inspector/fields/NumberField.tsx | 5ABDAAEFF285716DDC00D0DE4B40492B6262DBE9FF0EC2D6005DF592916B1CBC |
| src/components/inspector/tabs/TextBasicTab.tsx | 4ADFBDD7B5F4A4FB3A69A66881377BFAE1082E5CA0F76F5394623C2AD16BD38E |
| src/components/inspector/tabs/BackgroundBasicTab.tsx | 26C8232683C196ABD4F8ECB613F9C4118FB40F409B97EA4BBCA2BDD8FC82F8F4 |
| src/remotion/MainComposition.tsx | BB98BBC51B6963825CC207A99E2AB404C1FE2E77F454F6C9634D473B3F0157F4 |
| src/remotion/templates/registry.ts | 5691D087F477A8912C1042AADC7E38C69A518C8A8E069654A2C7C49CCF0CFB6E |
| electron/main.cjs | FBAB3488CB1A651285618433DC384B31AEAB162F300A141B34FD03C793905C49 |

## Regla de avance

Cada corrección debe añadir una prueba que falle por el defecto observado, pasar la prueba dirigida, y conservar evidencia de render para los criterios visuales. Un resultado ambiguo se marca BLOQUEADO y solicita ayuda manual; no se declara aprobado.

## Progreso de ejecución

- P00: PARCIAL. Hashes e inventario inicial disponibles; faltan reproducción visual y respaldo de sesiones del usuario. El inventario aún no es exhaustivo.
- P01: contrato tipado inicial para todos los IDs del catálogo; prueba dirigida 3/3 PASS; contrato aún requiere completar consumidores específicos.
- P02: NumberField exige default canónico y monta slider por defecto; defaults faltantes del panel actual corregidos; pruebas dirigidas 6/6 PASS y TypeScript PASS. Inputs numéricos legacy permanecen pendientes de migración.
- P03: control Velocidad del efecto conectado a props.speed; prueba de integración de Inspector 6/6 PASS en el bloque dirigido. El resolver de duración ya mantiene los frames del clip iguales para velocidades 0.2–3; prueba dirigida de duración 9/9 PASS. Los relojes individuales de cada plantilla y el render visual permanecen PENDIENTES.
- P03 adicional: Paper Cutout, Glyph Tile y Word Highlight ahora consumen speed en su reloj local; Glyph Tile usa el FPS de la composición. Pruebas dirigidas de esas familias 35/35 PASS y TypeScript PASS. Falta aún recorrer los demás efectos y completar la intensidad perceptible.

## Retoma 2026-09-06 — estado verificado, sin cierre de fase

La evidencia histórica anterior describe bloques parciales; no certifica P01, P02 ni P03 completos. El contrato de controles aún contiene defaults y consumidores que requieren reconciliación; los inputs legacy y los relojes de salida también siguen pendientes.

- Backup de fuentes, documentación, Electron, tests y package/lock en `backups/repair-20260906-0828/checkpoint.zip`, 763156 bytes. Es un checkpoint intermedio, no el estado original previo a las reparaciones; no contiene sesiones del navegador.
- `duration-migration.test.tsx`: 5 pruebas de presets antiguos y provider real. Duración efectiva histórica preservada para Slide/Typewriter/Kinetic, `timingVersion=1`, sin segunda migración tras guardar/cargar o desmontar/montar provider. Nuevos documentos desacoplados.
- `duration.test.ts`: 9 pruebas; Typewriter y Kinetic ya no extienden automáticamente el clip. `render-route-duration.test.ts`: 2 pruebas del handler real que conserva los frames solicitados; renderer externo simulado, no export visual.
- `ink-speed.test.tsx`: 3 pruebas del componente real: velocidad, levitación con FPS reales y escala hasta 6 sin clamp en 3.
- `dual-speed-integration.test.tsx`: 1 prueba con Inspector, AnimationProvider, Player y MainComposition reales. Slider de velocidad secundaria modifica solo su transformación y doble clic restaura. No sustituye inspección visual de píxeles.
- `paper-clock.test.tsx`: 2 pruebas del componente real: retraso entre palabras permanece en tiempo del clip y levitación usa FPS reales.
- `wave-clock.test.tsx`: 2 pruebas del componente real: speed cambia fase, seek determinista y repetición a 30/60 FPS. Soporte visible de fuente estática/eje variable aún PENDIENTE en P08.
- `fields.test.tsx`: 4 pruebas; NumberField siempre muestra slider incluso para callers legacy con `slider=false`; cambio inmediato y doble clic al default.
- Suite actual `npm run test:editor`: **317/317 PASS, 45 archivos**, exit 0. Hay avisos de Three.js duplicado, limitaciones de jsdom (AudioContext/Canvas) y errores intencionales de tests de export; no presentar el log como libre de avisos.
- TypeScript y ESLint pasaron después del ajuste de rangos. La ampliación posterior de layout/aviso de duración requiere nueva verificación.
- No build, instalador ni gate visual nuevos. P03 y P03-A continúan ABIERTOS; P04–P12 sin cierre.

### Reproducción de navegador 08:35–08:40

- Servidor iniciado en `http://localhost:3000`, proceso de esta ejecución. Carga inicial parcial con `SyntaxError: Invalid or unexpected token` en `app/layout.js`. Archivo local y respuesta HTTP idénticos; parseo de archivo y 16 módulos internos válido. Recarga recuperó la interfaz. Causa del fallo transitorio todavía NO determinada; no se adjudica a caché sin evidencia.
- Respaldo creado desde Mis presets: `Respaldo reparación 2026-09-06 08-37`, antes de modificar el texto de prueba. Estado visible original: `F2 MANUAL`, Flicker Outline Fill, velocidad 1.5, duración ya migrada 100 frames.
- Kinetic reproducido con `ALPHA BETA GAMMA`, velocidad 1, frame 30/99: texto/caja invisibles. Medición DOM: wrapper de opacidad y descendientes absolutos con ancho/alto 0; MasterMotionLayer de 808.89×455 px en preview. Causa concreta: wrapper sin dimensiones.
- Corrección de `MainComposition`: wrapper ocupa 100% del lienzo y centra su contenido. Misma escena/frame: wrapper 808.89×455 px; caja 808.89×91.63 px; texto BETA y franja cian visibles en captura de navegador.
- `composition-layout.test.tsx` reproduce el contrato del wrapper con Player/MainComposition reales; RED por dimensiones ausentes, GREEN después de corregir.
- Fly Through y Extruded 3D visibles tras la misma corrección, frame 30/99. No equivale a cierre de recorrido, fuentes, apariencia, 9:16 ni export. Extruded aún muestra material metálico y necesita P06/P10.
- `duration-fit.test.tsx`: dos pruebas UI reales verifican aviso Typewriter truncado y ajuste de duración exclusivamente tras click explícito; velocidad por slider no altera duración.

### Preparación del instalador 0.1.4

- Se incrementó la versión de `0.1.3` a `0.1.4`.
- El catálogo de escritorio consulta GDI y las claves de fuentes de `HKLM` y `HKCU`, con salida UTF-8 y deduplicación posterior en el selector. La enumeración observada contiene 407 archivos de fuente en Windows y 4156 en la carpeta de fuentes de usuario; el selector recibirá las familias disponibles al ejecutar la aplicación instalada.
- La generación y la prueba independiente del instalador quedan pendientes hasta completar `npm run desktop:package` y ejecutar el artefacto fuera del workspace.

### Checkpoint 08:42

- Suite después del aviso de duración y corrección de layout: **320/320 PASS, 47 archivos**, `npm run test:editor`, exit 0, 08:41:28. TypeScript exit 0; ESLint sin warnings/errors. Los avisos de entorno de pruebas descritos arriba permanecen.
- Preset de respaldo cargado nuevamente desde la UI; texto original `F2 MANUAL` restaurado y preview pausado. Servidor de desarrollo continúa en puerto 3000.
- Skills aplicadas: executing-plans, test-driven-development, remotion-best-practices y systematic-debugging. Se preservaron los cambios existentes; no hubo borrados de implementación.
- Trabajo restante de P03: salidas ancladas al final, fases in/out/in-out de todo el catálogo, retrasos de efectos legacy, opciones/velocidad completas por capa y matriz de intensidad P03-A. Persistencia de duraciones legacy que superaban los límites actuales necesita caso explícito antes de cerrar migración. P01/P02 mantienen pendientes descritos y P04–P12 no están cerrados.
