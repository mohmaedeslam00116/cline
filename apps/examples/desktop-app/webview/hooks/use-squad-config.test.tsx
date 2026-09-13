// @vitest-environment jsdom

import { getDefaultSquadConfig } from "@cline/shared/browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	readStoredSquadConfig,
	SQUAD_CONFIG_EVENT,
	SQUAD_CONFIG_STORAGE_KEY,
	writeStoredSquadConfig,
} from "./use-squad-config";

describe("squad config storage", () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it("normalizes dynamic persona IDs and Orion ordering", () => {
		window.localStorage.setItem(
			SQUAD_CONFIG_STORAGE_KEY,
			JSON.stringify({
				presetId: "release-review",
				activePersonaIds: ["audit-bot", "orion", "audit-bot"],
				checkpointGatesEnabled: false,
			}),
		);
		expect(readStoredSquadConfig()).toEqual({
			presetId: "release-review",
			activePersonaIds: ["orion", "audit-bot"],
			checkpointGatesEnabled: false,
		});
	});

	it("falls back for malformed data or a squad without Orion", () => {
		window.localStorage.setItem(SQUAD_CONFIG_STORAGE_KEY, "{broken");
		expect(readStoredSquadConfig()).toEqual(getDefaultSquadConfig());
		window.localStorage.setItem(
			SQUAD_CONFIG_STORAGE_KEY,
			JSON.stringify({
				presetId: "invalid",
				activePersonaIds: ["audit-bot"],
				checkpointGatesEnabled: false,
			}),
		);
		expect(readStoredSquadConfig()).toEqual(getDefaultSquadConfig());
	});

	it("writes normalized config and publishes the normalized event", () => {
		const listener = vi.fn();
		window.addEventListener(SQUAD_CONFIG_EVENT, listener);
		writeStoredSquadConfig({
			presetId: "release-review",
			activePersonaIds: ["audit-bot", "orion", "audit-bot"],
			checkpointGatesEnabled: true,
		});

		expect(
			JSON.parse(window.localStorage.getItem(SQUAD_CONFIG_STORAGE_KEY)!),
		).toEqual({
			presetId: "release-review",
			activePersonaIds: ["orion", "audit-bot"],
			checkpointGatesEnabled: true,
		});
		expect(listener).toHaveBeenCalledOnce();
		window.removeEventListener(SQUAD_CONFIG_EVENT, listener);
	});
});
