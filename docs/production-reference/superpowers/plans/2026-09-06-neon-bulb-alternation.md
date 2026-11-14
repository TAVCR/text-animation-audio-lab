# Neon Bulb Alternation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace `paper-confetti-settle` with a deterministic neon bulb grid using two asynchronously alternating colors and configurable controls.

**Architecture:** Add a pure deterministic grid/state helper consumed by the existing 2D background renderer and by tests. Migrate the old background ID at the existing state/preset boundary, then expose only the new background's controls through the existing Inspector and catalog contracts.

**Tech Stack:** React, TypeScript, Vitest, Testing Library, existing canvas renderer and editor catalog.

## Global Constraints

- Do not use `Math.random()` during render.
- Do not add dependencies, fonts, Three.js, or a parallel migration system.
- Preserve the global background/base color controls separately from bulb colors.
- Preview and render must consume the same deterministic helper.
- Use TDD: each production behavior gets a failing directed test first.

### Task 1: Deterministic grid helper

**Files:**
- Create: `src/remotion/backgrounds/neonBulbAlternation.ts`
- Test: `tests/editor/neon-bulb-alternation.test.ts`

- [ ] Write failing tests for stable grid dimensions at 9:16, 16:9, and 1:1; regular spacing; deterministic cell phase/frequency/bias; distinct cell phases; and temporal color/intensity alternation.
- [ ] Run `node node_modules/vitest/vitest.mjs run tests/editor/neon-bulb-alternation.test.ts` and verify the expected failure.
- [ ] Implement typed helpers `getNeonGridLayout(width,height,density)` and `getNeonBulbState(cellIndex,frame,fps, speed)` with bounded rows/columns and seeded hash math.
- [ ] Run the directed test again and confirm green.

### Task 2: Canonical types, defaults, catalog, and migration

**Files:**
- Modify: `src/lib/types/animation.ts`
- Modify: `src/lib/AnimationContext.tsx`
- Modify: `src/lib/editor/catalog.ts`
- Modify: `tests/editor/catalog.test.ts`
- Modify: `tests/editor/background-contract.test.ts`
- Test: `tests/editor/background-migration.test.ts`

- [ ] Add `neon-bulb-alternation` and its six JSON-safe props: Color A, Color B, density, size, brightness, speed.
- [ ] Add one canonical default object and use it from reset/state initialization.
- [ ] Replace the visible catalog label with `Neon Bulb Alternation` and remove the old entry from new selections.
- [ ] Extend the existing persistence migration boundary so `paper-confetti-settle` becomes `neon-bulb-alternation`, preserving unrelated fields and avoiding a second migration system.
- [ ] Write and run failing-then-green tests for catalog membership, old-ID migration, and legacy preset loading.

### Task 3: Real renderer integration

**Files:**
- Modify: `src/remotion/backgrounds/ParticleBackground.tsx`
- Modify: `src/remotion/MainComposition.tsx`
- Test: `tests/editor/background-contract.test.ts`

- [ ] Add the new props to the existing renderer contract and pass them through `MainComposition`.
- [ ] Add a renderer branch that draws fixed grid cells with neon core and halo, interpolating Color A/B from the shared helper state.
- [ ] Ensure no gravity, falling, settling, moving positions, or `Math.random()` remain in this branch.
- [ ] Prove the branch uses the new ID and shared helper without falling back to generic particles.
- [ ] Run the focused renderer/catalog tests and TypeScript.

### Task 4: Inspector, reset, presets, and thumbnail

**Files:**
- Modify: `src/components/inspector/tabs/BackgroundBasicTab.tsx`
- Modify: `src/lib/editor/catalog.ts` or the existing thumbnail source
- Test: `tests/editor/inspector-tabs.test.tsx`
- Test: `tests/editor/background-basic.test.tsx`

- [ ] Add only Color A, Color B, Density, Size, Brightness, and Speed when `neon-bulb-alternation` is selected.
- [ ] Use existing field components, canonical defaults, accessible labels, and defined ranges/steps.
- [ ] Test hidden controls for other backgrounds, default values, real state updates, reset, and preset save/load through existing APIs.
- [ ] Replace any confetti thumbnail with a representative two-color glowing grid thumbnail.

### Task 5: Verification and handoff

**Files:**
- Modify: relevant F7 progress documentation after technical verification

- [ ] Run all directed N-B01 regression, migration, renderer, Inspector, and neon helper tests.
- [ ] Run `node node_modules/typescript/bin/tsc --noEmit --incremental false`.
- [ ] Run the relevant editor/background suite only after directed tests pass.
- [ ] Verify no old-ID selection remains except the migration path and no other backgrounds changed unintentionally.
- [ ] Report `NEON BULB ALTERNATION — LISTO PARA QA VISUAL` with exact test and TypeScript results; do not declare visual closure before manual QA.
