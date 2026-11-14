# TEXT ANIMATION AUTOMATION — MASTER PLAN

Estado vigente: N00 — REMEDIATION IN REVIEW; N01 — REMEDIATION IN REVIEW; N02 — BLOCKED. Fecha: 2026-09-07. Solo Astra puede cerrar gates. La única ejecución autorizada es la remediación documental y reproducción controlada N00/N01.

Objetivo: habilitar Codex → Text Animation → asset correcto mediante un motor especializado y desacoplado. Este documento autoriza la preparación de N00/N01 para revisión; no acredita que esos gates hayan sido ejecutados.

Arquitectura B+C ratificada por Astra: Next / CLI / MCP → Automation Core → Remotion Adapter. Es una decisión aprobada, no una capacidad implementada. Las resoluciones vigentes están en ARCHITECTURE.md, sección «Decisiones Astra incorporadas».

Stack observado: Next 14.2.15, React 18, Remotion 4.0.520, TypeScript, Vitest 2 y Electron 35. Conservar package.json y package-lock.json durante el baseline. No actualizar versiones para preparar este proyecto.

## Autoridad y límites

- Astra: decisiones estructurales, revisión de evidencias y aprobación de gates.
- Luna: ejecutor principal de copia, verificación, auditoría e implementación autorizada.
- Sol: segunda opinión únicamente ante bloqueo técnico documentado con intentos y evidencia.
- Producción: `K:\ANTIGRAVITY\HABILIDADES\TEXT ANIMATION`, FROZEN / PRODUCTION / READ ONLY.
- Instalador autoritativo: `K:\ANTIGRAVITY\HABILIDADES\TEXT ANIMATION\release-p16-product-final\Text Animation Setup 0.1.4.exe`.
- Único destino de escrituras: `K:\ANTIGRAVITY\HABILIDADES\TEXT ANIMATION AUTOMATION`.
- La carpeta previa `TEXT ANIMATION\TEXT ANIMATION AUTOMOTION` no es este proyecto. No usarla, moverla ni eliminarla: hacerlo escribiría en producción.
- No ejecutar comandos de proyecto desde producción, ni instalar, compilar, inicializar Git, modificar documentación o enlazar sus carpetas mutables.
- No implementar N02–N11 hasta revisión. No iniciar automáticamente otra tarea/modelo.

## Remediación vigente y frontera aprobada

- N00: limitación histórica TEMP/TMP/tool-cache = UNKNOWN / NOT CAPTURED; reproducción nueva con entorno de proceso confinado, rutas efectivas, logs, códigos de salida y comparación de producción/instalador. No prueba retroactiva. Evidencia: evidence/N00/ISOLATION-REPRODUCTION.md.
- N01: auditar HDR remoto Drei, fuentes 2D y cierre de imports locales; distinguir bundled/local, runtime local, remote, browser fallback y pending N03. Corregir cancelación: callbacks antes/después no demuestran interrupción del renderer.
- Decisiones vinculantes de Astra: ARCHITECTURE.md, «Decisiones Astra incorporadas». B+C ratificado; schemas cerrados, perfiles declarados, host roots, PNG CPU heredado y diagnostics requested/configured/observed con null desconocido. Son decisiones, no funcionalidades terminadas.
- Futuro N02: contracts, validation, normalize, catalog, policy, filesystem, lifecycle, diagnostics, renderer interface, characterization/parity primero y adaptación mínima Next al único Core. No Node/headless/media reales ni integraciones.
- N03: Node real, codecs/alpha, fonts/assets runtime, observación hardware, cancelación activa/timeout e inspección de artifacts. Los resultados simulados N02 no sustituyen este gate.
- Entregar remediación con commit propio y working tree limpio. Astra revisa; Luna no declara CLOSED. N02 BLOCKED / NOT STARTED.

## N00: instrucciones históricas (no sustituyen la remediación vigente)

