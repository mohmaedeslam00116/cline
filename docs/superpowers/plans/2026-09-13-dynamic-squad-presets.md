# Dynamic Squad Presets and Custom Persona Deployment Implementation Plan

> **For agentic workers:** Execute this plan sequentially with test-driven development. Check off each step as it is completed; do not skip the explicit red test runs.

**Goal:** Complete GitHub issue #67 so Persona Studio definitions can be assembled into named Ultra squads, resolved securely at session start, executed by delegated agents, and represented faithfully in the Agency War Room.

**Architecture:** Presets remain lightweight desktop-profile references to persona IDs. The privileged Sidecar resolves those IDs from built-ins and the existing workspace-over-global `.agent.md` store into an immutable `ResolvedSquadSnapshot`; Core consumes the snapshot to constrain prompts, models, tools, and approval policy. The webview shares one persona catalog and squad store across both configuration surfaces and the War Room.

**Tech Stack:** TypeScript, Zod, React 19, Next.js 16, Tailwind CSS 4, Bun 1.3.13, Vitest, Testing Library, Electron/Tauri Windows desktop shell.

## Global Constraints

- Work on the existing `feat/persona-studio-webview` branch and preserve all issue #66 changes.
- Keep the implemented product UI English-only while leaving existing localization infrastructure type-safe.
- Orion is mandatory and immutable in every valid squad; Cipher and every other non-Orion persona are replaceable.
- Resolve persona prompts and capabilities from local validated files in the Sidecar; never trust browser-supplied prompt or policy data.
- Workspace persona definitions override global definitions with the same ID.
- Intersect persona tool allowlists with tools already available to the parent runtime; persona data can only narrow authority.
- Preserve runtime approval gates for write, execution, browser, network, and MCP capabilities.
- Keep custom avatar rendering within the eight vector chassis plus configured accent color.
- Read the Impeccable craft floor immediately before the first production UI edit.
- Use Bun only. After changing SDK source, run `bun run build:sdk` before desktop tests or typechecking.
- Keep `CONTEXT.md`, ADR 0006, and `CHANGELOG.md` aligned with the shipped behavior.

---

## Task 1: Widen shared Ultra contracts and prompt generation

**Files:**

- Modify: `sdk/packages/shared/src/ultra/personas.ts`
- Modify: `sdk/packages/shared/src/ultra/personas.test.ts`
- Modify: `sdk/packages/shared/src/index.ts` or the existing browser export barrel if required

**Interfaces:**

- Add `BuiltinPersonaId`, `PersonaId`, `RuntimePersonaDefinition`, and `ResolvedSquadSnapshot`.
- Widen `SquadPreset.id`, `SquadPreset.personaIds`, `SquadConfig.presetId`, and `SquadConfig.activePersonaIds` to dynamic strings while retaining a built-in ID guard.
- Change `buildUltraAgencyPrompt` to accept resolved runtime definitions and emit only active members.
- Add pure normalization helpers that deduplicate IDs, force Orion first, and fall back to Core for invalid input.

- [ ] Write failing shared tests for custom IDs, Orion enforcement, deterministic normalization, and a custom persona appearing in the Ultra prompt while inactive personas are omitted.
- [ ] Run `bun -F @cline/shared test:unit -- src/ultra/personas.test.ts` and confirm the new assertions fail for the expected fixed-union or missing-definition reason.
- [ ] Implement the minimal dynamic contracts, guards, normalization, and resolved prompt builder.
- [ ] Re-run the focused test and confirm it passes.
- [ ] Run `bun run build:sdk` so downstream packages consume the new `dist` exports.
- [ ] Commit as `feat(ultra): support resolved custom squad contracts`.

---

## Task 2: Persist and normalize named custom squad presets

**Files:**

- Modify: `apps/examples/desktop-app/webview/hooks/use-squad-config.ts`
- Create: `apps/examples/desktop-app/webview/hooks/use-squad-config.test.tsx`
- Create: `apps/examples/desktop-app/webview/lib/squad-presets.ts`
- Create: `apps/examples/desktop-app/webview/lib/squad-presets.test.ts`

