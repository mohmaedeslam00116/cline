import type {
	RuntimePersonaDefinition,
	SquadConfig,
} from "@cline/shared/browser";
import { describe, expect, it } from "vitest";
import {
	findUnavailablePersonaIds,
	getPersonaIdentity,
	toggleSquadPersona,
} from "./squad-selection-model";

const auditBot: RuntimePersonaDefinition = {
	id: "audit-bot",
	name: "Audit Bot",
	role: "Release Auditor",
	stage: "qa",
	avatar: { chassis: "sentinel", accentColor: "#10b981" },
	instructions: "Review release evidence.",
	tools: ["read_file"],
	toolPolicy: "auto",
	scope: "workspace",
};

const config: SquadConfig = {
	presetId: "custom:release-review",
	activePersonaIds: ["orion", "cipher"],
	checkpointGatesEnabled: true,
};

describe("squad selection model", () => {
	it("locks Orion while allowing every other specialist to be replaced", () => {
		expect(toggleSquadPersona(config, "orion")).toEqual(config);
		expect(toggleSquadPersona(config, "cipher").activePersonaIds).toEqual([
			"orion",
		]);
		expect(toggleSquadPersona(config, "audit-bot").activePersonaIds).toEqual([
			"orion",
			"cipher",
			"audit-bot",
		]);
	});

	it("reports unavailable references without silently removing them", () => {
		expect(
			findUnavailablePersonaIds(
				{ ...config, activePersonaIds: ["orion", "audit-bot", "deleted"] },
				new Map([
					["orion", auditBot],
					["audit-bot", auditBot],
				]),
			),
		).toEqual(["deleted"]);
	});

	it("returns a neutral diagnostic identity for unknown IDs", () => {
		expect(getPersonaIdentity("missing", new Map())).toMatchObject({
			id: "missing",
			name: "Unknown specialist",
			role: "Unavailable persona",
			scope: "unknown",
			avatar: { chassis: "orion", accentColor: "#64748b" },
		});
	});
});
