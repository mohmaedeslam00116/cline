import { describe, expect, it } from "vitest";
import {
	buildUltraAgencyPrompt,
	getAllPersonas,
	getDefaultSquadConfig,
	getPersona,
	getSquadPresets,
	type SpecialistPersonaId,
} from "./personas";

describe("BUILTIN_PERSONAS", () => {
	it("registers all 8 core specialist personas with non-empty attributes", () => {
		const personas = getAllPersonas();
		expect(personas).toHaveLength(8);

		const expectedIds: SpecialistPersonaId[] = [
			"orion",
			"lyra",
			"athena",
			"atlas",
			"cipher",
			"vector",
			"sentinel",
			"echo",
		];
		for (const id of expectedIds) {
			const p = getPersona(id);
			expect(p).toBeDefined();
			expect(p.id).toBe(id);
			expect(p.name.length).toBeGreaterThan(0);
			expect(p.role.length).toBeGreaterThan(0);
			expect(p.responsibilities.length).toBeGreaterThan(0);
			expect(p.deliverableFile.length).toBeGreaterThan(0);
			expect(p.color.startsWith("#")).toBe(true);
		}
	});

	it("preserves distinct color codes and roles across all personas", () => {
		const personas = getAllPersonas();
		const colors = new Set(personas.map((p) => p.color));
		const roles = new Set(personas.map((p) => p.role));
		expect(colors.size).toBe(8);
		expect(roles.size).toBe(8);
	});
});

describe("SQUAD_PRESETS", () => {
	it("defines 3 curated presets: core, full, and rapid", () => {
		const presets = getSquadPresets();
		expect(presets).toHaveLength(3);
		expect(presets.map((p) => p.id)).toEqual(["core", "full", "rapid"]);
	});

	it("defaults squad config to Core Software Squad with checkpoint gates enabled", () => {
		const defaultConfig = getDefaultSquadConfig();
		expect(defaultConfig.presetId).toBe("core");
		expect(defaultConfig.checkpointGatesEnabled).toBe(true);
		expect(defaultConfig.activePersonaIds).toEqual([
			"orion",
			"athena",
			"atlas",
			"cipher",
			"sentinel",
		]);
	});
});

describe("buildUltraAgencyPrompt", () => {
	it("synthesizes squad manifest and 2 Golden Checkpoints for default config", () => {
		const prompt = buildUltraAgencyPrompt();
		expect(prompt).toContain(
			"ULTRA MODE: MULTI-AGENT SOFTWARE ENGINEERING AGENCY",
		);
		expect(prompt).toContain("Orion");
		expect(prompt).toContain("Athena");
		expect(prompt).toContain("Atlas");
		expect(prompt).toContain("Cipher");
		expect(prompt).toContain("Sentinel");
		expect(prompt).toContain(
			"CHECKPOINT 1: STRATEGY & BLUEPRINT AWAITING APPROVAL",
		);
		expect(prompt).toContain(
			"CHECKPOINT 2: PRE-SHIP VERIFICATION AWAITING APPROVAL",
		);
		expect(prompt).toContain(".lens/ultra/");
		expect(prompt).not.toContain("workspace_code`");
		expect(prompt).toContain(
			"Cipher implements production code directly into target workspace source files",
		);
	});

	it("omits checkpoint gates when disabled in config", () => {
		const prompt = buildUltraAgencyPrompt({
			presetId: "rapid",
			activePersonaIds: ["orion", "atlas", "cipher", "sentinel"],
			checkpointGatesEnabled: false,
		});
		expect(prompt).toContain("Fully autonomous execution enabled");
		expect(prompt).not.toContain(
			"CHECKPOINT 1: STRATEGY & BLUEPRINT AWAITING APPROVAL",
		);
		expect(prompt).not.toContain(
			"CHECKPOINT 2: PRE-SHIP VERIFICATION AWAITING APPROVAL",
		);
	});

	it("dynamically tailors steps and checkpoints to active personas only", () => {
		// Custom squad without Athena (only Atlas for architecture) and without Sentinel
		const prompt = buildUltraAgencyPrompt({
			presetId: "custom",
			activePersonaIds: ["orion", "atlas", "cipher"],
			checkpointGatesEnabled: true,
		});

		// Should not refer to Athena or Sentinel
		expect(prompt).not.toContain("Athena");
		expect(prompt).not.toContain("Sentinel");
		expect(prompt).toContain(
			"After Atlas complete deliverables and reach team alignment",
		);
		expect(prompt).toContain(
			"After Cipher complete implementation and verification",
		);
		// Checkpoint 1 and Checkpoint 2 are both present because Atlas (planning) and Cipher (implementation) are active
		expect(prompt).toContain(
			"CHECKPOINT 1: STRATEGY & BLUEPRINT AWAITING APPROVAL",
		);
		expect(prompt).toContain(
			"CHECKPOINT 2: PRE-SHIP VERIFICATION AWAITING APPROVAL",
		);
	});

	it("excludes checkpoint 1 if no planning personas are active", () => {
		const prompt = buildUltraAgencyPrompt({
			presetId: "custom",
			activePersonaIds: ["orion", "cipher", "sentinel"],
			checkpointGatesEnabled: true,
		});
		expect(prompt).not.toContain("CHECKPOINT 1");
		expect(prompt).toContain(
			"CHECKPOINT 2: PRE-SHIP VERIFICATION AWAITING APPROVAL",
		);
	});
});
