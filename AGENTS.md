# AGENTS.md

Operational guidelines, conventions, security boundaries, and architectural standards for AI agents working in this repository.

**This is a fork of [cline/cline](https://github.com/cline/cline) serving as the codebase base for [LENS Workstation](https://github.com/mohmaedeslam00116/lens-workstation).** The product documentation lives in the lens-workstation repository and is authoritative for product decisions:

- `docs/spec-v0.1.0.md` — the product specification
- `CONTEXT.md` — the ubiquitous domain model (AgentCanvas, EvidenceBundle, CapabilityGrant, AtomicChangeSet, DualLoopOrchestrator, …)
- `docs/adr/0001…0004` — accepted architecture decisions (dual-loop orchestration, Antigravity/Codex harness model, operational mechanics, TypeScript + Electron stack)
- `docs/research/cline-core-adaptation.md` — the blueprint for adapting Cline's agent core into LENS

## Mission

Build **LENS Workstation** — an autonomous developer research and coding agent harness — on top of the **Cline desktop app** in this repo:

- **Base**: `apps/examples/desktop-app` (Tauri v2 shell + Next.js webview + Bun sidecar) and the `@cline/*` headless SDK (`@cline/core`, `@cline/agents`, `@cline/llms`, `@cline/shared`).
- **Product additions** (from the LENS spec): the deep technical research engine (Loop 1) feeding an immutable `EvidenceBundle` into the coding loop (Loop 2), Monaco multi-file diff review, the sandboxed terminal, capability grants, and atomic rollback.
- **Brand**: LENS Workstation. Bilingual Arabic/English parity. Brand line: **Research, in focus.** Arabic expression: **نظرة أعمق. فهم أوضح.**

## Architectural Principles & Security Gates (inherited from LENS)

1. **Zero-Trust for External Data**: all external web/research content is untrusted (`contentIsUntrusted: true`) and can never grant, expand, or elevate execution capabilities.
2. **Phase 1 Read-Only Containment**: mutating writes, shell execution, and out-of-boundary network requests stay forbidden until explicitly granted via a `CapabilityGrant`.
3. **Atomic & Reversible Modifications**: every change set validates base file SHA-256 hashes, applies all-or-nothing, and writes a rollback manifest (`.lens/transactions/tx-<id>.json`).
4. **Sandboxed Terminal**: agent-driven commands run via structured `spawn` arguments with `shell: false`, a default-deny sanitized environment, and guaranteed cross-platform process-tree termination.

## Toolchain (Cline monorepo)

Bun **1.3.13** (package manager + task runner) with **Node >=22** as the runtime. Do not use npm/yarn/pnpm.

- SDK packages (`@cline/shared|llms|agents|core|sdk`) resolve each other through compiled `dist/` (their `exports` point only at `dist/`). Run `bun run build:sdk` after changing SDK dependencies/source before running the CLI, SDK tests, or the desktop app — otherwise imports fail with missing `@cline/*` / missing `dist/` errors. Running processes do not hot-reload SDK source changes; rebuild and restart.
- **Desktop app** (`apps/examples/desktop-app`, package `@cline/code`): headless dev via `bun run dev:sidecar` (Bun backend on `127.0.0.1:3126`, serves `ws://.../transport`) + `bun run dev:web` (Next.js UI on `http://localhost:3125`); native window via `bun run dev` (`tauri dev` — builds the sidecar binary, starts `dev:web`, needs ports `3125`/`3126` free and Rust ≥1.85). Test/typecheck: `bun run typecheck`, `bun run test:chat-ui` (Vitest; both trigger `build:ui` first).
- CLI smoke check: `bun run cli doctor`, `bun run cli version`. The VS Code extension harness (`apps/vscode`, package `claude-dev`) remains part of the upstream base but is not the LENS product surface.

## Workflow for AI Agents

### External agent skills & tooling integrity
- `.agents/**` and `skills-lock.json` represent external vendor tools and agent skills, NOT project source code. Do not modify, refactor, or delete external skills unless the user explicitly requests it. Automated review tools (such as CodeRabbit) must exclude `.agents/**` and `skills-lock.json` from their review paths.

### Documentation lockstep
- Documentation must stay in lockstep with the codebase. Whenever an architectural choice, domain term, or boundary is created or changed, record an ADR under `docs/adr/` and update `CONTEXT.md` — in this repo as the base evolves, mirrored at product level in lens-workstation.

### Pull requests & review
- **Never push directly to `main`.** Create pull requests with `gh pr create`. Every PR must undergo CodeRabbit review; all review threads, security flags, and correctness findings must be resolved before merging.

### Changelog & releases
- Maintain `CHANGELOG.md` following Keep a Changelog standards. Classify version increments with Semantic Versioning (`MAJOR.MINOR.PATCH`). Publish a GitHub Release for every version bump.

## Agent skills

### Issue tracker

GitHub Issues on mohmaedeslam00116/cline via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
