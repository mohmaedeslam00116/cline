# Persona Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an English-first, top-level Persona Studio that lets developers discover, duplicate, author, permission, save, and delete Specialist Personas through the existing Universal Agent Specification and hybrid storage seam.

**Architecture:** Register `studio` in the desktop navigation and render one controller view over the mounted chat shell. Keep draft conversion and validation in a pure model module, split the library, avatar calibration, capability matrix, and Markdown editor into focused components, and restrict side effects to the `PersonaStudioView` controller through existing `desktopClient` methods.

**Tech Stack:** TypeScript 5.7, React 19, Next.js 16, Tailwind CSS 4, Radix-based local UI primitives, Shiki 4, Vitest 4, Bun 1.3.13.

## Global Constraints

- Work in `apps/examples/desktop-app`, the LENS Workstation product surface.
- Use Bun 1.3.13 and Node.js 22 or newer; do not use npm, yarn, or pnpm.
- Keep built-in Specialist Personas immutable and expose duplication before editing.
- Default new and duplicated personas to `read_file` only.
- Force `toolPolicy: "require_approval"` when mutation, execution, or network capabilities are enabled.
- Treat all external content as untrusted and never let persona content elevate permissions.
- Reuse the issue #63 parser, schemas, sidecar storage commands, desktop-client methods, and eight SVG chassis.
- Follow the existing LENS theme tokens, aperture geometry, Inter/Geist Mono type roles, and operational status colors.
- Keep the current Arabic/RTL infrastructure intact, while the primary authoring workflow and persona content remain English-first.
- Preserve keyboard operation, semantic state, visible focus, reduced motion, responsive operation, and actionable failure states.
- Use the code-first Impeccable path and finish with responsive captures, detector output, a fresh finish reviewer, and design documentation.
- Add no Monaco dependency, raster avatar upload, squad preset builder, persona execution sandbox, remote sync, or fabricated product claims.

---

## File Structure

- `apps/examples/desktop-app/webview/lib/desktop-app-state.ts`: adds `studio` to the navigation domain.
- `apps/examples/desktop-app/webview/lib/desktop-app-state.test.ts`: proves Studio participates in navigation history.
- `apps/examples/desktop-app/webview/components/agent-sidebar.tsx`: exposes expanded and collapsed Persona Studio navigation.
- `apps/examples/desktop-app/webview/components/agent-sidebar.test.tsx`: proves the sidebar dispatches `studio` and marks it current.
- `apps/examples/desktop-app/webview/app/page.tsx`: mounts the Studio overlay and supplies the active workspace path.
- `apps/examples/desktop-app/webview/lib/lens-i18n.ts`: owns English and Arabic interface labels without local hard-coded copy.
- `apps/examples/desktop-app/webview/components/views/studio/persona-studio-model.ts`: owns draft types, adapters, tool risk policy, and validation.
- `apps/examples/desktop-app/webview/components/views/studio/persona-studio-model.test.ts`: verifies pure draft and least-privilege behavior.
- `apps/examples/desktop-app/webview/components/views/studio/persona-library-panel.tsx`: renders and filters built-in and custom entries.
- `apps/examples/desktop-app/webview/components/views/studio/avatar-builder.tsx`: controls chassis/accent choice and five-state SVG preview.
- `apps/examples/desktop-app/webview/components/views/studio/capability-matrix.tsx`: renders grouped tool switches and policy status.
- `apps/examples/desktop-app/webview/components/views/studio/markdown-prompt-editor.tsx`: provides the controlled Shiki-highlighted Markdown editor and lint feedback.
- `apps/examples/desktop-app/webview/components/views/studio/persona-editor.tsx`: composes metadata, avatar, capability, and prompt controls.
- `apps/examples/desktop-app/webview/components/views/studio/persona-studio-view.tsx`: owns loading, selection, duplication, saving, deletion, and user-visible status.
- `apps/examples/desktop-app/webview/components/views/studio/persona-studio-view.test.tsx`: verifies the public Studio interaction contract.
- `apps/examples/desktop-app/webview/components/views/studio/index.ts`: exports the top-level view.
- `CHANGELOG.md`: records the new product surface under Unreleased.

---

### Task 1: Register the top-level Studio navigation slice

**Files:**
- Modify: `apps/examples/desktop-app/webview/lib/desktop-app-state.ts`
- Modify: `apps/examples/desktop-app/webview/lib/desktop-app-state.test.ts`
- Modify: `apps/examples/desktop-app/webview/components/agent-sidebar.tsx`
- Modify: `apps/examples/desktop-app/webview/components/agent-sidebar.test.tsx`
- Modify: `apps/examples/desktop-app/webview/app/page.tsx`
- Modify: `apps/examples/desktop-app/webview/lib/lens-i18n.ts`
- Create: `apps/examples/desktop-app/webview/components/views/studio/persona-studio-view.tsx`
- Create: `apps/examples/desktop-app/webview/components/views/studio/index.ts`