1. Resolver rutas absolutas y sus ancestros. Verificar que Automation es hermana de producción, no descendiente ni alias por junction/symlink. Rechazar reparse points en origen de copia, destino o ancestros que invaliden aislamiento. Inventariar archivos existentes de Automation y preservar estos planes. No sobreescribir contenido no reconocido.
2. Crear `docs/automation/evidence/N00/`. Antes de copiar, generar allí un manifiesto de producción: rutas relativas, tamaños, atributos, LastWriteTimeUtc y SHA-256 de cada archivo regular; registrar directorios y enlaces sin seguirlos. Incluir explícitamente instalador, source, lockfile, configuración, tests, docs y outputs. Nunca escribir el manifiesto en producción. Un cambio externo durante la captura invalida la comparación y exige explicarlo, no atribuirlo automáticamente al ejecutor.
3. Preparar inventario de copia revisable con motivo de inclusión/exclusión y hashes. Incluir `src/`, `tests/`, `electron/`, `public/` salvo outputs; `package.json`, `package-lock.json`, `tsconfig.json`, `next-env.d.ts`, `next.config.mjs`, `remotion.config.ts`, `vitest.config.ts`, `.eslintrc.json`, `.gitignore`, `postcss.config.mjs`, `tailwind.config.ts`, `README.md`. Preservar fonts y assets transitivos usados por composiciones, defaults y tests. Leer imports, staticFile, URLs y configuración antes de excluir un asset.
4. Copiar archivos regulares independientemente, sin hardlinks, symlinks ni junctions. Excluir `.git`, `node_modules`, `release*`, staging, `.next`, caches, renders, tmp, temporales, tsbuildinfo, backups, `.backup`, `CHANGES_DELIVERY_2026-03-22`, `NEW APPROACH` y la carpeta errónea anterior. Revisar patrones por contexto: no excluir un source solo porque su nombre contiene render. Copiar documentación técnica requerida por dependencias y baseline; registrar qué docs se preservaron. No copiar secretos, sesiones ni `.env` privados. Si el código necesita alguno, documentar la configuración requerida sin su valor.
5. Comparar hashes origen/copia para todos los archivos seleccionados. Registrar cobertura de assets/fonts y ausencia de enlaces/carpetas mutables compartidas. Inspeccionar scripts npm y configuración para detectar escrituras fuera de Automation antes de ejecutarlos.
6. Desde Automation solamente: `git init`; comprobar `git rev-parse --show-toplevel`. Sin remotos, sin push. Ajustar únicamente el `.gitignore` de Automation para ignorar dependencias, caches, outputs y evidencia voluminosa; conservar manifiestos, resúmenes y planes revisables. Documentar cualquier diferencia respecto a la copia. Commit inicial exacto: `baseline-stable-source`. Registrar `git rev-parse HEAD` en `docs/automation/evidence/N00/RESULT.md` después del commit, evitando autorreferencia del hash.
7. Mantener lockfile idéntico. Registrar Node/npm/OS y `npm ci` con códigos de salida. Configurar cache npm, TEMP/TMP y caches de herramientas dentro de Automation; comprobar rutas de descarga de Chromium antes de su uso. No reutilizar node_modules de producción. Si falta conectividad o runtime, reportar bloqueo; no declarar PASS ni alterar dependencias para esconderlo.
8. Ejecutar secuencialmente desde Automation: `npm run test:editor`, `./node_modules/.bin/tsc.cmd --noEmit --incremental false`, `npm run lint`, `npm run build`. Guardar stdout/stderr y exit code de cada uno bajo evidencia N00. La referencia requerida es 59 archivos y 366 tests; cualquier diferencia exige reconciliación explícita antes de PASS. No se han ejecutado aquí estas comprobaciones.
9. Si falla por copia incompleta, incorporar únicamente los archivos necesarios a Automation, registrar hashes y causa, y repetir checks afectados. No debilitar tests, lint o TypeScript. Si parece defecto heredado, documentar FAIL y elevar; N00 no autoriza un refactor funcional. Registrar commit de correcciones aparte del inicial.
10. Volver a generar el manifiesto de producción con el mismo algoritmo y comparar contenido, existencia y metadatos de modificación. No comparar atime, que puede cambiar al leer. Exigir cero cambios atribuibles al trabajo. Registrar hashes inicial y validado, comandos, resultados, exclusiones y estado Git en RESULT.md. Commit de evidencia resumida separado. Si N00 es FAIL/BLOCKED, detenerse antes de N01.

