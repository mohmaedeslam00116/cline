# Persona Studio Webview Surface Design

**Issue:** #66  
**Status:** Approved  
**Parent specification:** `docs/specs/0001-custom-persona-studio-and-team-memory.md`  
**Architecture reference:** `docs/adr/0006-custom-persona-studio-and-team-memory.md`

## Objective

Add a dedicated Persona Studio desktop view where developers can discover built-in and custom Specialist Personas, duplicate built-in personas into editable Custom Personas, configure their identity and least-privilege capabilities, preview their animated cyberpunk avatar, edit their Markdown system prompt, and persist or delete `.agent.md` files through the existing sidecar APIs.

## Scope

The work covers the `@cline/code` desktop webview surface and its existing `desktopClient` persona operations. It does not change the Universal Agent Specification parser or hybrid storage rules delivered by issue #63, and it does not add squad preset authoring, sandbox persona execution, cloud synchronization, or bitmap avatar uploads.

## Product Decisions

- `studio` is a top-level desktop view alongside `chat`, `sessions`, `settings`, and `evidence`.
- Built-in Specialist Personas are immutable templates. A developer must duplicate one before editing or saving it.
- Workspace and global Custom Personas are directly editable. Only Custom Personas can be deleted.
- A new or duplicated persona starts with `read_file` as its only enabled tool.
- Enabling a mutating or execution capability such as `edit_file` or `run_command` changes `toolPolicy` to `require_approval`. Read-only configurations may use `auto`.
- Saving always requires an explicit destination scope: workspace or global.
- The existing `desktopClient.listPersonas`, `readPersona`, `savePersona`, and `deletePersona` methods remain the persistence boundary.
- Markdown highlighting uses the Shiki packages already shipped by the desktop app; no Monaco or new editor dependency is introduced.

## Architecture

### Navigation and shell

Extend `DesktopAppView` and the sidebar view type with `studio`. Add expanded and collapsed sidebar controls with an active state and render `PersonaStudioView` as the same kind of full-surface overlay used by settings and evidence. The underlying chat surface remains mounted but inert while the Studio is active, preserving the desktop navigation-history behavior.

### Studio view

`PersonaStudioView` owns loading, selection, draft, dirty, save, and delete state while delegating focused rendering and interaction responsibilities:

- `PersonaLibraryPanel` combines the eight `BUILTIN_PERSONAS` records with `desktopClient.listPersonas()` results, supports case-insensitive search, shows built-in/workspace/global badges, and starts a blank draft.
- `PersonaEditor` composes metadata, avatar, capability, and prompt sections around a single controlled `PersonaDraft` value.
- `AvatarBuilder` selects one of the eight supported chassis and a valid neon hex accent, and renders `PersonaAvatar` in each of the five operational states.
- `CapabilityMatrix` presents known tools as accessible switches grouped by read-only, mutation, execution, and network impact. It computes the safe `toolPolicy` rather than trusting external content to elevate permissions.
- `MarkdownPromptEditor` provides a controlled multiline editing surface, a synchronized Shiki-highlighted layer, prompt lint results, visible keyboard focus, and reduced-motion-safe behavior.
- `DeletePersonaDialog` uses the existing alert-dialog primitive and requires confirmation before calling the sidecar.

The draft adapter converts built-in records and `CustomPersonaRecord` values into one UI shape, then produces an `AgentFrontmatter` plus Markdown instructions only at the save boundary. This keeps storage types authoritative while avoiding persistence concerns inside presentation components.

## Data Flow

1. Opening Studio loads custom persona records from the sidecar and combines them with local built-in definitions.
2. Selecting a custom persona creates an editable draft. Selecting a built-in persona creates a read-only preview with a **Duplicate to customize** action.
3. Form, avatar, capability, and prompt edits update the controlled draft and run synchronous field/prompt linting.
4. Save validates the full draft, calls `desktopClient.savePersona` with the selected scope and active workspace path, reloads the custom library, and selects the saved record.
5. Delete confirmation calls `desktopClient.deletePersona` with the record's exact scope, reloads the library, and selects the next available entry or the blank state.
6. Transport or validation failures leave the draft intact and show a specific actionable error.