**Interfaces:**
- Consumes: `DesktopAppView`, `AgentSidebar.setView`, `PageFrame`, `PageHeader`, `readWorkspaceSelectionFromWindow()`.
- Produces: `DesktopAppView` including `"studio"`; `PersonaStudioView({ workspaceRoot?: string })`.

- [ ] **Step 1: Write the failing reducer and sidebar tests**

Add a navigation-history assertion to `desktop-app-state.test.ts`:

```ts
it("keeps Persona Studio in desktop navigation history", () => {
	let state = createDesktopAppState("welcome", settingsSection);
	state = desktopAppReducer(state, {
		type: "navigate",
		destination: { ...state.navigation.current, view: "studio" },
	});

	expect(state.navigation.current.view).toBe("studio");
	state = desktopAppReducer(state, { type: "back" });
	expect(state.navigation.current.view).toBe("chat");
});
```

Extend the existing sidebar-actions test to expect and activate Persona Studio:

```ts
expect(rows.map((row) => row.textContent)).toEqual([
	"New",
	"Schedule",
	"Customize",
	"Persona Studio",
	"Evidence & Claims",
]);

await click(buttonWithText("Persona Studio", actionsNav as ParentNode));
expect(setView).toHaveBeenCalledWith("studio");
```

Add a collapsed-sidebar assertion for `[aria-label="Persona Studio"]` and `aria-current="page"` when `view="studio"`.

- [ ] **Step 2: Run the tests and verify red**

Run from `apps/examples/desktop-app`:

```powershell
bunx vitest run webview/lib/desktop-app-state.test.ts webview/components/agent-sidebar.test.tsx --config vitest.config.ts
```

Expected: FAIL because `studio` is not in `DesktopAppView` or the sidebar.

- [ ] **Step 3: Load the Impeccable craft floor before the first UI edit**

Read the complete file immediately before changing any production UI:

```powershell
Get-Content -Raw -LiteralPath '..\.agents\skills\impeccable\reference\craft-floor.md'
```

Apply it only to the changed Studio and navigation surfaces. Preserve the approved direction contract and avoid unrelated shell refactors.

- [ ] **Step 4: Implement the minimal navigable Studio surface**

Extend both view unions:

```ts
export type DesktopAppView =
	| "chat"
	| "sessions"
	| "settings"
	| "evidence"
	| "studio";
```

Add a `Bot`-icon sidebar row in expanded and collapsed modes. Both rows use `aria-current={view === "studio" ? "page" : undefined}`, call `setView("studio")`, and close the mobile sidebar.

Add the translation contract:

```ts
readonly personaStudio: {
	readonly navigationLabel: string;
	readonly navigationTooltip: string;
	readonly title: string;
	readonly description: string;
};
```

Populate English with `Persona Studio`, `Create and manage specialist personas`, and the page description `Calibrate identity, capabilities, and system prompts.` Populate the Arabic dictionary with equivalent interface labels so existing parity remains type-safe.

Create the first vertical view:

```tsx
export interface PersonaStudioViewProps {
	readonly workspaceRoot?: string;
}

export function PersonaStudioView({ workspaceRoot }: PersonaStudioViewProps) {
	const t = getLensTranslations().personaStudio;
	return (
		<PageFrame className="h-full" contentClassName="max-w-none">
			<PageHeader icon={Bot} title={t.title} description={t.description} />
			<p className="font-mono text-xs text-muted-foreground">
				{workspaceRoot || "Global personas only"}
			</p>
		</PageFrame>
	);
}
```

In `page.tsx`, import the view and derive a display/persistence workspace path:

```ts
const studioWorkspaceRoot =
	activeThread?.historySession?.workspaceRoot ||
	activeThread?.historySession?.cwd ||
	readWorkspaceSelectionFromWindow().lastWorkspace ||
	undefined;
```

Treat `studio` as an inert overlay state alongside settings/evidence and render:

```tsx
{view === "studio" ? (
	<div className="absolute inset-0 z-30 bg-background text-foreground">
		<PersonaStudioView workspaceRoot={studioWorkspaceRoot} />
	</div>
) : null}
```

- [ ] **Step 5: Run tests and typecheck**

