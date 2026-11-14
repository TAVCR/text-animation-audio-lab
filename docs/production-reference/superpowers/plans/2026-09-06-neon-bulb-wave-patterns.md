# Neon Bulb Wave Patterns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Añadir patrones luminosos deterministas, seleccionables y combinables al fondo `Neon Bulb Alternation`.

**Architecture:** El módulo puro `neonBulbAlternation.ts` calculará una señal espacial normalizada por bombilla. El estado canónico guardará la configuración; el Inspector lo editará y `MainComposition` lo transferirá a `ParticleBackground`, que aplicará la señal a color, brillo y halo sin mover la retícula.

**Tech Stack:** TypeScript, React, Canvas 2D, Remotion, Vitest, Testing Library.

## Global Constraints

- Conservar posiciones fijas, alternancia bicolor y fondo difuminado.
- No añadir dependencias, partículas móviles ni aleatoriedad no determinista.
- Mantener compatibilidad con presets antiguos mediante defaults.
- Mostrar los controles exclusivamente para `neon-bulb-alternation`.

---

### Task 1: Motor matemático de patrones

**Files:**
- Modify: `src/remotion/backgrounds/neonBulbAlternation.ts`
- Test: `tests/editor/neon-bulb-alternation.test.ts`

**Interfaces:**
- Produces: `NeonBulbPattern`, `NeonPatternOptions`, `getNeonPatternSignal(point, cellIndex, frame, fps, options): number`, and an extended `getNeonBulbState(..., point?, options?): NeonBulbState`.

- [ ] **Step 1: Write failing tests** for deterministic horizontal, vertical, diagonal, radial, spiral and angular signals; reverse direction; organic/spatial homogeneity; and primary/secondary mix endpoints.
- [ ] **Step 2: Run** `npm run test:editor -- tests/editor/neon-bulb-alternation.test.ts` and confirm the missing pattern API fails.
- [ ] **Step 3: Implement** normalized Cartesian, radial, polar and projected-wave functions, clamping every public result to `0..1`; blend two signals before blending with the seeded organic signal.
- [ ] **Step 4: Run the directed test** and require PASS.

### Task 2: Canonical state, defaults and composition transport

**Files:**
- Modify: `src/lib/types/animation.ts`
- Modify: `src/lib/AnimationContext.tsx`
- Modify: `src/lib/editor/selection.ts`
- Modify: `src/remotion/MainComposition.tsx`
- Modify: `src/remotion/backgrounds/ParticleBackground.tsx`
- Test: `tests/editor/neon-bulb-alternation.test.ts`

**Interfaces:**
- Adds canonical props: `neonBulbPattern`, `neonBulbCombinePattern`, `neonBulbSecondaryPattern`, `neonBulbPatternMix`, `neonBulbHomogeneity`, `neonBulbWaveLength`, `neonBulbPatternSpeed`, `neonBulbContrast`, `neonBulbSoftness`, `neonBulbReverse`, `neonBulbPatternAngle`, `neonBulbCenterX`, `neonBulbCenterY`.

- [ ] **Step 1: Add failing transport/default assertions** proving old props obtain organic/non-combined defaults and changed values reach the renderer.
- [ ] **Step 2: Run the directed test** and confirm failure for absent fields.
- [ ] **Step 3: Add typed props/defaults**, include them in the template-specific selection snapshot, pass them through `MainComposition`, and use them in the Canvas branch.
- [ ] **Step 4: Run the directed test and TypeScript** with `node node_modules/typescript/bin/tsc --noEmit --incremental false`.

### Task 3: Conditional Inspector controls

**Files:**
- Modify: `src/components/inspector/tabs/BackgroundBasicTab.tsx`
- Test: `tests/editor/inspector-tabs.test.tsx`

**Interfaces:**
- Consumes the canonical props from Task 2 and writes through `setProps`.

- [ ] **Step 1: Add failing UI tests** for primary selection, combination toggle, secondary/mix visibility, angular visibility, center visibility, disabled duplicate secondary choice, slider updates and reset behavior.
- [ ] **Step 2: Run** `npm run test:editor -- tests/editor/inspector-tabs.test.tsx` and confirm failure.
- [ ] **Step 3: Implement accessible selects, checkbox and NumberField sliders** with conditional rendering and canonical default values.
- [ ] **Step 4: Run both directed test files** and require PASS.

### Task 4: Persistence regression and terminal verification

**Files:**
- Modify only the existing closest preset test if generic persistence lacks explicit coverage.
- Modify: `docs/superpowers/specs/2026-09-06-neon-bulb-wave-patterns-design.md` only if implementation reveals a necessary clarification.

**Interfaces:**
- Consumes the existing generic preset persistence system; creates no new storage mechanism.

- [ ] **Step 1: Add a focused preset save/load test** that changes both pattern selectors and numeric options, restores them in a new provider, and confirms JSON serialization.
- [ ] **Step 2: Run the focused persistence and Neon tests**, then fix only demonstrated regressions.
- [ ] **Step 3: Run** `npm run test:editor`.
- [ ] **Step 4: Run** `node node_modules/typescript/bin/tsc --noEmit --incremental false`.
- [ ] **Step 5: Run** `node node_modules/next/dist/bin/next lint` and `npm run build`.
