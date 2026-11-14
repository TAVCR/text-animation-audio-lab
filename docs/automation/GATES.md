# TEXT ANIMATION AUTOMATION — GATES

Todos los archivos mencionados son relativos a `K:\ANTIGRAVITY\HABILIDADES\TEXT ANIMATION AUTOMATION`. Producción nunca es destino de cambios. Estado inicial de todos los gates: NOT EXECUTED. Este plan no certifica ningún PASS.

Estado vigente: N00 — REMEDIATION IN REVIEW; N01 — REMEDIATION IN REVIEW; N02 — BLOCKED. Astra rechazó el cierre N00 por evidencia histórica TEMP/TMP/tool-cache incompleta, no por una modificación demostrada de producción. Esta remediación no cierra gates automáticamente.

Cada gate entrega `docs/automation/evidence/Nxx/RESULT.md` con commit de entrada/salida, entorno, comandos, exit codes, resultados, riesgos, evidencia y conclusión. PASS requiere cumplir todos sus criterios; cualquier criterio incumplido produce FAIL; falta de entorno/servicio produce BLOCKED, no una validación simulada. Astra revisa resultados antes de abrir el siguiente alcance. N01 tiene STOP obligatorio antes de N02.

Rollback común: detener procesos propios y conservar logs/evidencia; revertir solo commits identificados del gate en Automation tras revisar cambios del usuario. No reset --hard ni borrado recursivo amplio. No tocar producción ni recuperar archivos allí. Cada gate añade su rollback específico.

## N00 — ISOLATION BASELINE

- Objetivo: copia independiente trazable que reproduce el baseline.
- Alcance: diez pasos N00 del MASTER-PLAN, sin extracción.
- Archivos potenciales: src, tests, public necesario, electron, configs/lockfile y docs copiados; .gitignore local; evidencia N00.
- Prohibiciones: escrituras en producción, copiar outputs históricos, enlaces, dependencia compartida, updates, cambios funcionales o debilitamiento de checks.
- Tests: aislamiento canónico y reparse points; hashes de copia; npm ci; test:editor 59 archivos/366 tests de referencia; tsc --noEmit --incremental false; lint; build; manifiesto producción antes/después.
- PASS: checks exit 0, conteos conciliados sin omisiones, commit baseline-stable-source y hash registrados, cero cambios atribuibles en producción y ninguna ruta mutable compartida.
- Rollback: conservar documentación/evidencia, revertir solamente cambios N00 identificados dentro de Automation; nunca borrar la carpeta equivocada en producción.

## N01 — ARCHITECTURE AUDIT

- Objetivo: decidir cómo ejecutar desde Node sin UI y sin duplicar motor.
- Alcance: mapa de código/depencias, comparación A/B/C, contratos, caracterización, riesgos; ocho pasos N01 del MASTER-PLAN.
- Archivos potenciales: tres planes; evidence/N01/{AUDIT,DEPENDENCIES,TEST-MATRIX,RISKS,RESULT}.md y probes aislados opcionales.
- Prohibiciones: implementar N02 o alterar motor/tests heredados para hacer pasar hipótesis; asumir compatibilidad de consumidores sin prueba.
- Tests: trazabilidad archivo:línea al commit N00; comprobar IDs catálogo/registry/tipo; cada dimensión de auditoría debe tener evidencia o ausencia explícita; revisar matriz GPU/PNG/env y plan de parity.
- PASS: recomendación justificada A/B/C, contratos revisables, inventario de extracción concreto, todos los puntos del brief mapeados y revisión Astra aprobada. Una auditoría entregada sin revisión queda READY FOR REVIEW.
- Rollback: revertir solo documentación/probes de este gate. STOP antes de N02.

## N02 — AUTOMATION CORE

Estado: BLOCKED / NOT STARTED. Decisiones de Astra en ARCHITECTURE.md aprobadas solo como arquitectura. Requiere cierre explícito N00/N01 por Astra antes de ejecución.

Frontera vinculante: contracts, runtime validation, normalize, catalog, policy, filesystem, lifecycle, diagnostics, renderer interface y characterization/parity con dobles. Next pasa a adaptador de compatibilidad del único Core, sin backend independiente. No headless real ni media real N03.

Schemas comunes + extensiones cerradas por animationId; unknown keys rechazadas. Host roots y solo outputName basename. PNG mantiene CPU heredado con LEGACY_PNG_CPU_POLICY cuando aplique; diagnostics requested/configured/observed, observaciones null. Perfiles h264-opaque/prores4444-alpha/vp9-alpha/png-alpha declarados, pendientes N03; no ProRes/MP4 nuevo. No consumidores ni Codex config.

