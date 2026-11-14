# TEXT ANIMATION AUTOMATION — ARCHITECTURE

Estado: arquitectura B+C ratificada por Astra; N00/N01 — REMEDIATION IN REVIEW; N02 — BLOCKED. Las decisiones aprobadas no son capacidades implementadas. La sección «Decisiones Astra incorporadas» prevalece sobre propuestas históricas siguientes.

## Decisiones Astra incorporadas — aprobadas, no implementadas

Estado N00/N01: REMEDIATION IN REVIEW. N02 permanece BLOCKED hasta nueva revisión explícita.

1. **B+C**: Next / CLI / MCP → Automation Core → Remotion Adapter. Una sola implementación activa de política, normalización, intentos y publicación dentro de Automation. Producción histórica permanece intacta.
2. **Frontera**: N02 define contracts, runtime validation, normalize, catalog, policy, filesystem, lifecycle, diagnostics, renderer interface y characterization/parity con dobles. Admite extracción conservadora de la integración existente para convertir Next en adaptador, no un nuevo renderer headless. N03 demuestra Node real sin Next/editor/Electron, renderMedia/renderFrames, codecs/alpha, hardware observado, cancelación efectiva/timeout, fonts/assets y artifacts inspeccionados.
3. **PNG**: preservar un intento CPU heredado y sus opciones; cuando difiera de lo pedido, `policyOverrideReason = LEGACY_PNG_CPU_POLICY`. CPU es configuración/intento, no prueba física. No introducir GPU PNG durante extracción. La etiqueta histórica alpha no fuerza isTransparent: el perfil nuevo resolverá transparencia explícitamente y rechazará contradicciones. Un fondo opaco dibujado puede ocupar todo el canal alpha.
4. **Diagnostics**: `requestedGpuPolicy`, `configuredRenderMode`, `effectiveRenderMode`, `configuredGlBackend`, `observedGlBackend`, `requestedEncoder`, `configuredEncoder`, `observedEncoder`, `policyOverrideReason`, `fallbackUsed`, `attempts`. Observación desconocida = `null`. effectiveRenderMode identifica configuración del intento exitoso, no hardware medido; null sin éxito. No usar gpuAvailable como evidencia física. Intentos ordenados con resultado/error seguro. GPU estricta + host deshabilitado falla antes del renderer; Auto puede reducirse a CPU. PNG conserva la excepción.
5. **Perfiles** (todos DECLARED / PENDING N03 VERIFICATION):

   | ID | Codec / contenedor | Pixel format / operación |
   |---|---|---|
   | h264-opaque | H.264 / MP4 | yuv420p / renderMedia |
   | prores4444-alpha | ProRes 4444 / MOV | yuva444p10le / renderMedia |
   | vp9-alpha | VP9 / WebM | yuva420p / renderMedia |
   | png-alpha | PNG | frame único / renderFrames |

   No conservar ProRes + MP4 en el nuevo contrato. Rechazar combinación heredada opaca + ProRes no soportada, sin convertir silenciosamente su contenido en transparente. Separar fixtures históricos y diferencias intencionales. Ningún fallo de inspección/publicación después de un render exitoso permite volver a renderizar.
