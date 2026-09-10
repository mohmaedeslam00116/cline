# Research Report: Mapping `@cline/*` SDK Internals to LENS's Hexagonal Ports

**Resolves**: [#3 [Research] Map @cline/core and the SDK to LENS's hexagonal ports](https://github.com/mohmaedeslam00116/cline/issues/3)
**Map**: [#1 [Map] LENS Workstation on the Cline desktop-app base — Phase-1 spec](https://github.com/mohmaedeslam00116/cline/issues/1)
**Companion**: `docs/research/desktop-app-inventory.md` (ticket #2)

---

## 1. SDK package decomposition (verified)

- `sdk/packages/core` (`@cline/core`) — orchestrator: session runtime, `RuntimeHost`, tools, approval, telemetry, settings, hub client, tasks, cron/automation.
- `sdk/packages/agents` (`@cline/agents`) — `AgentRuntime`: recursive model reasoning + tool-response observation cycles (headless-compatible).
- `sdk/packages/llms` (`@cline/llms`) — multi-provider client handlers (Anthropic, OpenAI, OpenRouter, Ollama, Gemini, …), streaming token deltas, provider tool schemas.
- `sdk/packages/shared` (`@cline/shared`) — message types, tool definitions, serialization — **including `ToolApprovalRequest` / `ToolApprovalResult`**.
- `sdk/packages/sdk` (`@cline/sdk`) — facade combining the above for embedders; `sdk/packages/ui` (`@cline/ui`) — shared React component kit used by the desktop webview.

## 2. Session boundary: `RuntimeHost`

`src/runtime/host/runtime-host.ts` (line 368) defines the transport/runtime boundary for core session execution:

- `startSession(input: StartSessionInput): Promise<StartSessionResult>`, `runTurn(input: SendSessionInput): Promise<AgentResult | undefined>` — the ReAct turn loop entry points.
- `restoreSession`, `abort(sessionId, reason)`, `stopSession`, `dispose` — lifecycle and cancellation (LENS `CancellationPort` maps here).
- `getSession` / `listSessions` / `updateSession` / `readSessionMessages` (+ optional `readLiveSessionMessages`) — session persistence views.
- `subscribe(listener, options?)` — a **push event bus** (`CoreSessionEvent` → `RuntimeHostEventBus` in `runtime-host-support.ts`) for all session events — LENS `TelemetryPort` maps here (no polling needed).
- `RuntimeHostMode = "auto" | "local" | "hub" | "remote"` with `LocalRuntimeHost` (`local-runtime-host.ts`, line 261, `LocalRuntimeHostOptions` at 242) as the in-process implementation the sidecar would use.

## 3. Tool seams: capabilities, approval, executors

`src/runtime/capabilities/runtime-capabilities.ts` — the entire file is the seam:

```ts
export interface RuntimeCapabilities {
	toolExecutors?: Partial<ToolExecutors>;
	requestToolApproval?: (
		request: ToolApprovalRequest,
	) => Promise<ToolApprovalResult> | ToolApprovalResult;
}
```

- **`toolExecutors`** (`Partial<ToolExecutors>` from `extensions/tools`): the SDK lets the embedder **override individual tool executors** — LENS can supply its own `read_file` / `search_files` / `list_files` executors that route through `RepoInspectionPort` + the Privileged Policy Layer (path boundary, allowlists, audit trail) without touching upstream code.
- **`requestToolApproval`**: a first-class async approval hook. The SDK even ships a desktop reference implementation (`runtime/tools/tool-approval.ts`, `requestDesktopToolApproval`) that bridges approvals over a file-based request/decision JSON exchange — the sidecar/webview approval flow can replace it with a transport-backed version implementing LENS grant semantics.
- **Read-only Phase 1**: containment = provide `toolExecutors` only for read tools + a `requestToolApproval` that auto-denies mutating tools (writes/shell/net-egress). The SDK's own `runtime/tools/subprocess-sandbox.ts` + `subprocess-sandbox-lifecycle.ts` (structured spawn, sandbox lifecycle) and `runtime/safety/` (`LoopDetectionTracker`, `MistakeTracker`) are existing guardrails LENS inherits for free.

## 4. Port-by-port mapping (LENS blueprint → SDK reality)

| LENS port (from `docs/research/cline-core-adaptation.md`) | SDK seam | Verdict |
| --- | --- | --- |
| `RepoInspectionPort` (read-only, path-bounded) | `RuntimeCapabilities.toolExecutors` overrides for file/search tools | **Adapt** — supply policy-wrapped executors; keep a thin `@lens/ports` interface above them |
| `ResearchRetrievalPort` (untrusted evidence) | No SDK equivalent — new `@lens/research` package exposes `queryResearch()`/`getCitationExcerpt()` and (Phase 1) a read-only evidence tool executor injected via `toolExecutors` | **Add** |
| `TelemetryPort` (event streaming) | `RuntimeHost.subscribe` (`CoreSessionEvent` bus) | **Adapt** — bridge into LENS `EventRingBuffer` |
| `CancellationPort` | `RuntimeHost.abort(sessionId, reason)` + cooperative `AbortSignal` in start/turn inputs | **Adapt** |
| Privileged Policy Layer | `RuntimeCapabilities.requestToolApproval` + custom executors; session token on the sidecar transport | **Adapt** — the policy engine sits between the SDK and every executor |
| CapabilityGrant | No SDK equivalent — new `@lens/policy` package; grants issued by the webview UI, enforced in executors | **Add** |
| `EvidenceBundle` (immutable, SHA-256) | No SDK equivalent — new `@lens/research` package; handed to the coding loop via evidence-tool results and `.lens/sessions` persistence (store location = ticket #5 output) | **Add** |

**Bottom line**: the SDK already implements the hexagonal boundary LENS's blueprint demanded — LENS writes adapters (`@lens/*`), not forks, and upstream improvements to `@cline/core` flow through.

## 5. Phase-1 seam list (concrete)

1. `@lens/ports` — the four port interfaces + `CapabilityGrant` types (clean-room, per the adaptation research).
2. `@lens/policy` — policy engine + grant registry; wraps `requestToolApproval` and every injected executor; denies mutating tools in Phase 1.
3. `@lens/research` — BM25 indexer, `ScraperPool`, claims synthesis → `EvidenceBundle`; exposes evidence retrieval as a read-only tool executor.
4. Sidecar wiring — instantiate `LocalRuntimeHost` (or via `@cline/sdk`) with `runtimeCapabilities` from `@lens/policy`/`@lens/research`; register `commands-research.ts`, `commands-policy.ts` additive command modules; session token enforced on the transport.
5. Webview — evidence shelf + grant-checkpoint UI consume the transport events (companion report §6.3).

## 6. Open items for the spec session (ticket #5)

- Exact `ToolExecutors` map shape and which tool names upstream registers (read the type during implementation).
- Whether `LocalRuntimeHost` bootstraps cleanly inside the sidecar process today (`RuntimeHostMode: "local"`) or the `@cline/sdk` facade is the intended embedder path.
- Session-persistence integration: reuse `readSessionMessages`/sqlite task store vs LENS `.lens/sessions` (interacts with the store-location decision).
- Compaction interaction with evidence citations (`readSessionCompactionState` exists; LENS's `CompactionShield` requirement may map onto it).