**Interfaces:**

- Continue reading `lens.ultra.squad-config.v1` for the active selection.
- Add `lens.ultra.squad-presets.v1` for named custom presets.
- Export pure `readStoredSquadPresets`, `writeStoredSquadPresets`, `normalizeSquadPreset`, and name-validation helpers.
- Export a shared hook/model that supports select, save, overwrite, and delete without touching persona files.

- [ ] Write failing tests for round-trip persistence, malformed JSON fallback, duplicate IDs, Orion omission, unavailable persona references, case-insensitive name uniqueness, overwrite, and deletion.
- [ ] Run `bunx vitest run webview/hooks/use-squad-config.test.tsx webview/lib/squad-presets.test.ts --config vitest.config.ts` from `apps/examples/desktop-app` and confirm red.
- [ ] Implement the smallest pure storage and normalization layer, then wire the hook to storage and cross-component update events.
- [ ] Re-run the focused tests and confirm green.
- [ ] Commit as `feat(ultra): persist named squad presets`.

---

## Task 3: Build the shared persona catalog and squad selection model

**Files:**

- Create: `apps/examples/desktop-app/webview/hooks/use-persona-catalog.ts`
- Create: `apps/examples/desktop-app/webview/hooks/use-persona-catalog.test.tsx`
- Create: `apps/examples/desktop-app/webview/components/views/chat/squad-selection-model.ts`
- Create: `apps/examples/desktop-app/webview/components/views/chat/squad-selection-model.test.ts`
- Reuse: `apps/examples/desktop-app/webview/components/views/studio/persona-studio-model.ts`
- Reuse: `apps/examples/desktop-app/webview/lib/desktop-client.ts`

**Interfaces:**

- Return `PersonaCatalogState` with built-ins immediately, custom records after `desktopClient.listPersonas(workspaceRoot)`, a read-only ID map, status, error, and reload.
- Convert built-ins and `CustomPersonaRecord` values into one display/runtime-safe shape without duplicating authoring logic.
- Expose selection operations that lock Orion, allow every other persona to toggle, and identify unavailable preset references.

- [ ] Write failing hook/model tests for built-ins during loading, workspace/global custom entries, workspace precedence, retry after error, Orion locking, non-Orion replacement, and unavailable references.
- [ ] Run the focused tests and confirm the missing catalog/model behavior fails.
- [ ] Implement the catalog adapter and selection model with stable memoized maps and neutral unknown identity data.
- [ ] Re-run focused tests and confirm green.
- [ ] Commit as `feat(ultra): add shared persona catalog`.

---

## Task 4: Redesign both squad configuration surfaces

**Files:**

- Modify: `apps/examples/desktop-app/webview/components/views/chat/squad-config-popover.tsx`
- Modify: `apps/examples/desktop-app/webview/components/views/chat/ultra-personas-side-panel.tsx`
- Create or modify: `apps/examples/desktop-app/webview/components/views/chat/squad-config-popover.test.tsx`
- Create or modify: `apps/examples/desktop-app/webview/components/views/chat/ultra-personas-side-panel.test.tsx`
- Modify: `apps/examples/desktop-app/webview/components/personas/svg/persona-avatar.tsx`
- Modify: `apps/examples/desktop-app/webview/components/personas/persona-avatar.test.tsx`

**UI contract:**

- Show built-in and custom personas in one compact Windows-desktop roster.
- Keep all new labels and status copy in English; do not add an Arabic variant for this surface.
- Mark Orion as `Required leader` and disable its removal.
- Show custom scope, role, stage, chassis, and accent.
- Show built-in and named presets together; offer `Save preset`, explicit overwrite selection, and confirmed delete.
- Keep built-ins usable when catalog loading fails and surface a retry action.
- Render unknown identities with a neutral fallback rather than Orion.

