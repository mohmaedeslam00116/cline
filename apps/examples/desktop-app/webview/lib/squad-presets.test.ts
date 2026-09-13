// @vitest-environment jsdom

import type { SquadPreset } from "@cline/shared/browser";
import { beforeEach, describe, expect, it } from "vitest";
import {
	createCustomSquadPreset,
	deleteCustomSquadPreset,
	isSquadPresetAvailable,
	normalizeSquadPreset,
	readStoredSquadPresets,
	SQUAD_PRESETS_STORAGE_KEY,
	saveCustomSquadPreset,
	validateSquadPresetName,
	writeStoredSquadPresets,
} from "./squad-presets";

describe("custom squad presets", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it("normalizes custom presets and keeps Orion first", () => {
		expect(
			normalizeSquadPreset({
				id: "release-review",
				name: "  Release Review  ",
				description: "  Focused release audit  ",
				source: "custom",
				personaIds: ["audit-bot", "orion", "audit-bot"],
				checkpointGatesEnabled: false,
			}),
		).toEqual({
			id: "release-review",
			name: "Release Review",
			description: "Focused release audit",
			source: "custom",
			personaIds: ["orion", "audit-bot"],
			checkpointGatesEnabled: false,
		});
		expect(
			normalizeSquadPreset({
				id: "invalid",
				name: "Invalid",
				description: "No leader",
				source: "custom",
				personaIds: ["audit-bot"],
				checkpointGatesEnabled: true,
			}),
		).toBeNull();
	});

	it("round-trips valid presets and ignores malformed storage", () => {
		const preset = createCustomSquadPreset({
			name: "Release Review",
			personaIds: ["orion", "audit-bot"],
			checkpointGatesEnabled: true,
		});
		writeStoredSquadPresets([preset]);
		expect(readStoredSquadPresets()).toEqual([preset]);

		window.localStorage.setItem(SQUAD_PRESETS_STORAGE_KEY, "{bad json");
		expect(readStoredSquadPresets()).toEqual([]);
	});

	it("validates names case-insensitively and supports explicit overwrite", () => {
		const existing = createCustomSquadPreset({
			name: "Release Review",
			personaIds: ["orion", "audit-bot"],
			checkpointGatesEnabled: true,
		});
		expect(validateSquadPresetName(" release review ", [existing])).toBe(
			"A preset with this name already exists.",
		);
		expect(
			validateSquadPresetName(" release review ", [existing], existing.id),
		).toBeNull();

		const updated: SquadPreset = {
			...existing,
			personaIds: ["orion", "sentinel"],
		};
		expect(saveCustomSquadPreset([existing], updated, existing.id)).toEqual([
			updated,
		]);
		expect(deleteCustomSquadPreset([updated], updated.id)).toEqual([]);
	});

	it("reports presets that reference unavailable personas", () => {
		const preset = createCustomSquadPreset({
			name: "Release Review",
			personaIds: ["orion", "audit-bot"],
			checkpointGatesEnabled: true,
		});
		expect(
			isSquadPresetAvailable(preset, new Set(["orion", "audit-bot"])),
		).toBe(true);
		expect(isSquadPresetAvailable(preset, new Set(["orion"]))).toBe(false);
	});
});
