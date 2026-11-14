# N00 — Controlled isolation reproduction

Gate: **REMEDIATION IN REVIEW**, not CLOSED. Historical TEMP/TMP/tool-cache evidence: **UNKNOWN / NOT CAPTURED**. This is a new reproduction, not retroactive evidence.

## Execution

- Input commit: 98df2d4630b80d5728730ca31e52aa196621754d.
- cwd: `K:\ANTIGRAVITY\HABILIDADES\TEXT ANIMATION AUTOMATION`.
- Reproducible command: `pwsh -NoProfile -File docs/automation/evidence/N00/reproduce-isolation.ps1` from that cwd. The script configures child-process environment before invoking npm or checks, validates configured paths/ancestors against reparse points, and records environment before commands and after completion.
- Initial controlled execution: 2026-09-07, 10:42:27–10:45:37 UTC. Full timestamps, commands and codes in controlled-commands.json; stdout/stderr in controlled-*.txt. No render/headless/desktop packaging command was run.
- Node v22.17.0; Windows 11 Pro; effective controlled npm **10.9.2**.
- Historical npm was 11.18.0. Redirecting APPDATA changes the npm global prefix selected by `C:\Program Files\nodejs\npm.cmd`: the shim checks prefix/node_modules/npm/bin/npm-cli.js, then falls back to its bundled npm. This reproduction used the latter, not an npm upgrade/downgrade installation. This version difference is explicit; the run is not a bit-identical historical replay.
- package-lock SHA-256 unchanged: `5bbbd1a01e5673313d6bb5781ee115f11503c6e1ca24ac7806f09665a0df5003`. All 31 top-level installed package versions match the N01 inventory (controlled-package-comparison.json). npm reports 1070 installed packages rather than historical 1066; different installer/lifecycle/optional-package behavior is not claimed identical. No dependency fix/update was run.

## Effective paths

Let A mean the absolute cwd above; all table paths expand to absolute paths in controlled-environment-before/after.json (and final-environment-before/after.json for final probes). The nine environment paths were absent before setup, existed before commands, and existed after reproduction; each is inside Automation.

| Name | Absolute path (A expansion) | Verification |
|---|---|---|
| TEMP | A\.automation-runtime\temp | env + child Node os.tmpdir() |
| TMP | A\.automation-runtime\tmp | process environment |
| NPM_CONFIG_CACHE | A\.automation-runtime\npm-cache | npm config get cache exact match |
| XDG_CACHE_HOME | A\.automation-runtime\tool-cache | configurable tooling cache base |
| LOCALAPPDATA | A\.automation-runtime\local-appdata | Windows fallback cache root redirected |
| APPDATA | A\.automation-runtime\roaming-appdata | process-only roaming/config root redirected |
| electron_config_cache | A\.automation-runtime\tool-cache\electron | electron/install.js:46 passes cacheRoot to @electron/get; archive observed inside |
| ELECTRON_BUILDER_CACHE | A\.automation-runtime\tool-cache\electron-builder | packaging not invoked; defensive configuration only |
| NEXT_SWC_PATH | A\.automation-runtime\tool-cache\next-swc | next/dist/lib/download-swc.js:78 uses this; no fallback download needed |

HOME and USERPROFILE remain `C:\Users\Gustavo`, outside Automation and existing before/after. They were recorded, not reassigned. Runtime executables under Program Files and user config may be read; they are not authorized write targets. No global config was created/changed. NEXT_TELEMETRY_DISABLED=1 avoids Next telemetry; environment settings exist only in the controlled child process and descendants.

## Additional tooling/output paths and evidence