6. **Filesystem**: host controla outputRoot/tempRoot; request acepta como máximo outputName basename validado. Prohibidos outputPath/root/serveUrl/executable/ffmpeg args o paths arbitrarios. Canonicalizar raíces/ancestros y comparar por segmentos; rechazar traversal, absolutos, UNC, drive-relative, ADS, reservados Windows, separadores y trailing dots/spaces. Rechazar escapes symlink/junction/reparse; staging privado, reserva exclusiva, revalidación y publicación sin overwrite. N02 puede rechazar publicación entre volúmenes. Cleanup idempotente solo de temporales propios, sin seguir enlaces y después de detener/liberar renderer. Nunca retención de una hora para entregables.
7. **Cancelación**: Core posee lifecycle/contexto host compatible con AbortSignal; adapter posee interrupción real y confirmación del renderer. N02 define y prueba contrato con dobles; N03 conecta y demuestra cancel durante render, sin fallback, segundo render ni publicación parcial. Cancelación que solo marca estado mientras continúa renderMedia es insuficiente. TIMEOUT es fallo diferenciado; cancelled no entrega artifact.
8. **Parameters**: common schema + closed extensions por animationId; rechazo de unknown keys en todos los niveles, defaults efectivos y una fuente de metadata para validación y describe_animation. No Record libre ni copiar contratos UI incompletos como si fueran schemas runtime. MVP: 32 IDs de texto; 41 backgrounds como parámetros/capacidades, no 41 animaciones extra; un job/un artifact, fps heredado fijo, duración normalizada a frames; API nueva estricta y coerción legacy explícita solo en compatibilidad.
9. **Parity**: characterization-first de ruta existente antes de extracción. Comparar Main, template, props efectivos, dimensions, duration, profile, GPU policy, attempts, output type y número de llamadas renderer. No igualdad binaria ni cambios de las 32 composiciones. Vídeo permite intentos fallidos registrados pero una única llamada renderMedia exitosa por artifact; PNG exclusivamente renderFrames.
10. **Next**: /api/render será adaptador de compatibilidad del Core; no conservar segundo backend al concluir N02. Batch heredado puede secuenciar jobs del mismo Core; no capacidad MCP v1 implícita.

OpenDesign / Hyperframes / DaVinci, sus MCP y Codex config quedan fuera de N02. N07/N08/N09 conservan las integraciones futuras separadas. Las secciones siguientes preservan la propuesta histórica; esta sección prevalece si existe contradicción.

## Recomendación histórica

Elegir B, extracción conservadora del backend en la copia Automation, con C como adaptador Node. El núcleo coordina un adaptador Remotion; CLI y MCP llaman al mismo servicio, no se llaman entre sí. Si se conserva la ruta Next en Automation, debe delegar al mismo núcleo. Producción sigue congelada con su implementación histórica: «un motor» significa no crear dos implementaciones activas dentro de Automation, no sincronizar automáticamente el proyecto congelado.

```text
Codex ── MCP delgado ──┐
CLI ──────────────────┼─ Automation Core ─ Remotion adapter ─ Root/Main/registry
Next route (si existe)┘        │
                       outputs + manifest

Codex ─ OpenDesign (lee diseño)
Codex ─ Hyperframes (compone assets)
Codex ─ DaVinci MCP (importa/inserta)
```

Headless significa Node sin editor, ventana Electron ni servidor Next; Chromium sigue siendo necesario para renderizar React/Remotion. El bundle necesita poder servir assets localmente; eso no equivale a montar la UI del editor.

| Alternativa | Ventaja | Coste/riesgo | Decisión preliminar |
|---|---|---|---|
| A: rutas actuales | Conserva HTTP y comportamiento existente | Arrastra Next, process.cwd, cleanup y delivery web; seguridad insuficiente para MCP | Útil como referencia de parity en la copia; no API final |
| B: backend compartido | Política/render únicos, rutas y lifecycle explícitos, testabilidad | Extracción necesita caracterización y revisión | Recomendada |
| C: runner de funciones actuales | Arranque Node pequeño | Función principal de vídeo está anidada en POST; el helper reutilizable hallado es de subtítulos | Complemento de B; solo elegir C puro si N01 prueba cobertura sin duplicación |

## Evidencia inicial del repositorio leído