```powershell
bunx vitest run webview/lib/desktop-app-state.test.ts webview/components/agent-sidebar.test.tsx --config vitest.config.ts
bun run typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Commit**

```powershell
git add -- apps/examples/desktop-app/webview/lib/desktop-app-state.ts apps/examples/desktop-app/webview/lib/desktop-app-state.test.ts apps/examples/desktop-app/webview/components/agent-sidebar.tsx apps/examples/desktop-app/webview/components/agent-sidebar.test.tsx apps/examples/desktop-app/webview/app/page.tsx apps/examples/desktop-app/webview/lib/lens-i18n.ts apps/examples/desktop-app/webview/components/views/studio
git commit -m "feat(personas): register persona studio navigation"
```

---

### Task 2: Load and filter the Persona Library

**Files:**
- Create: `apps/examples/desktop-app/webview/components/views/studio/persona-studio-model.ts`
- Create: `apps/examples/desktop-app/webview/components/views/studio/persona-studio-model.test.ts`
- Create: `apps/examples/desktop-app/webview/components/views/studio/persona-library-panel.tsx`
- Modify: `apps/examples/desktop-app/webview/components/views/studio/persona-studio-view.tsx`
- Create: `apps/examples/desktop-app/webview/components/views/studio/persona-studio-view.test.tsx`
- Modify: `apps/examples/desktop-app/webview/lib/lens-i18n.ts`

**Interfaces:**
- Consumes: `BUILTIN_PERSONAS`, `CustomPersonaRecord`, `desktopClient.listPersonas(workspaceRoot?)`.
- Produces: discriminated `PersonaLibraryEntry`, controlled `PersonaLibraryPanel`, loading/error/selection behavior in `PersonaStudioView`.

- [ ] **Step 1: Write the failing public UI test**

Create a JSDOM test that mocks only the transport-facing client method:

```tsx
vi.spyOn(desktopClient, "listPersonas").mockResolvedValue([
	{
		frontmatter: {
			id: "audit-bot",
			name: "Audit Bot",
			version: "1.0.0",
			description: "Reviews release risk",
			role: "Release Auditor",
			stage: "qa",
			avatar: { chassis: "sentinel", accentColor: "#10b981" },
			tools: ["read_file"],
			toolPolicy: "auto",
		},
		instructions: "# Audit Bot\nReview release evidence.",
		rawContent: "",
		scope: "workspace",
		filePath: "/workspace/.lens/personas/audit-bot.agent.md",
		isBuiltin: false,
	},
]);

await renderStudio();
expect(container.textContent).toContain("Orion");
expect(container.textContent).toContain("Audit Bot");
expect(container.textContent).toContain("Workspace");

await input(searchInput, "audit");
expect(container.textContent).not.toContain("Orion");
expect(container.textContent).toContain("Audit Bot");
```

- [ ] **Step 2: Run the focused test and verify red**

```powershell
bunx vitest run webview/components/views/studio/persona-studio-view.test.tsx --config vitest.config.ts
```

Expected: FAIL because the library does not exist.

- [ ] **Step 3: Add the library model and view**

Define one selection-safe entry type:

```ts
export type PersonaLibraryEntry =
	| {
			kind: "builtin";
			id: SpecialistPersonaId;
			name: string;
			role: string;
			chassis: AgentChassis;
			accentColor: string;
	  }
	| {
			kind: "custom";
			id: string;
			name: string;
			role: string;
			chassis: AgentChassis;
			accentColor: string;
			scope: "workspace" | "global";
			record: CustomPersonaRecord;
	  };
```

Export `buildPersonaLibrary(customPersonas)` and `filterPersonaLibrary(entries, query)` as pure functions. Preserve the stable built-in order `orion`, `lyra`, `athena`, `atlas`, `cipher`, `vector`, `sentinel`, `echo`, append custom records, and match query against ID, name, and role using `toLocaleLowerCase()`.

Render `PersonaLibraryPanel` as a labeled search input, New Persona button, semantic selectable list, SVG thumbnails, and Built-in/Workspace/Global badges. The selected entry uses `aria-current="true"` and visible border/focus tokens.

Update `PersonaStudioView` to:

```ts
const [customPersonas, setCustomPersonas] = useState<CustomPersonaRecord[]>([]);
const [selectedKey, setSelectedKey] = useState("builtin:orion");
const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

