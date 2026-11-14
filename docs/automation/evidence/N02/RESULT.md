# N02 — Automation Core

Status: READY FOR ARCHITECTURE REVIEW after remediation. N02 is implemented in the automation workspace only; N03 remains blocked.

Implemented: versioned request/result contracts, runtime value validation, 32-animation catalog projection, strict GPU/CPU/Auto policy, diagnostics, exclusive staging reservation and publish, lifecycle cancellation/timeout context, renderer abstraction, and `/api/render` compatibility delegation.

Scope guard: no changes under `src/remotion/**`; no real browser, codec, alpha, GPU, cancellation, or timeout execution was claimed.

Evidence: see `CHARACTERIZATION.md`, `CONTRACTS.md`, `FILESYSTEM.md`, `PARITY.md`, `TESTS.md`, and `REMEDIATION-MAP.md`.