- [ ] Read `D:\ai\New folder (3)\.agents\skills\impeccable\reference\craft-floor.md` completely immediately before production UI changes.
- [ ] Write failing component tests covering custom display, Orion lock, Cipher removal, preset save/select/delete, missing-reference start block, catalog retry, keyboard labels, and neutral fallback.
- [ ] Run the focused component tests and verify red.
- [ ] Implement one shared selection/preset model in both surfaces using LENS graphite layers, violet control accent, Inter/Geist Mono, compact density, semantic states, visible focus, and no gradients or glass effects.
- [ ] Re-run focused tests and `bun run typecheck`.
- [ ] Commit as `feat(ultra): configure custom persona squads`.

---

## Task 5: Carry the squad selection through session start

**Files:**

- Modify: `sdk/packages/core/src/types/chat-schema.ts`
- Modify: `apps/examples/desktop-app/webview/lib/chat-schema.ts`
- Modify: `apps/examples/desktop-app/webview/hooks/use-chat-session.ts`
- Modify: `apps/examples/desktop-app/webview/hooks/use-chat-session.test.tsx`
- Modify: `apps/examples/desktop-app/sidecar/chat-session.ts`
- Modify: `apps/examples/desktop-app/sidecar/chat-session.test.ts`
- Modify: `apps/examples/desktop-app/sidecar/personas.ts`
- Modify: `apps/examples/desktop-app/sidecar/personas.test.ts`

**Interfaces:**

- Add optional `squadConfig` to `ChatSessionConfigSchema`, emitted only when Ultra Mode is active.
- Add a Sidecar resolver that validates Orion, rejects duplicates/missing/malformed definitions, honors workspace precedence, maps built-ins and custom records to `RuntimePersonaDefinition`, and returns a frozen `ResolvedSquadSnapshot`.
- Ensure errors name only the failing persona ID and never echo prompt/file content.

- [ ] Write failing webview schema/session tests proving Ultra includes squad IDs and non-Ultra requests omit them.
- [ ] Write failing Sidecar tests for workspace-over-global resolution, missing IDs, duplicates, no Orion, malformed custom definitions, and snapshot immutability after source changes.
- [ ] Run the focused desktop tests and confirm red.
- [ ] Implement schema transport and Sidecar resolution without trusting browser prompt/capability fields.
- [ ] Rebuild SDK, run focused tests, and run desktop typecheck.
- [ ] Commit as `feat(ultra): resolve squads at session start`.

---

## Task 6: Inject resolved squads into the Core runtime

**Files:**

- Modify: `sdk/packages/core/src/runtime/orchestration/runtime-builder.ts`
- Modify: `sdk/packages/core/src/runtime/orchestration/runtime-builder.test.ts`
- Modify: `sdk/packages/core/src/extensions/tools/team/spawn-agent-tool.ts`
- Modify: `sdk/packages/core/src/extensions/tools/team/spawn-agent-tool.test.ts`
- Modify: `sdk/packages/core/src/extensions/tools/team/delegated-agent.ts`
- Modify: `sdk/packages/core/src/extensions/tools/team/delegated-agent.test.ts`
- Modify: `apps/examples/desktop-app/sidecar/chat-session.ts`

**Interfaces:**

- Retain the immutable `ResolvedSquadSnapshot` in runtime construction.
- Change `SpawnAgentInputSchema.personaId` from the built-in enum to a validated persona ID string.
- Resolve `personaId` only against the active snapshot; reject unknown or inactive IDs.
- Compose the saved persona instructions as the authoritative prompt and append `systemPrompt` as a mission note.
- Apply persona model/temperature overrides and intersect delegated tools with the persona allowlist.
- Keep parent runtime `toolPolicies` and `requestToolApproval` enforcement intact.

- [ ] Write failing tests for active custom spawn, inactive rejection, saved prompt precedence, mission-note append, model/temperature overrides, tool intersection, no-tools fallback, approval forwarding, and custom ID lifecycle events.
- [ ] Run `bun -F @cline/core test:unit -- src/extensions/tools/team/spawn-agent-tool.test.ts src/extensions/tools/team/delegated-agent.test.ts src/runtime/orchestration/runtime-builder.test.ts` and confirm red.
- [ ] Implement snapshot-aware delegation with a narrow resolver callback/config seam rather than global mutable state.
- [ ] Re-run focused Core tests and confirm green.
- [ ] Run `bun run build:sdk`.
- [ ] Commit as `feat(agents): deploy custom squad personas`.