## Visual Direction

The Studio should feel like an agent calibration bench inside LENS Workstation, not a generic settings form. It extends the incumbent product identity rather than creating a separate cyberpunk theme.

- **Palette:** existing semantic background, card, border, foreground, muted, primary, ring, destructive, and sidebar tokens remain authoritative so the Studio follows the user's selected accent. Established cyan/violet activity, amber checkpoint, emerald success, and rose failure colors are reserved for operational meaning.
- **Identity:** reuse the LENS aperture/viewfinder geometry, quiet instrument-panel surfaces, thin diagnostic rules, and precise status language already present in the shell and Agency War Room.
- **Typography:** existing Inter Variable for interface copy and Geist Mono Variable for identifiers, tool names, versions, state labels, and prompt content.
- **Layout:** a compact library rail at the left and a scrollable editor at the right, collapsing into a vertical flow at narrow widths.
- **Signature element:** a holographic calibration bay that previews the chosen chassis simultaneously across `idle`, `thinking`, `speaking`, `working`, and `checkpoint`. Motion communicates operational state and respects `prefers-reduced-motion`.
- **Restraint:** the calibration bay receives the concentrated glow and motion treatment; forms and library rows remain quiet, high-contrast, and consistent with existing desktop primitives. Decorative gradients, glass panels, and unrelated neon ornaments are excluded.
- **Execution path:** code-first. The direction contract, responsive captures, Impeccable detector, and finish review are the visual quality gates; no generated comp is required.

## Validation and Error Handling

- Required metadata fields surface inline errors and block save.
- `id` follows the Universal Agent Specification schema and is not hand-normalized into a different identifier.
- Accent colors must be valid hex colors before reaching `PersonaAvatar` or persistence.
- Temperature remains within the schema-supported range.
- Empty system prompts and malformed heading structure produce live lint messages; errors block save while non-fatal guidance remains advisory.
- A workspace save is disabled when no workspace is active, while global save remains available.
- Built-in entries never expose delete or direct-save actions.
- Save and delete controls prevent duplicate requests while their operation is pending.
- Error messages identify whether loading, validation, saving, or deletion failed and preserve the current draft.

## Accessibility and Localization

- Search, chassis options, state previews, scope selection, switches, dialogs, and editor controls have programmatic names and keyboard operation.
- Selection uses semantic listbox/option or equivalent button state attributes, never color alone.
- Focus remains visible against the dark panel palette.
- Animation is reduced or removed under `prefers-reduced-motion`.
- The Studio's primary authored content and operating workflow are English. New interface strings continue through the existing LENS translation source, and existing Arabic/RTL support is preserved to maintain repository-level parity.
- Responsive behavior preserves access to both the library and save actions without horizontal page scrolling.

## Test Seams

Tests exercise only public behavior agreed by issue #66:

1. Desktop navigation exposes Persona Studio and renders the top-level view.
2. The library renders built-in and custom entries, filters by user-entered search text, and distinguishes workspace/global scope.
3. Avatar chassis and accent changes update the rendered preview across all five operational states.
4. Capability switches update the selected tool set and enforce `require_approval` for mutating or execution tools.
5. Save sends a valid `AgentFrontmatter`, Markdown instructions, and selected scope through the public desktop client.
6. Delete is unavailable for built-ins, requires confirmation for Custom Personas, and calls the public desktop client with the exact ID and scope.
7. Failed persistence preserves the draft and presents an actionable message.

Tests use Vitest and React DOM interaction at the component boundary. They mock only the desktop transport seam and do not inspect private component state or implementation-specific child calls.

## Acceptance Mapping

- Top-level navigation: Navigation and shell.
- Filterable built-in/custom gallery and new action: Persona Library Panel.
- Eight chassis, neon color, and five states: Avatar Builder and calibration bay.
- Metadata editing: Persona Editor.
- Least-privilege tool toggles: Capability Matrix.
- Highlighted/linted Markdown editing: Markdown Prompt Editor.
- Workspace/global `.agent.md` saving: existing desktop-client persistence boundary.
- Confirmed Custom Persona deletion: Delete Persona Dialog.
- Required UI coverage: Test Seams.