- `src/app/api/render/route.ts`: POST combina bundling, normalización, output bajo `process.cwd()/public/renders`, borrado por antigüedad, fallback, batch secuencial y NextResponse. PNG no es necesariamente otra ruta: aquí usa `outputProfile='png-paused-frame-alpha'` y renderFrames.
- Vídeo invoca renderMedia dentro del bucle de intentos y retorna al éxito. No se observó pipeline intermedio de vídeo en esa ruta. ProRes transparente solicita perfil 4444 y yuva444p10le; VP9 transparente yuva420p. Verificar los archivos efectivos en N03.
- `src/lib/render/renderAttempts.ts`: CPU solo standard; GPU permite intentos GPU sin CPU; Auto agrega CPU. NVENC se habilita en Windows opaco h264/h265. La ruta filtra además por REMOTION_USE_GPU: GPU forzada + env desactivada puede dejar lista vacía.
- PNG fuerza un intento marcado CPU, aunque el request permita otra política. No prometer GPU PNG ni cambiar esta excepción sin decisión N01.
- `gpuAvailable` se deriva del intento elegido, no de una prueba independiente del hardware; `encodeMode` tampoco demuestra el encoder efectivo. Separar solicitado/configurado/observado en resultados.
- La ruta principal no conecta señal de cancelación. `renderCaptionedVideo.ts` posee callbacks pero pertenece a CaptionedVideo, no sustituye al motor Main.
- La limpieza actual borra extensiones de media tras una hora; no trasladar ese comportamiento automáticamente a assets entregados.
- ProRes opaco puede seleccionar extensión mp4 en la expresión actual. Registrar como riesgo de codec/contenedor, no corregir producción ni ocultarlo durante baseline.
- `src/remotion/Root.tsx`: Main aplica defaults, dimensions y duration mediante calculateMetadata; también registra CaptionedVideo y composiciones experimentales. No equiparar cada animationId con un compositionId.
- `src/remotion/templates/registry.ts` y `src/lib/editor/catalog.ts` contienen las 32 entradas de texto esperadas por lectura inicial. N01 verificará equivalencia programática con AnimationStyle.
- `tsconfig.json` usa alias @ y moduleResolution bundler. Node necesita resolver el código construido y sus imports sin depender accidentalmente del runtime Next. `next.config.mjs` externaliza bundler/renderer/esbuild. N00 conserva configuración antes de extraer.

Estos hallazgos no certifican baseline, ausencia de otros paths de render, compatibilidad de formatos ni éxito headless. N01 debe añadir líneas y trazabilidad al commit validado.

## Límites internos propuestos para revisión N01

Rutas futuras candidatas, todas relativas a Automation:

- `src/automation/contracts.ts`: tipos de request/result y schemas runtime.
- `src/automation/normalize.ts`: defaults y validación coherentes con composición.
- `src/automation/core.ts`: servicio de job único, intentos, lifecycle y entrega.
- `src/automation/filesystem.ts`: raíces confiables, reservas, temporales, publicación.
- `src/automation/remotionAdapter.ts`: bundle/select/renderMedia/renderFrames; única integración del renderer.
- `src/automation/catalog.ts`: acceso a IDs y metadata separada; no importar componentes React para listar.
- `src/automation/inspect.ts`: metadata observada del artifact entregado.
- `src/cli/index.ts`, `src/mcp/server.ts`: adaptadores delgados.
- `tests/automation/`, `tests/cli/`, `tests/mcp/`: contratos, parity e integración.

No crear estos archivos ahora. N01 decidirá si reutilizar las unidades `src/lib/render/` existentes evita una estructura redundante. AnimationContext y sus imports se auditan antes de mover defaults fuera del contexto de UI.

## Contratos preliminares, versión 1

Nombres conceptuales pendientes de ratificación, no API publicada. Una petición produce un artifact; señales de cancelación, raíces, capacidades y hooks pertenecen al contexto confiable del host, no al JSON del modelo.

`AutomationRenderRequest`: schemaVersion=1; animationId perteneciente al catálogo; text; parameters validados por schema del ID (sin arbitrary props); aspectRatio 16:9/9:16/1:1 y resolutionPreset existente; controles de duración heredados normalizados; gpuPolicy auto/gpu/cpu; profile de salida permitido; outputName opcional de solo basename. Los fps quedan fijados al valor heredado en MVP salvo que N01 demuestre soporte seguro de override. No aceptar dimensiones, duración y preset contradictorios: normalizar a una representación única o rechazar.

Perfiles candidatos: h264 opaco/mp4; prores4444 alpha/mov; vp9 alpha/webm. N01 ratifica mapping y N03 verifica media. No exponer h265 solo porque aparezca en un tipo interno: requiere ruta funcional y prueba.

`AutomationStillRequest`: mismos campos de composición normalizados, frameIndex entero dentro de [0,durationInFrames-1], profile png-alpha. N01 decidirá compatibilidad entre clamp heredado de normalizeStillFrame y validación estricta de la nueva API. Política GPU solicitada y excepción CPU deben quedar visibles.