- Next build/cache: A\.next and A\.next\cache. The final environment probe records before/after existence; controlled build produces its normal output there. Next getCacheDirectory resolves NEXT_SWC_PATH explicitly; Windows fallback would use the redirected LOCALAPPDATA.
- Remotion browser download destination: its installed `browser/get-download-destination.js:9-38` walks to the nearest package.json and returns A\node_modules\.remotion. The final probe calls this pure resolver and records its effective path/existence. No Chromium download/render invocation was performed; tests mock bundler/renderer. No claim of browser runtime cache isolation for N03 is made.
- esbuild: binary install/work files are project node_modules-local; its install.js uses an npm-install directory adjacent to its package for fallback. The baseline does not set an arbitrary ESBUILD_BINARY_PATH. Any Node/os temporary use inherits the confined TEMP/TMP.
- Electron download scratch: @electron/get/dist/cjs/utils.js uses os.tmpdir(), thus A\.automation-runtime\temp; downloaded archive is inside the configured Electron cache. Electron application was not launched.
- Node compile cache observed under A\.automation-runtime\temp\node-compile-cache. Vitest's project cache candidate A\node_modules\.vite is recorded in final probes without implying it was used when absent.
- Tests create mocked PNG bytes in A\public\renders; these are fixtures, not verified media. The legacy route cleanup may remove old test renders only within that Automation output directory. Published production outputs are not touched.
- Final tool-path probes add absolute paths, inside-root checks and before/after existence to final-environment-*.json. They are explicitly later observations, not added retroactively to the initial manifest.

## Checks

| Command | Controlled result |
|---|---|
| npm ci | Exit 0 |
| npm run test:editor | Exit 0; 59 files / 366 tests |
| node node_modules/typescript/bin/tsc --noEmit --incremental false | Exit 0; empty output |
| npm run lint | Exit 0; no lint warnings/errors |
| npm run build | Exit 0 |

Npm emitted inherited deprecation/security warnings (18 vulnerabilities); no audit fix/update was authorized. Tests emit mocked GPU failure traces and inherited React DOM warnings; no test fails. Reviewed absolute paths in the controlled check logs point into Automation. No tool log reported an external output/cache destination. This report does not validate security advisories or media capabilities.

After documentation changes, run the same script with `-FinalChecks`: tests, TypeScript, lint, tool path probes, and production integrity are repeated. The already successful build covers unchanged application source/configuration; no second build is needed for documentation-only edits. Results are recorded separately in final-commands.json and final-*.txt.

Final checks completed: tests 59/366, TypeScript and lint all exit 0; production recheck at 2026-09-07T10:51:18.2184264Z again 258/258 unchanged and installer matching. Final external tooling-cache snapshots were also unchanged; global TEMP churn again has unknown attribution, recorded separately in final-external-deltas.json.

## Outside-path observation and limits

Reasonable scoped check, not a Windows-wide scan or kernel/PID write trace: snapshot the immediate children of the original external TEMP, npm cache, next-swc cache, Electron cache and electron-builder cache before/after the controlled process. External tooling cache snapshots were unchanged. The global TEMP snapshot changed: six new zero-byte GUID .tmp entries and six removed zero-byte GUID .tmp entries. Names/timestamps/deltas are in controlled-external-deltas.json; **attribution is UNKNOWN**. Metadata does not establish whether these belonged to concurrent desktop/agent processes or the controlled process; no source is asserted without process evidence. Raw broad snapshots remain local/ignored to avoid versioning unrelated user temp metadata.

All explicit writable paths and tool resolvers inspected are confined; no mandatory unconfigurable external tooling write was identified. No attributable external project output/cache write was found in logs or examined destinations. This supports a **PASS for the controlled baseline and minimum configured-path checks**, not proof that every Windows write was confined. If Astra requires attribution of global TEMP churn beyond the requested minimum checks, that remains unproven; do not silently promote this evidence to exhaustive isolation. N00 remains REMEDIATION IN REVIEW either way.

## Production integrity

controlled-production-integrity.json: 258 checked / 258 unchanged, no differences; comparison includes SHA-256, length and LastWriteTimeUtc against the original manifest. Installer hash and metadata match:

`dcbeda3734816b099d9643d7444848670ccd0afbeb4af910c4bbb1490a5709e6`

**production untouched = PASS for the recorded critical-file/installer scope.** This is not a claim to have hashed every historical output. The final run repeats the same checks in final-production-integrity.json.

## Proposed conclusion / handoff

Historical evidence remains NOT CAPTURED. Controlled reproduction baseline passed; scoped isolation evidence and its attribution limit are now explicit. Request Astra review, not automatic closure. N00/N01: REMEDIATION IN REVIEW; N02: BLOCKED / NOT STARTED.

Only documentation, audit/reproduction probes, generated evidence and .gitignore exclusions for runtime/private metadata changed. No src/tests/package/lock/template or production modification. Dedicated local remediation commit is reported in handoff; runtime caches and broad external snapshots are deliberately unversioned. Rollback, if requested later, is a scoped revert of the remediation commit; no production operation or broad deletion.
