import type { CustomPersonaRecord } from "@cline/shared/browser";
import { describe, expect, it } from "vitest";
import {
	buildPersonaLibrary,
	filterPersonaLibrary,
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

		expect(filterPersonaLibrary(entries, "audit").map((entry) => entry.id)).toEqual([
			"audit-bot",
		]);
		expect(filterPersonaLibrary(entries, "architect").map((entry) => entry.id)).toEqual([
			"atlas",
			"vector",
		]);
	});
});
