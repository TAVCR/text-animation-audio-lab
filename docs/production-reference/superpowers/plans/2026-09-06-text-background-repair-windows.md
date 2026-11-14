# Corrección integral de controles, efectos y distribución Windows — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. La autorización del usuario prevalece sobre las recomendaciones de las skills.

**Goal:** Corregir los defectos reportados y completar controles útiles en todo el catálogo, entregando un instalador Windows que funcione sin el workspace y permita usar todas las fuentes instaladas del equipo.

**Architecture:** Mantener AnimationProps como documento serializable, AnimationProvider como autoridad y MainComposition como entrada común de preview/export. Completar el Inspector realmente montado con secciones tipadas por capacidad; conservar componentes y efectos existentes y corregir sus contratos de tiempo, apariencia, fuentes y geometría. El runtime de escritorio enumerará fuentes y servirá recursos locales para preview y render.

**Tech Stack:** React 18, Next.js 14.2.15, Remotion 4.0.520, Three.js/R3F, TypeScript, Vitest/Testing Library, Electron 35, electron-builder/NSIS, Windows 11.

## 0. Autoridad, alcance y estado de esta entrega

- Workspace verificado: `K:/ANTIGRAVITY/HABILIDADES/TEXT ANIMATION`.
- Plan elaborado el 2026-09-06 mediante lectura de código. Versión leída en package.json: **0.1.3**, posterior a la 0.1.2 mencionada en conversación.
- Este documento es el entregable de planificación. No se han corregido implementaciones, ejecutado suites ni certificado visualmente los efectos en esta auditoría.
- Un defecto señalado por el usuario queda abierto aunque un test antiguo diga PASS. Un riesgo inferido del código no equivale a una causa reproducida.
- Preservar cambios existentes, presets, sesiones y fondos importados. No eliminar plantillas para ocultar fallos ni sustituirlas por Typewriter.
- No reiniciar fases históricas. El trabajo autorizado al ejecutor es este conjunto de correcciones, su verificación y el instalador.
- No considerar un HTTP 200, un test de helper ni un contador histórico como prueba de funcionamiento visual.
- Toda tarea cierra con evidencia específica. Estados: PENDIENTE, EN CURSO, BLOQUEADO CON EVIDENCIA, PASS. No inventar resultados.

## 1. Requisitos globales no negociables

1. **TODOS LOS CONTROLES NUMÉRICOS SERÁN SLIDERS SIN EXCEPCIÓN**: Texto, ambas capas, textos secundarios, fondos procedurales, Composición, exportación y paneles avanzados realmente accesibles. Una entrada numérica precisa puede acompañar al slider, nunca sustituirlo. Incluye números discretos como peso, cantidad, semilla numérica y FPS si son editables. Los indicadores de solo lectura no son controles.
2. Slider y entrada escriben la misma prop. Arrastrar actualiza sin Enter; doble clic sobre el slider y botón Reset vuelven al default canónico, no al valor actual ni al inicial del montaje.
3. Min/max/step/default/unidad deben coincidir en UI, normalización, preset y render. No aceptar tramos muertos por clamps internos. Para valores legítimos antiguos fuera del rango, ampliar coherentemente el rango o migrar explícitamente con aviso; nunca truncarlos en silencio.
4. **Toda opción que contenga degradados tendrá colores editables y slider de suavidad/dureza SIN EXCEPCIÓN.** Inventariar cada degradado visual: texto, borde, caja, franja, sombra/halo, luces, nebulosas y fondos procedurales. Cada degradado independiente tiene sus controles propios. Si una máscara implementa un degradado visible, controlar la paleta real y la transición que produce, no exponer falsos colores de máscara. Los videos prerenderizados siguen inmutables conforme al requisito expreso previo: sus píxeles no son opciones de degradado del motor.
5. **TODAS LAS OPCIONES DE TEXTO tendrán edición de tamaño, familia, peso, color/relleno, borde (color y grosor), sombra (color y desenfoque), borde con sombra simultáneos, opacidad, espaciado e interlineado.** Aplica a cada texto principal, secundario, capa, bloque de secuencia y texto 3D. No permitir listas de plantillas exentas ni excusas basadas en identidad o limitaciones actuales del motor: adaptar el renderer. Las alternancias temporales propias conservan sus fases usando los valores elegidos; no cancelan sombra ni impiden editar. Una incompatibilidad no resuelta es bloqueo de cierre.
6. **Todos los efectos tendrán velocidad independiente de la duración del video.** Cambiar velocidad nunca modifica frames totales, FPS, retraso de inicio ni duración de export; cambiar intensidad nunca modifica velocidad. Añadir intensidad específica donde haga perceptible el efecto según P03-A. Los videos prerenderizados conservan su contrato inmutable, no son efectos procedurales editables. Las entradas pueden mantener pose final; los ciclos continúan durante el clip.
7. Mantener texto/apariencia compartidos según contrato actual al cambiar plantilla; parámetros exclusivos solo afectan su efecto. Presets restauran la composición completa.
8. Todos los selectores de tipografía, incluidos textos 2/3, secuencias, capas y 3D, ofrecen todas las familias instaladas; selección implica que se usa la fuente real. Prohibida sustitución silenciosa por Helvetiker/Arial.
9. Los cuatro fondos `imported-video-1…4` no presentan controles de características. Solo selección e información; preservar reproducción, orientación y archivos locales.
10. La entrega final es un instalador nuevo, ejecutado y verificado en Windows 11 sin dependencia del servidor de desarrollo, directorio K: del proyecto ni conexiones externas para recursos esenciales.

## 2. Mapa del código que el junior debe seguir