- Objetivo: núcleo reutilizable con normalización, política y lifecycle únicos.
- Alcance: contratos ratificados N01, extracción mínima, catálogo separado y filesystem; caracterización primero. Metadata cubre 32 IDs con schemas válidos.
- Archivos potenciales: src/automation/{contracts,normalize,core,filesystem,catalog}.ts o equivalentes aprobados; src/lib/render; ruta Next copiada como adaptador; tests/automation; configuración de tests separada para no diluir baseline.
- Prohibiciones: duplicar backend, reescribir animaciones, integrar consumidores, corregir silenciosamente semántica heredada.
- Tests: defaults/duration/dimensions; IDs y parámetros desconocidos; matriz Auto/GPU/CPU; GPU+env desactivada; PNG policy; traversal/UNC/ADS/junction/nombres reservados/colisión; limpieza solo del job; caracterización antes/después y baseline completo.
- PASS: un servicio compartido, contratos validados runtime, riesgos de N01 resueltos mediante decisiones explícitas, aislamiento probado y suite heredada sin regresión.
- Rollback: revertir extracción/adapter conjuntamente al commit N01; conservar evidencia.

## N03 — HEADLESS RENDERER

Responsabilidad exclusiva de este gate: Node real, renderMedia/renderFrames, codecs y alpha reales, observación hardware, interrupción activa del renderer y timeout, fuentes/assets runtime e inspección de artifacts. Callbacks o simulaciones N02 no demuestran estas capacidades. Incluir HDR remoto de Drei, ausencia de carga CSS de fuentes 2D en bundle Remotion y fallback tipográfico en matriz offline/missing asset. Cualquier localización/fix requiere alcance N03 aprobado, no esta remediación.

- Objetivo: render real Node sin Next/Electron/editor.
- Alcance: adapter Remotion, paths y assets explícitos, cancelación/timeout, artifacts verificados.
- Archivos potenciales: src/automation/remotionAdapter.ts y inspect.ts; entry/build Node aprobado; tests/automation; fixtures y outputs/evidence N03.
- Prohibiciones: renderFrames→FFmpeg→video; dos renderMedia exitosos para un archivo; segundo render tras error de inspección; servidor Next requerido.
- Tests: instrumentar éxito/fallo por llamada; vídeo opaco, ProRes4444 alpha, VP9 alpha y PNG; 16:9/9:16/1:1; frames inicial/medio/final; 2D y 3D; CPU real, Auto fallback inyectado, GPU forzada sin CPU; cancelación sin retry; missing font/asset; probe codec/dimensiones/fps/duración; alpha sobre fondos contrastantes; repeat de frames con entorno fijo. Smoke de las 32 entradas; no afirmar GPU hardware probado si solo se usaron mocks.
- PASS: archivos reproducibles desde Node, metadata congruente, PNG solo renderFrames y exactamente un renderMedia exitoso por vídeo; rutas confinadas y cleanup correcto. Cobertura de GPU real documentada o gate bloqueado para esa capacidad.
- Rollback: revertir adapter/build, eliminar solamente temporales de jobs identificados tras detenerlos; conservar fixtures y artifacts de evidencia.

## N04 — CLI

- Objetivo: list/describe/render/still/inspect utilizables por procesos.
- Alcance: CLI delgado, --json, exit codes, SIGINT.
- Archivos potenciales: src/cli/index.ts; package.json/bin y lockfile solo si se justifica dependencia; tests/cli; docs CLI.
- Prohibiciones: duplicar normalización/render; logs en stdout JSON; inspect de rutas libres.
- Tests: cinco comandos reales; JSON parseable; job inválido; ID inexistente; ruta con espacios; ejecución desde cwd ajeno; output fuera de root; salida por SIGINT y error de renderer.
- PASS: comandos documentados producen contrato único y códigos estables, render real coincide con N03 y no depende del cwd.
- Rollback: revertir bin/CLI y cambios de paquete del gate.

## N05 — TEXT ANIMATION MCP

- Objetivo: exponer exactamente cinco tools tipadas sobre core.
- Alcance: list_animations, describe_animation, render_animation, render_still, inspect_render; stdio y configuración local del servidor.
- Archivos potenciales: src/mcp/server.ts; schemas reutilizados; package state; tests/mcp; docs MCP.
- Prohibiciones: filesystem libre, tools de DaVinci/Hyperframes/OpenDesign, roots controladas por el request, daemon/DB/cola persistente.
- Tests: cliente MCP real enumera exactamente cinco tools; schema rechaza campos extra; render/inspect real; errores estructurados; path attacks; stdout limpio; desconexión/cancelación y timeout según capacidades reales del host.
- PASS: protocolo válido y resultado real confinado con semántica equivalente a CLI; duración del job compatible con host o límite explícito validado.
- Rollback: retirar únicamente registro/configuración de este servidor y revertir adapter/dependencias del gate.

## N06 — CODEX ORCHESTRATION

- Objetivo: demostrar MVP Codex → Text Animation → asset correcto.
- Alcance: discovery, describe, selección de parámetros, render e inspect desde Codex.
- Archivos potenciales: docs/orchestration/codex.md; ejemplos JSON; evidencia N06; configuración local específica aprobada.
- Prohibiciones: usar UI o CLI manual para aparentar éxito MCP; ampliar tools.
- Tests: pedido en lenguaje natural produce vídeo y pedido de frame produce PNG; corregir petición inválida vía contrato; verificar outputs y metadata.
- PASS: evidencia de llamadas reales y artifacts correctos, sin intervención manual que sustituya al flujo evaluado.
- Rollback: desregistrar solo configuración propia del gate y conservar resultados. MVP alcanzado solamente aquí.

