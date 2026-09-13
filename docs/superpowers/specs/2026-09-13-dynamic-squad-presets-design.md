# Dynamic Squad Presets and Custom Persona Deployment Design

## Status

Approved for implementation on 2026-09-13.

## Goal

Complete GitHub issue #67 by allowing custom personas created in Persona Studio to join named Ultra Mode squads, execute through the real delegated-agent runtime with their declared prompts and capability limits, and render accurately throughout the Agency War Room.

## Product Constraints

- LENS Workstation is a Windows desktop developer research-and-coding agent harness.
- The implemented surface is English-only.
- Orion remains the mandatory squad leader.
- Every other built-in persona may be removed or replaced by a custom persona.
- Workspace persona definitions override global definitions with the same identifier.
- External research content remains untrusted and cannot grant or expand execution capabilities.
- Persona instructions cannot override the tool allowlist or approval policy declared in the persona specification.
- Custom avatars remain compositions of the eight built-in vector chassis and a neon accent color; image upload is out of scope.

## Considered Approaches

### 1. Resolve persona manifests at session start — selected

Persist squad presets as lightweight references to persona identifiers. When an Ultra session starts, the Sidecar resolves the referenced `.agent.md` files through the existing hybrid persona store, validates the lineup, and sends an immutable runtime snapshot into the agent runtime.

This keeps the `.agent.md` file authoritative, honors workspace precedence, avoids stale copies in browser storage, and provides a clean security gate before execution.

### 2. Copy complete persona manifests into each saved preset — rejected

This would make presets self-contained, but every persona edit would leave stale prompts, avatar details, and capability rules in existing presets. It would also duplicate security-sensitive policy data in browser storage.

### 3. Convert LENS personas into the existing `.cline/agents` format — rejected

The configured-agent runtime offers useful implementation patterns, but changing the source format would discard LENS stage, avatar, scope, and approval semantics. It would also conflict with ADR 0006, which establishes `.agent.md` as the portable source of truth.

## Domain Model

The built-in union remains available as `BuiltinPersonaId`. Runtime-facing APIs use `PersonaId = string` because valid custom identifiers are discovered from files.

```ts
export type BuiltinPersonaId =
	| "orion"
	| "lyra"
	| "athena"
	| "atlas"
	| "cipher"
	| "vector"
	| "sentinel"
	| "echo";

export type PersonaId = string;

export interface SquadPreset {
	id: string;
	name: string;
	description: string;
	source: "builtin" | "custom";
	personaIds: PersonaId[];
	checkpointGatesEnabled: boolean;
}

export interface SquadConfig {
	presetId: string;
	activePersonaIds: PersonaId[];
	checkpointGatesEnabled: boolean;
}

export interface RuntimePersonaDefinition {
	id: PersonaId;
	name: string;
	role: string;
	stage: AgentStage;
	avatar: AgentAvatar;
	instructions: string;
	tools: string[];
	toolPolicy: "auto" | "require_approval";
	model?: string;
	temperature?: number;
	scope: "builtin" | "workspace" | "global";
}

export interface ResolvedSquadSnapshot {
	config: SquadConfig;
	personas: RuntimePersonaDefinition[];
}
```

`ResolvedSquadSnapshot` is immutable for the lifetime of one running session. Editing a persona affects the next session, never a session already in flight.

## Preset Persistence

Named custom presets are desktop-profile preferences and are stored in webview local storage under `lens.ultra.squad-presets.v1`. A preset stores only its name, identifier list, and checkpoint preference. Persona prompts, model choices, tools, stages, and avatars are never copied into the preset.

The existing `lens.ultra.squad-config.v1` active selection remains readable and is normalized into the widened `SquadConfig`. Invalid JSON, empty lineups, duplicated identifiers, and custom presets without Orion fall back to the Core Software Squad. Deleted or unavailable personas are reported before an Ultra session starts instead of being silently removed.

Built-in presets remain immutable. Custom presets can be created, overwritten after explicit selection, and deleted with confirmation. Preset names are trimmed, must contain at least one visible character, and are unique case-insensitively.

## Persona Catalog

A shared webview catalog hook loads the built-in records synchronously and custom records through `desktopClient.listPersonas(workspaceRoot)`. It returns:

```ts
interface PersonaCatalogState {
	personas: RuntimePersonaDefinition[];
	byId: ReadonlyMap<PersonaId, RuntimePersonaDefinition>;
	status: "loading" | "ready" | "error";
	error: string | null;
	reload(): Promise<void>;
}
```

Workspace precedence is already enforced by the Sidecar. The UI labels custom records by scope and uses their configured chassis and accent color. An unknown event persona receives a neutral fallback identity rather than being misrepresented as Orion.

## Session Start Data Flow

1. The developer selects Ultra Mode and configures a squad in the popover or full side panel.
2. The active `SquadConfig` is added to `ChatSessionConfig` only for Ultra sessions.
3. The Sidecar validates the received identifiers, requires `orion`, and resolves the custom records from the current workspace and global persona directories.
4. Missing, malformed, or duplicate records reject session start with an actionable error naming the affected identifier.
5. The Sidecar builds a `ResolvedSquadSnapshot`, then provides it to the shared Ultra prompt builder and Core runtime.
6. The root Ultra prompt lists only the resolved active personas, their roles, stages, and collaboration responsibilities.
7. The snapshot is retained by the session runtime so subsequent persona-file edits cannot mutate the running session.

