# N01 — Dependency audit

## Runtime graph

Current remediation findings are detailed in `DEPENDENCY-REMEDIATION.md` and `import-graph-remediation.json`. They supersede any implication below that the selected local assets prove an offline/self-contained renderer. Main reaches 61 local source files; the Remotion entry reaches 72; the static literal-import traversal found no CSS imports and no unresolved local imports. Package internals were followed separately for the Drei environment.

- **Remote HDR:** `Extruded3DEffect.tsx:683` → Drei `EnvironmentCube` → `useEnvironment` → preset studio → `studio_small_03_1k.hdr` at `https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/studio_small_03_1k.hdr`. R3F caches the loader result in memory; no durable offline cache/fallback is established. A cold offline loader can reject; exact render behavior remains N03.
- **2D fonts:** Next layout imports Google Fonts CSS; the separate Remotion import graph does not. Templates request CSS font-family names (Poppins by default; secondary Montserrat/Oswald), falling back to system/browser sans-serif or monospace. No project font-face/FontFace/loadFont registration was found in this closure. Effective font files are PENDING N03 RUNTIME VERIFICATION.
- **3D fonts:** Extruded3D explicitly resolves copied local TTF/JSON via staticFile and loaders. This is separate from 2D CSS font selection and does not eliminate its remote HDR dependency.
- **Other resources:** imported video backgrounds use fixed local mappings; the landscape texture is an embedded SVG data URI, not a remote URL. SVG namespace URLs are not network asset fetches. No other fixed remote fetch target was found in the inspected Main project closure; this is not an audit of every dependency's unused exports.

```text
Next POST /api/render
  ├─ NextResponse / Node route lifecycle
  ├─ @remotion/bundler
  │    └─ src/remotion/index.ts → Root → Main/experimental compositions
  └─ @remotion/renderer
       ├─ getCompositions
       ├─ renderMedia (video)
       └─ renderFrames (PNG still)
```

The bundle entry is `src/remotion/index.ts:1-3`. `Root.tsx:75-174` registers compositions. `MainComposition.tsx:8-162` selects the template registry and particle background. The route's bundler and renderer imports are at `src/app/api/render/route.ts:144-178` and `:218-320`.

## Dependency categories

| Dependency | Current evidence | Headless implication |
|---|---|---|
| React / React DOM | `Root`, `MainComposition`, all template components, and Three components are React trees. | Required for the Remotion composition bundle; removing React is not a valid headless strategy. |
| Browser / Chromium | Remotion renderer evaluates React compositions in Chromium; Three/WebGL compositions use browser canvas/WebGL. | Still required for actual render. Headless means no editor UI/window, not “no Chromium.” |
| Remotion | `@remotion/bundler`, `@remotion/renderer`, `remotion`, `@remotion/three`, and `@remotion/player` are locked in `package.json:20-37`. | Core must keep Remotion behind one adapter. `renderMedia`/`renderFrames` semantics must remain explicit. |
| Next | The main API is a Next Node route and returns `NextResponse` (`route.ts:4`, `:9-10`, `:172-178`, `:414-417`). | Not required by a future Node runner; current route cannot be imported as the Core without carrying Next. |
| Electron | `electron/main.cjs:1-84` owns the desktop window, spawns the standalone Next server, and exposes desktop fonts/GPU status. | Not required by headless rendering. Electron's `gpu:feature-status` is not currently consumed by `/api/render`. |
| Editor UI | UI uses `AnimationContext`, `Player`, File System Access, localStorage, and browser event APIs (`PreviewContainer.tsx:19-72`, `useRenderExport.ts:43-302`). | Must not be mounted by the future runner. Defaults/types currently live in a client-marked module, so extraction must separate pure model data from editor state. |
| Filesystem | Main route writes under `process.cwd()/public/renders` and deletes old media (`route.ts:94-140`, `:172-176`, `:220-251`, `:305-309`). | Core must receive trusted host roots and enforce canonicalization, collision, reparse, and publication rules. |
| `process.cwd()` | Used for the Remotion entry/alias and output root (`route.ts:148-159`, `:175`; `remotion.config.ts:27-35`). | A Node runner must resolve project/runtime roots explicitly and work from an arbitrary caller cwd. |
| Aliases | `@/*` maps to `src/*` in `tsconfig.json:20-22`, Next config, and Remotion bundler override. | The Remotion adapter must install an equivalent alias or use a build entry that resolves it deterministically. |
| Assets / fonts | Imported videos use `staticFile('backgrounds/video-imports/...')` (`ImportedVideoBackground.tsx:5-30`); 3D text uses TTF/JSON fonts (`Extruded3DEffect.tsx:507-543`); defaults reference `/assets/circuito_limpio.png` (`AnimationContext.tsx:136-147`). | Asset root must be explicit and bundled/served by the Remotion adapter. The N00 copy includes the required selected assets. |

## Minimum Node launch point

The smallest plausible future launch point is a Node process that:

1. validates a closed request and resolves trusted output/temp roots;
2. invokes the Remotion bundler against `src/remotion/index.ts` with the `@` alias and a known static asset root;
3. obtains `Main` from `getCompositions`;
4. calls exactly the chosen renderer operation (`renderMedia` for video or `renderFrames` for PNG);
5. inspects/publishes the artifact and returns a structured result.

This does not require the editor page, Electron `BrowserWindow`, or a Next server. It does require React, Remotion, Chromium, the Three/WebGL runtime for relevant compositions, and the fonts/video assets selected by props. N01 did not implement or claim this runner; a real Node-only smoke belongs to N03.

## Current package baseline

The authoritative package/lock baseline is preserved. The installed top-level tree is recorded in `npm-dependencies.json`; notable versions are Next `14.2.15`, Remotion `4.0.520`, React `18.3.1`, Three `0.168.0`, Electron `35.7.5`, TypeScript `5.9.3`, Vitest `2.1.9`, and Node `v22.17.0`.

No package was upgraded and no MCP SDK was installed.
