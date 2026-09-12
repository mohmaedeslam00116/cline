# [Spec] Custom Persona Studio, Universal Agent Specification, and Checkpoint-Governed Team Memory

- **Status**: Ready for Agent
- **Issue**: [#62](https://github.com/mohmaedeslam00116/cline/issues/62)
- **ADR Reference**: [ADR 0006](docs/adr/0006-custom-persona-studio-and-team-memory.md)

## Problem Statement

Developers using LENS Workstation in Ultra Mode currently rely on a fixed, hardcoded squad of eight built-in specialist personas (Orion, Lyra, Athena, Atlas, Cipher, Vector, Sentinel, Echo). As engineering projects expand into diverse domains (e.g. Solidity smart contracts, Flutter mobile applications, Cloudflare edge workers, bioinformatics pipelines), developers have no native, visual, or standardized way to create, customize, and persist specialized domain agents with tailored system prompts, restricted tool capabilities, and custom visual identities. 

Furthermore, multi-agent squads currently execute in ephemeral sessions without persistent institutional memory: architectural decisions, coding conventions, and hard-won debugging learnings are lost between sessions, forcing agents to rediscover repository idioms repeatedly.

## Solution

A first-class **Persona Studio** (`view: "studio"`) within LENS Workstation enabling developers to author, edit, test, and save custom specialist agents adhering to the **Universal Agent Specification** (`.agent.md` files with YAML frontmatter + Markdown body). Custom personas are stored in a hybrid hierarchy (workspace `<workspace>/.lens/personas/` for team sharing via Git, and `~/.lens/personas/` for global developer availability) and integrate seamlessly into Ultra Mode squads and the Agency War Room with dynamic cyberpunk vector avatars. 

Alongside this, a **Structured Agent Team Memory** engine (`.lens/memory/` with `decisions.md`, `conventions.md`, `learnings.md`) provides stratified context injection into active sessions, coupled with **Orion Checkpoint Governance** where new learnings proposed by agents during execution are reviewed and approved by the human developer at Checkpoint Gates before being committed permanently.

## User Stories

1. As a developer, I want to access a dedicated "Persona Studio" tab in the workstation navigation, so that I have a focused visual environment for authoring and managing AI agents.
2. As a developer, I want to author new specialist personas using the open Universal Agent Specification (`.agent.md` with YAML frontmatter), so that my agent configurations are portable across industry agent harnesses and Git-friendly.
3. As a developer, I want to store custom personas at the repository level (`.lens/personas/`), so that my teammates automatically gain access to project-specific agents when cloning the repo.
4. As a developer, I want to store custom personas globally (`~/.lens/personas/`), so that my personal specialist agents are available across all repositories on my workstation.
5. As a developer, I want repository-level personas to override global personas on identifier collisions, so that project-specific requirements always take precedence.
6. As a developer, I want to visually customize each persona's cyberpunk avatar by selecting a base vector chassis (Orion, Lyra, Athena, Atlas, Cipher, Vector, Sentinel, Echo) and custom neon accent color, so that custom agents look native in the Agency War Room.
7. As a developer, I want custom personas to animate dynamically across all 5 live operational states (`idle`, `thinking`, `speaking`, `working`, `checkpoint`) in the War Room, so that I can observe their execution state in real-time.
8. As a developer, I want to restrict which tools a custom persona can use (e.g. read-only file access vs terminal execution), so that I can enforce the principle of least privilege and Phase 1 containment.
9. As a developer, I want to configure custom squad presets (e.g. "Mobile App Squad", "Audit Squad") combining built-in and custom personas, so that I can deploy role-tailored teams for specific tasks.
10. As an autonomous multi-agent squad, I want to access a structured team memory store in `.lens/memory/`, so that architectural decisions and repository conventions persist across sessions.
11. As a specialist agent executing in Ultra Mode, I want a concise summary of `decisions.md` and `conventions.md` injected into my session prompt, so that I adhere to project idioms without bloating the context window.
12. As a specialist agent, I want a dedicated `read_team_memory` tool, so that I can inspect full historical context on specific topics on demand.
13. As a specialist agent, I want a `record_team_learning` tool, so that I can propose newly discovered operational insights or bug resolutions during execution.
14. As a developer, I want proposed team memory updates to be reviewed at Checkpoint Gates (Orion Governance), so that no hallucinated or conflicting rules enter the permanent memory store without human sign-off.
15. As a developer, I want to test a custom persona in an interactive studio sandbox playground before deploying it into a live project squad, so that I can verify its prompt instructions and tool behavior safely.

## Implementation Decisions

- **Universal Agent Specification Standard (`.agent.md`)**:
  - Personas are defined as Markdown files with strict YAML frontmatter (`id`, `name`, `version`, `description`, `role`, `stage`, `avatar`, `tools`, `toolPolicy`, `model`, `temperature`).
  - Markdown body contains structured operational guidelines and domain prompt instructions.
  - Implemented via `@cline/shared` Zod schema and parser/serializer utilities.
- **Hybrid Storage Seam**:
  - Sidecar file management APIs scan and resolve personas from both `<workspace>/.lens/personas/` and `~/.lens/personas/`.
  - Workspace personas take precedence over global personas on ID match.
- **Persona Studio Webview Surface (`view: "studio"`)**:
  - Registered as a top-level view alongside `chat`, `settings`, and `evidence`.
  - Split-pane layout: Left pane displays persona gallery/list with search and filter; Right pane provides the visual editor (Chassis & Neon Palette picker, YAML metadata form, Markdown prompt editor with syntax highlighting, and Tool Capability matrix).
- **Structured Team Memory Engine (`.lens/memory/`)**:
  - Dedicated files: `decisions.md` (ADRs & architectural rules), `conventions.md` (coding standards & lint rules), `learnings.md` (operational fixes & bug resolutions).
  - Runtime service in `@cline/core` that generates token-budgeted summaries for session prompts.
  - Runtime tools: `read_team_memory` (category filter) and `record_team_learning` (stages proposal in runtime state).
- **Orion Checkpoint Memory Governance**:
  - `WarRoomCheckpointGate` cards display a "Proposed Team Memory Updates" tab when agents call `record_team_learning`.
  - Human approval writes the verified learnings to `.lens/memory/learnings.md`. Rejection discards them.
- **War Room & Squad Dispatch Integration**:
  - `UltraSquadConfig` updated to accept custom persona IDs.
  - Dynamic avatar renderer maps custom persona chassis and custom neon accent color into vector SVG avatars.

## Testing Decisions

- **Test Quality Definition**:
  - Tests must verify observable system contracts, schema validation, file serialization, and user interaction without coupling to internal private state.
- **Tested Modules**:
  1. Specification Parser (`@cline/shared`): Round-trip parsing, validation errors for malformed YAML frontmatter, and serialization fidelity.
  2. Team Memory Service (`@cline/core`): Summary extraction within token budget, on-demand category retrieval, and checkpoint commit mechanics.
  3. Persona Studio Webview (`@cline/code`): Studio view rendering, avatar chassis/color customization, tool toggle interaction, and persona save/delete lifecycle.
  4. War Room Custom Persona Stream (`@cline/code`): Rendering custom personas with their configured colors and stages during live events.
- **Prior Art**:
  - `apps/examples/desktop-app/webview/components/views/chat/agency-war-room/agency-war-room.test.tsx`
  - `apps/examples/desktop-app/webview/components/personas/persona-avatar.test.tsx`
  - `sdk/packages/core/src/runtime/host/local/agent-event-bridge.test.ts`

## Out of Scope

- Remote cloud synchronization of personas across arbitrary non-Git channels (Git handles project sharing).
- Embedded vector databases or local semantic embedding search (transparent Markdown is strictly chosen).
- Bitmapped PNG/JPEG avatar image upload (pure vector Cyberpunk SVG chassis system is preserved).

## Further Notes

- Fully adheres to ADR 0005 (Ultra Mode Agency Framework) and ADR 0006 (Custom Persona Studio & Team Memory).
- Extends Wayfinder Map #54 into Engine Milestone #7 under Map #33.
