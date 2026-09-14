# Custom Persona Studio, Universal Agent Specification, and Checkpoint-Governed Team Memory

## Status

Accepted

## Context & Decision

Building upon the Ultra Mode Agency Framework (ADR 0005), developers need the ability to author, customize, and persist specialized AI agents tailored to specific technology stacks and project domains, while enabling multi-agent squads to maintain shared institutional memory across sessions.

Rather than introducing proprietary configuration formats or opaque vector stores, LENS Workstation adopts the **Universal Agent Specification** and a **Checkpoint-Governed Markdown Knowledge Base**.

### Decision:

1. **Universal Agent Specification Standard (`.agent.md`)**:
   - Custom personas are authored and stored as standard Markdown files with YAML frontmatter, adhering strictly to global open agent standards (Anthropic Agent Skills / Linux Foundation AGENTS.md conventions):
     ```markdown
     ---
     name: string
     id: string
     version: string
     description: string
     role: string
     stage: "strategy" | "research" | "architecture" | "development" | "qa" | "documentation"
     avatar:
       chassis: "orion" | "lyra" | "athena" | "atlas" | "cipher" | "vector" | "sentinel" | "echo"
       accentColor: string
     tools: string[]
     toolPolicy?: "auto" | "require_approval"
     model?: string
     temperature?: number
     ---

     # Operational Guidelines & System Prompt
     ...
     ```
   - Files are 100% human-readable, Git-versionable, and interoperable across other developer agent harnesses.

2. **Hybrid Storage Topology**:
   - **Global Personas (`~/.lens/personas/*.agent.md`)**: Available across all projects on the workstation.
   - **Workspace Personas (`<workspace>/.lens/personas/*.agent.md`)**: Committed to source control and shared with the development team. Workspace personas override global personas on identifier collision.

3. **Persona Studio (Dedicated Desktop View `studio`)**:
   - A dedicated top-level view in the desktop webview (`view: "studio"`) providing a visual authoring environment:
     - Interactive Cyberpunk Avatar Customizer: Select base chassis and neon accent color with live SVG vector preview across all 5 operational states (`idle`, `thinking`, `speaking`, `working`, `checkpoint`).
     - Tool Capability Selector: Granular permission toggles (`read_file`, `edit_file`, `run_command`, `browser`, etc.) respecting Phase 1 containment.
     - Markdown System Prompt Editor with live linting and syntax highlighting.
     - Squad Preset Builder: Assemble and save custom squads (`SquadConfig`) alongside default presets (`core`, `full`, `rapid`).

   Named squad presets persist only persona identifiers and checkpoint preferences in the desktop profile. At Ultra session start, the privileged Sidecar resolves those identifiers from validated built-in and `.agent.md` definitions, applies workspace-over-global precedence, and passes an immutable `ResolvedSquadSnapshot` into the runtime. Orion remains the required leader; every other specialist may be replaced. Persona prompts can narrow behavior but cannot widen the runtime's tool availability or approval policy.

4. **Structured Agent Team Memory (`<workspace>/.lens/memory/`)**:
   - Institutional memory is maintained in transparent, version-controlled Markdown files:
     - `decisions.md`: Architectural decisions, technical trade-offs, and design constraints.
     - `conventions.md`: Repository idioms, coding standards, and lint/style guidelines.
     - `learnings.md`: Historical error resolutions, operational pitfalls, and environment specifics.

5. **Stratified Context Injection & Dedicated Memory Tools**:
   - To keep agents in the **smart zone** (~150k tokens) and prevent context bloating, only concise indexes of `decisions.md` and `conventions.md` are injected into system prompts at session launch.
   - Agents interact with detailed memory via dedicated runtime tools:
     - `read_team_memory(category)`: Fetches full section excerpts on demand.
     - `record_team_learning(topic, learning)`: Proposes a new lesson or convention discovered during execution.

6. **Orion Governance at Checkpoint Gates**:
   - Proposed memory updates do not write directly to disk during unmonitored runs.
   - The Orchestrator (Orion) aggregates proposed learnings and presents them as part of **Checkpoint Gate 1** or **Checkpoint Gate 2** approval cards.
   - Human approval commits the updates to `.lens/memory/`, ensuring memory remains free of hallucinations or conflicting directives.

## Considered Options

- **Proprietary JSON Configuration (`personas.json`)**: Rejected — escapes standard agent tooling, prevents rich Markdown formatting for prompts, and hinders portable Git diffing.
- **Embedded Vector Database (Chroma / SQLite-vec)**: Rejected — introduces heavy native dependencies, opaque vector indexing, and unreviewable context dumps. Transparent Markdown files allow direct human auditing and editing.
- **Ungoverned Append-Only Memory**: Rejected — unchecked agent writes lead to conflicting instructions, hallucinated conventions, and prompt bloat over successive sessions.

## Consequences

- **Portability**: Agent definitions can be checked into repositories and shared across different workstations and AI harnesses.
- **Visual Parity**: Custom personas inherit the handcrafted cyberpunk vector SVG avatars and dynamic state animations in the Agency War Room.
- **Session Determinism**: A running Ultra session uses its immutable resolved squad snapshot, so later persona-file edits cannot silently change active delegated agents.
- **Least-Privilege Delegation**: Persona tool declarations are intersected with the parent runtime and approval requirements can only become stricter, never broader.
- **High Trust**: Team memory stays clean, relevant, and human-verified through Checkpoint Gate governance.