`AutomationRenderResult` y `AutomationStillResult`: unión discriminada por status `succeeded|failed|cancelled`, schemaVersion, jobId y diagnostics. Éxito incluye artifactId, outputPath canónico confinado, mediaType, bytes, width, height, compositionFps, compositionDurationInFrames y durationSeconds. Vídeo añade codec, container, pixelFormat y alpha; PNG añade frameIndex, codec png y media duration/fps nulos cuando no apliquen. Separar duración de composición y duración del archivo still.

Diagnostics incluyen requestedGpuPolicy, effectiveRenderMode, glBackend, requestedEncoder, observedEncoder (null si no se demuestra), fallbackUsed y attempts ordenados con outcome, errorCode y etapa. Alpha debe distinguir requested, declared y verified; no inventar verificación a partir de la extensión. Indicar provenance `configured|probed` de metadata. No usar gpuAvailable como afirmación física sin medirlo.

Error estructurado: code, message, stage, retryable, details seguros. Códigos mínimos: INVALID_REQUEST, UNKNOWN_ANIMATION, UNSUPPORTED_PROFILE, OUTPUT_OUTSIDE_ROOT, OUTPUT_COLLISION, ASSET_UNAVAILABLE, GPU_UNAVAILABLE, RENDER_FAILED, INSPECTION_FAILED, CANCELLED, TIMEOUT. En failure/cancelled no devolver un archivo parcial como entregado. No filtrar secretos ni stack/rutas ajenas al root en MCP.

`list` devuelve metadata ligera; `describe` devuelve schema y defaults efectivos. Metadata agentic separable: id, name, description, tags, tone, recommendedUse, textLengthGuidance, alphaSupport, aspectRatioGuidance, configurableParameters. Verificar cobertura exacta de los 32 IDs sin reescribir animaciones. No inventar capacidades no probadas.

## Filesystem y lifecycle

Host configura outputRoot y tempRoot; para este desarrollo ambos dentro de Automation y fuera de producción. El MCP no puede cambiarlos ni pasar outputLocation, serveUrl, rutas ejecutables o argumentos FFmpeg. inspect acepta artifactId o referencia relativa confinada, nunca lectura libre del sistema. Assets/fonts se resuelven desde inventario local permitido; no habilitar URLs o rutas arbitrarias mediante parameters.

Canonicalizar raíces existentes y ancestros del destino antes de crear. Rechazar rutas absolutas, UNC, drive-relative, traversal con separadores Windows/POSIX, ADS con dos puntos, nombres reservados Windows, trailing dots/spaces y escapes por symlink/junction/reparse points. No basta startsWith textual: comparar path relativo y límites de segmento con semántica Windows. Validar de nuevo antes de publicar; usar directorios privados sin escritores no confiables para reducir TOCTOU. Una carrera detectada falla cerrada.

Reservar nombre sin overwrite, con sufijo único por job como estrategia por defecto. Renderizar a staging privado del job, validar archivo y publicar con operación segura sin reemplazo; un rename/copy de entrega no es un segundo render. Si roots están en volúmenes distintos, definir publicación sin exponer archivo parcial. Un único renderMedia exitoso por vídeo, aunque haya intentos fallidos documentados. Fallo de publicación/inspección tras éxito no dispara un segundo renderMedia.

Limpiar solo temporales propios del job, tras liberar renderer; cleanup idempotente y sin seguir enlaces. Mantener outputs entregados por defecto, sin heredar borrado de una hora. Recolección de huérfanos solo sobre temporales identificados y no activos. Concurrencia inicial un job por proceso, con IDs/reservas robustos entre procesos; respetar límite WebGL heredado máximo 4 workers. Sin cola persistente. Cancelación/timeout detienen el renderer, no hacen fallback, no publican parcial y dejan error estructurado.

## Orquestación y formatos

CLI: `text-animation list`, `describe <id>`, `render <job.json>`, `still <job.json>`, `inspect <file>`; modo `--json`, stdout exclusivo de resultado JSON, progreso/logs en stderr. Exit codes propuestos 0 éxito, 2 validación, 3 render/inspección, 4 filesystem, 130 cancelado. inspect restringe file al outputRoot. SIGINT se traduce al contexto de cancelación.

