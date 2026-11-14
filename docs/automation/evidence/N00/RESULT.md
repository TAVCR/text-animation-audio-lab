# N00 — ISOLATION BASELINE

Status: **N00 — REMEDIATION IN REVIEW**. N02 remains BLOCKED; only Astra may close this gate.

## Historical evidence limitation (supersedes the original isolation conclusion)

La ejecución original no registró evidencia suficiente para demostrar el confinamiento efectivo de TEMP/TMP y todas las caches de herramientas.

Historical TEMP/TMP/tool-cache status: **UNKNOWN / NOT CAPTURED**. This does not assert those paths were inside or outside Automation. The original critical-file integrity evidence and successful checks remain historical evidence, not proof of complete write confinement.

The new controlled reproduction is documented in `ISOLATION-REPRODUCTION.md`. It is not retroactive proof of the original run. The original PASS sections below are retained for provenance and do not close this gate.

## Remediation result — ready for Astra review

- Controlled npm ci, 59 files / 366 tests, TypeScript, lint and build: exit 0. Final post-documentation tests (59/366), TypeScript and lint repeated with exit 0; build already covers unchanged application source.
- Effective process TEMP/TMP/npm cache and auxiliary caches are recorded before/after in controlled-environment-*.json and final-environment-*.json. Runtime paths are under .automation-runtime; actual npm cache/Node tmpdir and final Next/Remotion path resolvers are recorded.
- Historical npm 11.18.0 vs controlled npm 10.9.2 due redirected AppData/npm prefix is documented, not hidden. Lockfile unchanged; all 31 top-level package versions match.
- Production comparison repeated after both runs: 258/258 unchanged; authoritative installer SHA-256 and metadata match. See controlled-production-integrity.json and final-production-integrity.json.
- Scoped external cache snapshots unchanged; global TEMP metadata changed with UNKNOWN attribution. No PID/whole-system write trace was performed. See ISOLATION-REPRODUCTION.md for the bounded isolation conclusion; this is not exhaustive proof of no external write.
- Proposed result: controlled checks/configured-path verification PASS; N00 remains REMEDIATION IN REVIEW / READY FOR ASTRA REVIEW. No CLOSED claim. Remediation commit hash is recorded in final handoff, avoiding self-reference.

## Source and destination

- Source: `K:\ANTIGRAVITY\HABILIDADES\TEXT ANIMATION` (FROZEN / PRODUCTION / READ ONLY).
- Destination: `K:\ANTIGRAVITY\HABILIDADES\TEXT ANIMATION AUTOMATION`.
- The destination is a physical sibling project, not a child of production.
- Existing Automation planning files were preserved.
- No symlink, junction, hardlink, or reparse point was created in the selected copy.

## Copy and exclusions

The independent copy contains `src/`, `tests/`, `electron/`, baseline configuration, `public/assets/`, `public/backgrounds/`, the explicit Remotion fonts/typefaces, two transitively required `NEW APPROACH` modules, and production documentation under `docs/production-reference/`.

Excluded items are `node_modules/`, `.next/`, releases/staging/backups, historical renders, `public/renders/`, `public/audio/`, the Windows-installed font inventory, `tsconfig.tsbuildinfo`, local launch helpers, and private environment/session data. The rationale and transitive-import correction are in `COPY-PLAN.md`.

Evidence files:

- `production-before.json` — 258 critical source/config/test files with metadata and SHA-256.
- `copy-verification.json` — 258/258 initial selected files matched.
- `copy-correction.json` — the two discovered transitive `NEW APPROACH` modules matched by SHA-256.
- `excluded-output-inventory-before.json` and `excluded-output-inventory-after.json` — excluded output/history inventory.
- `authoritative-installer.json` — required installer evidence.
- `production-comparison.json` — post-baseline production comparison.

## Git

- `git init`: executed only in Automation.
- `git rev-parse --show-toplevel`: `K:/ANTIGRAVITY/HABILIDADES/TEXT ANIMATION AUTOMATION`.
- Remote: none.
- Baseline commit message: `baseline-stable-source`.
- Baseline commit hash: `2a07c35da741450d96a388b822f1363e8f2f8d91`.
- `package-lock.json` remained byte/hash identical to production: `5bbbd1a01e5673313d6bb5781ee115f11503c6e1ca24ac7806f09665a0df5003`.

## Environment and dependency installation

- OS: Microsoft Windows 11 Pro.
- Node: `v22.17.0`.
- npm: `11.18.0`.
- Command: `npm ci --cache .cache/npm`.
- Exit code: `0`.
- Production `node_modules` was not reused.
- npm emitted deprecation/security warnings inherited from the locked baseline; no package update or audit fix was performed.

## Baseline checks

| Check | Command | Exit | Result |
|---|---|---:|---|
| Editor tests | `npm run test:editor` | 0 | **59 files, 366 tests passed** |
| TypeScript | `node node_modules/typescript/bin/tsc --noEmit --incremental false` | 0 | PASS |
| ESLint | `npm run lint` | 0 | No warnings or errors |
| Build | `npm run build` | 0 | PASS; `.next` created only in Automation |

The first test attempt exposed two omitted transitive imports and produced 5 failed suites; only the missing files were copied into Automation, then the exact test command was rerun successfully. No source behavior, test, or dependency was changed.

## Production integrity

**production untouched = PASS**

- Critical comparison: 258 unchanged, 0 differences.
- Excluded output/history inventory: 23 unchanged, 0 differences.
- Authoritative installer: exists at `release-p16-product-final/Text Animation Setup 0.1.4.exe`, 1,906,881,102 bytes, SHA-256 `dcbeda3734816b099d9643d7444848670ccd0afbeb4af910c4bbb1490a5709e6`.

Historical handoff originally allowed N01. Current status is REMEDIATION IN REVIEW; no N02 implementation is included or authorized.
