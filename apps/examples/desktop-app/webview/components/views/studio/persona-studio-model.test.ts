import type { CustomPersonaRecord } from "@cline/shared/browser";
import { describe, expect, it } from "vitest";
import {
	buildPersonaLibrary,
	createBlankPersonaDraft,
	draftFromCustomPersona,
	duplicateBuiltinPersona,
	filterPersonaLibrary,
	lintPersonaPrompt,
	toolPolicyForTools,
	validatePersonaDraft,
} from "./persona-studio-model";

const workspacePersona: CustomPersonaRecord = {
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
	instructions: "# Audit Bot\n\nReview release evidence.",
	rawContent: "",
	scope: "workspace",
	filePath: "/workspace/.lens/personas/audit-bot.agent.md",
	isBuiltin: false,
};

describe("Persona Studio library model", () => {
	it("keeps the eight built-ins in their stable operational order", () => {
		const entries = buildPersonaLibrary([]);

		expect(entries).toHaveLength(8);
		expect(entries.map((entry) => entry.id)).toEqual([
			"orion",
			"lyra",
			"athena",
			"atlas",
			"cipher",
			"vector",
			"sentinel",
			"echo",
		]);
		expect(entries.every((entry) => entry.kind === "builtin")).toBe(true);
	});

	it("appends custom records without losing their persistence scope", () => {
		const entries = buildPersonaLibrary([workspacePersona]);
		const custom = entries.at(-1);

		expect(custom).toMatchObject({
			kind: "custom",
			id: "audit-bot",
			scope: "workspace",
		});
	});

	it("filters by persona id, name, or role without changing order", () => {
		const entries = buildPersonaLibrary([workspacePersona]);

		expect(
			filterPersonaLibrary(entries, "audit").map((entry) => entry.id),
		).toEqual(["audit-bot"]);
		expect(
			filterPersonaLibrary(entries, "architect").map((entry) => entry.id),
		).toEqual(["atlas", "vector"]);
	});

	it("creates new and duplicated drafts with read-only capability", () => {
		const blank = createBlankPersonaDraft();
		const orion = buildPersonaLibrary([])[0];

		expect(blank).toMatchObject({
			stage: "development",
			chassis: "orion",
			tools: ["read_file"],
			scope: "workspace",
		});
		expect(orion?.kind).toBe("builtin");
		if (!orion || orion.kind !== "builtin") return;
		expect(duplicateBuiltinPersona(orion)).toMatchObject({
			id: "orion-custom",
			name: "Orion Custom",
			role: "Lead Orchestrator",
			tools: ["read_file"],
		});
	});

	it("maps a custom record without dropping optional values", () => {
		const draft = draftFromCustomPersona({
			...workspacePersona,
			frontmatter: {
				...workspacePersona.frontmatter,
				model: "anthropic/claude-sonnet",
				temperature: 0.4,
			},
		});

		expect(draft.model).toBe("anthropic/claude-sonnet");
		expect(draft.temperature).toBe("0.4");
		expect(draft.instructions).toBe(workspacePersona.instructions);
	});

	it("requires approval for every mutation, execution, or network capability", () => {
		expect(toolPolicyForTools(["read_file"])).toBe("auto");
		expect(toolPolicyForTools(["read_file", "edit_file"])).toBe(
			"require_approval",
		);
		expect(toolPolicyForTools(["browser"])).toBe("require_approval");
	});

	it("lints Markdown prompts deterministically", () => {
		expect(
			lintPersonaPrompt("").some((item) => item.severity === "error"),
		).toBe(true);
		expect(
			lintPersonaPrompt("# Operational Guidelines\n\n- Verify evidence first."),
		).toEqual([]);
	});

	it("validates metadata through the Universal Agent Specification", () => {
		const invalid = createBlankPersonaDraft();
		expect(validatePersonaDraft(invalid).success).toBe(false);

		const valid = {
			...invalid,
			id: "release-auditor",
			name: "Release Auditor",
			description: "Checks release evidence",
			role: "QA specialist",
			instructions: "# Release Auditor\n\nVerify evidence before approval.",
		};
		const result = validatePersonaDraft(valid);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.frontmatter).toMatchObject({
			id: "release-auditor",
			toolPolicy: "auto",
			tools: ["read_file"],
		});
	});
});
