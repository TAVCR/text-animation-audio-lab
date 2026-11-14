# N01 — Dependency remediation

Status: REMEDIATION IN REVIEW. Input source commit: 98df2d4630b80d5728730ca31e52aa196621754d. No source, template, asset, renderer, or dependency fix was implemented. No media or remote HDR/font download was requested by this audit.

## Method and scope

`node docs/automation/evidence/N01/audit-import-graph.cjs` uses installed TypeScript to traverse literal imports, re-exports, require and dynamic imports resolving local files and @ aliases. Explicit type-only imports are excluded. The generated JSON records edges and font/asset findings with line numbers. This is a conservative module reachability audit, not proof that every reachable function runs or every package export is bundled. It does not execute compositions.

- MainComposition closure: 61 project files, no CSS, no unresolved local import.
- Remotion index/Root closure: 72 project files, no CSS, no unresolved local import.
- Registry contains the original 32 text IDs; no animation was changed. Main imports ParticleBackground, which includes the two necessary NEW APPROACH source modules.
- Followed installed package code for Environment/useEnvironment, R3F useLoader, Three cache. No unlimited audit of unrelated package internals or consumer tools.

## Drei studio HDR

Call chain:

1. `src/remotion/templates/Extruded3DEffect.tsx:683`: Environment preset studio.
2. `node_modules/@react-three/drei/core/Environment.js`: Environment without ground/map/children chooses EnvironmentCube, which invokes useEnvironment(rest).
3. `node_modules/@react-three/drei/core/useEnvironment.js:9,21-24`: validates preset and replaces files/path using presetsObj and CUBEMAP_ROOT.
4. `node_modules/@react-three/drei/helpers/environment-assets.js:9`: studio maps to studio_small_03_1k.hdr.
5. useEnvironment selects RGBELoader, sets its path and delegates to useLoader.

Static effective URL:

`https://raw.githack.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/studio_small_03_1k.hdr`

Classification: **remote / not self-contained**. The pinned asset path identifies the source, not availability or permission to redistribute.

Cache and failure: R3F `dist/events-776716bd.esm.js:1674-1703` memoizes loaders and uses suspend-react with [loader, ...URLs] as cache keys. Loading failure rejects with Could not load. Drei exposes preload/clear using that cache; the inspected application does not establish a persistent disk copy or an offline fallback for this preset. Three's `src/loaders/Cache.js` defaults enabled=false; no enabling call was found in Main's project closure. Browser HTTP cache may affect a warm run but is not a guaranteed portable cache. A cold offline request cannot obtain this remote HDR; exact failure/timing/render outcome is **PENDING N03 RUNTIME VERIFICATION**, not tested here.

Scope: the only Environment preset call found in the 32-template project graph is Extruded3DEffect. It affects a job that selects extruded-3d; inclusion of that module in the registry does not establish that other selected templates fetch the HDR. Other selected backgrounds remain independently relevant. No other preset call was found in the wider Remotion project source scan.

## Fonts: editor is not the renderer

`src/app/layout.tsx:2` imports globals.css. `src/app/globals.css:1` requests Google Fonts CSS (fonts.googleapis.com); stylesheet responses may reference font binaries on fonts.gstatic.com, whose exact URLs are not present in the project and were not fetched.

The Remotion entry is `src/remotion/index.ts` → Root → MainComposition, not the Next layout. The generated local graph contains neither layout nor globals.css. Main's inline style block resets background and smoothing, not font-face registration. No FontFace/loadFont/@font-face mechanism was found in that graph. A Player mounted inside the editor may inherit editor CSS; a separately rendered Remotion page cannot be assumed to do so.

Defaults: `src/lib/AnimationContext.tsx:145-147` requests Poppins, Montserrat, Oswald. Styles generally use quoted props.fontFamily with sans-serif fallback (e.g. TypewriterEffect.tsx:40, FlyThroughEffect.tsx:52). ScrambleEffect.tsx:67 instead uses monospace. Browser installed font resolution and fallback are host dependent; the name in computed font-family alone would not prove the exact glyph font.

