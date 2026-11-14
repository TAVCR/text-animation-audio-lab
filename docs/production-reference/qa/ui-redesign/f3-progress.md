# F3 — Plantillas de texto

## T01 — Typewriter

Estado: F3/T01 — COMPLETADA.

- Segmentación por grafemas con `Intl.Segmenter`, incluyendo emojis compuestos y ZWJ.
- `charactersPerSecond` contextual para Typewriter: 1–60, default 15, con reset y ayuda accesible.
- Duración determinista basada en grafemas/CPS/FPS; `speed` global se aplica una sola vez.
- Cursor: mostrar/ocultar, barra/guion bajo/bloque y parpadear/ocultar/mantener al terminar.
- Compatibilidad con documentos antiguos sin `charactersPerSecond` mediante default seguro.
- Validación manual T01: PASS con `Hola 👨‍👩‍👧‍👦 Costa Rica 🇨🇷`, CPS 5 y cursor bloque persistente.
- Tests dirigidos T01: PASS.
- `npm run test:editor`: PASS — 16 archivos, 47 tests.
- TypeScript: PASS.
- ESLint: PASS, 0 warnings/errors.

F3/T01 y la validación por familias quedan completadas. F4 y F5 no se inician.

## Estrategia F3 por familias

La validación se hará por contrato compartido y se promoverá a revisión individual cuando aparezca timing, props, rama o arquitectura propia. `StyledRangeText` es un consumidor común de apariencia/rangos, pero no implica que el timing sea común. La cobertura contractual 26/26 se ejecuta con un smoke test data-driven; el render visual queda para representantes y arquitecturas que puedan aislarse correctamente.

### Checkpoint de cobertura común

- `template-contract.test.ts`: PASS — 26/26 IDs activos cubiertos individualmente dentro de un test parametrizado; 27 assertions/tests totales.
- Registro, descriptor, nombre visible, componente resoluble, defaults numéricos finitos, contenido base, claves únicas y tamaño completo del registro: PASS.
- El warning de Three.js múltiple proviene de importar el registro completo para comprobar resolubilidad; no genera fallo y no se usó jsdom para forzar renders 3D.

### Representantes de familia — primer checkpoint

- `slide-in`, `wipe-reveal`, `glitch`, `flicker` y `bar-reveal`: test dirigido inicial PASS (`5/5`). Se validaron orden de palabras, markup de reveal, salida finita y ausencia de `NaN`/`Infinity` bajo un fixture de Remotion con frame determinista.
- `extruded-3d`: validada visualmente con apariencia global funcional; `ai-circuit-hud` fue retirada del catálogo por decisión de producto.
- El primer fallo fue del fixture — faltaba `durationInFrames` — y se corrigió sin modificar producción.

### Representantes y cobertura compacta — segundo checkpoint

- `family-representatives.test.tsx`: PASS — 16 pruebas dirigidas.
- Representantes visuales aislables: `slide-in`, `wipe-reveal`, `glitch`, `flicker` y `bar-reveal`.
- Grupo compacto con contrato común y salida finita: `bubble-pop`, `blur-reveal`, `neon-pulse`, `slide-reveal`, `smooth-sliding`, `clean-modern`, `follower-grow`, `blur-cascade` y `apple-style`.
- Arquitectura especial: `extruded-3d` validada por registro y props específicas, sin forzar WebGL en jsdom.
- `ai-circuit-hud`: eliminada del catálogo y registro activos; el inventario de plantillas de texto pasa de 27 a 26.
- La primera aserción literal del grupo compacto se corrigió porque varias plantillas renderizan por grafema; no hubo cambio de producción.
- El smoke dirigido de las plantillas individuales restantes (`scramble`, `rotation`, `flicker-outline-fill`, `kinetic-box-sequence`, `shape-reveal`, `fly-through`, `viral-text`, `shake-flicker` y `cinematic`) queda PASS.

### QA manual final por familias

