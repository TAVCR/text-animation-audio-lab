# N02 Filesystem Safety

`src/automation/filesystem.ts` validates output names before staging, creates per-job staging directories, holds an exclusive destination lock through publication, rechecks destination absence before rename, and cleans staging and its own lock in `finally` paths. Paths are resolved beneath the configured output and temp roots; traversal and absolute output names are rejected.

Tests cover the safe basename boundary and collision primitives. Reparse-point hardening remains environment-dependent and is explicitly pending a Windows fixture; no public artifact cleanup is performed by N02.