## N07 — OPENDESIGN ORCHESTRATION

- Objetivo: traducir identidad visual mediante Codex.
- Alcance: auditar proyecto, DESIGN.md, palette, fonts, assets, layout/context y CLI/MCP realmente disponibles; mapping a catálogo/parameters.
- Archivos potenciales: docs/orchestration/opendesign.md; fixtures locales autorizados y evidencia N07.
- Prohibiciones: modificar OpenDesign o hacer que el motor parsee DESIGN.md; inventar fonts/assets disponibles.
- Tests: fixture de identidad con provenance; comparación de colores/font/texto/layout con render; font faltante se reporta o usa sustitución explícita registrada.
- PASS: Codex obtiene diseño por mecanismo real, mapping rastreable y asset verificado; proyecto OpenDesign intacto.
- Rollback: revertir solamente mapping/docs propios; conservar diseño externo.

## N08 — HYPERFRAMES ORCHESTRATION

- Objetivo: seleccionar handoff por POC real.
- Alcance: matriz ProRes4444/PNG/PNG sequence/WebM alpha y soporte observado; composición de prueba.
- Archivos potenciales: docs/orchestration/hyperframes.md; consumer fixture y evidencia N08 dentro de Automation.
- Prohibiciones: dependencia Hyperframes dentro del core; afirmar soporte por intuición; pipeline prohibido de vídeo.
- Tests: importar candidatos realmente soportados, exportar composición sobre fondos claros/oscuros; revisar alpha/bordes/color/fps/duración/rendimiento; marcar formatos rechazados con evidencia. Si sequence requiere capacidad nueva, delimitar y revisar ese subalcance antes de implementarlo.
- PASS: al menos un formato de handoff conserva el efecto y transparencia requerida en export real; matriz explica descartes.
- Rollback: revertir fixture/configuración propia, no instalación/proyectos ajenos.

## N09 — DAVINCI ORCHESTRATION

- Objetivo: render → importación → inserción mediante servidores separados.
- Alcance: descubrir tools reales del MCP DaVinci y trabajar sobre timeline de ensayo duplicada; inspección de fps/timecode/tracks.
- Archivos potenciales: docs/orchestration/davinci.md; evidencia N09. Cambios externos solo en proyecto/timeline de ensayo autorizados.
- Prohibiciones: add_to_davinci en Text Animation; modificar timeline original ajena al ensayo; asumir fps/timecode.
- Tests: importar artifact real, insertar rango conocido, confirmar in/out/duración/pista/alpha y ausencia de desplazamientos no pedidos.
- PASS: evidencia antes/después muestra inserción exacta por orquestación Codex entre MCP independientes.
- Rollback: quitar solo clip de ensayo o restaurar copia de timeline registrada; nunca borrar media fuente.

## N10 — COMBINED WORKFLOW

- Objetivo: validar pedido completo de título vertical enérgico con identidad OpenDesign entre 00:05 y 00:08.
- Alcance: flujo integral en ensayo, incluyendo variante con Hyperframes; Codex decide herramientas necesarias en pedidos posteriores.
- Archivos potenciales: docs/orchestration/combined.md; job/mapping/manifiestos y evidencia N10; timeline de ensayo.
- Prohibiciones: acoplar motores; obligar herramientas innecesarias en todo pedido; sobrescribir timeline original.
- Tests: verificar identidad, animación, 9:16, duración, alpha, artifact provenance y intervalo [5s,8s) convertido al fps real; repetir con IDs nuevos sin colisiones.
- PASS: flujo real completo documentado y revisable, con inserción temporal correcta y handoffs demostrados; no basta pseudocódigo.
- Rollback: revertir únicamente inserciones/elementos de ensayo registrados, preservar assets y evidencia.

## N11 — HARDENING / DISTRIBUTION

- Objetivo: instalación independiente y operación reproducible.
- Alcance: paquete propio, runtime/Chromium/fonts/assets, límites de recursos, documentación, versiones y revisión de permisos de redistribución vigentes.
- Archivos potenciales: package state, scripts de distribución propios, docs install/troubleshooting, tests de instalación y outputs/release Automation.
- Prohibiciones: reutilizar nombre/appId instalador producción de modo que lo reemplace; publicar sin revisión; depender de rutas de producción; infraestructura especulativa.
- Tests: instalar y desinstalar en entorno limpio y path con espacios; CLI/MCP smoke; producción ausente; cancel/timeout/disco lleno/colisión y recovery; auditoría de paquete sin secretos; hashes y versiones; inventario de licencias.
- PASS: distribución autocontenida respecto a producción, dependencias externas documentadas, baseline/regresión y smoke reales pasan, revisión de redistribución completada y limitaciones claras.
- Rollback: desinstalar solo paquete Automation y restaurar su configuración previa, manteniendo outputs entregados y producción intactos.