const reloadPersonas = useCallback(async () => {
	setLoadState("loading");
	try {
		setCustomPersonas(await desktopClient.listPersonas(workspaceRoot));
		setLoadState("ready");
	} catch (error) {
		setLoadError(error instanceof Error ? error.message : String(error));
		setLoadState("error");
	}
}, [workspaceRoot]);
```

Keep built-ins visible if custom loading fails, display a Retry action, and ensure stale async results cannot replace a newer workspace load by using a monotonically increasing request ref.

- [ ] **Step 4: Add pure library assertions**

In `persona-studio-model.test.ts`, independently assert eight built-ins, scope preservation, stable order, and search results with known literals.

- [ ] **Step 5: Run tests and typecheck**

```powershell
bunx vitest run webview/components/views/studio/persona-studio-model.test.ts webview/components/views/studio/persona-studio-view.test.tsx --config vitest.config.ts
bun run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- apps/examples/desktop-app/webview/components/views/studio apps/examples/desktop-app/webview/lib/lens-i18n.ts
git commit -m "feat(personas): add filterable persona library"
```

---

### Task 3: Duplicate templates and calibrate the animated avatar

**Files:**
- Modify: `apps/examples/desktop-app/webview/components/views/studio/persona-studio-model.ts`
- Modify: `apps/examples/desktop-app/webview/components/views/studio/persona-studio-model.test.ts`
- Create: `apps/examples/desktop-app/webview/components/views/studio/avatar-builder.tsx`
- Create: `apps/examples/desktop-app/webview/components/views/studio/persona-editor.tsx`
- Modify: `apps/examples/desktop-app/webview/components/views/studio/persona-studio-view.tsx`
- Modify: `apps/examples/desktop-app/webview/components/views/studio/persona-studio-view.test.tsx`
- Modify: `apps/examples/desktop-app/webview/lib/lens-i18n.ts`

**Interfaces:**
- Consumes: built-in library entry, `PersonaAvatar`, supported `AgentChassis` values, five `PersonaActivityState` values.
- Produces: `PersonaDraft`, `createBlankPersonaDraft()`, `duplicateBuiltinPersona(entry)`, `draftFromCustomPersona(record)`, controlled `AvatarBuilder`.

- [ ] **Step 1: Write the failing duplication and avatar test**

```tsx
await click(buttonWithText("Orion"));
expect(container.textContent).toContain("Built-in template");
expect(buttonWithText("Save persona").hasAttribute("disabled")).toBe(true);

await click(buttonWithText("Duplicate to customize"));
expect(inputByLabel("ID").value).toBe("orion-custom");
expect(inputByLabel("Name").value).toBe("Orion Custom");

await click(buttonWithText("Lyra chassis"));
await input(inputByLabel("Neon accent"), "#ff2bd6");

const previews = container.querySelectorAll(
	'[data-testid="persona-state-preview"] svg',
);
expect(previews).toHaveLength(5);
for (const preview of previews) {
	expect(preview.innerHTML).toContain("#ff2bd6");
}
```

- [ ] **Step 2: Run the test and verify red**

```powershell
bunx vitest run webview/components/views/studio/persona-studio-view.test.tsx --config vitest.config.ts
```

Expected: FAIL because duplication and avatar calibration are absent.

- [ ] **Step 3: Implement safe draft adapters**

Define the draft shape with input-friendly temperature text:

```ts
export interface PersonaDraft {
	id: string;
	name: string;
	version: string;
	description: string;
	role: string;
	stage: AgentStage;
	model: string;
	temperature: string;
	chassis: AgentChassis;
	accentColor: string;
	tools: string[];
	instructions: string;
	scope: "workspace" | "global";
}
```

Use the approved defaults:

```ts
export const BLANK_PERSONA_DRAFT: PersonaDraft = {
	id: "",
	name: "",
	version: "1.0.0",
	description: "",
	role: "",
	stage: "development",
	model: "",
	temperature: "",
	chassis: "orion",
	accentColor: "#22d3ee",
	tools: ["read_file"],
	instructions: "# Operational Guidelines\n\n",
	scope: "workspace",
};
```

Map built-in stages with an explicit exhaustive record, duplicate to `${id}-custom`, copy the real role/tagline/color/system prompt, and reset tools to `read_file`. Map Custom Persona fields without normalizing or dropping optional model/temperature data.

- [ ] **Step 4: Implement the calibration bay**

`AvatarBuilder` renders eight chassis buttons and five labeled state samples:

```tsx
const ACTIVITY_STATES: PersonaActivityState[] = [
	"idle",
	"thinking",
	"speaking",
	"working",
	"checkpoint",
];

