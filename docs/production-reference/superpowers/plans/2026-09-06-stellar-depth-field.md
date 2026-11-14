# Stellar Depth Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir e integrar el fondo procedural `stellar-depth-field` con profundidad 2.5D, movimiento cinematográfico, ambiente galáctico y controles reales en el Inspector.

**Architecture:** Un módulo matemático puro genera partículas XYZ seeded y proyecta cualquier fotograma sin estado acumulado. Un componente Canvas especializado memoiza la población base y dibuja nebulosa, estrellas y polvo; `ParticleBackground` lo monta exclusivamente para el nuevo ID. Las propiedades viven en `AnimationContext`, viajan por `MainComposition` y se editan mediante controles condicionales del Inspector.

**Tech Stack:** TypeScript, React, Canvas 2D, Remotion 4, Vitest, Testing Library.

## Global Constraints

- Renderer 2.5D determinista; no `Math.random()` ni dependencias nuevas.
- El frame N no depende de renderizar frames anteriores.
- El fondo base global permanece separado.
- Ningún background anterior cambia de comportamiento ni recibe controles Stellar.
- Defaults sobrios, cinematográficos y útiles sin ajuste manual.

---

### Task 1: Matemática espacial pura

**Files:**
- Create: `src/remotion/backgrounds/stellarDepthField.ts`
- Create: `tests/editor/stellar-depth-field.test.ts`

**Interfaces:**
- Produces: `StellarParticle`, `StellarProjectionOptions`, `createStellarParticle(seed,index,distribution)`, `projectStellarParticle(particle,frame,options)`, `getDepthBlur(z,focus,dof)`, `getStellarColor(...)`.

- [ ] Escribir pruebas fallidas que demuestren determinismo, diferencia por seed, proyección near/mid/far, parallax, perspectiva, DOF, centelleo independiente, modos de movimiento, wrapping y formatos 16:9/9:16/1:1.
- [ ] Ejecutar `npx vitest run tests/editor/stellar-depth-field.test.ts` y confirmar fallo por API ausente.
- [ ] Implementar generación hash seeded, transformación temporal directa, cámara, wrapping Z y proyección normalizada.
- [ ] Repetir el test dirigido hasta PASS.

### Task 2: Renderer Canvas especializado

**Files:**
- Create: `src/remotion/backgrounds/StellarDepthField.tsx`
- Modify: `src/remotion/backgrounds/ParticleBackground.tsx`
- Modify: `tests/editor/background-representatives.test.tsx`

**Interfaces:**
- Consumes: funciones puras de Task 1 y `StellarDepthFieldProps` tipadas.
- Produces: componente `StellarDepthField` montado únicamente cuando `preset === 'stellar-depth-field'`.

- [ ] Añadir prueba fallida de montaje real y aislamiento respecto de otros presets.
- [ ] Implementar Canvas único, datos estáticos memoizados, buckets far/mid/near, halos limitados, polvo secundario y nebulosa procedural de pocos gradientes.
- [ ] Dibujar usando `useCurrentFrame()` y `useVideoConfig()` para igualdad preview/export.
- [ ] Ejecutar pruebas Stellar y representantes hasta PASS.

### Task 3: Estado canónico, catálogo y transporte

**Files:**
- Modify: `src/lib/types/animation.ts`
- Modify: `src/lib/AnimationContext.tsx`
- Modify: `src/lib/editor/catalog.ts`
- Modify: `src/lib/editor/selection.ts`
- Modify: `src/remotion/MainComposition.tsx`
- Modify: `src/remotion/backgrounds/ParticleBackground.tsx`
- Modify: `tests/editor/catalog.test.ts`
- Modify: `tests/editor/selection.test.ts`

**Interfaces:**
- Adds `stellarDensity`, `stellarDistribution`, `stellarSize`, `stellarSizeVariation`, `stellarDepth`, `stellarPerspective`, `stellarMotionMode`, `stellarSpeed`, `stellarDriftAngle`, `stellarParallax`, `stellarCameraMotion`, `stellarSway`, `stellarRotation`, `stellarZSpeed`, `stellarStreaks`, `stellarBrightness`, `stellarGlow`, `stellarTwinkle`, `stellarColorMode`, `stellarColorA`, `stellarColorB`, `stellarTemperatureVariation`, `stellarDof`, `stellarFocusPlane`, `stellarDepthFog`, `stellarDust`, `stellarNebula`, `stellarNebulaScale`, `stellarNebulaSpeed`, `stellarNebulaIntensity`, `stellarNebulaColor`, `stellarSeed`.

- [ ] Añadir pruebas fallidas de catálogo, defaults seguros y restauración por selección.
- [ ] Incorporar ID, tipos y defaults canónicos.
- [ ] Transportar todas las props por `MainComposition` hasta el renderer.
- [ ] Persistirlas en el dominio de background y comprobar JSON-safe.

### Task 4: Inspector condicional y presets

**Files:**
- Modify: `src/components/inspector/tabs/BackgroundBasicTab.tsx`
- Modify: `tests/editor/inspector-tabs.test.tsx`
- Modify: `tests/editor/presets-and-tabs.test.tsx`

**Interfaces:**
- Consumes: props canónicas de Task 3; escribe mediante `setProps`.

- [ ] Añadir pruebas fallidas para visibilidad exclusiva, defaults, sliders, cambios reales, reset, controles condicionales y preset save/load.
- [ ] Implementar grupos Campo, Movimiento, Luz, Profundidad, Ambiente y Sistema.
- [ ] Mostrar Z/Estelas solo con Avance, variación térmica solo en temperatura, colores según modo, foco solo con DOF y controles de nebulosa solo cuando esté activa.
- [ ] Ejecutar pruebas de Inspector y presets hasta PASS.

### Task 5: Verificación terminal y App local

**Files:**
- Modify: `docs/superpowers/specs/2026-09-06-stellar-depth-field-design.md` únicamente si la implementación exige documentar una limitación real.

- [ ] Ejecutar `npm run test:editor`.
- [ ] Ejecutar `node node_modules/typescript/bin/tsc --noEmit --incremental false`.
- [ ] Ejecutar `node node_modules/next/dist/bin/next lint`.
- [ ] Ejecutar `npm run build`.
- [ ] Reiniciar únicamente el servidor del proyecto en `http://localhost:3000/` y confirmar HTTP 200 con la App.
- [ ] Entregar el fondo como `IMPLEMENTACIÓN COMPLETA / LISTA PARA QA VISUAL`, dejando la aprobación estética al usuario.