- `slide-in`: PASS — entrada por palabras desde abajo, stagger y estado final estable.
- `wipe-reveal`: PASS — máscara completa sin clipping.
- `glitch`: PASS — interferencia temporal, separación cromática y recuperación estable.
- `flicker`: PASS — flicker perceptible y final válido.
- `bar-reveal`: PASS — barra única, secuencia correcta y contenido completo.
- `extruded-3d`: PASS — geometría, profundidad y controles globales de apariencia utilizables tras la corrección.
- `ai-circuit-hud`: RETIRADA — QA cancelado por decisión explícita del usuario; no forma parte del catálogo activo ni del QA final.
- Sanity checks: `bubble-pop`, `blur-reveal` y `flicker-outline-fill`: PASS.

## Cierre F3

Estado: `F3 — COMPLETADA`.

- Catálogo activo: 26 plantillas únicas.
- Cobertura contractual: 26/26 plantillas activas.
- Suite automatizada final: 102/102 tests PASS.
- TypeScript: PASS.
- ESLint: PASS.
- Build: PASS.
- Compatibilidad: documentos antiguos con `ai-circuit-hud` migran de forma segura a `typewriter`.
- Pendientes estéticos no bloqueantes: ninguno registrado que impida el cierre.

| ID | Componente | Familia propuesta | Cobertura | Diferencia que puede promoverla |
|---|---|---|---|---|
| typewriter | TypewriterEffect | Escritura progresiva | Individual, T01 completada | Grafemas, CPS, cursor |
| slide-in | KineticSlideIn | Palabras con spring | Representante de familia | Dirección, rebote, retardo |
| bubble-pop | BubblePopEffect | Palabras con spring | Contrato + dirigida | Escala elástica sin desplazamiento |
| glitch | GlitchEffect | Interferencia por frame | Individual | Copias RGB y semilla |
| wipe-reveal | WipeRevealEffect | Reveal/máscara | Representante | Dirección y suavidad de máscara |
| blur-reveal | BlurRevealEffect | Reveal con spring | Contrato + dirigida | Blur/escala inicial |
| scramble | ScrambleEffect | Sustitución por frame | Individual | Texto aleatorio determinista |
| neon-pulse | NeonPulseEffect | Estilo por frame | Contrato + dirigida | Pulso/glow |
| slide-reveal | SlideRevealEffect | Reveal con spring/máscara | Contrato + dirigida | Movimiento y máscara combinados |
| follower | FollowerEffect | Palabras seguidoras | Representante | Dirección y stagger |
| rotation | RotationRevealEffect | Palabras con rotación | Individual | Transformación 3D por palabra |
| flicker | FlickerEffect | Parpadeo | Representante | Ventanas de flicker |
| flicker-outline-fill | FlickerOutlineFillEffect | Parpadeo con identidad de apariencia | Individual | Relleno/borde propios |
| kinetic-box-sequence | KineticBoxSequenceEffect | Secuencia de cajas/barras | Individual | Modelo de contenido y duración por elemento |
| smooth-sliding | SmoothSlidingText | Deslizamiento continuo | Contrato + dirigida | Cascada/dirección propia |
| shape-reveal | ShapeRevealEffect | Reveal con forma | Individual | Forma, gradiente y máscara |
| fly-through | FlyThroughEffect | 3D de texto | Arquitectura especial | Perspectiva y profundidad |
| clean-modern | CleanModernText | Texto estático/entrada simple | Contrato + dirigida | Entrada mínima |
| bar-reveal | BarRevealEffect | Reveal con barra y palabras A/B | Individual | Barra permanente y contenido especial |
| follower-grow | FollowerGrowRotate | Palabras con crecimiento | Contrato + dirigida | Crecimiento/rotación |
| viral-text | ViralTextEffect | Texto especializado por líneas | Individual | Título/líneas y no duplicación |
| shake-flicker | ShakeFlickerEffect | Flicker con shake | Individual | Ruido y desplazamiento |
| blur-cascade | BlurringTextCascade | Cascada con blur | Contrato + dirigida | Cascada por segmentos |
| cinematic | CinematicText | Entrada/salida cinematográfica | Individual | Fases in/out |
| apple-style | AppleStyleText | Estilo de marca/entrada suave | Contrato + dirigida | Timing y acabado propios |
| extruded-3d | Extruded3DEffect | 3D extruido | Arquitectura especial | Geometría/material |

### Cobertura común — cerrada

El smoke test parametrizado sobre los 26 IDs activos y la validación de representantes por familia ya están registrados arriba como PASS. No quedan acciones pendientes en esta sección.