## N01: instrucciones ejecutables

1. Trabajar sobre la copia verificada y su commit, leyendo producción solo para resolver procedencia. Crear `docs/automation/evidence/N01/`.
2. Mapear con referencias `archivo:línea` la ruta `/api/render` completa, su rama PNG, composición Main, Root, registry, catálogo, defaults, tipos, metadata, duration/fps/dimensions, alpha, ProRes 4444, GPU Auto/GPU/CPU, env overrides, encoder, diagnostics, intentos/fallback, temporal, outputLocation, delivery y cancelación. Marcar ausencias como tales.
3. Seguir imports transitivos de `MainComposition`, `AnimationContext`, componentes compartidos y bundle. Separar dependencias de navegador necesarias para Remotion de dependencias del editor, servidor Next y Electron. Inventariar fuentes, paths absolutos, URLs remotas, random/time y usos de process.cwd. Verificar igualdad de IDs entre tipo AnimationStyle, catálogo y registry; referencia esperada: 32.
4. Comparar A: invocar rutas actuales; B: extraer backend reutilizable; C: runner alrededor de funciones actuales. Evaluar dependencia de servidor, duplicación, esfuerzo, parity, filesystem, cancelación y distribución. Actualizar ARCHITECTURE.md con decisión sustentada en código y lista exacta de archivos que N02 necesitaría tocar, todos en Automation.
5. Diseñar caracterización: tests existentes que cubren invariantes, casos faltantes, fixtures representativos 2D/3D, matrix GPU/codecs/PNG y expectativas. Se permiten pequeños probes de auditoría en evidencia N01, sin cambiar código funcional. Un probe de Node sin UI es opcional; su ausencia debe quedar explícita y no se presentará como headless validado. La demostración completa pertenece a N03.
6. Especificar contratos normalizados, límites MVP y errores; confirmar manejo del PNG CPU, env contradictorias, contenedor ProRes opaco, encoder real frente a solicitado y cancelación ausente. No convertir hallazgos en fixes dentro de N01.
7. Entregar `AUDIT.md`, `DEPENDENCIES.md`, `TEST-MATRIX.md`, `RISKS.md`, `RESULT.md` y actualización de los tres planes, con commit de auditoría. Repetir comprobación de integridad de producción. Si se ejecutaron probes, registrar comandos y efectos.
8. Detenerse: Astra revisa N00/N01 y ratifica contratos. La entrega de auditoría no aprueba automáticamente N02.

## Secuencia y revisiones

N00 → N01 → revisión explícita → N02 → N03 → N04 → N05 → N06 (MVP). N07, N08 y N09 dependen de N06 y se validan individualmente; N10 requiere los tres; N11 endurece/distribuye el conjunto aprobado. Cada gate produce evidencia y commit propio. FAIL bloquea gates dependientes; BLOCKED describe falta de entorno/autoridad y nunca equivale a PASS.

No comenzar con daemon, DB, colas persistentes, WebSocket, cloud, autenticación compleja, contenedores, telemetría o microservicios. Un job y un artifact por petición MVP; Codex puede secuenciar varios jobs. La ruta batch heredada se preserva durante baseline y se audita, pero no obliga a exponer batch en MCP v1.

## Historical execution report — superseded by remediation review