| Familia solicitada | Fuente efectiva probable / verificada estáticamente | Origen | Offline | Template / uso |
|---|---|---|---|---|
| Poppins (default primary) | Poppins if available to Chromium; otherwise sans-serif fallback; actual file unknown | runtime local / browser fallback, no CSS font loader in Remotion closure | May work via installed/fallback font; exact identity pending | Most 2D templates; FlyThrough also DOM text despite 3D motion |
| Montserrat / Oswald (secondary/third defaults) | Requested family or browser sans-serif fallback; actual file unknown | runtime local / browser fallback | Same qualification | ViralTextEffect.tsx:21-65,110; KineticBoxSequenceEffect.tsx:152-154,481; BarRevealEffect.tsx:97 for secondary |
| Arbitrary permitted UI family / styled-range family | Name forwarded to CSS, not automatically registered or downloaded | runtime local / browser fallback | Host-dependent | StyledRangeText.tsx:69,136; templates consuming props |
| Poppins or other family in Scramble | Requested name with monospace fallback | runtime local / browser fallback | Exact glyph source pending | ScrambleEffect.tsx:67 |
| Secondary layer family | Explicit secondary.fontFamily forwarded into InkStampPrint | runtime local / browser fallback | Exact glyph source pending | DualTextLayers.tsx:10, InkStampPrint.tsx:39 |
| Variable family, e.g. Inter/Poppins | CSS family plus wght variation requested; actual variable font support unverified | runtime local / browser fallback | Appearance/weight behavior pending | VariableWeightWave.tsx:14 |
| Poppins in Extruded3D | Poppins-Regular.ttf or Poppins-Bold.ttf selected by weight | bundled/local public/fonts/ttf, served via staticFile | Font file local; complete template still requires remote HDR | Extruded3DEffect.tsx:94-118,507-519 |
| Montserrat / Oswald in Extruded3D | Montserrat-Var.ttf / Oswald-Var.ttf | bundled/local TTF | Same qualification | Explicit TTF_FONT_MAP |
| Arial/Helvetica/Verdana/Tahoma/Trebuchet in Extruded3D | Explicit mapping to OpenSans-Var.ttf, not the requested system font | bundled/local TTF | Same qualification | TTF_FONT_MAP |
| Times/Georgia; Courier; Impact in Extruded3D | PlayfairDisplay-Var.ttf; RobotoMono-Var.ttf; Anton-Regular.ttf | bundled/local TTF substitutions | Same qualification | TTF_FONT_MAP |
| Explicit 3D preset or unmapped 3D family | Local JSON preset; final default helvetiker regular/bold, with serif/comic/mono branches | bundled/local public/fonts/*.json | Font file local; full template pending HDR | resolveFontAsset / presetToFile:125-192 |

Every 2D effective font-file claim is **PENDING N03 RUNTIME VERIFICATION**. Copying public TTF files is not evidence of 2D use. 3D mappings are statically verified configuration; successful loading, glyph coverage and visual output remain N03.

## Resource inventory by category

| Resource | Category / evidence | Limits |
|---|---|---|
| React/Remotion/Three application bundle | bundled/local dependencies from locked install | Chromium execution still needed N03 |
| Explicit 3D TTF/JSON files | bundled/local; staticFile + TTFLoader/FileLoader at Extruded3D:513-519,542 | Not CSS font registration |
| Fonts selected by DOM CSS | runtime local / browser fallback | Actual host fonts unknown; no promise of offline fidelity |
| Google Fonts CSS | remote; Next globals.css only in inspected source | Not established as a Remotion font source |
| studio HDR | remote; exact pinned URL above | No reliable durable offline cache/fallback established |
| Landscape SVG | bundled/inline data URI, Extruded3D:13-41,395 | http://www.w3.org/2000/svg is namespace, not fetch |
| Imported video backgrounds | bundled/local: ImportedVideoBackground.tsx:5-12,30 maps six presets to ten distinct filenames | Static asset serving/decoding pending N03 |
| circuito_limpio.png | retained local asset/default reference in AnimationContext | Presence/default reference alone is not proof of active use in every Main job |
| Root-only experimental compositions and CaptionedVideo | broader bundle registrations; not additional Main text IDs | Not advertised as 32-template capabilities; caption src request path is outside Main audit |
| Other fixed remote fetch targets in Main project closure | None found beyond package-resolved HDR | Static literals/local imports are not a proof against all dynamic/package behavior |

## Cancellation correction

Existing: checks/callbacks before/after selected operations in renderCaptionedVideo.ts:12,18; callback-driven cleanup/fallback handling. The subtitle cancellation fixture starts already cancelled and asserts renderMedia was not called.

NOT demonstrated: interrupting renderMedia/Chromium/encoder while working. No cancellation token is passed to renderMedia there. Main /api/render does not wire req.signal. N02 defines lifecycle/renderer interface using doubles; N03 must connect and verify active interruption, timeout, no retry after cancellation, no partial delivery and idempotent cleanup.
