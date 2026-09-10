# Research Report: Inventory of the Cline Desktop App — Surfaces & Integration Seams

**Resolves**: [#2 [Research] Inventory the Cline desktop app](https://github.com/mohmaedeslam00116/cline/issues/2)
**Map**: [#1 [Map] LENS Workstation on the Cline desktop-app base — Phase-1 spec](https://github.com/mohmaedeslam00116/cline/issues/1)

---

## 1. Package identity

- `apps/examples/desktop-app`, package **`@cline/code`** (keep the name; see [#1 Notes](https://github.com/mohmaedeslam00116/cline/issues/1)).
- Layout inside the app dir: `sidecar/` (Bun backend), `webview/` (Next.js app), `src-tauri/` (Tauri v2 Rust shell), `scripts/`, plus `bun.mts` (build entry).

## 2. Runtime modes (from `package.json` scripts)

| Mode | Command | What it does |
| --- | --- | --- |
| Headless | `bun run dev:sidecar` | Runs `sidecar/index.ts` directly (Bun). |
| Web UI | `bun run dev:web` | `next dev webview -p 3125 --turbo` (pre-step builds `@cline/ui`). |
| Full native | `bun run dev` | `tauri dev --config src-tauri/tauri.dev.conf.json`. |
| Headless orchestration | `bun run dev:headless` | `scripts/dev-headless.ts`. |
| Package | `bun run package:desktop:{mac,windows,linux}` | Per-platform packaging via `scripts/package-desktop.ts`. |

Port allocation (consistent with the shared Tauri dev config): sidecar **`127.0.0.1:3126`** serving `ws://.../transport`; webview Next.js dev server **`:3125`**.

## 3. Sidecar (the privileged backend)

- Entry: `sidecar/index.ts`; tests colocated (`*.test.ts` — e.g. `chat-session.test.ts`, `attachments.test.ts`, `commands-integrations.test.ts`).
- Session model: `sidecar/chat-session.ts` (chat/session lifecycle), `sidecar/session-data/` (per-session data).
- Command surface: `sidecar/commands-*.ts` modules (account, hub upgrade, integrations, …) — the natural place a `commands-research.ts` / `commands-policy.ts` would slot in additively.
- Context wiring: `sidecar/client-context.ts`.
- **The sidecar is the privileged boundary**: it instantiates the SDK runtime (see the companion report `sdk-ports-mapping.md`) and would host LENS's policy layer, capability grants, and the research engine services.

## 4. Webview (Next.js UI)

- Framework: Next.js (dev via `next dev webview`), component library `@cline/ui` (workspace package `sdk/packages/ui`), Radix primitives, Tailwind config in `webview/`.
- Top-level structure: `webview/app` (Next App Router), `webview/components`, `webview/contexts`, `webview/hooks`, `webview/lib`, `webview/styles`.
- Views under `webview/components/views/`: **chat** (incl. `chat-messages.test.tsx` and `messages/`), **sessions**, **settings**, **onboarding**, **marketplace-view**, **marketplace-explorer-view**, `page-layout.tsx`.
- Existing chat views are composed from `@cline/ui` primitives — LENS surfaces (AgentCanvas tool cards, evidence shelf tab, diff pane tab) should compose from the same kit as additional views/panels rather than restyling the Base views.

## 5. Shell (Tauri)

- `src-tauri/` with a dedicated dev config (`tauri.dev.conf.json`) and a production build path (`bun run build` → `bun.mts`, `build:binary` → `tauri build`).
- Packaging scripts already cover **Windows, macOS, Linux** — directly reusable for LENS installers later.

## 6. Integration seams for LENS (shortlist)

1. **Sidecar command modules** (`sidecar/commands-*.ts` pattern): add LENS commands (research, evidence retrieval, policy status) as new additive files.
2. **Transport**: the sidecar's `ws://.../transport` session channel is the single pipe to the webview; LENS event streams (research progress, evidence claims, grant requests) ride the same transport with new message types (verify exact schema location during the ports mapping — companion report).
3. **Webview panels**: new LENS views under `webview/components/views/` (e.g. an evidence shelf panel beside `sessions`/`settings`), built on `@cline/ui`.
4. **Approval flow**: the SDK already defines `ToolApprovalRequest`/`ToolApprovalResult` (see companion report) with a desktop file-based approval bridge in `@cline/core` — LENS's human-in-the-loop grant checkpoints can replace/extend this bridge inside the sidecar.
5. **Persistence**: `sidecar/session-data/` is the existing per-session store; `.lens/sessions/` LENS sessions can either extend this or run alongside it (decision deferred to the spec-grilling ticket #5).
6. **Shell branding**: `src-tauri/` icons/config + `webview/styles` + fonts (`@fontsource-variable/inter` already a dependency; Cairo would be added) — trailing Phase-1 tickets.

## 7. Facts to carry into the spec

- The app already depends on `@cline/core`, `@cline/llms`, `@cline/shared` (and workspace `@cline/ui`) — LENS additions consume the SDK the same way.
- `dev:web`'s pre-step (`predev:web` → `build:ui`) confirms the shared-UI build dependency; the same chain applies to LENS UI work.
- Vitest is configured for webview tests (`vitest.config.ts`); sidecar tests are Bun-native colocated tests.
