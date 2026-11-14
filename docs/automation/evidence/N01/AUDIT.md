# N01 — Architecture audit

Status: **N01 — REMEDIATION IN REVIEW**. Findings below include historical audit observations; the remediation addendum supersedes claims of completeness.

Audit input commit: `4cf9b1a2063fa39846a3c31e32099f7a9c185b2b` (`N00-isolation-baseline`).

## Current render map

Remediation addendum: `DEPENDENCY-REMEDIATION.md` and `import-graph-remediation.json` complete the missing static dependency follow-up. Main's 61-file local closure and the Remotion entry's 72-file closure have no CSS imports. Next's Google Fonts stylesheet does not enter that graph; 2D CSS font names rely on available browser/system fonts or fallback, with actual font identity pending N03. Extruded3D loads local 3D font files but its Environment studio preset resolves remotely to studio_small_03_1k.hdr through installed Drei. R3F in-memory loader caching does not establish durable offline support. No asset was downloaded or source fixed. See the companion report for exact source chain, URL, font table and scope limitations.

### Video and PNG entrypoint

- `src/app/api/render/route.ts:172-178` is the only main POST entrypoint found. It is a Next Node route (`:9-10`), parses the request into `RenderInputProps & Record<string, unknown>` (`:172-175`), bundles the Remotion entrypoint (`:144-170`), and dynamically imports `getCompositions`/`renderMedia` (`:177-178`).
- The bundle entry is `src/remotion/index.ts:1-3`, which registers `RemotionRoot`. The route resolves that entry through `process.cwd()` and injects the `@` alias to `process.cwd()/src` (`route.ts:147-160`). This is a real cwd and alias dependency.
- `src/remotion/Root.tsx:75-174` registers `Main`, `CaptionedVideo`, and seven experimental compositions. `Main` is the production text/background composition (`:81-100`); its metadata derives dimensions and duration from request props (`:89-99`).
- `src/remotion/MainComposition.tsx:8-21` adapts border props, selects `templateRegistry[animationStyle]`, and composes `ParticleBackground` plus the active text effect (`:23-162`).

### Video path

1. The route resolves transparency, codec, extension, aspect ratio, resolution, duration, and PNG-vs-video mode (`route.ts:180-195`).
2. It builds attempts from `buildRenderAttemptDescriptors` (`route.ts:197-216`; implementation `src/lib/render/renderAttempts.ts:1-17`). `REMOTION_USE_GPU` can remove GPU attempts (`route.ts:197-208`), and `REMOTION_GL` selects the preferred GL backend (`route.ts:48-57`).
3. For each batch line or the single request, `renderSingleWithFallback` calls `getCompositions`, selects composition `Main`, overrides width/height/duration, and calls `renderMedia` (`route.ts:273-320`). Failed attempts are logged and the next policy attempt runs (`:329-338`).
4. Batch rendering is sequential by design (`route.ts:341-380`), producing one output per non-empty line. A single request renders once through the same function (`:396-412`).
5. The response exposes `outputPath`, URL, dimensions, duration, attempt, mode, GL backend, encoder label, and fallback (`route.ts:382-412`). Failure is an HTTP 500 with a free-form message (`:414-417`).

### Still PNG path

- `outputProfile === 'png-paused-frame-alpha'` selects the still branch (`route.ts:192`, `:218-271`). That branch imports and calls `renderFrames` only (`:219`, `:232-250`), with a one-frame range and `imageFormat: 'png'` (`:242-244`). It checks that the expected file exists before returning (`:251-264`).
- PNG attempts are explicitly forced to one CPU-labelled attempt (`route.ts:202`), so a GPU request is not honored for this path. There is no `renderMedia` call in the PNG branch.
- Frame normalization is clamp-and-round (`src/lib/editor/stillExport.ts:6-10`); non-finite input maps to the last frame. The editor passes the normalized frame to the same route (`src/lib/hooks/useRenderExport.ts:251-287`).

### Codec, alpha, and encoder observations

- Opaque requests default to `h264` and `.mp4`; transparent requests select VP9/ProRes and `.webm`/`.mov` (`route.ts:180-184`).
- Transparent VP9 requests use `yuva420p`; transparent ProRes requests use `yuva444p10le` and `proResProfile: '4444'` (`route.ts:305-313`).
- `ffmpegOverride` only rewrites `libx264`/`libx265` to NVENC for eligible Windows opaque attempts (`route.ts:208-216`; policy `renderAttempts.ts:9-16`). No independent FFmpeg transcode pipeline was found. `renderFrames → FFmpeg → video` and `renderMedia → intermediate → second renderMedia` were not observed in this route.
- `VideoCodec` includes `h265` (`route.ts:27-29`), but the public route resolver only exposes h264 for opaque and vp9/prores for transparent (`:181-184`). H265 is therefore not a proven public capability.
- A real mismatch exists for an opaque request with `transparentCodec: 'prores'`: codec becomes ProRes but extension remains `.mp4` because the extension branch keys on `wantsTransparency` (`route.ts:180-184`). This is documented as a risk, not fixed in N01.

## Catalog and defaults

