# Phase-1 containment lives entirely in the SDK capability seam

## Status

Accepted

## Context & Decision

LENS mandates read-only containment for Phase 1. Two enforcement points were possible: the SDK's `RuntimeCapabilities` seam (inject policy-wrapped `toolExecutors` + an auto-denying `requestToolApproval`) or an additional in-sidecar guard layer.

**Decision**: Phase 1 enforces containment **exclusively via the SDK seam** in `@cline/core` (`RuntimeCapabilities.toolExecutors` + `requestToolApproval`), implemented in `@lens/policy`. The seam is the privileged policy layer; mutating tools (writes, shell, out-of-boundary network) are denied by default with no grants issued. A second defense-in-depth layer inside the sidecar process is deferred to Phase 2, where terminal sandboxing and atomic writes arrive and the threat model grows.

## Consequences

- Zero upstream code changes for containment → mergeability preserved.
- Phase-2 additions (RESTRICted_TERMINAL_COMMAND, MUTATING_FILE_WRITE grants) will revisit this ADR before adding the sidecar layer.
