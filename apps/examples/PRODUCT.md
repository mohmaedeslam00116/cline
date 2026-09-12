# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is a professional software developer working in English who uses LENS Workstation to research, plan, implement, and review software changes from one desktop environment. Teams may share repository-scoped personas and durable project knowledge through Git.

## Product Purpose

LENS Workstation is an autonomous developer research and coding agent harness. It helps a developer move from a technical question to evidence-backed implementation while keeping external research untrusted, execution explicitly governed, and code changes reviewable and reversible.

Success means the developer can understand why a change is proposed, control the capabilities used to make it, inspect the resulting evidence and diff, and recover cleanly when an operation fails.

## Positioning

LENS joins a deep technical research loop to a separate coding loop through an immutable EvidenceBundle. The coding loop receives verified claims instead of unrestricted web content, while capability grants, checkpoint gates, atomic change sets, and rollback manifests keep autonomous work under human control.

## Operating Context

- Developers work inside the LENS Workstation desktop application, built from the Cline Tauri shell, Next.js webview, and Bun sidecar.
- Work centers on a selected local repository and produces reviewable files, terminal activity, research evidence, sessions, and agent-team artifacts under `.lens/`.
- Persona Studio is the configuration environment for authoring and managing Specialist Personas used by Ultra Mode squads.
- Custom Personas use human-readable `.agent.md` files and can live in workspace or global scope.
- The primary authoring and operating workflow for this implementation is English.

## Capabilities and Constraints

- External research content is always untrusted and cannot grant or elevate execution capability.
- Phase 1 begins read-only; file mutation, shell execution, and out-of-boundary network activity require an explicit CapabilityGrant.
- Code modifications are atomic and reversible, validate base SHA-256 hashes, and produce rollback manifests.
- Agent-driven commands use structured spawn arguments with `shell: false`, a sanitized default-deny environment, and cross-platform process-tree termination.
- Product additions remain isolated from the Cline Base to preserve mergeability with Upstream.
- The desktop toolchain is Bun 1.3.13 with Node.js 22 or newer. npm, yarn, and pnpm are not used.
- Universal Agent Specification files contain YAML frontmatter and a Markdown system prompt.
- Built-in Specialist Personas are immutable product templates; Custom Personas are editable user artifacts.

## Brand Commitments

- Product name: **LENS Workstation**.
- Brand line: **Research, in focus.**
- Arabic expression: **نظرة أعمق. فهم أوضح.**
- Product language is precise, calm, technical, and evidence-led rather than promotional.
- Existing product-level Arabic/English parity remains a repository commitment, while the current primary user's workflow and authored persona content are English-first.
- Persona and Ultra Mode surfaces use the established dark workstation identity, high-precision vector avatars, operational state signals, and restrained cyan, violet, amber, emerald, and rose status colors already present in the desktop app.

## Evidence on Hand

- Product specification: `docs/spec-v0.1.0.md` in the LENS Workstation product repository.
- Domain language: root `CONTEXT.md` and accepted ADRs in `docs/adr/`.
- Cline adaptation blueprint: `docs/research/cline-core-adaptation.md` in the product repository.
- Persona Studio specification: `docs/specs/0001-custom-persona-studio-and-team-memory.md`.
- Persona Studio architecture: `docs/adr/0006-custom-persona-studio-and-team-memory.md`.
- Existing visual evidence: desktop webview theme tokens, the Agent Sidebar, the Evidence surface, the Persona Gallery, eight SVG persona chassis, and Agency War Room interaction patterns.
- No customer claims, commercial benchmarks, or third-party endorsements are available and future surfaces must not fabricate them.

## Product Principles

1. Research evidence and coding capability stay separated by an explicit trust boundary.
2. Autonomy remains visible, least-privileged, interruptible, and reversible.
3. Human-readable project artifacts are preferred over opaque proprietary stores.
4. The interface shows operational state and provenance clearly enough to support confident review.
5. LENS Additions preserve the mergeability of the Cline Base.

## Accessibility & Inclusion

LENS interfaces preserve keyboard operation, visible focus, semantic state, reduced-motion preferences, and readable contrast. Existing bidirectional layout and localization infrastructure remain intact even when the active workflow is English-first.
