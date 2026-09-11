# Ultra Mode agency framework: Atoms.dev persona evolution, cognitive isolation, and checkpoint gates

## Status

Accepted

## Context & Decision

Engine #7 evolves Ultra Mode from a fixed procedural MetaGPT pipeline into a dynamic multi-agent software engineering agency inspired by the 3-year evolutionary leap of Atoms.dev (MetaGPT foundation). Rather than running a monolithic sequence of generic stages, the system coordinates named cybernetic specialist personas (Orion, Lyra, Athena, Atlas, Vector, Cipher, Sentinel, Echo) with cognitive isolation, structured inter-agent collaboration feeds, and human-in-the-loop review gates.

**Decision**:
1. **Named Cybernetic Specialist Personas**: The agency defines eight specialized personas (`SpecialistPersona`):
   - **Orion**: Lead Orchestrator — coordinates squad strategy, task DAG, and checkpoint enforcement.
   - **Lyra**: Deep Tech Researcher — investigates technical feasibility and library benchmarks; treats all external findings strictly as untrusted data (`[External Evidence - Untrusted]`).
   - **Athena**: Product Lead — produces structured PRDs with user stories and prioritized requirement pools.
   - **Atlas**: Systems Architect — produces comprehensive system designs, formal interface definitions, and Mermaid architecture diagrams.
   - **Vector**: Data Architect — produces data models, database schemas, and migration strategies.
   - **Cipher**: Core Full-Stack Engineer — implements production code directly into workspace target paths adhering strictly to Atlas's interfaces.
   - **Sentinel**: QA & Executable Self-Correction — writes and executes automated test suites, running up to 3 autonomous self-correction repair cycles on test/compiler failures.
   - **Echo**: Web & Documentation Specialist — produces onboarding guides, API docs, and runbooks.
2. **Sub-Agent Cognitive Isolation**: Each persona maintains strict domain focus. Deliverables are published to isolated files under `.lens/ultra/` (e.g. `01_research_lyra.md`, `02_prd_athena.md`, `03_architecture_atlas.md`, `03_data_schema_vector.md`, `04_tasks_orion.md`, `05_qa_report_sentinel.md`, `06_documentation_echo.md`), preventing cross-domain context dilution.
3. **Dynamic Collaboration Feed**: Specialists consult and hand off work through explicit message protocols (`[AgentA -> AgentB]: <context / deliverable handoff>`), displayed in an interactive collaboration timeline in the webview.
4. **The 2 Golden Checkpoints**:
   - **Checkpoint 1 (Strategy & Blueprint Gate)**: Lyra and Vector complete research and data schemas, Atlas reconciles them with Athena's PRD, and Orion pauses execution (`### CHECKPOINT 1: STRATEGY & BLUEPRINT AWAITING APPROVAL`) for human approval before source code edits begin.
   - **Checkpoint 2 (Pre-Ship Verification Gate)**: Cipher implements code and Sentinel executes test and compiler verification. If all checks pass (Passed / Verified), Orion pauses (`### CHECKPOINT 2: PRE-SHIP VERIFICATION AWAITING APPROVAL`) for human ship authorization. If test or compiler failures persist after 3 autonomous repair cycles, Sentinel records the status as Failed / Blocked with full diagnostic tracebacks, and Orion does not advance to ship approval, pausing for human intervention.
5. **Configurable Squad Presets**: Users can configure the active squad lineup (`SquadConfig`) choosing from presets (`core`, `full`, `rapid`, `custom`) and toggling interactive checkpoint gates. Disabling checkpoint gates requires an explicit, audited human configuration override; in fully autonomous mode with gates disabled, execution continues through Sentinel verification without pausing at the human review gates.

## Considered Options

- **Single monolithic prompt with all roles**: Rejected — leads to role bleeding, context pollution, and lack of accountability between research, architecture, and implementation.
- **Independent LLM agent processes per persona**: Deferred for Phase 1 — running separate sidecars or processes for each persona introduces process management complexity and higher token usage; instead, cognitive isolation is enforced via per-persona system prompt snippets, dedicated deliverable files, and structured handoff logs within the unified orchestrator harness.
- **Unbounded self-correction loops**: Rejected — autonomous repair loops are strictly capped at 3 retries with rollback awareness to prevent infinite failure loops.

## Consequences

- Full traceability: Every architectural decision, data schema, task dependency, and test result is written to an immutable deliverable in `.lens/ultra/`.
- Safety: When checkpoint gates remain enabled (the secure default), Checkpoints 1 & 2 prevent unauthorized code changes and premature shipping without explicit human approval; when explicitly disabled via audited configuration override, Sentinel's verification gate still blocks progression on failures.
- Zero-trust compliance: Lyra's external evidence is tagged untrusted, preserving Phase 1 security invariants.
