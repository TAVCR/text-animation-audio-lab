# N00 — Isolation and copy plan

## Scope

- Production source: `K:\ANTIGRAVITY\HABILIDADES\TEXT ANIMATION`
- Automation destination: `K:\ANTIGRAVITY\HABILIDADES\TEXT ANIMATION AUTOMATION`
- Destination relationship: sibling directories under `K:\ANTIGRAVITY\HABILIDADES`.
- Production state: FROZEN / PRODUCTION / READ ONLY.
- Existing Automation content: the three recognized planning documents under `docs/automation/` were preserved and not overwritten.

## Included

- `src/`, `tests/`, and `electron/`.
- Baseline configuration and metadata: `.eslintrc.json`, `.gitignore`, `next-env.d.ts`, `next.config.mjs`, `package.json`, `package-lock.json`, `postcss.config.mjs`, `remotion.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `vitest.config.ts`, and `README.md`.
- `public/assets/`, because `AnimationContext` references `assets/circuito_limpio.png`.
- `public/backgrounds/`, because the renderer resolves imported-video backgrounds through `staticFile()`.
- `public/fonts/ttf/` and the nine `public/fonts/*.json` typeface assets, because `Extruded3DEffect` resolves these assets through `staticFile()`.
- `NEW APPROACH/bg3d-lowpoly-terrain.tsx` and `NEW APPROACH/bg3d-crystal-shards.tsx`, discovered as direct transitive imports from `src/remotion/backgrounds/ParticleBackground.tsx`; no other files from that historical folder are copied.
- Production `docs/` under `docs/production-reference/` as read-only technical/history reference; it is separate from Automation planning documents.

## Excluded

- `.git`, `node_modules`, `.next`, release/staging/backup folders, historical renders, `public/renders/`, and `tsconfig.tsbuildinfo`.
- `public/fonts/windows-installed/`: the source code uses explicit `public/fonts/ttf/` and JSON typeface assets for Remotion; the Windows font inventory is editor/system data, not a required static asset for this baseline copy.
- `public/audio/`: no `staticFile()` or renderer import references it; subtitle upload/transcription paths are not part of the text-animation render baseline.
- The remaining historical `NEW APPROACH` files, including previews and alternates, because they are not in the transitive import closure of the baseline entrypoints.
- Local launch scripts and private environment/session files not needed by the baseline.

## Isolation checks

- Production and destination ancestors were checked for reparse points before copying.
- The selected production trees were checked for reparse points: none found.
- No symlink, junction, or hardlink was created.
- `production-before.json` records the source metadata and SHA-256 values.
- `copy-verification.json` records destination comparison; it must remain all `match` before N00 can pass.
- `excluded-output-inventory-before.json` records existence, timestamp, file count, and size for excluded output/history trees.
- `authoritative-installer.json` records the required `release-p16-product-final/Text Animation Setup 0.1.4.exe` evidence.
