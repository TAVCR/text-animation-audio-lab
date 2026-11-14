# N01 — Test and characterization matrix

## Baseline gate

The Automation copy passes the inherited baseline: **59 test files / 366 tests**, TypeScript, ESLint, and Next build. Full command evidence is under `../N00/`.

## Existing render coverage

| Area | Existing evidence | Current level | Gap for Automation |
|---|---|---|---|
| One successful video call | `tests/editor/render-single-pass-contract.test.ts:24-32` | Mocked route contract; one `renderMedia` call | Real Remotion artifact and exactly-one-success instrumentation in N03 |
| Batch video | `render-single-pass-contract.test.ts:34-42`; route `route.ts:341-380` | Mocked, sequential calls | Job/artifact identity, partial failure policy, collision and cleanup |
| PNG only | `render-single-pass-contract.test.ts:44-55`; route `route.ts:218-271` | Mocked `renderFrames`, no `renderMedia` | Real PNG dimensions/alpha/frame and output-root enforcement |
| GPU / CPU policy | `gpu-policy.test.ts:4-23`; `gpu-render-integration.test.ts:7-43` | Deterministic policy and mocked attempts | Requested/configured/observed GPU distinction and real hardware probe |
| GPU fallback | `render-single-pass-contract.test.ts:70-85` | Mocked GPU failures then CPU success | Partial artifact cleanup, cancellation during renderer, structured attempts |
| Cancellation | `gpu-render-integration.test.ts:30-32`; `subtitle-render.test.ts:31-37` | Callback/checks before/after operations; subtitle case cancels before renderer starts | Active interruption during renderMedia is NOT demonstrated; N02 contract doubles, N03 real interruption/timeout |
| Duration/dimensions | `render-route-duration.test.ts:18-47`; `videoConfig.ts:1-223` | Route metadata mocked, 30 fps/defaults exercised | Full parity matrix for aspect/resolution/animation/long text |
| Catalog | `catalog.test.ts:5-26`; `catalog-equivalence.json` | Catalog uniqueness plus N01 static equivalence: 32 text, 41 backgrounds | Runtime catalog contract with closed parameter schemas |
| Font/assets | `desktop-package-config.test.ts:18-30`; `available-fonts.test.ts` | Packaging/reference checks | Headless static asset serving, missing font/asset behavior |
| Output delivery | `export-filesystem.test.ts:7-193` | Browser File System Access/download writer | Server artifact publication, roots, reparse/UNC/ADS and inspect |

## Boundary correction after Astra review

Characterization of legacy route, closed schemas, normalization, policy, filesystem confinement and lifecycle with doubles belong to N02, before extraction. Real artifacts, alpha, fonts/HDR offline behavior, hardware observation and active cancellation/timeout belong to N03. Neither is implemented by this remediation.

## Required N03 media matrix (historical list; boundary correction above applies)

The following is planned, not claimed as executed:

- video: h264 opaque, ProRes 4444 alpha, VP9 alpha;
- still: PNG at first/middle/last frame;
- aspect ratios: 16:9, 9:16, 1:1;
- resolution presets: 1080p, 1440p, 4K, 8K (resource-gated);
- animation representatives: 2D, 3D, dual-layer, imported-video background, and a WebGL/Three scene;
- policies: CPU, Auto success, Auto fallback, GPU strict failure, and `REMOTION_USE_GPU=0`;
- diagnostics: requested policy, configured attempt, GL backend, encoder requested/effective/observed, fallback and ordered errors;
- lifecycle: cancellation before start, during render, after renderer success but before publish, timeout, stale temp cleanup, output collision;
- filesystem: traversal, absolute/UNC/drive-relative paths, ADS, reserved names, trailing dot/space, symlink/junction/reparse, cross-root publication;
- parity: legacy route versus Core for dimensions, duration, default props, selected template/background, alpha/profile, and successful artifact metadata.

## N01 non-actions

No functional code, tests, package state, CLI, MCP, or real headless renderer was added in N01. That boundary is intentional and remains a gate for N02/N03 review.
