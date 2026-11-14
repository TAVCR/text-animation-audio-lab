# N02 Parity

The adapter preserves the existing `/api/render` input and response fields consumed by `useRenderExport` while delegating execution to `AutomationCore`. It preserves single-pass video behavior, sequential batch behavior with line metadata, PNG still routing with the requested frame, duration fields, GPU diagnostics, fallback behavior, and faithful artifact-producing doubles.

No Remotion composition implementation was moved or edited. N03 must prove parity with real headless rendering and media inspection.
