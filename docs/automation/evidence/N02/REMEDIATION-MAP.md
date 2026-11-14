# N02 Remediation Map

This is retrospective characterization: the legacy route and its consumer were read from `51ca3cc301a840f53196cb4e25fc7e38a347171e` and compared with N02.

| Defect | Expected | Current | Owner | Regression test | Minimal correction |
|---|---|---|---|---|---|
| Fabricated output | Missing artifact fails | Adapter wrote `renderer-output` | Next adapter | missing-artifact | Remove fabrication |
| Still frame | Requested frame reaches renderer | Core omitted `frameIndex` | Core/adapter | exact-frame | Propagate and bound-check |
| GPU strict | GPU-only attempts | CPU was appended | Policy | strict-gpu | Return GPU attempts only |
| Publication | Reservation and publish are exclusive | Reservation was deleted early | Filesystem | collision | Retain lock/revalidate |
| Lifecycle | Cancel/timeout stop before publish | No timeout and weak pre-publish checks | Core/lifecycle | cancellation-timeout | Add signal and timeout context |
| Post-render failure | No retry after successful render | stat/publish were inside retry loop | Core | publish-failure | Separate render from publish |
| Batch response | Existing consumer receives URL/line metadata | Core results were returned directly | Next adapter | batch-shape | Translate response shape |
| Runtime schema | Typed values and nested extras rejected | Keys were checked, values mostly not | Contracts/normalize | nested-schema | Validate descriptor controls |