MCP v1, exactamente cinco tools: list_animations, describe_animation, render_animation, render_still, inspect_render. Schemas cerrados con validación runtime, resultados estructurados, stdio sin logs contaminantes. MVP síncrono; medir timeout del host en N05/N06 antes de introducir infraestructura. No añadir tools específicas de consumidores.

N07 audita herramientas disponibles de OpenDesign y lectura de proyecto, DESIGN.md, fonts, palette, assets y layout/context. Codex traduce identidad a parámetros permitidos y conserva un mapping revisable. El motor no parsea DESIGN.md ni modifica OpenDesign.

N08 compara mediante POC ProRes4444, PNG, PNG sequence y WebM alpha según soporte real de Hyperframes. PNG sequence es candidata de handoff futuro, no sexto tool ni capacidad MVP implícita. Verificar alpha por composición sobre fondos de contraste, frame rate, duración y bordes. No afirmar compatibilidad por extensión.

N09: Codex usa render_animation → herramienta real de importación DaVinci → herramienta real de inserción. Los nombres import_media/insert_timeline son conceptuales hasta descubrir el MCP disponible. Auditar fps/timecode, pistas, transparencia y rango antes de operar; probar sobre timeline duplicada de ensayo.

N10 demuestra título vertical enérgico con identidad OpenDesign y colocación en intervalo [00:05,00:08) de timeline de ensayo. Convertir segundos a frames usando fps y convención de la timeline; decidir si Hyperframes aporta algo según el pedido, y demostrar también una variante que pruebe el handoff combinado. No obligar a usar todas las herramientas siempre.

## Riesgos y decisiones de revisión

1. Copia incompleta/fonts externas: inventario y hashes, baseline completo antes de extracción.
2. Acoplamiento React/Next/alias: grafo de imports y prueba Node N03; no eliminar React del bundle por confundirlo con UI del editor.
3. Fallback y diagnostics engañosos: pruebas inyectadas de fallo, distinguir GL y encoder, GPU forzada sin CPU y excepción PNG revisada.
4. Diferencias de codec/contenedor y alpha: probe y composición visual de artifacts reales antes de prometer compatibilidad.
5. Duración/defaults/random: normalización única y comparación de frames con mismo seed/entorno; determinismo de composición no implica bytes idénticos entre GPU/codec/máquinas.
6. Cleanup/cancelación/colisiones: publicación privada, cancelación real y tests de aislamiento; no heredar eliminación de entregables.
7. Timeouts MCP y recursos WebGL: job acotado, concurrencia baja, mediciones reales antes de ampliar diseño.
8. Distribución/licencias de Chromium, Remotion, fonts y assets: inventario y revisión N11; no afirmar permiso de redistribución sin comprobar términos vigentes.
9. Baseline local distinto del instalador: 0.1.4 y tests no prueban identidad del binario; registrar hash del instalador y límites de trazabilidad. No reconstruir producción.

## N01 validated addendum — 2026-09-07

N00 passed in Automation and N01 audited the copied code at commit `4cf9b1a2063fa39846a3c31e32099f7a9c185b2b`. The B+C recommendation is supported by the observed code shape: `src/app/api/render/route.ts:144-178` owns bundling and renderer imports, while `:273-339` nests the main video attempt loop inside the Next POST handler. A pure runner wrapper would either carry Next or duplicate that loop.

The main route preserves the required render invariants: video uses `renderMedia` in the attempt loop (`route.ts:285-320`) and PNG uses only `renderFrames` (`route.ts:218-271`). N01 found no prohibited video transcode chain. N01 also confirmed that cancellation is absent from the main route, PNG is CPU-labelled, diagnostics describe configured attempts rather than probed hardware/encoders, cleanup deletes old delivered-looking media, and opaque ProRes can receive an `.mp4` extension (`route.ts:180-184`). These are review risks, not fixes.

Catalog evidence confirms 32/32/32 for `AnimationStyle`, registry, and text catalog, plus 41/41 for particle type and background catalog. See `docs/automation/evidence/N01/catalog-equivalence.json` and `AUDIT.md` for file:line references. No N02 source files exist yet.