- **N00 PASS** — independent Automation copy, locked dependency install, 59/366 baseline, TypeScript, ESLint, build, and production integrity evidence complete. Baseline commit: `2a07c35da741450d96a388b822f1363e8f2f8d91`; N00 evidence/correction commit: `4cf9b1a2063fa39846a3c31e32099f7a9c185b2b`.
- **N01 PASS / READY FOR ARCHITECTURE REVIEW** — render/dependency/catalog/test/risk audit complete; recommendation is B+C. Evidence: `docs/automation/evidence/N01/`.
- **STOP** — do not begin N02 or any CLI/MCP/headless implementation until Astra reviews and ratifies the N01 recommendation, contracts, output profiles, cancellation semantics, and filesystem boundaries.

## Prompt histórico N00/N01 — no ejecutar; reemplazado por remediación

```text
Actúa como ejecutor principal Luna de TEXT ANIMATION AUTOMATION. Ejecuta únicamente N00 y N01 del plan local y después DETENTE.

Lee por completo:
K:\ANTIGRAVITY\HABILIDADES\TEXT ANIMATION AUTOMATION\docs\automation\MASTER-PLAN.md
K:\ANTIGRAVITY\HABILIDADES\TEXT ANIMATION AUTOMATION\docs\automation\ARCHITECTURE.md
K:\ANTIGRAVITY\HABILIDADES\TEXT ANIMATION AUTOMATION\docs\automation\GATES.md

Producción K:\ANTIGRAVITY\HABILIDADES\TEXT ANIMATION es FROZEN / PRODUCTION / READ ONLY. Nunca escribas allí, ni la uses como cwd de comandos de proyecto. Su instalador autoritativo es release-p16-product-final\Text Animation Setup 0.1.4.exe. No uses ni borres la subcarpeta TEXT ANIMATION AUTOMOTION creada previamente.

Todas las escrituras, Git local, dependencias independientes, caches, temporales, evidencia y outputs deben quedar en K:\ANTIGRAVITY\HABILIDADES\TEXT ANIMATION AUTOMATION. No enlaces ni compartas carpetas mutables con producción. Preserva los planes existentes. Resuelve rutas y reparse points antes de copiar o ejecutar.

Ejecuta los diez pasos N00 del MASTER-PLAN: manifiestos de integridad antes/después, copia selectiva independiente, assets/fonts necesarios, Git solo en Automation y commit inicial baseline-stable-source con hash registrado; npm ci y baseline test:editor (59 archivos/366 tests como referencia), TypeScript, ESLint y Build, con logs y exit codes. No declares PASS si un check falla o la discrepancia de conteo queda sin resolver. Corrige copias incompletas solo en Automation; no refactorices ni debilites checks. Si N00 no pasa, reporta y detente.

Después ejecuta los ocho pasos N01. Audita el código real con archivos/líneas y commit: rutas de video/PNG, renderMedia/renderFrames, Root/Main, registry/catalog/defaults/types/props, duration/fps/dimensions, alpha/ProRes, GPU/env/encoder/diagnostics/fallback, paths/temporales/cancelación/delivery y dependencias Next/Electron/UI. Compara A/B/C; recomienda una arquitectura y ratifica o corrige los contratos preliminares con evidencia. Audita los riesgos ya identificados sin implementarlos. Entrega mapa de dependencias, matriz de tests y alcance exacto de extracción para N02.

Conserva una única llamada efectiva exitosa renderMedia por archivo de vídeo, admitiendo intentos fallidos registrados; PNG exclusivamente renderFrames. Prohibidos renderFrames→FFmpeg→video y renderMedia→intermedio→segundo renderMedia. No cambies silenciosamente Auto/GPU/CPU. No implementes N02, CLI, MCP ni integraciones. No modifiques OpenDesign, Hyperframes o DaVinci. Usa Sol solo si un bloqueo complejo documentado justifica escalar.

Entrega estado PASS/FAIL/BLOCKED por N00/N01, hashes de commits, rutas de evidencias, resultados exactos de checks, diferencias del baseline, prueba de integridad de producción, recomendación A/B/C, riesgos y decisiones que requieren revisión de Astra. Finaliza con N00/N01 — READY FOR ARCHITECTURE REVIEW. No avances sin revisión.
```