The browser never sends a complete system prompt or capability policy as an authoritative runtime definition. The privileged Sidecar resolves those values directly from validated local files.

## Delegated-Agent Execution

`spawn_agent.personaId` accepts any valid Agent Specification identifier rather than an enum limited to the eight built-ins. When a selected persona is present in the session snapshot:

- its saved Markdown instructions become the authoritative specialist prompt;
- the call's `systemPrompt` becomes a task-specific mission note appended below the persona contract;
- its optional model and temperature override the inherited connection defaults for that delegated run;
- the delegated tool list is intersected with the runtime's currently available tools and the persona's declared allowlist;
- write, execute, browser, and MCP capabilities retain runtime approval gates even when present in the allowlist;
- lifecycle events carry the exact custom persona identifier.

An identifier not present in the active snapshot is rejected. A model-generated `personaId` therefore cannot grant access to an inactive or unknown persona.

## Squad Configuration Interface

The compact squad popover and the full Ultra Personas side panel share one squad-selection model.

- Orion is selected, locked, and marked `Required leader`.
- All other built-in and custom personas are independently selectable.
- Custom rows show the configured vector chassis, accent color, role, stage, and scope badge.
- Built-in and named custom presets appear in one preset section, with custom presets visually identified without creating a second navigation hierarchy.
- A compact `Save preset` action requests a name and saves the current lineup and checkpoint preference.
- Selecting a saved preset updates the active lineup immediately.
- Deleting a custom preset requires confirmation and never deletes persona files.
- Catalog or preset failures keep built-ins usable and provide a retry action.

The UI retains the LENS design system: graphite tonal layers, the violet control accent, Inter and Geist Mono, restrained radii, compact Windows density, and no gradients or glass effects. Narrow layouts exist only for resizable-window resilience, not as a mobile product mode.

## Agency War Room

War Room message and state contracts use `PersonaId` instead of the built-in-only union. The War Room consumes the same resolved display catalog as squad configuration.

- Message bubbles render custom name, role, stage, chassis, and accent color.
- Persona filters include active custom personas.
- `activePersonaStates` is a dynamic `Record<PersonaId, PersonaActivityState>` initialized from the active squad.
- Streaming text moves a persona through `speaking` and back to `idle`.
- Tool execution moves a persona through `working`, then `thinking`, then `idle`.
- Checkpoint events use `checkpoint` without changing the persona's identity.
- Artifact and telemetry cards continue to render for custom senders because identity lookup no longer assumes a built-in record.

## Error Handling

- Invalid saved preset data falls back to the default preset and is not propagated into a session request.
- A preset referencing a deleted persona is visibly marked unavailable and cannot start an Ultra session until repaired.
- Persona catalog loading errors do not hide built-in personas.
- Runtime resolution errors include the failing persona ID but do not echo the persona prompt or file contents.
- Unknown live event identifiers render as `Unknown specialist` with a neutral avatar treatment and remain visible for diagnostics.
- Tool filtering defaults to no tools when a custom allowlist cannot be interpreted.

## Test Strategy

Implementation follows red-green-refactor at each boundary.

### Shared contracts

- Dynamic persona identifiers are accepted while built-in guards remain type-safe.
- Built-in and custom presets normalize deterministically.
- Ultra prompts include active custom definitions and exclude inactive personas.

### Webview state and components

- Stored presets round-trip and malformed storage falls back safely.
- Orion cannot be removed; Cipher and every other specialist can be replaced.
- Custom personas display scope, stage, chassis, and accent.
- Named presets save, select, and delete without modifying persona files.
- Missing persona references prevent session start with an actionable message.

### Sidecar

- Session start resolves workspace-over-global definitions from identifiers.
- Inactive, missing, malformed, and duplicate identifiers are rejected.
- The resolved snapshot is stable after source files change.

### Core runtime

- `spawn_agent` accepts an active custom persona ID.
- The saved prompt, model, temperature, tool allowlist, and approval policy reach `createDelegatedAgent`.
- Unknown and inactive persona IDs are rejected.
- Lifecycle events retain the custom ID.

### Agency War Room

- Custom persona messages and tool telemetry render without fallback-to-Orion errors.
- All five activity states use the configured chassis and accent.
- Unknown identities use the diagnostic fallback.

## Documentation and Release Notes

Implementation updates `CONTEXT.md`, ADR 0006, and `CHANGELOG.md`. The repository does not require a new ADR because ADR 0006 already accepted custom squad presets and runtime deployment; this design records the concrete runtime-resolution mechanism beneath that accepted decision.

## Out of Scope

- Cloud synchronization of squad presets.
- Workspace-shared squad preset files.
- Persona image uploads.
- Editing persona specifications from the squad popover.
- Changing the running session when a persona file changes on disk.
- Replacing Orion as the squad leader.