{ACTIVITY_STATES.map((state) => (
	<figure data-testid="persona-state-preview" key={state}>
		<PersonaAvatar
			personaId={draft.chassis}
			accentColor={draft.accentColor}
			state={state}
			size={state === "working" ? 112 : 64}
			showStatusRing
		/>
		<figcaption>{state}</figcaption>
	</figure>
))}
```

Use the large working preview as the focal lens and arrange the remaining state samples on one quiet diagnostic rail. Use a color input plus a text input tied to the same value; invalid text remains editable but does not reach the SVG until it matches a strict hex pattern.

`PersonaEditor` renders a read-only built-in inspection state with Duplicate to customize, otherwise starts with the avatar builder and controlled metadata shell.

- [ ] **Step 5: Run model/UI tests and typecheck**

```powershell
bunx vitest run webview/components/views/studio/persona-studio-model.test.ts webview/components/views/studio/persona-studio-view.test.tsx --config vitest.config.ts
bun run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- apps/examples/desktop-app/webview/components/views/studio apps/examples/desktop-app/webview/lib/lens-i18n.ts
git commit -m "feat(personas): add avatar calibration and template duplication"
```

---

### Task 4: Author metadata, least-privilege capabilities, and Markdown prompts

**Files:**
- Modify: `apps/examples/desktop-app/webview/components/views/studio/persona-studio-model.ts`
- Modify: `apps/examples/desktop-app/webview/components/views/studio/persona-studio-model.test.ts`
- Create: `apps/examples/desktop-app/webview/components/views/studio/capability-matrix.tsx`
- Create: `apps/examples/desktop-app/webview/components/views/studio/markdown-prompt-editor.tsx`
- Modify: `apps/examples/desktop-app/webview/components/views/studio/persona-editor.tsx`
- Modify: `apps/examples/desktop-app/webview/components/views/studio/persona-studio-view.test.tsx`
- Modify: `apps/examples/desktop-app/webview/lib/lens-i18n.ts`

**Interfaces:**
- Consumes: `AgentFrontmatterSchema`, local Input/Select/Switch/Textarea primitives, Shiki `codeToHtml`.
- Produces: `PERSONA_CAPABILITIES`, `toolPolicyForTools`, `lintPersonaPrompt`, `validatePersonaDraft`, `toAgentFrontmatter`, controlled capability and prompt editors.

- [ ] **Step 1: Write failing least-privilege and prompt tests**

Pure contract:

```ts
expect(toolPolicyForTools(["read_file"])).toBe("auto");
expect(toolPolicyForTools(["read_file", "edit_file"])).toBe(
	"require_approval",
);
expect(toolPolicyForTools(["browser"])).toBe("require_approval");
expect(lintPersonaPrompt("").some((item) => item.severity === "error")).toBe(
	true,
);
expect(
	lintPersonaPrompt("# Operational Guidelines\n\n- Verify evidence first."),
).toEqual([]);
```

Public UI contract:

```tsx
await click(buttonByLabel("Allow edit_file"));
expect(container.textContent).toContain("Human approval required");
expect(buttonByLabel("Allow edit_file").getAttribute("data-state")).toBe(
	"checked",
);

await input(textareaByLabel("System prompt"), "# Release Auditor\n\n- Verify evidence.");
await vi.waitFor(() => {
	expect(container.querySelector('[data-highlight-ready="true"]')).not.toBeNull();
});
```

- [ ] **Step 2: Run tests and verify red**

```powershell
bunx vitest run webview/components/views/studio/persona-studio-model.test.ts webview/components/views/studio/persona-studio-view.test.tsx --config vitest.config.ts
```

Expected: FAIL because capability policy, metadata validation, and prompt editing are absent.

- [ ] **Step 3: Implement the capability policy**

Define stable product capabilities and risk groups:

```ts
export const PERSONA_CAPABILITIES = [
	{ id: "read_file", group: "read", risk: "read_only" },
	{ id: "list_files", group: "read", risk: "read_only" },
	{ id: "search_files", group: "read", risk: "read_only" },
	{ id: "edit_file", group: "write", risk: "approval" },
	{ id: "write_file", group: "write", risk: "approval" },
	{ id: "run_command", group: "execute", risk: "approval" },
	{ id: "browser", group: "network", risk: "approval" },
	{ id: "mcp", group: "network", risk: "approval" },
] as const;

const APPROVAL_CAPABILITIES: ReadonlySet<string> = new Set(
	PERSONA_CAPABILITIES
		.filter((capability) => capability.risk === "approval")
		.map((capability) => capability.id),
);

