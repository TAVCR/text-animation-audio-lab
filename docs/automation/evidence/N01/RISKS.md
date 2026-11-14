# N01 — Risks and decisions

| Risk / claim from preliminary plan | N01 finding | Evidence | Decision |
|---|---|---|---|
| Main cancellation signal is not connected | **Confirmed.** Main `POST` reads `req.json()` but never uses `req.signal`, AbortController, timeout, or renderer cancellation options. | `src/app/api/render/route.ts:172-178`, `:273-339`; search evidence shows no AbortController/signal in main path. | Carry into N02 contract and N03 implementation. No fix in N01. |
| PNG appears CPU-forced | **Confirmed.** PNG sets `renderAttempts` to a single CPU-labelled attempt and passes no Chromium GPU options. | `route.ts:202`, `:218-271`. | Expose effective policy explicitly in future results; do not silently change it. |
| GPU diagnostics may describe attempt, not hardware | **Confirmed / underspecified.** `gpuAvailable` is derived from selected render mode, and `encodeMode` from presence of an FFmpeg override; no physical GPU or encoder probe occurs. | `route.ts:322-327`, `:392-411`; `src/lib/render/gpuDiagnostics.ts:4-18`. | Separate requested, configured, and observed/probed fields in future contracts. |
| Cleanup might delete future deliverables | **Confirmed.** Every request asynchronously scans `process.cwd()/public/renders` and deletes `.mp4/.webm/.mov/.png` older than one hour. | `route.ts:94-140`, `:175-176`. | Do not inherit cleanup for delivered artifacts; restrict cleanup to owned temp jobs in Core. |
| Codec/container mismatch | **Confirmed.** Opaque `transparentCodec: 'prores'` yields ProRes codec but `.mp4` extension because extension uses `wantsTransparency`. Transparent ProRes is `.mov` with 4444 profile and `yuva444p10le`. | `route.ts:180-184`, `:305-313`. | Treat codec/container as a closed profile in N02/N03; no N01 fix. |
| Alpha claims may be inferred from request/extension | **Confirmed.** Route returns requested/effective labels but does not inspect the resulting media for alpha. | `route.ts:400-412`; no media inspection path found. | Future result must distinguish requested, declared, and verified alpha. |
| Request props are unrestricted | **Confirmed.** Route casts JSON to `RenderInputProps & Record<string, unknown>` and forwards it to composition/rendering. | `route.ts:172-175`, `:226-228`, `:305-311`. | Closed runtime schemas per animation/capability are mandatory before MCP. |
| Output path safety | **Partially mitigated in current route.** Server chooses `public/renders`, and filenames are generated/sanitized for batch; there is no canonicalization, reparse defense, reservation, or host-controlled root abstraction. | `route.ts:97-105`, `:175`, `:220-221`, `:366-369`; browser writer sanitizer `exportFilesystem.ts:22-28` is not a server security boundary. | Implement root confinement and publication in Core; MCP must not choose arbitrary filesystem paths. |
| Output collisions | **Open.** Single names use timestamp plus six random characters; batch names use timestamp plus line number. No atomic reservation/exists check occurs. | `route.ts:220`, `:348-369`, `:396-398`. | Add job/artifact reservation in Core. |
| ProRes/VP9 actual support | **Unproven.** Parameters are configured, but no real media probe or alpha verification is in N01. | `route.ts:305-313`; no inspect tool exists. | Validate real artifacts in N03; do not promise formats from extension alone. |
| Headless Node launch | **Not currently present.** The route owns bundling and renderer imports; no standalone runner exists. | `route.ts:144-178`; package scripts `package.json:6-18`. | B+C extraction, then a real Node smoke in N03. |
| Electron GPU status | **Separate from renderer diagnostics.** Electron exposes `app.getGPUFeatureStatus()` but main route does not consume it. | `electron/main.cjs:75-76`; route has its own attempt labels. | Do not treat Electron status as render hardware evidence. |
| Dependencies / distribution | **Baseline locked, operational warnings present.** npm ci reports inherited deprecation/vulnerability warnings; no updates were made. | `../N00/npm-ci.log`, `package.json:20-53`, `npm-dependencies.json`. | Revisit security/licensing/Chromium/font distribution in N11, not N01. |

## Remediation findings and decision status

- Remote HDR dependency confirmed for extruded-3d; cold offline success is not established. See DEPENDENCY-REMEDIATION.md for exact source URL and in-memory cache behavior.
- 2D font-family names do not prove local TTF use. Main/Remotion entry local import graphs contain no CSS font loading. Host fallback and exact glyph sources remain PENDING N03 RUNTIME VERIFICATION.
- Caption helper checks before/after operations are not proof of interruption during rendering. Real cancellation remains N03.
- Astra's ten architectural decisions are incorporated in ARCHITECTURE.md; they are approved decisions, not implemented capabilities. N00/N01 are REMEDIATION IN REVIEW and N02 BLOCKED.

## Historical decisions submitted for Astra review (superseded by incorporated resolutions)

1. Ratify B+C and the exact Core/Remotion adapter boundary.
2. Ratify closed animation-specific parameter schemas and whether legacy props are accepted only through a compatibility adapter.
3. Ratify profile names and the allowed codec/container/pixel-format/alpha matrix, especially ProRes opaque requests and VP9 alpha.
4. Ratify whether PNG remains an explicitly CPU-effective capability in MVP.
5. Ratify cancellation/timeout semantics: stop renderer, do not fallback, do not publish partial artifacts.
6. Ratify outputRoot/tempRoot ownership and whether any delivered artifact cleanup exists; N01 recommends no age-based deletion of delivered outputs.
7. Ratify whether batch remains an internal/CLI capability or is excluded from MCP v1.
8. Ratify scope of the 32 text animations versus the 41 background presets in `list_animations`/`describe_animation`.