| Área | Archivos reales y responsabilidad |
|---|---|
| UI montada | src/components/inspector/InspectorPanel.tsx → tabs/TextTab.tsx → tabs/TextBasicTab.tsx; tabs/BackgroundBasicTab.tsx; tabs/CompositionBasicTab.tsx |
| UI histórica | InspectorPanelLegacy.tsx, Text3DTab.tsx, src/components/controls/FontSection.tsx. Consultar como referencia; modificar solo estos no corrige el panel actual |
| Campos | src/components/inspector/fields/NumberField.tsx, ColorField.tsx; src/lib/editor/useDraftValue.ts |
| Estado y tipos | src/lib/AnimationContext.tsx; src/lib/types/animation.ts |
| Catálogo/selección | src/lib/editor/catalog.ts, selection.ts, controlSchema.ts |
| Persistencia | src/lib/editor/persistence.ts; AnimationContext.tsx; tabs/PresetsBasicTab.tsx |
| Render | src/remotion/MainComposition.tsx, MasterMotionLayer.tsx, useMotionFrame.ts, Root.tsx; src/lib/videoConfig.ts |
| Plantillas | src/remotion/templates/registry.ts y cada archivo de la sección 3 |
| Fondos | src/remotion/backgrounds/ParticleBackground.tsx, ImportedVideoBackground.tsx, StellarDepthFieldCanvas.tsx, stellarDepthField.ts, neonBulbAlternation.ts y componentes 3D del mismo directorio |
| Exportación | src/app/api/render/route.ts; src/lib/hooks/useRenderExport.ts; src/lib/editor/ExportContext.tsx, exportFilesystem.ts, exportOrchestration.ts, batchOrchestration.ts |
| Fuentes | src/lib/fonts/availableFonts.ts, src/types/desktop-fonts.d.ts, electron/main.cjs, electron/preload.cjs, public/fonts |
| Instalador | package.json, package-lock.json, next.config.* existente, electron/*, release |

No crear una segunda autoridad de estado. Las secciones de controles nuevas consumen useAnimation(); no estados locales independientes para valores persistentes.

## 3. Hallazgos y trazabilidad de los reportes humanos

Leyenda: **C** confirmado estáticamente; **R** reportado, falta reproducción visual; **H** hipótesis concreta que debe comprobarse.

| ID / plantilla | Evidencia y corrección exigida | Tarea |
|---|---|---|
| slide-reveal / SlideRevealEffect.tsx | C: render usa boxColor; TextBasicTab solo expone ese color en bar-reveal. Exponer color de franja y velocidad | P03/P04 |
| follower / FollowerEffect.tsx | C: baseFrame × speed existe, falta slider de speed en Texto | P03 |
| rotation / RotationRevealEffect.tsx | C: mismo problema de exposición | P03 |
| flicker / FlickerEffect.tsx | C: mismo problema; probar cambios de frecuencia visibles, no solo transform | P03 |
| flicker-outline-fill / FlickerOutlineFillEffect.tsx | C: speed consumido sin control; preservar transición borde/relleno propia | P03/P04 |
| kinetic-box-sequence / KineticBoxSequenceEffect.tsx | C: faltan controles específicos; boxSequenceWidth se ignora por boxWidth='100%'; boxSequenceCount no determina el count; texto principal no vacío gana sobre lista específica. R: blanco. H: caja al 100% en contenedor sin dimensión definida, salida final/estado heredado | P05 |
| smooth-sliding / SmoothSlidingText.tsx | C: speed consumido sin control | P03 |
| shape-reveal / ShapeRevealEffect.tsx | C: gradientStart/End, shapeGradientWidth, shapeBorderRadius consumidos sin controles específicos. Usa || para radio 0, que se convierte en 10 | P04 |
| fly-through / FlyThroughEffect.tsx | R: no hace nada. C: Z viaja de -2000 a +1500 con perspectiva 1000; puede cruzar plano de cámara. C: pinta fondo propio y degradado. H: doble profundidad con MasterMotionLayer / layout | P06 |
| clean-modern / CleanModernText.tsx | C: speed consumido sin control | P03 |
| bar-reveal / BarRevealEffect.tsx | C: usa props.wordTwo y estilos Two no expuestos. Grosor de barra acoplado a borderWidth del texto | P04/P05 |
| follower-grow / FollowerGrowRotate.tsx | C: speed consumido sin control | P03 |
| viral-text / ViralTextEffect.tsx | C: tres bloques con wordTwo/wordThree, fontFamilyTwo/Three, tamaños, colores y apariencia; Inspector solo principal. speed tiene curva calibrada propia | P05/P03 |
| shake-flicker / ShakeFlickerEffect.tsx | C: speed consumido sin control | P03 |
| blur-cascade / BlurringTextCascade.tsx | C: enableGradient/gradientStart/gradientEnd sin controles. C: Array.from y rangos indexados no respetan grafemas compuestos/offset UTF-16 | P04/P09 |
| cinematic / CinematicText.tsx | C: speed consumido sin control | P03 |
| apple-style / AppleStyleText.tsx | C: speed consumido sin control | P03 |
| extruded-3d / Extruded3DEffect.tsx | R: roto. C: resolveFontAsset limita familias/sustituye por JSON; Environment preset studio; fondo paisajístico fijo; parámetros propios ausentes del Inspector básico. H: carga de recursos, WebGL, posición cámara, geometría | P06/P10 |
| word-highlight-tracker / WordHighlightTracker.tsx | C: cambia índice de palabra discretamente, no anima desplazamiento del resaltador; queda en última palabra; usa frame real sin speed. Faltan colores activo/inactivo/resaltador y padding | P07 |
| variable-weight-wave / VariableWeightWave.tsx | C: /30 fijo, centro avanza una vez sin módulo; solo fontVariationSettings, sin comprobar eje wght ni fallback. text.length y Array.from usan unidades distintas. R: sin movimiento | P08 |

## 4. Defectos adicionales y riesgos que también deben quedar cubiertos

- **Reset defectuoso:** NumberField defaultValue=value significa que, sin default explícito, el Reset puede devolver el valor modificado. No depende de cada usuario: corregir contrato del campo.
- **Clamps contradictorios:** NumberField fuerza escala Ink Stamp hasta 6 por ID; InkStampPrint limita ambas escalas a 3. Slider 3–6 no tiene efecto. Quitar excepciones por nombre e igualar rango real.
- **Cero válido:** usos de || en boxSequenceBorderRadius, shapeBorderRadius, tamaños/espaciados y otros valores convierten cero en default. Revisar campo por campo; no reemplazo mecánico global.
- **Catálogo insuficiente:** todas las entradas de texto se declaran single, ownKeys=[] y capacidades genéricas; incluso fondos importados declaran color. No usar ese metadata para generar controles hasta corregirlo.
- **Capacidades escondidas:** TextBasicTab oculta toda apariencia de cuatro plantillas por ID. Eliminar esta exclusión y completar renderers para el contrato universal de texto. No basta revelar switches que el componente ignore.
- **Tiempo heterogéneo:** GlyphTileAssemble e InkStampPrint usan 30 fijo; PaperCutout/Ink/Glyph/Tracker/Wave leen frame sin speed. Scramble ignora mapMotionFrame. Verificar cómo speedControlsDuration acorta duración además de multiplicar frame.
- **Dual Layers:** renderer siempre usa InkStampPrint; capa secundaria no propaga speed/templateOptions propios. UI carece de edición de varios parámetros secundarios (colores/ancho borde/desenfoque sombra y retraso secundario en la sección revisada). No dar por completo el contrato porque antes hubo PASS.
- **Fondos procedurales:** colorB es usado en muchas ramas de ParticleBackground y el Inspector general lo muestra solo para Solar Wind. Controles genéricos de tamaño/densidad/velocidad requieren matriz por rama, no presuposición de soporte universal.
- **Rango de opacidad:** Inspector general empieza en 0.05 y algunas ramas fijan mínimos alpha >0. Si se ofrece opacidad, 0 debe apagar realmente esa capa.
- **Retro Grid:** slider de grosor implementado como input range suelto, sin Reset/doble clic estándar.
- **Composición:** regla global '* { transform: translateZ(0); }' puede alterar containing blocks y apilamiento. Medir con/sin ella antes de atribuirle blancos. MasterMotionLayer usa %; Dual XY se presenta en px: mantener unidades explícitas, sin mezclar migraciones.
- **Glyph Tile:** hoy mueve caracteres enteros y minWidth, no recorta glifos en mosaico. Comparar con contrato F6 antes de certificar identidad de mosaico; restaurar fragmentación real si falta.
- **Fuentes Windows:** solo GDI InstalledFontCollection; no demuestra cobertura total. availableFonts mezcla preferidas aunque no estén instaladas y silencia errores. Listar nombre no garantiza preview ni export con esa fuente.
- **Arranque/export instalado:** main oculta stdout/stderr y sale sin diálogo al fallar. route usa process.cwd() para fuente y renders. Se verificó que el paquete actual contiene src/remotion/index.ts; NO afirmar que falta. Debe probarse independencia del cwd y escritura fuera de Program Files.
- **Recursos externos:** comprobar Environment de drei y cualquier URL de fuentes/HDR con red desconectada. No afirmar que falla sin reproducción.
- **Pruebas históricas:** detectar pruebas que solo comprueban existencia de controles/helpers; no demuestran cambios visibles ni exportado real.

## 5. Secuencia obligatoria de ejecución

P00 → P01 → P02 → P03 → P04 → P05 → P06 → P07 → P08 → P09 → P10 → P11 → P12.

P10 puede investigarse en lectura durante P06 para resolver fuentes 3D. No cerrar P06 con una sustitución de fuente a la espera de P10. Evitar dos trabajadores editando AnimationContext/TextBasicTab a la vez.

### P00 — Congelar evidencia y reproducir fallos

**Archivos:** crear docs/qa/text-background-repair/evidence.md y control-inventory.csv. Leer package.json, catálogo, registry, defaults y tests actuales.
- [ ] Registrar versión real, fecha, hash de archivos relevantes y ejecutable instalado. Confirmar si existe repositorio antes de usar git; si no, backup versionado de fuentes/docs/config, sin borrar nada.
- [ ] Guardar copia de sesiones/presets de prueba. Capturar caso de usuario y caso limpio con defaultAnimationProps, text='ALPHA BETA GAMMA', showTextLayer=true, opacity=1, relleno=true, textRangeStyles=[], XY=0, startZ=endZ=0.
- [ ] Reproducir Kinetic/Fly/Extruded en app real: frame 0, 10%, 25%, 50%, 75%, 95%; registrar consola, red, dimensiones DOM/Canvas, estado y capturas. No exigir texto visible exactamente en primer/último frame si hay entrada/salida.
- [ ] No corregir todavía la causa presumida: escribir qué condición concreta produce el fallo y el test de regresión que lo detecta.
**Cierre:** cada reporte humano tiene fila, reproducción o incertidumbre explícita y tarea propietaria.

### P01 — Contrato exhaustivo de controles

**Modificar:** catalog.ts, controlSchema.ts, tipos/defaults/normalización en archivos citados. **Crear:** src/lib/editor/templateControlContracts.ts; tests/editor/template-control-contracts.test.ts.
**Interfaz propuesta:** exportar textControlContracts y backgroundControlContracts, registros exhaustivos por ID del catálogo; cada entrada describe keys reales, ámbito, tipo, rango/default de números, condición de visibilidad y efecto observable. No almacenar React ni funciones en presets.
- [ ] Para cada prop consumida por renderer clasificar: editable, derivada técnica o legado. Inventario CSV: templateId,prop,label,type,scope,visibleWhen,min,max,step,defaultSource,rendererLocation,evidenceTest,status.
- [ ] Rellenar capabilities/contentMode/ownKeys con información real. Marcar importados como recurso de video inmutable sin capacidades de color/tamaño/velocidad.
- [ ] Resolver conflictos con selection.ts: preservar valores globales compartidos; defaults exclusivos solo al inicializar; cambiar plantilla no debe sobrescribir tipografía compartida.
- [ ] Test: igualdad exacta entre IDs del registro y contratos; todo control tiene consumidor; default numérico finito dentro de rango; ninguna entrada editable queda sin widget o sin prueba.
**Cierre:** 32 textos y todas las entradas reales de backgroundCatalog trazadas; si el catálogo cambió, registrar número calculado, no usar 32 como constante de test.

### P02 — Sliders universales y Reset real

**Modificar:** NumberField.tsx, useDraftValue.ts si necesario; llamadas en paneles accesibles; controlSchema.ts.
**Tests:** ampliar tests/editor/fields.test.tsx; crear tests/editor/numeric-controls-contract.test.tsx.
- [ ] Hacer obligatorio defaultValue en NumberField y slider presente para todo número. Eliminar heurísticas por ID, effectiveMax especial y omisión del campo retirado dentro del componente genérico; ese control retirado simplemente no se monta en su panel.
- [ ] Pasar defaultAnimationProps o defaults exclusivos canónicos a cada caller. Corregir ColorField callers cuando su default no corresponde al efecto.
- [ ] Normalizar vacío/NaN/infinito sin corromper contexto; step, coma decimal y teclado deben tener conducta explícita. No persistir NaN ni convertir cero válido en fallback.
- [ ] Convertir inputs numéricos directos y rangos sueltos accesibles al campo común. Rangos discretos (peso, FPS si editable) usan step compatible.
- [ ] Un test DOM por panel verifica que cada spinbutton editable tiene slider con el mismo identificador lógico, límites y valor.
Ejemplo de comportamiento obligatorio para el campo real:
```tsx
const onChange = vi.fn();
render(<NumberField id="test-size" label="Tamaño" value={40}
  defaultValue={20} min={0} max={100} step={1} onChange={onChange} />);
fireEvent.change(screen.getByRole('slider'), {target: {value: '70'}});
expect(onChange).toHaveBeenLastCalledWith(70);
fireEvent.doubleClick(screen.getByRole('slider'));
expect(onChange).toHaveBeenLastCalledWith(20);
```
- [ ] Añadir versión con provider: modificar → otro control → doble clic → 20; cargar preset 70 → Reset → default canónico, no 70.
**Cierre:** ningún numérico accesible sin slider; cero tramos muertos; reset funciona tras remount/preset.

### P03 — Velocidad y reloj coherentes

**Modificar:** TextBasicTab.tsx, useMotionFrame.ts, videoConfig.ts, Root.tsx, AnimationContext.tsx, persistencia, ruta de render y plantillas consumidoras; CompositionBasicTab.tsx para desacoplar duración.
**Tests:** tests/editor/duration.test.ts, typewriter.test.ts, family-representatives.test.tsx; crear tests/editor/text-speed-integration.test.tsx.
- [ ] Exponer 'Velocidad del efecto' con prop speed, rango canónico actual 0.2–3, paso 0.05, default 1. No inventar segundo multiplicador global.
- [ ] Retirar de la UI 'La velocidad ajusta la duración'. Nuevos documentos usan duración fija y speedControlsDuration=false. Migrar sesiones/presets antiguos UNA VEZ: calcular con el resolver antiguo su duración efectiva, almacenarla como duración fija y desactivar acoplamiento. Conservar speed; versionar la migración para no dividir duración otra vez en cada carga.
- [ ] Root, Player, batch y route deben usar el mismo resolver de duración independiente de speed/CPS/duración del ciclo. Eliminar extensiones automáticas de clip por longitud de texto; indicar cuando una secuencia excede el clip y ofrecer ajuste explícito, nunca alterar duración silenciosamente.
- [ ] Separar tiempo de clip t=frame/fps y tiempo local del efecto. Inicio con delay d: local=max(0,t-d)*speed. Para salida anclada al final usar tiempo restante del clip, no duración ya multiplicada por speed. Delays se mantienen en tiempo del clip. Aplicar speed una sola vez por capa/efecto; nunca al fondo y texto simultáneamente por un control ambiguo.
- [ ] Reutilizar speed para texto simple, secondaryTextLayer.speed para segunda capa, particleSpeed o velocidad específica para fondo. Añadir editor de cada velocidad independiente donde falte. Ciclos secundarios (levitación/patrón) conservan sliders propios identificados; documentar si son frecuencia base multiplicada por speed principal para evitar doble aplicación oculta.
- [ ] Hacer tabla de tiempo por efecto: entrada/salida/ciclo/pausa y si usa segundos, frames o progreso normalizado. Para relojes ya escalados no multiplicar speed otra vez. Duración normalizada debe calcularse en la misma unidad temporal que frame.
- [ ] Probar 0.5/1/2 a mismo tiempo de clip, fases in/out/in-out y cambios de duración. Reproducción hacia atrás mediante seek debe dar exactamente mismo frame que render directo.
- [ ] Migrar N-T y Scramble al contrato sin destruir CPS, retrasos individuales o levitación. Quitar /30 en favor de fps real; fps actuales 30 no justifican constantes ocultas.
- [ ] No mover el control a playbackRate del Player: export debe verse igual. Mantener pausa/avance independiente.
**Cierre:** todos los IDs reportados por velocidad muestran cambios visibles, y Typewriter no duplica speed. Casos cortos no desaparecen durante todo el clip.

### P03-A — Intensidad perceptible por familia, sin cambiar duración

Subtarea obligatoria de P03. **Crear:** src/lib/editor/effectIntensityContracts.ts y tests/editor/effect-intensity-integration.test.tsx. **Modificar:** sección de controles de cada efecto y renderer correspondiente; añadir a AnimationProps únicamente props que no tengan equivalente existente.

Evidencia adicional leída: Flicker y FlickerOutlineFill fijan 3 ciclos de 12 frames; ShakeFlicker usa ruido por bloques y encendido binario. Variar speed cambia frecuencia pero no amplitud. Estos controles no pueden resolverse simplemente ampliando speed.

Los rangos siguientes son contratos de implementación propuestos, no pruebas de que los campos existan. Son amplios y físicamente significativos; reutilizar la prop equivalente si existe. Defaults deben producir efecto claro en 1080p con fuente 120 px. Valores en em escalan con tamaño de texto; px se expresan en coordenadas de composición. No aplicar clamps internos menores que el slider.

| Efectos / archivos en templates | Slider de intensidad y rango propuesto | Qué debe cambiar; qué permanece fijo |
|---|---|---|
| GlitchEffect | Desplazamiento glitch 0–2 em, paso 0.01, default 0.15 | Separación/distorsión; no frecuencia ni color elegido |
| ShakeFlickerEffect | Amplitud de sacudida 0–1.5 em, paso 0.01, default 0.12; Contraste de parpadeo 0–100%, paso 1, default 80 | Distancia y diferencia de opacidad, con sliders independientes |
| FlickerEffect / FlickerOutlineFillEffect | Contraste de parpadeo 0–100%, default 85; Ciclos 1–30, paso 1, default 3 | Contraste interpola opacidad mínima: 1-intensity; ciclos regula repeticiones, nunca se llama intensidad. Mantener máscara de entrada separada |
| NeonPulseEffect | Amplitud luminosa 0–4×, paso 0.05, default 1; Radio de halo 0–2 em, paso 0.01, default 0.25 | Diferencia máximo/mínimo y expansión del halo, no periodo |
| BubblePopEffect | Sobreimpulso 0–2× adicional, paso 0.05, default 0.35 | Máximo de escala del rebote; posición/escala final no cambian |
| RotationRevealEffect | Ángulo inicial -360–360°, paso 1, default 90 | Recorrido angular, independiente de velocidad |
| FollowerEffect / FollowerGrowRotate | Recorrido 0–2 longitudes de lienzo, paso 0.01, default 0.3; para Grow escala inicial 0.05–6×, paso 0.05 | Distancia/crecimiento; conservar centrado final |
| KineticSlideIn / SmoothSlidingText / CleanModernText / AppleStyleText | Recorrido de entrada 0–2 longitudes de lienzo, paso 0.01, default 0.25 | Distancia del deslizamiento; verificar identidad en cada archivo, no añadir rotación arbitraria |
| BlurRevealEffect / BlurringTextCascade | Desenfoque inicial 0–160 px, paso 1, default 30 | Radio de desenfoque; no tiempo de despeje |
| CinematicText / FlyThroughEffect | Profundidad/recorrido 0–4× del recorrido base validado, paso 0.05, default 1 | Magnitud de viaje; controlar cruce de cámara, sin clipping que deje todo el clip vacío |
| Extruded3DEffect | Profundidad geométrica 0.05–10× altura del glifo, paso 0.05, default equivalente actual; Recorrido cámara 0–4× | Geometría y movimiento separados, límites de cámara recalculados |
| InkStampPrint | Reutilizar presión 0–6, escalas 0.05–6 y levitación 0–120 px | No crear otra intensidad duplicada; corregir tramos muertos y mantener periodo al cambiar amplitud |
| PaperCutoutAssemble | Reutilizar amplitud de levitación 0–96 px; añadir recorrido de entrada 0–2 longitudes de lienzo si no tiene equivalente | Cambiar excursión sin cambiar frecuencia de levitación |
| WordHighlightTracker | Padding 0–60 px y opacidad del resaltador 0–1, paso 0.01; velocidad de recorrido según P03 | Dar presencia al resaltado; no sacudir las palabras ni cambiar su color al variar intensidad |
| VariableWeightWave | Amplitud de onda 0–3×, paso 0.05, default 1; pesos base/pico existentes | Escalar diferencia respecto a peso base. Si el eje satura, usar expansión visual determinista explícita, sin falso tramo 1–3 inmóvil |
| GlyphTileAssemble | Dispersión 0–2 longitudes de lienzo, paso 0.01, default 0.3 | Trayecto de fragmentos, no duración de ensamblaje |
| Typewriter / Scramble | No intensidad artificial; CPS/velocidad controla aparición/cambio. Scramble puede exponer proporción de caracteres alterados 0–100% si se implementa su consumidor | No inventar amplitud de desplazamiento para efectos tipográficos de sustitución |
| SlideReveal / WipeReveal / ShapeReveal / BarReveal / KineticBoxSequence / ViralText | Reutilizar ancho/alto/grosor/radio de formas, recorrido de entrada cuando exista y suavidad de degradado; no agregar un slider genérico que cambie varios parámetros ajenos | Separar magnitud espacial, paleta y velocidad; final legible y editable |
| DualTextLayers | Controles de Ink Stamp y velocidad por capa, mismos rangos | Cambiar una capa no altera la otra |
| Fondos procedurales | Amplitud de onda/deriva/halo/contraste según consumidor: 0–4× base paso 0.05; reutilizar Neon/Stellar existentes antes de añadir props | Intensidad cambia amplitud/brillo/contraste; velocidad cambia frecuencia/traslación; duración fija |

- [ ] Completar en effectIntensityContracts el mapeo exacto ID → prop existente/nueva → unidad → rango → función consumidora. No añadir slider universal 'Intensidad' sin indicar qué magnitud controla.
- [ ] Prueba de independencia por efecto/capa: clip de 10 s a 30 FPS permanece 300 frames a velocidades 0.2/1/3 y a intensidades mínima/media/máxima. Export debe conservar los mismos 300 frames. Repetir después de preset save/load y con un preset antiguo migrado.
- [ ] Prueba visual de amplitud: a igual fase local comparar intensidad 0, default, mitad superior y máximo; demostrar cambio monotónico de distancia, ángulo, radio o contraste. No usar cambio de fase como evidencia de intensidad.
- [ ] Probar también a igual tiempo real: velocidad cambia progreso; intensidad conserva instantes de inicio/fin/ciclo y posición final cuando corresponda. No permitir que incrementar intensidad solo aumente duración.
- [ ] En efectos con opacidad, intensidad cero elimina la modulación, no necesariamente el texto entero. En desplazamiento, cero elimina excursión manteniendo aparición legible. Documentar cada cero.
- [ ] Valores extremos pueden exagerar el efecto, pero deben seguir produciendo frames finitos, sin NaN, sin crash ni render permanentemente vacío. No limitar silenciosamente para ocultar fallo; ajustar geometría/encuadre cuando corresponda.
- [ ] Añadir captures/medidas que demuestren tres niveles claramente diferenciados; los defaults no se aprueban si el efecto solo se distingue al pausar y ampliar.
**Cierre:** velocidad, duración e intensidad son tres magnitudes independientes; cada efecto tiene ritmo regulable y los casos de la tabla ofrecen amplitud perceptible con rango útil.

### P04 — Colores, degradados y apariencia completa

**Modificar:** TextBasicTab.tsx; crear secciones src/components/inspector/sections/TextAppearanceControls.tsx y RevealControls.tsx; templates/SlideRevealEffect.tsx, ShapeRevealEffect.tsx, BlurringTextCascade.tsx, BarRevealEffect.tsx cuando haga falta.
**Tests:** crear tests/editor/reveal-appearance-integration.test.tsx; ampliar extruded-appearance y tests de familias.
- [ ] Slide Reveal: selector Color de franja → boxColor, independiente de color del texto.
- [ ] Shape Reveal: Color inicial/final → gradientStart/gradientEnd; anchura → shapeGradientWidth; radio → shapeBorderRadius. Cero radio produce esquinas rectas. No vincular paleta a la de fondo.
- [ ] Blur Cascade: modo sólido/degradado → enableGradient; ambos colores libres. Comprobar StyledRangeText y estilos heredados no pintan encima del degradado global.
- [ ] Bar: color barra independiente; nueva prop barWidthPx, default 4 y rango 1–100 paso 1, con migración desde borderWidth únicamente cuando no existe barWidthPx. El grosor del borde del texto no mueve grosor barra después de migrar.
- [ ] Exponer fontWeight, letterSpacing, lineHeight, opacity, borderWidth, shadowBlur y colores en TODAS las opciones de texto. Si falta consumidor, implementarlo. Scopes claros por texto/capa, sin controles duplicados ambiguos. Defaults desde contrato; opacidad 0–1, paso 0.01.
- [ ] Degradados por palabra de Bar/Viral: reutilizar modos existentes fill-gradient/stroke-gradient y strokeGradientStart/End; editar el rango correcto sin borrar estilos ajenos. Si se elige sólido, quitar solo el override de ese bloque.
- [ ] Añadir editor reutilizable GradientControls.tsx en src/components/inspector/sections y contrato tipado en src/lib/editor/gradientControls.ts. Cada instancia recibe su paleta real y softness persistida. No compartir accidentalmente suavidad/color entre dos degradados independientes.
- [ ] Slider 'Suavidad del degradado': 0–100%, paso 1; 0 = transición dura, 100 = máxima transición suave. Default para degradado lineal de dos colores = 100 (conserva interpolación completa). Para degradados existentes de varias paradas, conservar sus posiciones y calcular default desde la transición existente.
- [ ] Implementación de referencia dos colores: s=softness/100; parada de color A=(50-50*s)%; parada de color B=(50+50*s)%. En s=0 ambas paradas en 50% dan corte duro; en s=1 van de 0 a 100%. Aplicar misma función a CSS/Canvas/shader en coordenada normalizada; radial conserva radio/centro y cambia anchura de transición, no opacidad global.
- [ ] Para múltiples colores exponer CADA parada cromática y posición por slider, sin eliminar colores intermedios para simplificar. Aplicar suavidad por intervalo entre paradas manteniendo orden y límites; añadir caso de paradas coincidentes y extremos sin división por cero.
- [ ] Migrar gradientStart/End, boxSequenceGradientStart/End y rangos word-gradient existentes sin perder paletas. Añadir suavidad por instancia al estado tipado y persistencia; no una prop global que cambie todo. Inventario registra ID del degradado, paradas, propiedad de suavidad y consumidor.
- [ ] Crear tests/editor/gradient-controls-integration.test.tsx: rojo/azul a softness 0/50/100 produce límites distintos; ambos extremos editables; presets restauran; reset; dos degradados independientes no se contaminan. Capturas en renderer real, no solo string CSS.
- [ ] Crear tests/editor/universal-text-appearance.test.tsx parametrizado por TODOS los IDs y bloques de texto: cambiar tamaño/fuente/color/borde/sombra; activar borde+sombra juntos; cada cambio llega a píxeles/contornos. Tracker/Wave/Paper/Glyph/Extruded incluidos obligatoriamente.
**Cierre:** ninguna opción de degradado sin paleta y suavidad; ningún texto sin apariencia completa; colores, suavidad y combinaciones sobreviven presets y funcionan en export.

### P05 — Texto múltiple, Bar, Viral y reparación Kinetic

**Crear:** src/components/inspector/sections/MultiTextControls.tsx y KineticSequenceControls.tsx; tests/editor/multi-text-integration.test.tsx y kinetic-box-integration.test.tsx.
**Modificar:** TextBasicTab.tsx, KineticBoxSequenceEffect.tsx, BarRevealEffect.tsx, ViralTextEffect.tsx, tipos/persistencia/videoConfig según el contrato.
- [ ] Bar: editar text y wordTwo con familias, tamaños, colores, apariencia independientes. Viral: text/wordTwo/wordThree y props Two/Three correspondientes; no usar Líneas para lote como sustituto.
- [ ] Cards 'Texto 1/2/3': familia real, peso, tamaño, relleno/color, borde/color/ancho, sombra/color/blur, espaciado/interlineado. Opacidad independiente requiere prop nueva tipada si no existe, default 1, rango 0–1.
- [ ] Kinetic: reproducir caja en wrapper de dimensiones reales de composición; hacer efectiva boxSequenceWidth (10–100%, default actual 62), altura (0.25–4 ×, default 1.25), radio (0–120 px, default 12), modo box/bar, dirección y paleta sólida/degradada.
- [ ] Unificar contenido Kinetic de forma explícita: selector 'Palabras del texto principal' / 'Secuencia personalizada'. Guardar modo nuevo tipado; migración mantiene comportamiento anterior para presets sin modo. En personalizado, filas editables con texto/tiempo/estilo y color de caja.
- [ ] Eliminar ambigüedad de count: derivarlo de filas/palabras. Mantener claves legacy solo para migración; no mostrar count que no controla nada. No eliminar silenciosamente frases por separarlas en comas.
- [ ] Preferir arrays tipados serializables para filas; crear conversión legacy de Raw/One/Two/Three/Four que mantenga estilos y duraciones. Probar antes y después idénticos para caso antiguo.
- [ ] Corregir fitDurationsToTotal para clips con menos frames que mínimos de segmentos; no intervalos decrecientes, NaN ni bucles. No extender duración automáticamente. Indicar secuencia truncada y permitir que el usuario aumente explícitamente la duración; al variar velocidad, mantener frames totales y cambiar solo el progreso de la secuencia.
- [ ] El test visual de Kinetic exige caja y palabra legibles durante cada segmento, transiciones efectivas y no todo blanco; capturar bounding box >0 y píxeles en color contrastante.
**Cierre:** Bar cambia texto al retraerse; Viral muestra los tres contenidos nuevos; Kinetic funciona en ambos formatos y export.

### P06 — Fly Through y Extruded 3D

**Modificar:** FlyThroughEffect.tsx, Extruded3DEffect.tsx, MainComposition.tsx, MasterMotionLayer.tsx únicamente con reproducción; controles específicos en sección nueva TextDepthControls.tsx. Coordinar fuentes con P10.
**Tests:** crear tests/editor/text-depth-contract.test.tsx; ampliar tests/editor/extruded-appearance.test.ts; evidencia de frames reales obligatoria.
- [ ] Fly: capturar tamaño/posición y opacidad en Z inicial/centro/final. Separar viaje interno de desplazamiento Z global; evitar duplicarlo por herencia al cambiar plantilla.
- [ ] Una trayectoria que cruza la cámara necesita intervalo de visibilidad explícito y final conocido. No simplemente aumentar z-index. Ajustar perspectiva/near crossing o acotar trayectoria conservando vuelo, y exponer dirección/velocidad/distancia con ranges validados.
- [ ] Reproducir dentro del wrapper actual: AbsoluteFill en contenedor sin tamaño puede colapsar; dar al contenedor la dimensión de composición sin alterar centrado 2D. Probar desactivar regla universal translateZ y conservar solo promociones necesarias.
- [ ] Extruded: registrar errores useLoader/Text3D, disponibilidad TTF/JSON/HDR, contexto WebGL, bounds de geometría y cámara. Error debe mostrarse; no canvas vacío permanente.
- [ ] Hacer autocentrado/encuadre según bounds para texto corto/largo y 9:16/16:9. Exponer profundidad real, cámara/movimiento y material con sliders; material metálico no debe ignorar color sin indicar modo.
- [ ] Separar paisaje/degradado de texto del fondo elegido: mantener transparencia del texto para poder componer fondos. Si paisaje es capacidad artística intencional, exponer opción propia, default compatible, no obligatoria.
- [ ] Resolver Environment offline con recurso local empaquetado y carga coordinada con render; no descargar al abrir la app.
**Cierre:** ambas plantillas visibles y animadas en preview y export instalado; fuente real del selector; no dependencia de red ni colapso de layout.

### P07 — Word Highlight Tracker visible y configurable

**Modificar:** WordHighlightTracker.tsx, wordHighlightUtils.ts, TextBasicTab.tsx; tipos/defaults para parámetros nuevos. **Tests:** crear tests/editor/word-highlight-motion.test.tsx.
- [ ] Mantener texto legible y resaltador que viaja entre palabras; medir rectángulos de palabras después de document.fonts.ready. Recalcular por texto/fuente/tamaño/lienzo.
- [ ] Interpolar rectángulo del resaltador entre bounds de palabras, incluida transición de renglón; no desplazar párrafo ni romper layout.
- [ ] Exponer duración por palabra existente (0.1–3 s, paso 0.05, default 0.4), colores resaltador/activo/inactivo, padding (0–60 px default 8), radio (0–60 px default 12).
- [ ] Añadir wordHighlightLoop boolean default true y wordHighlightTransitionSeconds default 0.12 (0–0.5 paso 0.01). Limitar transición a duración de palabra sin invertir intervalos. Modo no loop mantiene último resaltado.
- [ ] Una sola palabra produce resaltado válido; vacío no falla; con varias palabras el resaltador cambia posición a lo largo de duración. Sin aleatoriedad ni reconocimiento de voz.
**Cierre:** existe movimiento del resaltador, no solo salto de color; loop y velocidad observables y export determinista.

### P08 — Variable Weight Wave funcional con cualquier familia

**Modificar:** VariableWeightWave.tsx; controles de onda en TextBasicTab; crear utilidades acotadas si necesario. **Tests:** tests/editor/variable-weight-motion.test.tsx.
- [ ] Segmentar grafemas; medir layout base estable. Calcular t=frame/fps con reloj P03; fase de ciclo con módulo.
- [ ] Ejemplo de fase: phase=((t/cycle)%1+1)%1; center=phase*(glyphCount+2*waveWidth)-waveWidth. Influencia gaussiana interpolando base/peak. Evitar desbordar al comenzar otro ciclo.
- [ ] Detectar soporte real wght del archivo seleccionado; para fuente variable aplicar eje en rango real. No inferir soporte porque CSS acepta fontVariationSettings.
- [ ] Fuente estática: aplicar equivalencia determinista ya autorizada (peso disponible + espesor de contorno del mismo color proporcional a influencia) en cajas fijas. Documentar simulación; no instalar otra fuente ni cambiar familia.
- [ ] Mantener baseWeight/peakWeight existentes y ciclo default 2.4; slider 'Duración del ciclo' regula ritmo, speed general debe obedecer contrato. Probar diferencia entre base y peak; si iguales indicar efecto neutral.
- [ ] Verificar tres ciclos, fuentes variables y estáticas, emojis compuestos, texto largo/multilínea, dimensiones constantes.
**Cierre:** onda visible durante toda duración y fuente seleccionada conservada.

### P09 — Cobertura del resto del catálogo y fondos

**Modificar según evidencia:** todas las ramas reales del registry/ParticleBackground, BackgroundBasicTab, DualTextLayers, InkStampPrint, GlyphTileAssemble, PaperCutoutAssemble.
**Tests:** ampliar background-contract.test.ts, background-basic.test.tsx, background-representatives.test.tsx, dual-text-layers.test.ts, family-representatives.test.tsx; crear control-observability.test.tsx.
- [ ] Recorrer automáticamente IDs de texto aún no reportados: typewriter, slide-in, bubble-pop, glitch, wipe-reveal, blur-reveal, scramble, neon-pulse, paper-cutout-assemble, ink-stamp-print, glyph-tile-assemble, dual-text-layers. Ninguna excepción por haber sido aprobados antes.
- [ ] Ink Stamp: unificar escala hasta 6 en campo/default/normalización/render; resolver prioridad conflictiva inkStampFloatAmplitude vs inkStampFloatAmplitudePx por migración explícita. No reintroducir switch de profundidad retirado.
- [ ] Dual: delays/velocidad/options/estilos son por capa; propagar secundarios al renderer y controles. XY=0 centra cada capa independientemente; verificar 16:9 y 9:16, opacidad/color de una no afecta otra.
- [ ] Glyph/Blur/Scramble/otros por caracteres: Intl.Segmenter con fallback definido; conservar offsets UTF-16 para rangos. Casos: 'A👨‍👩‍👧‍👦é🇨🇷 B', saltos de línea y espacios repetidos.
- [ ] Para cada fondo procedural analizar rama activa y cada parámetro de inventario; variar min/default/max con seed fijo y tiempo fijo. Si un parámetro genérico no aplica, reemplazar por el específico útil o retirar únicamente ese no-op documentado.
- [ ] Exponer Color secundario donde colorB realmente pinta; luces/backdrop/metalness/roughness solo si consumidos. Opacidad cero elimina capa incluyendo halos; tamaños 0 y min=max tienen conducta coherente.
- [ ] Neon: preservar modos simples/combinados, ondas, ángulo/centro solo cuando aplican. Stellar: mantener implementación GPU; medir preview con/sin fondo a 1080, misma escena, 10 s, frame time y memoria GPU/CPU; no certificación por modelo de tarjeta.
- [ ] Importados: cero sliders/selectores de características; validar ocho archivos (horizontal/vertical), loops, duración, no audio accidental y uso del archivo correcto en export.
**Cierre:** inventario completo sin controles sin consumidor o consumidor artístico relevante inaccesible; todos los textos/fondos con evidencia individual, no solo representantes.

### P10 — Todas las fuentes reales en Windows

**Modificar:** electron/main.cjs/preload.cjs, desktop-fonts.d.ts, availableFonts.ts, todos los selectores tipográficos; integración de fuentes con render y Extruded.
**Crear:** electron/font-catalog.cjs; src/lib/fonts/fontCatalog.ts; tests/editor/desktop-font-catalog.test.ts; tests/editor/font-selection-integration.test.tsx.
- [ ] Inventariar familias y caras, archivos por equipo y usuario, colecciones TTC/OTC, OTF/TTF y fuentes variables. Contrastar DirectWrite (catálogo de Windows) con GDI y registro HKLM/HKCU; registros sirven como diagnóstico, no nombre de familia obtenido del nombre del archivo.
- [ ] No declarar totalidad por un conteo alto. Emitir reporte con sets: fuentes Windows, catalogadas, seleccionables, resolubles. La diferencia de familias instaladas menos seleccionables debe estar vacía; registrar alias por cara, no perder familias por deduplicación errónea.
- [ ] Interfaz propuesta FontFaceRecord: id, family, fullName, style, weight, stretch, variableAxes y availability. Archivo físico permanece del lado host. Versionar IPC para que getFamilies siga compatible mientras se introducen caras.
- [ ] Ordenar primero preferidas realmente instaladas, luego resto alfabético con búsqueda. Mantener fuente de preset ausente visible como 'no instalada', sin mostrar como instalada una preferida inexistente.
- [ ] UTF-8 explícito en salida PowerShell si se conserva; no truncar catálogo, errores visibles con reintento, refresco/caché invalidable tras instalar fuentes.
- [ ] Resolver archivos mediante ID catalogado; nunca aceptar ruta arbitraria del renderer. Acceso local controlado para @font-face y render headless. Esperar carga antes de medir/capturar. Mantener contextIsolation y nodeIntegration=false.
- [ ] Fuentes 3D: convertir contornos de cara seleccionada a geometría compatible. TTFLoader actual no es prueba de soporte OTF/TTC/color; implementar extracción de caras y formato necesario con parser o puente nativo probado. Si una fuente carece de contornos extruibles (bitmap/color), conservar su glifo real con tratamiento de profundidad compatible, identificado; no sustituir familia ni ocultarla.
- [ ] Si falta capacidad de formatos reales, registrar bloqueo técnico y resolver antes del cierre; no prometer todas con fallback silencioso.
- [ ] Probar fuente por usuario, por sistema, nombre no ASCII, estática, variable, colección, símbolos y fuera de PREFERRED_FONT_FAMILIES, en texto 1/2/3, capas, Kinetic, Extruded.
- [ ] Verificar glyphs reales en MP4/WebM/MOV representativos además de DOM. Todas las familias seleccionables, error específico si un archivo instalado está ilegible; cualquier omisión no resuelta impide aprobación.
**Cierre:** inventario reconciliado sin familias omitidas y preview/export usan fuentes reales. Acceder a fuentes instaladas no exige redistribuir todos sus archivos dentro del instalador.

### P11 — Persistencia, export y pruebas visuales integradas

**Modificar solo regresiones:** persistence.ts, AnimationContext.tsx, ruta de render y orquestación.
**Crear:** tests/editor/text-repair-presets.test.tsx; scripts/qa/text-background-visual-check.mjs para evidencias de render.
- [ ] Tests UI con providers reales: cambiar slider/color/texto/familia → MainComposition real recibe cambios; guardar A → modificar B → cargar A → valores y render restaurados. Componentes sintéticos solo instrumentan estado, nunca sustituyen efecto a validar.
- [ ] Asegurar objetos runtime/fonts handles/streams no entran al preset. Migración V2/legacy conserva estilos y campos nuevos. Reset no cambia texto/fondo ajeno.
- [ ] Pruebas visuales: render de texto solo sobre fondo contrastante, frames de entrada/media/salida; comparar dos valores de control a mismo frame activo. Medir bbox/colores/alpha o geometría del efecto, no capturas globales donde fondo en movimiento simula éxito.
- [ ] Separar controles estáticos y temporales: color cambia canales; velocidad cambia posición/progreso/frecuencia; reset recupera pixels; fuente cambia contornos. Semilla y entorno fijos.
- [ ] Verificar duración 0.5/5/20/120 s donde permitido y formatos 16:9/9:16/1:1. Cada template en ambos formatos principales; extremos costosos se muestrean según riesgo con lista explícita.
- [ ] Export individual y batch: líneas ALPHA/BETA producen texto distinto, estilos y fuentes correctos; Guardar Copia no re-renderiza; busy/cancel/failure preservan exclusión previa.
- [ ] Ejecutar comandos siguientes y guardar exit code, número real de tests y log. No ejecutar build simultáneamente con next dev sobre la misma .next.
```powershell
npm run test:editor
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/next/dist/bin/next lint
npm run build
```
**Cierre:** suite verde no sustituye evidencia visual. Toda fila del inventario con test + captura/artefacto o exclusión técnica razonada.

### P12 — Instalador independiente y gate senior

**Modificar:** electron/main.cjs, package.json/package-lock.json, src/app/api/render/route.ts y configuración de empaquetado según resultado.
**Crear:** docs/qa/text-background-repair/release-report.md; scripts/qa/desktop-smoke.mjs.
- [ ] Empaquetar recursos de Remotion precompilados y sus assets en ruta explícita, o garantizar entrada y todas sus dependencias locales; elegir bundle de producción precompilado para evitar compilación desde src al exportar instalado.
- [ ] Definir variables internas TEXT_ANIMATION_RENDER_BUNDLE y TEXT_ANIMATION_RENDER_OUTPUT en main apuntando a resources y userData/cache; route debe consumirlas con fallback de desarrollo. Servir descarga por ruta controlada si sale de public; no escribir renders bajo Program Files.
- [ ] Registrar errores del proceso servidor y mostrar diálogo de arranque útil. Timeout y proceso hijo finalizado no dejan app invisible ni huérfanos.
- [ ] Verificar dependencias next, chromium/compositor, fuentes/HDR/video/static. Probar desde cwd ajeno y sin next dev; no basarse solo en Test-Path ni HTTP 200.
- [ ] Bump de versión superior a la instalada y la leída al ejecutar (base observada 0.1.3), mismo appId. Compilar con npm run desktop:package.
- [ ] Instalar/actualizar en este Windows, preservar datos y lanzar desde acceso directo. Verificar visualmente interfaz, fuentes nativas, al menos Kinetic/Fly/Extruded/Wave/Tracker y fondo importado.
- [ ] Export real desde la instalación: MP4, alpha WebM y MOV si disponible, batch de dos textos; abrir archivos y confirmar texto/frames/fuentes. Hacer prueba sin red; no generar copia de render al abrir UI.
- [ ] Verificar que ninguna petición de recursos usa workspace K:; probar sesión instalada con desarrollo detenido. No mover/borrar workspace para simular independencia.
- [ ] Gate senior: revisar cada hallazgo de sección 3 y 4 contra evidencia real. El junior entrega instalador + SHA256 + versión/tamaño/ruta + reporte de cobertura y fuentes + defectos pendientes explícitos.
**Cierre permitido:** 'IMPLEMENTACIÓN CORREGIDA / INSTALADOR VERIFICADO' solamente con todas las filas PASS y cero bloqueantes. Si falta fuente/efecto/export no declarar aprobado.

## 6. Protocolo de pruebas y avance para el junior

Cada tarea:
- [ ] Leer archivos propietarios y pruebas existentes.
- [ ] Añadir regresión que falle por el defecto real, no por un mock defectuoso.
- [ ] Ejecutar dirigida: node node_modules/vitest/vitest.mjs run tests/editor/<archivo-de-la-tarea>.
- [ ] Implementar corrección mínima con estado compartido y defaults canónicos.
- [ ] Ejecutar dirigida + TypeScript cuando cambia tipos/props. Registrar resultados.
- [ ] Añadir evidencia visual cuando el criterio sea visual; el review no acepta helpers aislados como sustituto.
- [ ] Actualizar evidence.md y continuar siguiente tarea automáticamente. Si hay git, commit acotado; no crear repositorio ni resetear trabajo para cumplir este paso.

Ejemplo de patrón de prueba de integración real:
```tsx
// Dentro del harness Remotion existente, con reloj controlado y providers reales:
render(<AnimationProvider initialProps={{animationStyle:'slide-reveal'}}>
  <TextBasicTab />
  <CompositionProbe />
</AnimationProvider>);
// CompositionProbe debe renderizar MainComposition con useAnimation().props;
// el wrapper de pruebas suministra frame/fps por el harness existente.
fireEvent.change(screen.getByLabelText('Color de franja'), {
  target:{value:'#00ff44'}
});
// Verificar prop mediante el probe y color CSS de franja realmente renderizada.
// Después, render de frame activo con MainComposition comprueba sus píxeles.
```
El ejemplo define el patrón, no certifica una prueba existente. CompositionProbe es instrumentación de prueba a crear y debe contener MainComposition real, no sustituirlo.

## 7. Matriz de cierre que debe entregar el ejecutor

Cada fila de control-inventory.csv exige:
- ID real / archivo / prop / ámbito / rango y default.
- Control visible y accesible por teclado.
- Slider inmediato + entrada consistente + reset/doble clic.
- Cambio llega a render real y tiene resultado perceptible.
- Preset guarda/carga y no contamina otra plantilla/capa.
- Captura o archivo de export con configuración reproducible.
- Resultado PASS/FAIL y test exacto.

Por plantilla registrar además:
- Texto final correcto, grafemas completos, layout 9:16 y 16:9.
- Inicio/mitad/final y velocidad; loop solo si la identidad lo requiere.
- Todos los degradados visuales con CADA color editable y slider de suavidad/dureza probado.
- Todas las opciones de texto con apariencia completa y borde+sombra simultáneos, sin excepciones por plantilla.
- Preview y export coincidentes.
- Rendimiento sin degradación importante frente al baseline medido.

No se permite cerrar usando la frase 'las demás deberían funcionar'. El catálogo completo genera la lista de filas obligatorias. El responsable senior puede rechazar una sola tarea sin borrar las demás aprobaciones.

## 8. Prompt de ejecución para otro modelo

> Ejecuta este plan desde P00 en el workspace canónico. Eres el implementador; no sustituyas contratos por aproximaciones silenciosas. Conserva el trabajo existente. Corrige todos los reportes humanos y los hallazgos adicionales; todo numérico editable necesita slider y reset real. Avanza automáticamente tarea por tarea con evidencia. Mantén la identidad de las plantillas y la independencia de capas/textos. Los fondos de video importados no admiten controles de características. El cierre exige todas las fuentes instaladas disponibles y usadas realmente, export probado desde Windows instalado e instalador nuevo con SHA256. No declares éxito por tests unitarios, HTTP 200 o por compilación solamente. Si descubres una limitación técnica, documenta reproducción, impacto y solución necesaria y resuélvela dentro del alcance; si no puedes, entrega bloqueo específico, nunca un PASS inventado.
