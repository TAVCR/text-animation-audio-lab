# N02 Characterization

This is retrospective characterization. The legacy endpoint behavior was read from the pre-N02 commit and then encoded with faithful doubles: Main composition metadata, input props, dimensions, duration/fps, profiles, GPU attempts, PNG frame routing, batch response fields, and failure behavior.

The characterization tests remain in `tests/editor/render-single-pass-contract.test.ts`, `tests/editor/render-route-duration.test.ts`, and `tests/automation/remediation.test.ts`. N02 uses doubles only; media truth is deferred to N03.
