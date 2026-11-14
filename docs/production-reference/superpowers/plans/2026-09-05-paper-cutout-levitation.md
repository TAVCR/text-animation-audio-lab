# Paper Cutout Levitation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Mantener las piezas de `paper-cutout-assemble` en una levitación suave y determinista durante toda la duración de la composición.

**Architecture:** Reutilizar `getPaperCutoutPiece` y la animación de entrada existente. Después de alcanzar `progress = 1`, sumar a cada pieza un desplazamiento vertical sinusoidal independiente, con fase derivada de la semilla y del índice; no modificar la posición horizontal ni el layout final. Exponer amplitud y velocidad solo cuando N‑T02 esté seleccionado.

**Tech Stack:** React, TypeScript, Remotion, Vitest, controles `NumberField` existentes.

## Global Constraints

- No instalar fuentes, dependencias ni crear infraestructura paralela.
- El movimiento debe ser determinista y funcionar igual en preview y render.
- La entrada/caída existente debe conservarse.
- El desplazamiento debe permanecer cerca de la posición original y no producir jitter residual.

### Task 1: Contrato determinista de levitación

**Files:**
- Modify: `src/remotion/templates/paperCutoutUtils.ts`
- Test: `tests/editor/paper-cutout.test.ts`

**Interfaces:**
- `getPaperCutoutPiece(index, frame, settleFrames, seed, floatAmplitude, floatSpeed)` conserva sus campos actuales y añade `floatY` en unidades relativas.

- [x] **Step 1: Write the failing test**

Añadir un caso que compruebe que dos llamadas iguales producen el mismo `floatY`, que el valor está acotado por la amplitud y que cambia entre frames posteriores al asentamiento.

- [x] **Step 2: Run the focused test**

Run: `npx vitest run tests/editor/paper-cutout.test.ts`

Expected: FAIL porque `floatY` y los parámetros nuevos aún no existen.

- [x] **Step 3: Implement minimal deterministic motion**

Derivar una fase estable desde `seed:index`, calcular `floatY = amplitude * sin(phase + frame * speed / 30) * 0.5`, y multiplicarlo por `progress` para que no aparezca antes de terminar la entrada.

- [x] **Step 4: Run focused tests**

Run: `npx vitest run tests/editor/paper-cutout.test.ts`

Expected: PASS.

### Task 2: Props, defaults, Inspector y composición

**Files:**
- Modify: `src/lib/types/animation.ts`
- Modify: `src/lib/AnimationContext.tsx`
- Modify: `src/components/inspector/tabs/TextBasicTab.tsx`
- Modify: `src/remotion/templates/PaperCutoutAssemble.tsx`
- Test: `tests/editor/presets-and-tabs.test.tsx`

- [x] **Step 1: Add typed defaults**

Añadir `paperCutoutFloatAmplitudePx` con default `3` y rango `0–8`, y `paperCutoutFloatSpeed` con default `1` y rango `0–3`.

- [x] **Step 2: Expose contextual controls**

Mostrar ambos `NumberField` únicamente para `paper-cutout-assemble`, conectados a `setProps` y con reset individual a los defaults canónicos.

- [x] **Step 3: Apply levitation after assembly**

Usar `piece.floatY` en `translateY`, conservando la caída, rotación, color, sombra, texto y layout existentes.

- [x] **Step 4: Add integration regression**

Probar selección real de N‑T02, cambio de amplitud, actualización de props y restauración por preset.

- [x] **Step 5: Verify**

Run: `npx vitest run tests/editor/paper-cutout.test.ts tests/editor/presets-and-tabs.test.tsx -t "paper cutout"`

Run: `node node_modules/typescript/bin/tsc --noEmit --incremental false`

Expected: all focused tests and TypeScript PASS.

### Task 3: Regression verification

- [x] **Step 1:** Run `npm run test:editor`.
- [x] **Step 2:** Run `node node_modules/next/dist/bin/next lint`.
- [x] **Step 3:** Run `npm run build`.
- [x] **Step 4:** Verify that only N‑T02 changes visually and that legacy templates retain their existing output.
