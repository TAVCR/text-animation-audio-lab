# N01 — ARCHITECTURE AUDIT

Status: **N01 — REMEDIATION IN REVIEW**. N00 is REMEDIATION IN REVIEW; N02 is BLOCKED. Historical audit delivery is not gate closure.

Input: N00 baseline commit `4cf9b1a2063fa39846a3c31e32099f7a9c185b2b`.

## Result

### Remediation delivery

- Missing HDR/font dependency follow-up: DEPENDENCY-REMEDIATION.md, updated DEPENDENCIES.md/AUDIT.md and generated import-graph-remediation.json (61/72 local files, no CSS, no unresolved local imports).
- Remote studio HDR documented through installed Drei/R3F, including URL, in-memory cache, cold offline limitation and extruded-3d scope. No download/fix performed.
- 2D font sources distinguished from explicit 3D local font loading; exact rendered glyph font is PENDING N03 RUNTIME VERIFICATION.
- Cancellation wording corrected in AUDIT, dependency report and TEST-MATRIX: callbacks/checks are not active renderer interruption.
- MASTER-PLAN, ARCHITECTURE and GATES incorporate Astra's decisions and review-only status. No Core/CLI/MCP or N02 source exists as part of this change.
- Controlled baseline and final verification logs are under ../N00/. Dedicated remediation commit is reported at handoff; no self-referential commit hash is embedded.

### Historical audit result (qualified by remediation above)

- Render map complete with file:line references: `/api/render`, bundling, composition lookup, `Main`, `Root`, registry, catalog, defaults, duration/fps/dimensions, alpha, codecs, GPU policy, encoder override, diagnostics, fallback, temporary/output paths, cleanup, delivery, cancellation, and batch.
- Dependency audit complete for React, browser/Chromium, Remotion, Next, Electron, UI, filesystem, cwd, aliases, assets, and fonts.
- Catalog equivalence verified: 32 `AnimationStyle` IDs = 32 registry IDs = 32 text catalog IDs; 41 particle/background IDs match their catalog.
- Existing test matrix and missing characterization are documented.
- Preliminary risks were confirmed or narrowed without implementing fixes.
- N01 post-audit production comparison: 258/258 critical files unchanged; see `production-comparison.json`.

## Recommendation

**B + C**: shared Automation Core plus a thin Node/Remotion adapter; Next, CLI, and MCP remain adapters over the same Core. This minimizes duplication and keeps policy, filesystem, lifecycle, diagnostics, and parity in one place while acknowledging that Remotion still needs React/Chromium for rendering.

## Future contracts proposed

- `AutomationRenderRequest` / `AutomationStillRequest`: `schemaVersion`, closed `animationId`, validated animation-specific parameters, normalized text, aspect ratio, resolution preset, duration controls, output profile, and GPU policy. Host-controlled roots/signals are not model-selected fields.
- `AutomationRenderResult` / `AutomationStillResult`: discriminated status (`succeeded|failed|cancelled`), `jobId`, `artifactId`, canonical confined output path, media type, width/height, fps, duration/frames, codec/container/pixel format/alpha where applicable, requested/effective GPU policy, renderer/encoder metadata, ordered attempts, fallback, diagnostics, and structured error.
- Alpha and hardware metadata must distinguish requested, configured/declared, and verified/observed values.

## N02 candidates

`src/automation/contracts.ts`, `normalize.ts`, `catalog.ts`, `filesystem.ts`, `core.ts`, and `remotionAdapter.ts`, plus characterization tests and a delegating Next adapter. The exact extraction boundary remains subject to Astra review.

## Confirmed risks

Main cancellation absent; PNG CPU-forced; GPU/encoder diagnostics are attempt labels rather than physical observations; age-based cleanup deletes media in the route; opaque ProRes can receive `.mp4`; request props are unrestricted; server roots lack future-grade confinement/collision defenses; real headless Node and real codec/alpha probes are not yet present.

## Discarded or not confirmed

- No evidence of a prohibited `renderFrames → FFmpeg → video` pipeline or a successful `renderMedia` followed by a second video render in the main route.
- The single-success-per-video and PNG-only-`renderFrames` invariants are covered by code and baseline tests.
- Catalog/type/registry drift was not found for the 32 text IDs or 41 background IDs.
- Production was not modified; N00 integrity comparison remains PASS.

## Commit and stop

N01 documentation and the updated plans are committed separately from N00. The final audit commit hash is reported at handoff. No N02/N03/N04/N05 implementation is included.
