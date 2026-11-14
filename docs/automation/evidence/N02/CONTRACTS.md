# N02 Contracts

`src/automation/contracts.ts` defines schema version 1, request/result unions, output profiles, diagnostics, lifecycle error codes, host context, and artifact metadata. `normalize.ts` rejects unknown request and parameter keys, validates animation IDs, dimensions, profile/operation pairing, text limits, and still-frame indices.

`catalog.ts` projects the existing authoritative template catalog and control contracts into 32 stable animation descriptors without importing Remotion components.