export function toolPolicyForTools(tools: readonly string[]) {
	return tools.some((tool) => APPROVAL_CAPABILITIES.has(tool))
		? "require_approval"
		: "auto";
}
```

The matrix renders a Switch for every capability, never changes a different tool implicitly, and displays the computed policy. Unknown tools loaded from disk remain visible under an Additional group and are preserved unless explicitly disabled.

- [ ] **Step 4: Implement schema-backed metadata and prompt validation**

Convert UI values only at the validation boundary:

```ts
export function toAgentFrontmatter(draft: PersonaDraft): AgentFrontmatter {
	return AgentFrontmatterSchema.parse({
		id: draft.id.trim(),
		name: draft.name.trim(),
		version: draft.version.trim(),
		description: draft.description.trim(),
		role: draft.role.trim(),
		stage: draft.stage,
		avatar: { chassis: draft.chassis, accentColor: draft.accentColor.trim() },
		tools: [...draft.tools],
		toolPolicy: toolPolicyForTools(draft.tools),
		model: draft.model.trim() || undefined,
		temperature:
			draft.temperature.trim() === ""
				? undefined
				: Number(draft.temperature),
	});
}
```

`validatePersonaDraft` uses `safeParse`, maps issue paths to field messages, and combines prompt lint errors. Prompt lint rules are deterministic: content is required, the first non-empty line must be a Markdown heading, and a heading with no following guideline text is an error.

Render all accepted metadata fields: `id`, `name`, `version`, `description`, `role`, `stage`, `model`, and `temperature`. Use `type="number"`, `min="0"`, `max="2"`, and `step="0.1"` for temperature while retaining string draft state.

- [ ] **Step 5: Implement live Shiki highlighting without an editor dependency**

`MarkdownPromptEditor` uses a textarea as the only editable/accessibility surface and an `aria-hidden` synchronized highlight layer:

```tsx
useEffect(() => {
	let active = true;
	void codeToHtml(value || " ", {
		lang: "markdown",
		theme: "github-dark-default",
	}).then((html) => {
		if (active) setHighlightedHtml(html);
	});
	return () => {
		active = false;
	};
}, [value]);
```

Shiki escapes source content before returning HTML. Mark the overlay `aria-hidden="true"`, keep the textarea label and caret visible, synchronize scroll positions, preserve user selection, and show lint messages in an `aria-live="polite"` region.

- [ ] **Step 6: Run tests and typecheck**

```powershell
bunx vitest run webview/components/views/studio/persona-studio-model.test.ts webview/components/views/studio/persona-studio-view.test.tsx --config vitest.config.ts
bun run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add -- apps/examples/desktop-app/webview/components/views/studio apps/examples/desktop-app/webview/lib/lens-i18n.ts
git commit -m "feat(personas): add least-privilege persona editor"
```

---

### Task 5: Save workspace and global Persona Specifications

**Files:**
- Modify: `apps/examples/desktop-app/webview/components/views/studio/persona-studio-view.tsx`
- Modify: `apps/examples/desktop-app/webview/components/views/studio/persona-editor.tsx`
- Modify: `apps/examples/desktop-app/webview/components/views/studio/persona-studio-view.test.tsx`
- Modify: `apps/examples/desktop-app/webview/lib/lens-i18n.ts`

**Interfaces:**
- Consumes: `toAgentFrontmatter`, `validatePersonaDraft`, `desktopClient.savePersona(frontmatter, instructions, scope, workspaceRoot?)`.
- Produces: explicit workspace/global scope control, pending/status state, reload-and-reselect behavior.

- [ ] **Step 1: Write the failing save lifecycle test**

```tsx
const savePersona = vi
	.spyOn(desktopClient, "savePersona")
	.mockResolvedValue({
		success: true,
		filePath: "/home/dev/.lens/personas/audit-bot.agent.md",
	});

await selectCustomPersona("Audit Bot");
await input(inputByLabel("Name"), "Audit Bot v2");
await select(inputByLabel("Save destination"), "global");
await click(buttonWithText("Save persona"));

await vi.waitFor(() => {
	expect(savePersona).toHaveBeenCalledWith(
		expect.objectContaining({
			id: "audit-bot",
			name: "Audit Bot v2",
			tools: ["read_file"],
			toolPolicy: "auto",
		}),
		"# Audit Bot\nReview release evidence.",
		"global",
		"/workspace",
	);
});
expect(container.textContent).toContain("Saved to Global");
```

Add two failure assertions: invalid metadata prevents a client call and focuses the first invalid field; rejected persistence leaves the edited name/prompt in place and shows `Unable to save persona`.

- [ ] **Step 2: Run the focused test and verify red**

```powershell
bunx vitest run webview/components/views/studio/persona-studio-view.test.tsx --config vitest.config.ts
```

Expected: FAIL because save is not wired.

- [ ] **Step 3: Implement the save command strip**

Keep scope in the draft and require the developer to see it beside Save. Disable workspace scope with an explanation when `workspaceRoot` is absent, but leave global available.

Implement one pending-safe handler:

```ts
const handleSave = async () => {
	if (!draft || pendingAction) return;
	const validation = validatePersonaDraft(draft);
	if (!validation.success) {
		setValidationErrors(validation.errors);
		focusFirstInvalidField(validation.errors);
		return;
	}
	setPendingAction("save");
	setOperationError(null);
	try {
		const result = await desktopClient.savePersona(
			validation.frontmatter,
			draft.instructions,
			draft.scope,
			workspaceRoot,
		);
		await reloadPersonas(`custom:${draft.scope}:${draft.id}`);
		setOperationNotice(`Saved to ${draft.scope === "workspace" ? "Workspace" : "Global"}: ${result.filePath}`);
	} catch (error) {
		setOperationError(error instanceof Error ? error.message : String(error));
	} finally {
		setPendingAction(null);
	}
};
```

Changing the ID of an existing Custom Persona is explicitly labeled `Save as a new persona`; it never silently deletes the original file.

- [ ] **Step 4: Run tests and typecheck**

```powershell
bunx vitest run webview/components/views/studio/persona-studio-view.test.tsx --config vitest.config.ts
bun run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- apps/examples/desktop-app/webview/components/views/studio apps/examples/desktop-app/webview/lib/lens-i18n.ts
git commit -m "feat(personas): save persona specifications by scope"
```

---

### Task 6: Delete Custom Personas safely

**Files:**
- Modify: `apps/examples/desktop-app/webview/components/views/studio/persona-studio-view.tsx`
- Modify: `apps/examples/desktop-app/webview/components/views/studio/persona-editor.tsx`
- Modify: `apps/examples/desktop-app/webview/components/views/studio/persona-studio-view.test.tsx`
- Modify: `apps/examples/desktop-app/webview/lib/lens-i18n.ts`

**Interfaces:**
- Consumes: selected Custom Persona record, local AlertDialog primitive, `desktopClient.deletePersona(id, scope, workspaceRoot?)`.
- Produces: built-in-safe delete visibility, exact-scope confirmation, pending/error/selection recovery.

- [ ] **Step 1: Write failing delete behavior tests**

```tsx
await selectBuiltinPersona("Orion");
expect(container.querySelector('[aria-label="Delete persona"]')).toBeNull();

