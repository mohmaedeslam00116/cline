# Cline fork — LENS Workstation base

This repository is the fork of cline/cline serving as the codebase base for LENS Workstation. It hosts the adapted Cline desktop app and the LENS product additions. Product-level domain language (AgentCanvas, EvidenceBundle, CapabilityGrant, …) lives in the lens-workstation repo's `CONTEXT.md` and is authoritative there.

## Language

**Base**:
The inherited Cline desktop app (Tauri v2 shell, Next.js webview, Bun sidecar) and `@cline/*` SDK packages, kept mergeable with upstream.
_Avoid_: upstream, vanilla Cline, the extension

**LENS Additions**:
The product code contributed by LENS Workstation — the research engine, evidence handoff, policy layer, diff review, and sandboxed terminal — isolated so the Base stays mergeable.
_Avoid_: fork changes, customizations

**Sidecar**:
The Bun backend process of the desktop app (`127.0.0.1:3126`, `ws://.../transport`) that hosts the agent runtime and mediates all privileged operations.
_Avoid_: server, backend service, daemon

**Upstream**:
The cline/cline repository this fork tracks; periodic merges from it are part of the maintenance contract.
_Avoid_: origin (that's this fork's GitHub remote)

**Mergeability**:
The property that LENS Additions stay isolated enough that merging Upstream remains routine rather than a rewrite.
_Avoid_: sync, drift

**Evidence Store**:
The content-addressed file layout under `<workspace>/.lens/sessions/<sessionId>/evidence/` holding immutable `EvidenceBundle` files plus a per-session index manifest; bundles are superseded, never edited.
_Avoid_: evidence cache, bundle database

**Claims Index**:
The high-level, per-session list of verified research claims injected at session start; detailed excerpts are fetched on demand.
_Avoid_: evidence summary, digest

**On-Demand Claim Detail**:
The read-only retrieval of a single claim's full excerpt (`get_evidence_detail(claimId)`) during a coding turn, keeping context stratified.
_Avoid_: evidence dump, full-context injection

**Ultra Mode**:
The autonomous multi-agent software engineering agency mode within LENS Workstation, executing structured SOP assembly lines with named specialist personas.
_Avoid_: super mode, dev mode

**Persona Studio**:
The workstation configuration environment for creating, editing, testing, and managing specialized AI agent personas.
_Avoid_: bot creator, prompt manager

**Specialist Persona**:
A named, role-specific agent identity (e.g. Orion, Athena, Atlas, Cipher, Sentinel) with a distinct system prompt, avatar, domain responsibilities, and tool privileges.
_Avoid_: character, sub-prompt

**Squad**:
A configured group of specialist personas selected to collaborate on an Ultra Mode mission, coordinated by a Team Leader.
_Avoid_: agent swarm, crew

**Checkpoint Gate**:
A human-in-the-loop review point orchestrated by the Team Leader where execution pauses for user validation before advancing to the next engineering milestone.
_Avoid_: breakpoint, prompt stop
