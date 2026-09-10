# LENS Workstation — Phase 1 Implementation Spec

**Effort**: [Map #1 — LENS Workstation on the Cline desktop-app base](https://github.com/mohmaedeslam00116/cline/issues/1) · resolved via [#5](https://github.com/mohmaedeslam00116/cline/issues/5)
**Scope gate**: Phase 1 is **read-only containment** — research loop + read-only codebase exploration. Terminal sandboxing, atomic writes, and shell grants are Phase 2.

## 1. What this assembles

This spec indexes the settled decisions; the detail lives in the linked artifacts:

- [`docs/research/desktop-app-inventory.md`](./research/desktop-app-inventory.md) — Base surfaces & six integration seams
- [`docs/research/sdk-ports-mapping.md`](./research/sdk-ports-mapping.md) — SDK-to-ports mapping (`RuntimeHost`, `RuntimeCapabilities`)
- `docs/adr/0001` — Tauri v2 shell adopted (amends LENS ADR-0004)
- `docs/adr/0002` — Evidence store: content-addressed bundles under `<workspace>/.lens/sessions/`
- `docs/adr/0003` — Containment enforced exclusively via the SDK capability seam
- Dev-environment facts — [#4 resolution](https://github.com/mohmaedeslam00116/cline/issues/4)

## 2. Architecture (Phase 1)

```
Tauri shell ── Next.js webview (evidence panel, grant checkpoints, chat)
     │ ws://127.0.0.1:<port>/transport?approval_token=<uuid>
Bun sidecar ── @cline/sdk (LocalRuntimeHost)
     │  runtimeCapabilities = {
     │    toolExecutors:    @lens/policy-wrapped READ-ONLY executors
     │                      + evidence detail executor (@lens/research)
     │    requestToolApproval: @lens/policy grant check (Phase 1: deny mutating)
     │  }
     ├── @lens/ports    — RepoInspection/ResearchRetrieval/Telemetry/Cancellation + CapabilityGrant types
     ├── @lens/policy   — policy engine, grant registry, executor wrappers
     └── @lens/research — BM25 index, ScraperPool, claims synthesis → EvidenceBundle
```

- **Evidence flow**: research pass → `EvidenceBundle` (immutable, SHA-256 content-addressed file under `<workspace>/.lens/sessions/<sessionId>/evidence/`) → `Claims Index` injected at session start → coding loop fetches excerpts via a read-only `get_evidence_detail(claimId)` executor (stratified on-demand claims; see `CONTEXT.md`).
- **Containment**: no grants are issued in Phase 1; mutating tools are denied by `requestToolApproval`. Repo reads are bounded by the policy layer's path checks.
- **Transport**: new LENS message types ride the existing sidecar transport; their schema location is settled during the sidecar wiring ticket (open point in §5).

## 3. Package layout

New top-level `lens/` workspace; Base (`apps/examples/desktop-app`, `sdk/packages/*`) keeps `@cline/*` names and stays mergeable with upstream:

```
lens/
├── ports/      @lens/ports     (zero deps, pure types + grant model)
├── policy/     @lens/policy    (depends on @lens/ports, @cline/shared types)
└── research/   @lens/research  (depends on @lens/ports; BM25, scraper pool, evidence store)
```

## 4. Acceptance criteria (demo-scenario primary)

A scripted scenario: prompt → deep web research → `EvidenceBundle` persisted content-addressed → new session with claims index → repo questions answered with `get_evidence_detail` citations → **`RepoSnapshotHash` provably unchanged** (zero mutation). Plus: existing Base suites (`build:sdk`, `build:web`, `typecheck`, desktop `test:chat-ui`) stay green; policy denial tests prove mutating tools fail closed.

## 5. Open points carried into implementation

- Exact `ToolExecutors` map shape (verify during #10 wiring) — §6 of the ports report.
- Transport message-schema location for LENS types (sidecar `commands-*` + transport).
- Sidecar process second-layer defense — deliberately deferred to Phase 2 (ADR-0003).
- Evidence-store retention/GC — Phase 2 (ADR-0002).

## 6. Hand-off slices

Implementation tickets created from this spec: see the "Part of #1 — Phase-1 hand-off" issues (#8–#12). Branding/AR-EN parity trails after the core slices land.
