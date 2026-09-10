import { describe, expect, it } from "bun:test";
import { CAPABILITY_TYPES, isActiveGrant, isCapabilityType } from "./capability-grant.js";
import { LensPortError } from "./errors.js";

const grant = (capability: (typeof CAPABILITY_TYPES)[number], expiresAt: number) => ({
	grantId: "g1",
	capability,
	scope: { workspaceRoot: "/ws" },
	expiresAt,
	reason: "test",
});

describe("isCapabilityType", () => {
	it("accepts the three canonical types", () => {
		expect(isCapabilityType("READ_ONLY_INSPECTION")).toBe(true);
		expect(isCapabilityType("MUTATING_FILE_WRITE")).toBe(true);
		expect(isCapabilityType("RESTRICTED_TERMINAL_COMMAND")).toBe(true);
	});
	it("rejects unknown values", () => {
		expect(isCapabilityType("READ_WRITE")).toBe(false);
		expect(isCapabilityType(42)).toBe(false);
		expect(isCapabilityType(undefined)).toBe(false);
	});
});

describe("isActiveGrant", () => {
	const now = 1_000_000;
	it("is active for a matching, unexpired grant", () => {
		expect(isActiveGrant(grant("READ_ONLY_INSPECTION", now + 1), "READ_ONLY_INSPECTION", now)).toBe(true);
	});
	it("is inactive when expired at the boundary (strictly-greater rule)", () => {
		expect(isActiveGrant(grant("READ_ONLY_INSPECTION", now), "READ_ONLY_INSPECTION", now)).toBe(false);
	});
	it("is inactive for a different capability", () => {
		expect(isActiveGrant(grant("READ_ONLY_INSPECTION", now + 1), "MUTATING_FILE_WRITE", now)).toBe(false);
	});
});

describe("LensPortError", () => {
	it("carries the canonical code", () => {
		const e = new LensPortError("SECURITY_ACCESS_DENIED", "escape rejected");
		expect(e.code).toBe("SECURITY_ACCESS_DENIED");
		expect(e.name).toBe("LensPortError");
	});
});