await selectCustomPersona("Audit Bot");
await click(buttonByLabel("Delete persona"));
expect(container.textContent).toContain(
	"Delete Audit Bot from Workspace?",
);
expect(deletePersona).not.toHaveBeenCalled();

await click(buttonWithText("Delete persona", dialog));
await vi.waitFor(() => {
	expect(deletePersona).toHaveBeenCalledWith(
		"audit-bot",
		"workspace",
		"/workspace",
	);
});
```

Add rejection coverage proving the record remains selected and the dialog closes into a visible `Unable to delete persona` error.

- [ ] **Step 2: Run the test and verify red**

```powershell
bunx vitest run webview/components/views/studio/persona-studio-view.test.tsx --config vitest.config.ts
```

Expected: FAIL because delete confirmation is absent.

- [ ] **Step 3: Implement confirmed exact-scope deletion**

Only render the delete action when the selected entry has `kind: "custom"`. Capture its immutable ID/scope in dialog state before the request, disable both actions while pending, invoke the exact scope, reload the library after success, and select the first remaining custom entry or Orion when the deleted key disappears.

```ts
await desktopClient.deletePersona(
	pendingDelete.record.frontmatter.id,
	pendingDelete.record.scope,
	workspaceRoot,
);
await reloadPersonas();
setSelectedKey("builtin:orion");
setOperationNotice(`Deleted ${pendingDelete.record.frontmatter.name}`);
```

- [ ] **Step 4: Run tests and typecheck**

```powershell
bunx vitest run webview/components/views/studio/persona-studio-view.test.tsx --config vitest.config.ts
bun run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- apps/examples/desktop-app/webview/components/views/studio apps/examples/desktop-app/webview/lib/lens-i18n.ts
git commit -m "feat(personas): confirm custom persona deletion"
```

---

### Task 7: Finish the LENS surface and verify the complete ticket

**Files:**
- Modify: `apps/examples/desktop-app/webview/components/views/studio/*.tsx`
- Modify: `apps/examples/desktop-app/webview/app/globals.css` only if reduced-motion or synchronized-editor styling cannot remain local
- Modify: `CHANGELOG.md`
- Verify: `apps/examples/.impeccable/surfaces/ents-views-studio-persona-studio-view-tsx-256006d9.md`
- Create at finish: `.impeccable/review/desktop.png`
- Create at finish: `.impeccable/review/mobile.png`
- Create or update at finish: `DESIGN.md`
- Create or update at finish: `.impeccable/design.json`

**Interfaces:**
- Consumes: all prior public behavior, Impeccable direction contract, project theme tokens, desktop dev commands.
- Produces: responsive, reviewed, documented Persona Studio with a clean test/type/build result.

- [ ] **Step 1: Apply the previously loaded Impeccable craft floor during final polish**

Audit only the changed Studio and navigation surfaces against the craft floor loaded immediately before the first production UI edit. Preserve the approved direction contract and avoid unrelated shell refactors.

- [ ] **Step 2: Add the changelog entry**

Under `CHANGELOG.md` → `[Unreleased]` → `Added`, add:

```markdown
- **Persona Studio & Cyberpunk Avatar Customizer**: Added a dedicated desktop Persona Studio for discovering built-in and custom Specialist Personas, duplicating immutable templates, calibrating all eight vector chassis across five operational states, editing Universal Agent Specification metadata and Markdown prompts, enforcing least-privilege tool policies, and safely saving or deleting workspace/global `.agent.md` files.
```

- [ ] **Step 3: Run formatting checks, focused tests, and typecheck**

From the repository root:

```powershell
bun biome check --diagnostic-level=error apps/examples/desktop-app/webview/app/page.tsx apps/examples/desktop-app/webview/lib/desktop-app-state.ts apps/examples/desktop-app/webview/lib/lens-i18n.ts apps/examples/desktop-app/webview/components/agent-sidebar.tsx apps/examples/desktop-app/webview/components/views/studio
```

From `apps/examples/desktop-app`:

```powershell
bunx vitest run webview/lib/desktop-app-state.test.ts webview/components/agent-sidebar.test.tsx webview/components/views/studio/persona-studio-model.test.ts webview/components/views/studio/persona-studio-view.test.tsx --config vitest.config.ts
bun run typecheck
```

Expected: all focused tests PASS and typecheck exits 0.

- [ ] **Step 4: Run the desktop app’s full test suite once**

From `apps/examples/desktop-app`:

```powershell
bunx vitest run --config vitest.config.ts
```

Expected: the complete desktop app Vitest suite PASS. Record any pre-existing unrelated failure separately and do not mask it.

- [ ] **Step 5: Verify the production web build**

```powershell
bun run build:web
```

Expected: Next.js production build completes successfully.

- [ ] **Step 6: Inspect desktop and mobile render in one bounded pass**

Start `bun run dev:sidecar` and `bun run dev:web` in separate hidden terminal sessions. Open `http://localhost:3125`, enter Persona Studio through its real sidebar control, and capture validated screenshots at 1440px and 390px widths to:

```text
.impeccable/review/desktop.png
.impeccable/review/mobile.png
```

Confirm each file shows the intended view, loaded avatar SVGs, library/editor content, no clipping, no half-loaded state, and keyboard-visible controls. Fix all material findings in one batch, then perform at most one confirmation capture round.

- [ ] **Step 7: Run the Impeccable detector once**

```powershell
..\.agents\skills\impeccable\scripts\impeccable.cmd detect --json apps/examples/desktop-app/webview/components/views/studio apps/examples/desktop-app/webview/components/agent-sidebar.tsx apps/examples/desktop-app/webview/app/page.tsx
```

Fix mechanical findings in one batch and retain any reasoned exceptions for the finish-review packet. Do not run the detector a second time.

- [ ] **Step 8: Spawn the fresh Impeccable finish reviewer**

Spawn `impeccable-finish-reviewer` with no forked conversation history and pass:

```text
Original request: implement issue #66 using the approved Persona Studio design and LENS identity.
Confirmed decisions: built-ins are immutable templates; English-first workflow; code-first path.
Artifact: apps/examples/desktop-app/webview/components/views/studio/persona-studio-view.tsx
Required screenshots: .impeccable/review/desktop.png, .impeccable/review/mobile.png
Direction contract: apps/examples/.impeccable/surfaces/ents-views-studio-persona-studio-view-tsx-256006d9.md
Approved comp: none (code-first)
Detector findings: exact JSON output from Step 7
Craft floor: D:/ai/New folder (3)/.agents/skills/impeccable/reference/craft-floor.md
```

Act on the disposition exactly: recapture invalid evidence, rebuild wholesale when directed, or fix all material findings in one batch and return the new captures for a verdict pass. Stop when the reviewer returns `ship` or the user decides after the allowed correction rounds.

- [ ] **Step 9: Run the Impeccable documenter**

Spawn `impeccable-documenter` with no forked history and pass the project root, finished artifact, direction contract, `apps/examples/PRODUCT.md`, and `reference/document.md`. Verify that the established LENS world is documented without replacing unrelated identity, and that any required `DESIGN.md` and `.impeccable/design.json` outputs are valid.

- [ ] **Step 10: Run the required CodeRabbit review workflow**

Load `.agents/skills/code-review/SKILL.md` completely, run its review command while excluding `.agents/**` and `skills-lock.json`, address correctness/security findings in scope, and rerun affected focused tests after each fix batch.

- [ ] **Step 11: Commit the finished ticket**

```powershell
git add -- CHANGELOG.md apps/examples/desktop-app/webview apps/examples/PRODUCT.md apps/examples/.impeccable .impeccable docs/superpowers
git commit -m "feat(personas): add persona studio authoring surface"
git status --short --branch
```

Expected: commit succeeds and the working tree is clean. Do not push, open a pull request, publish a release, or merge unless the user separately requests it.