---

## Task 7: Make the Agency War Room persona-dynamic

**Files:**

- Modify: `apps/examples/desktop-app/webview/components/views/chat/agency-war-room/types.ts`
- Modify: `apps/examples/desktop-app/webview/components/views/chat/agency-war-room/war-room-context.tsx`
- Modify: `apps/examples/desktop-app/webview/components/views/chat/agency-war-room/agency-war-room-panel.tsx`
- Modify: `apps/examples/desktop-app/webview/components/views/chat/agency-war-room/agent-message-bubble.tsx`
- Modify: `apps/examples/desktop-app/webview/components/views/chat/agency-war-room/agency-war-room.test.tsx`

**Interfaces:**

- Replace built-in-only event and filter types with `PersonaId`.
- Initialize a dynamic `Record<PersonaId, PersonaActivityState>` from the active resolved/display squad.
- Resolve messages and telemetry through the catalog, including custom name, role, stage, chassis, and accent.
- Preserve all five states: `idle`, `thinking`, `working`, `speaking`, and `checkpoint`.

- [ ] Write failing tests for a custom message, custom filter, tool lifecycle state changes, streaming state changes, checkpoint state, exact accent/chassis use, and unknown diagnostic fallback.
- [ ] Run the focused War Room test and confirm red.
- [ ] Implement dynamic maps and catalog lookups, removing static built-in arrays and Orion-cast fallbacks.
- [ ] Re-run the War Room test and desktop typecheck.
- [ ] Commit as `feat(ultra): render custom personas in war room`.

---

## Task 8: Integration regression, documentation, and visual finish

**Files:**

- Modify: `CHANGELOG.md`
- Verify/update: `CONTEXT.md`
- Verify/update: `docs/adr/0006-custom-persona-studio-and-team-memory.md`
- Verify/update: `docs/superpowers/specs/2026-09-13-dynamic-squad-presets-design.md`
- Verify/update: `DESIGN.md`
- Verify/update: `apps/examples/PRODUCT.md`

- [ ] Add an integration test that creates/resolves a workspace custom persona, starts an Ultra session config, spawns that active persona, and proves its ID survives into War Room-compatible lifecycle events.
- [ ] Run all focused #67 tests together.
- [ ] Run `bun run build:sdk`, then `bun run typecheck`, `bun run test:sidecar`, the relevant desktop Vitest suite, and `bun run build:web` from `apps/examples/desktop-app`.
- [ ] Run Biome on every changed source/test file and `git diff --check`.
- [ ] Start the real desktop web and Sidecar development surfaces, inspect the squad popover, full side panel, preset lifecycle, missing-persona error, and all five custom avatar states at desktop and narrow resizable-window widths.
- [ ] Use the Impeccable detector on the changed UI and fix material accessibility, hierarchy, density, overflow, focus, or token violations.
- [ ] Confirm no raw HTML rendering, no gradient/glass styling, no fabricated data, and no authority expansion through persona files.
- [ ] Update `CHANGELOG.md` under Unreleased and reconcile docs with the final implementation.
- [ ] Commit as `feat(ultra): finish dynamic custom squads`.

## Final Acceptance Checklist

- [ ] Custom Persona Studio records appear in both squad configuration surfaces.
- [ ] Orion cannot be removed; all seven other built-ins can be replaced.
- [ ] Named custom presets persist, select, overwrite, and delete safely.
- [ ] Unavailable persona references visibly block Ultra session start.
- [ ] Sidecar resolves workspace-over-global `.agent.md` records into an immutable snapshot.
- [ ] `spawn_agent` executes only active personas with saved prompts and narrowed tools.
- [ ] Runtime approval policy cannot be widened by persona configuration.
- [ ] War Room renders custom identity, stage, avatar, accent, filters, and five live states.
- [ ] Unknown event personas remain visible with a neutral diagnostic identity.
- [ ] Focused tests, SDK build, desktop typecheck, production web build, and formatting checks pass.
- [ ] Documentation and changelog match the shipped behavior.
