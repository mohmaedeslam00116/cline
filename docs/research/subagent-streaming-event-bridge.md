# Research Report: Subagent Streaming & Event Bridge in `@cline/core`

**Issue**: [#55 [Research] Subagent Streaming & Event Bridge in @cline/core](https://github.com/mohmaedeslam00116/cline/issues/55)  
**Map**: [#54 [Map] Ultra Mode: Autonomous Multi-Agent Agency War Room & Real Subagent Swarm](https://github.com/mohmaedeslam00116/cline/issues/54)  
**Status**: Completed  
**Author**: Research Subagent  
**Date**: 2026-09-12  

---

## 1. Executive Summary

This investigation analyzes how `@cline/core` executes child agents spawned via `spawn_agent` and `createDelegatedAgent`, how their lifecycle events (`onSubAgentStart`, `onSubAgentEvent`, `onSubAgentEnd`) stream through the runtime host and Hub, and how they can be bridged into the desktop app (`apps/examples/desktop-app`) to power the real-time **Agency War Room** without colliding with the main session chat stream.

### Key Discoveries:
1. **Event Identity Loss**: When `spawn_agent` runs a child `SessionRuntime`, the generated `AgentEvent`s (`content_start`, `content_update`, `content_end`) do not carry the child's `agentId` or `parentAgentId`.
2. **Root Session Impersonation**: In `LocalRuntimeHost`'s `AgentEventBridge`, missing `agentId` on `AgentEvent` triggers a fallback that flags the event as `isPrimaryAgentEvent: true`. Subagent token deltas and tool calls are broadcast with the root session's `sessionId`, masquerading as the parent agent.
3. **Chat Stream Collision in Desktop Webview**: The desktop sidecar (`sidecar/context.ts`) projects all `agent_event`s into standard `chat_text` and `chat_tool_call_start` chunks on `sessionId`. In `webview/hooks/use-chat-session.ts`, these chunks append directly into the active assistant bubble, causing subagent tokens and tool calls to interleave directly into the user's primary conversation.
4. **Persistence vs. Streaming Dichotomy**: `TeamChildSessionManager` correctly tracks child sessions in SQLite (`isSubagent: true`, subsession ID `root::sub::agentId`) and persists messages on completion, but provides zero live streaming to clients.
5. **Architectural Solution**: We propose an attributed streaming bridge that tags subagent chunks with `subSessionId`, `personaId`, and `stage`, routes them to a dedicated WebSocket event (`agency_war_room_event` / `subagent_chat_event`), and introduces a type-safe inter-agent conversation schema.

---

## 2. Deep Dive: `spawn_agent` & `createDelegatedAgent` Lifecycle

### 2.1 Tool Declaration & Execution
- **File**: `sdk/packages/core/src/extensions/tools/team/spawn-agent-tool.ts`
- **Schema**:
  ```ts
  // Lines 30-35
  export const SpawnAgentInputSchema = z.object({
      systemPrompt: z.string().describe("System prompt defining the sub-agent's behavior"),
      task: z.string().describe("Task for the sub-agent to complete"),
  });
  ```
- **Lifecycle Contexts**:
  - `SubAgentStartContext` (lines 49–54):
    ```ts
    export interface SubAgentStartContext {
        subAgentId: string;
        conversationId: string;
        parentAgentId: string;
        input: SpawnAgentInput;
    }
    ```
  - `SubAgentEndContext` (lines 56–64):
    ```ts
    export interface SubAgentEndContext {
        subAgentId: string;
        conversationId: string;
        parentAgentId: string;
        input: SpawnAgentInput;
        result?: SpawnAgentOutput;
        agentResult?: AgentResult;
        error?: Error;
    }
    ```
- **Execution Flow** (`createSpawnAgentTool`, lines 124–199):
  1. Instantiates the subagent:
     ```ts
     // Lines 129-141
     const subAgent = createDelegatedAgent({
         kind: "subagent",
         prompt: input.systemPrompt,
         configProvider: config.configProvider,
         tools,
         maxIterations: config.defaultMaxIterations,
         parentAgentId: context.agentId,
         abortSignal: context.signal,
         onEvent: config.onSubAgentEvent,
         hookErrorMode: config.hookErrorMode,
         toolPolicies: config.toolPolicies,
         requestToolApproval: config.requestToolApproval,
     });
     ```
  2. Resolves IDs: `subAgentId = subAgent.getAgentId()`, `conversationId = subAgent.getConversationId()`, `parentAgentId = context.agentId` (lines 142–144).
  3. Triggers `onSubAgentStart` observer callback (lines 145–156).
  4. Runs `subAgent.run(input.task)` (line 158).
  5. Triggers `onSubAgentEnd` on success (lines 168–181) or failure (lines 184–196).

### 2.2 Delegation & Runtime Orchestration
- **File**: `sdk/packages/core/src/extensions/tools/team/delegated-agent.ts`
  - `createDelegatedAgent` builds `AgentConfig` and constructs a new `SessionRuntime`:
    ```ts
    // Lines 149-158
    export function createDelegatedAgent(
        options: BuildDelegatedAgentConfigOptions,
    ): SessionRuntime {
        const config = buildDelegatedAgentConfig(options);
        const session = new SessionRuntime(config);
        if (config.onEvent) {
            session.subscribeEvents(config.onEvent);
        }
        return session;
    }
    ```
- **The Missing Link**:
  - In `SessionRuntime` (`sdk/packages/core/src/runtime/orchestration/session-runtime-orchestrator.ts`), events from `AgentRuntime` are adapted via `RuntimeEventAdapter.translate(event)` (line 1259) and broadcast to `this.listeners` via `emitLegacyEvent(event)` (lines 1291–1301).
  - In `RuntimeEventAdapter` (`sdk/packages/core/src/runtime/orchestration/runtime-event-adapter.ts`, lines 185–260), generated `AgentEvent` objects (`content_start`, `content_update`, `content_end`, etc.) **do not have `agentId` or `parentAgentId` stamped on them**.
  - As a result, `onSubAgentEvent` receives an `AgentEvent` where `agentId` is `undefined`.

---

## 3. Child Agent Session Management & Team Coordination

### 3.1 Persistence: `TeamChildSessionManager`
- **File**: `sdk/packages/core/src/session/team/team-child-session-manager.ts`
- **Subsession Identification**:
  - `makeSubSessionId(rootSessionId, agentId)` (line 152) generates subsession keys: `${rootSessionId}::sub::${agentId}`.
- **Start Hook** (`handleSubAgentStart`, lines 368–381):
  - Upserts a `SessionRow` into SQLite with:
    - `sessionId`: `makeSubSessionId(rootSessionId, context.subAgentId)`
    - `parentSessionId`: `rootSessionId`
    - `parentAgentId`: `context.parentAgentId`
    - `agentId`: `context.subAgentId`
    - `isSubagent`: `true`
    - `status`: `"running"`
    - `prompt`: `context.input.task`
  - Initializes disk messages file: `messagesPath`.
- **End Hook** (`handleSubAgentEnd`, lines 383–414):
  - Serializes `context.agentResult?.messages` via `manifestStore.persistSessionMessages(subSessionId, persistedMessages)`.
  - Marks session status as `"completed"`, `"failed"`, or `"cancelled"`.
- **Limitation**:
  `TeamChildSessionManager` writes to SQLite and JSON files on disk. It has **no live event streaming channel**. It is strictly a post-hoc audit/history record.

### 3.2 Coordination: `team-session-coordinator.ts`
- **File**: `sdk/packages/core/src/session/team/team-session-coordinator.ts`
- Manages teammate runs in Agent Teams mode:
  - `dispatchTeamEventToBackend`: notifies backend of task progress, start, and end.
  - `emitTeamProgress`: emits `{ type: "team_progress", payload: { sessionId, teamName, lifecycle, summary } }`.
  - Auto-continuation: `shouldAutoContinueTeamRuns` and `waitForTeamRunUpdates`.
- **Architectural Seam**:
  `spawn_agent` subagents currently do **not** route through `team-session-coordinator.ts`. They are treated as one-off child tool executions rather than coordinated team actors.

---

## 4. Event Streaming Pipeline & The Collision Root Cause

The following trace reveals exactly how subagent events collide with the main session in the current codebase:

```
[Child Agent SessionRuntime]
             │
             ▼
  RuntimeEventAdapter.translate()  ──> (Omits agentId / parentAgentId)
             │
             ▼
  onSubAgentEvent(event)
             │
             ▼
  LocalRuntimeHost.subAgentDeps.onAgentEvent(rootSessionId, config, event)
             │
             ▼
  AgentEventBridge.dispatchAgentEvent(rootSessionId, config, event)
             │
             ├─> extractAgentEventMetadata(event) -> { agentId: undefined }
             ├─> isRootAgentEvent evaluates to TRUE!
             │
             ▼
  handleAgentEvent(ctx, event, { isPrimaryAgentEvent: true })
             │
             ├─> Telemetry accumulates into root turn baseline
             ├─> Emits CoreSessionEvent: { type: "agent_event", payload: { sessionId: rootSessionId, event } }
             └─> Emits CoreSessionEvent: { type: "chunk", payload: { sessionId: rootSessionId, stream: "agent" } }
             │
             ▼
  Desktop Sidecar (sidecar/context.ts)
             │
             ├─> handleCoreSessionEvent -> handleAgentEvent
             ├─> emitChunk(ctx, rootSessionId, "chat_text", event.text)
             │
             ▼
  WebSocket Frame: { event: "chat_event", stream: "chat_text", sessionId: rootSessionId }
             │
             ▼
  Webview (use-chat-session.ts)
             │
             ├─> handleIncomingChunk checks payload.sessionId === activeSessionId (MATCH!)
             └─> Appends subagent tokens directly into the primary assistant message bubble!
```

---

## 5. Architectural Blueprint: Agency War Room Streaming Bridge

To power the **Agency War Room** without chat stream collisions, the streaming pipeline must be decoupled into primary and specialist streams.

### Seam Adjustments Required:

### 1. Fix Event Attribution at the Source (`spawn-tool.ts`)
In `sdk/packages/core/src/runtime/host/local/spawn-tool.ts`, enrich `onSubAgentEvent` with the child agent's identity:
```ts
export function createSessionSubAgentLifecycleCallbacks(
    deps: SpawnToolDeps,
    config: CoreSessionConfig,
    rootSessionId: string,
): SessionSubAgentLifecycleCallbacks {
    let currentSubAgentId: string | undefined;
    let currentParentAgentId: string | undefined;

    return {
        onSubAgentStart: (context) => {
            currentSubAgentId = context.subAgentId;
            currentParentAgentId = context.parentAgentId;
        },
        onSubAgentEvent: (event) => {
            if (!event.agentId && currentSubAgentId) {
                event.agentId = currentSubAgentId;
                event.parentAgentId = currentParentAgentId;
            }
            deps.onAgentEvent(rootSessionId, config, event);
        },
        onSubAgentEnd: (context) => {
            // handle lifecycle cleanup...
        }
    };
}
```

### 2. Sidecar Dual-Pipe Routing
In `apps/examples/desktop-app/sidecar/context.ts`:
- Check if `agentEvent.parentAgentId` is present.
- If it is a subagent event:
  - **Do NOT** emit `"chat_text"` or `"chat_tool_call_start"` on the main chat stream.
  - Instead, emit `"agency_war_room_event"` with metadata:
    ```ts
    sendEvent(ctx, "agency_war_room_event", {
        rootSessionId,
        subSessionId: makeSubSessionId(rootSessionId, agentEvent.agentId),
        agentId: agentEvent.agentId,
        parentAgentId: agentEvent.parentAgentId,
        personaId: resolvePersona(agentEvent),
        stream: mapSubAgentStream(agentEvent),
        chunk: agentEvent.text || JSON.stringify(agentEvent),
        ts: nowMs(),
    });
    ```

---

## 6. Proposed TypeScript Event Schema

```typescript
/**
 * Inter-Agent Conversation & War Room Event Schema
 * Part of Map #54 / Issue #55
 */

export type AgentPersonaId =
    | "orion"          // Lead orchestrator / team commander
    | "lyra"           // Deep technical researcher
    | "athena"         // Product & requirements strategist
    | "atlas"          // Systems & software architect
    | "vector"         // Core full-stack engineer
    | "cipher"         // Data & security architect
    | "sentinel"       // QA & compiler guardian
    | "echo"           // Docs & release specialist
    | (string & {});

export type WorkflowStage =
    | "intake"
    | "planning"
    | "discovery"
    | "deep_research"
    | "synthesis"
    | "implementation"
    | "audit"
    | "review"
    | "decision";

export type InterAgentMessageType =
    | "delegation_start"
    | "text_delta"
    | "reasoning_delta"
    | "tool_call_start"
    | "tool_call_update"
    | "tool_call_end"
    | "artifact_yield"
    | "checkpoint_request"
    | "checkpoint_response"
    | "delegation_end";

export interface ToolCallPayload {
    toolCallId: string;
    toolName: string;
    input?: unknown;
    output?: unknown;
    error?: string;
    durationMs?: number;
}

export interface ArtifactReference {
    id: string;
    type: "prd" | "architecture" | "code_diff" | "test_report" | "file";
    title: string;
    digest?: string;
    uri?: string;
    metadata?: Record<string, unknown>;
}

export interface InterAgentMessageEnvelope {
    id: string;
    rootSessionId: string;
    subSessionId: string;
    senderPersonaId: AgentPersonaId;
    recipientPersonaId: AgentPersonaId | "broadcast";
    stage: WorkflowStage;
    type: InterAgentMessageType;
    timestamp: number;
    content: string;
    reasoning?: {
        text: string;
        redacted?: boolean;
    };
    artifacts?: ArtifactReference[];
    toolCall?: ToolCallPayload;
    metadata?: {
        iteration?: number;
        parentAgentId?: string;
        subAgentId?: string;
        finishReason?: string;
        usage?: {
            inputTokens: number;
            outputTokens: number;
            cost?: number;
        };
    };
}

export interface AgencyWarRoomSnapshot {
    rootSessionId: string;
    activeStage: WorkflowStage;
    orchestratorStatus: "idle" | "orchestrating" | "synthesizing" | "completed";
    specialists: Record<string, SpecialistState>;
}

export interface SpecialistState {
    subAgentId: string;
    personaId: AgentPersonaId;
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    task: string;
    systemPromptSnippet?: string;
    startedAt: number;
    endedAt?: number;
    accumulatedText: string;
    accumulatedReasoning: string;
    activeToolCall?: ToolCallPayload;
    completedToolCalls: ToolCallPayload[];
    artifacts: ArtifactReference[];
    usage: {
        inputTokens: number;
        outputTokens: number;
        totalCost: number;
    };
}
```
