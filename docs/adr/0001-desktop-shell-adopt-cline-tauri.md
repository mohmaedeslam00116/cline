# Desktop shell: adopt Cline's Tauri v2 shell (amends LENS ADR-0004)

## Status

Accepted — supersedes the Electron 29 decision in [LENS Workstation ADR-0004](https://github.com/mohmaedeslam00116/lens-workstation/blob/main/docs/adr/0004-technology-stack-typescript-electron-shell.md) for this codebase.

## Context & Decision

LENS Workstation is being built on top of the Cline desktop app (`apps/examples/desktop-app`: Tauri v2 Rust shell + Next.js webview + Bun sidecar), a fork of cline/cline kept mergeable with upstream. Adopting Cline's shell as-is preserves upstream mergeability, keeps the `@cline/*` SDK's reference host integration, and reuses its typed-transport sidecar — which already matches LENS's hexagonal-ports blueprint. Porting Cline's webview and sidecar into a fresh Electron host would trade all of that for shell uniformity with the original LENS stack.

**Decision**: ship LENS Workstation on the Tauri v2 shell. LENS's security gates (privileged policy layer, capability grants, sandboxed process-tree termination) are enforced in the sidecar and policy layer, not in the shell, so they carry over without Electron.

## Considered Options

- **Adopt Tauri v2 as-is** (chosen): upstream mergeability, reference host, sidecar reuse.
- **Port to Electron 29**: shell uniformity with LENS ADR-0004, at the cost of permanent divergence from upstream and a rebuilt host layer.

## Consequences

- LENS ADR-0004's shell choice is amended; its TypeScript-everywhere engine decision stands.
- Process-tree termination guarantees are reimplemented against Tauri/sidecar process semantics (Windows Job Objects/`taskkill /T /F`, Unix process groups), not Electron utilities.
- `docs/research/cline-core-adaptation.md`'s "frontend/electron/engine/agent/" paths map to the sidecar package instead.
