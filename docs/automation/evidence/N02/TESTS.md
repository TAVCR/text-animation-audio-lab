# N02 Tests

Observed in the N02 verification pass:

- TypeScript: passed (`tsc --noEmit --incremental false`).
- Automation suite: 20/20 tests passed.
- Editor suite: 366/366 tests passed across 59 files.
- Lint and production build: passed after the final remediation changes.

Requirement matrix: contracts and nested extras (`remediation.test.ts`); strict GPU and missing artifact (`remediation.test.ts`); exact PNG frame and bounds (`remediation.test.ts`); filesystem boundary (`filesystem.test.ts`); Next video/PNG/batch/fallback (`render-single-pass-contract.test.ts`); duration compatibility (`render-route-duration.test.ts`).

All N02 tests use mocks/doubles. Real media, codec, alpha, GPU, cancellation, and timeout verification is explicitly deferred to N03.
