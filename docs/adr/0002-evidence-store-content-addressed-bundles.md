# Evidence store: content-addressed bundles under `<workspace>/.lens/sessions/`

## Status

Accepted

## Context & Decision

The Phase-1 spec (wayfinder [#5](https://github.com/mohmaedeslam00116/cline/issues/5)) needed a home and a mechanics model for the `EvidenceBundle` (LENS glossary: immutable, versioned, SHA-256-digested research artifact). Storing bundles inside the sidecar's Base-owned `session-data/` would entangle LENS artifacts with upstream churn, and an append-only log mixes index with payload.

**Decision**: bundles persist under `<workspace>/.lens/sessions/<sessionId>/evidence/` (matching LENS's `ProjectSession` convention), each bundle as a **content-addressed file** (name = its SHA-256 digest) referenced by a per-session index manifest. Bundles are never edited in place — a new research pass writes a new bundle and the manifest supersedes the pointer, so immutability is structural rather than by convention.

## Consequences

- The sidecar holds only a live index; restart-safe, workspace-portable.
- A retention/GC question (superseded bundles accumulate) is deferred to Phase 2.