- `AnimationStyle` declares 32 IDs (`src/lib/types/animation.ts:3-35`).
- `templateRegistry` maps all 32 IDs to components (`src/remotion/templates/registry.ts:38-71`).
- `textTemplateCatalog` declares all 32 text entries (`src/lib/editor/catalog.ts:22-30`).
- The background type and catalog each contain 41 IDs (`animation.ts:65-106`; `catalog.ts:36-51`).
- Programmatic equivalence evidence is in `catalog-equivalence.json`: type, registry, and text catalog are all 32 with no missing IDs; background type and catalog are both 41 with no missing IDs.
- Defaults are centralized in `src/lib/AnimationContext.tsx:136-379`, including text, fonts, aspect ratio, resolution, transparency, animation style, motion duration, particle preset, and 3D font selection. `AnimationContext` is marked `'use client'` and includes localStorage/history/editor behavior (`:1-9`, `:400-680`), so it is a significant UI coupling point even though Remotion imports its types/defaults.

## Invariants verified by code and baseline tests

- Video: the main route calls `renderMedia` inside the attempt loop (`route.ts:285-320`). A prior failed attempt may call it again; a successful output returns immediately. Tests cover one successful call per video and one per batch item (`tests/editor/render-single-pass-contract.test.ts:24-42`), plus GPU→CPU fallback (`:70-85`).
- PNG: the route calls `renderFrames` and never `renderMedia` in the still branch (`route.ts:218-271`; tests `render-single-pass-contract.test.ts:44-55`).
- Attempt policy: CPU is CPU-only, GPU is GPU-only, and Auto includes CPU fallback (`renderAttempts.ts:9-17`; `tests/editor/gpu-policy.test.ts:4-23`).
- Checks/callbacks before and after selected operations exist in the captioned-video helper (`src/lib/render/renderCaptionedVideo.ts:7-22`); the cancellation test (`tests/editor/subtitle-render.test.ts:31-37`) cancels before rendering. Neither demonstrates active interruption of `renderMedia` while working. Main `/api/render` does not connect cancellation; real renderer interruption remains N03.

## Architecture comparison

| Option | Evidence-based assessment | Decision |
|---|---|---|
| A — call the existing API route | Preserves behavior, but requires Next, `NextResponse`, cwd-sensitive bundling, server-managed output, cleanup, and an HTTP lifecycle. It also exposes an unvalidated arbitrary props record (`route.ts:172-175`). | Keep only as a parity/reference adapter. Not the future core. |
| B — shared Automation Core | Best place for normalized contracts, one render policy, filesystem roots, attempts, cancellation, inspection, diagnostics, and publication. It removes policy duplication across consumers. | **Recommended.** |
| C — Node runner around existing functions | Useful as the first adapter, but the main video implementation is nested inside the POST handler (`route.ts:273-339`). A C-only wrapper would either remain coupled to Next or duplicate it. | Use as a thin Node/Remotion adapter around B, not as the sole architecture. |

### N01 recommendation

Ratify **B + C**:

```text
Next route ─┐
CLI         ├─> Automation Core ─> Remotion adapter ─> Root/Main/registry
MCP         ┘
```

The current route remains a parity adapter in Automation. The future Core owns request validation, lifecycle, policy, roots, artifact publication, and structured diagnostics. The Remotion adapter owns bundling/composition lookup/`renderMedia`/`renderFrames`. No consumer-specific OpenDesign, Hyperframes, or DaVinci code belongs in this repository.

## Candidate N02 extraction scope

The first extraction should be conservative and touch only Automation:

- `src/automation/contracts.ts` — closed request/result/error shapes and schema version.
- `src/automation/normalize.ts` — catalog ID validation, defaults, aspect/resolution/duration normalization, PNG frame rules.
- `src/automation/catalog.ts` — metadata view over the existing catalog; no React component imports for listing/describe.
- `src/automation/filesystem.ts` — trusted output/temp roots, canonicalization, collision reservation, publication, and job-owned cleanup.
- `src/automation/core.ts` — job lifecycle, attempt orchestration, cancellation, fallback, diagnostics, and artifact result.
- `src/automation/remotionAdapter.ts` — the only Core-to-Remotion boundary; initially reuse `Root`, `MainComposition`, registry, and existing renderer packages.
- A small Next adapter under `src/app/api/render/` that delegates to Core, preserving parity tests.
- `tests/automation/` for contract, normalization, filesystem, policy, and parity characterization.

Do not create these files in N01; they are scope for N02 after review.

## Capabilities not present or not proven

- No Node-only render runner exists today; current main rendering is inside a Next route.
- No runtime schema validation for requests; the route accepts `Record<string, unknown>`.
- No structured artifact/job/error contract.
- No request cancellation signal wired into `/api/render`.
- No independent hardware GPU probe or observed encoder verification.
- No path-root canonicalization, reparse-point defense, UNC/ADS/reserved-name policy for server outputs.
- No collision reservation for server-generated output paths.
- No artifact inspection endpoint/tool.
- No CLI or MCP server.
- No OpenDesign, Hyperframes, or DaVinci integration.
- No real headless Node render demonstration was run in N01; that belongs to N03.
