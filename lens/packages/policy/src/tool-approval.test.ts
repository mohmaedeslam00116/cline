import { describe, expect, it } from "bun:test";
import type { ToolApprovalRequest } from "@cline/shared";
import { CapabilityGrantRegistry } from "./grant-registry.js";
import { createPhase1ToolApproval, decideToolCall, PHASE1_READ_ONLY_TOOLS } from "./tool-approval.js";
import { LensPortError } from "@lens/ports";

const request = (toolName: string): ToolApprovalRequest => ({
	sessionId: "s1",
	agentId: "a1",
	conversationId: "c1",
	iteration: 1,
	toolCallId: `tc-${toolName}`,
	toolName,
	input: {},
	policy: { enabled: true, autoApprove: false },
});

describe("Phase-1 tool approval (fail closed)", () => {
	it("auto-approves read-only allowlisted tools", () => {
		for (const tool of PHASE1_READ_ONLY_TOOLS) {
			const d = decideToolCall(request(tool));
			expect(d.approved).toBe(true);
			expect(d.policyDenied).toBe(false);
		}
	});

	it("denies mutating and unknown tools with a policy reason", () => {
		for (const tool of ["write_to_file", "apply_diff", "execute_command", "browser_action", "mcp_tool", "totally_new_tool"]) {
			const d = decideToolCall(request(tool));
			expect(d.approved).toBe(false);
			expect(d.policyDenied).toBe(true);
			expect(d.reason).toContain("read-only");
		}
	});

	it("createPhase1ToolApproval returns SDK-compatible results", () => {
		const approve = createPhase1ToolApproval();
		expect(approve(request("read_file")).approved).toBe(true);
		const denied = approve(request("write_to_file"));
		expect(denied.approved).toBe(false);
		expect(denied.reason).toContain("Phase 1 is read-only");
	});
});

describe("CapabilityGrantRegistry", () => {
	it("issues and verifies READ_ONLY_INSPECTION grants", () => {
		const reg = new CapabilityGrantRegistry("/ws");
		const g = reg.issue("READ_ONLY_INSPECTION", {}, 60_000, "session start");
		expect(reg.active().map((x) => x.grantId)).toContain(g.grantId);
		expect(reg.require("READ_ONLY_INSPECTION").grantId).toBe(g.grantId);
	});

	it("refuses to issue mutating or terminal grants in Phase 1", () => {
		const reg = new CapabilityGrantRegistry("/ws");
		expect(() => reg.issue("MUTATING_FILE_WRITE", {}, 60_000, "nope")).toThrow(LensPortError);
		expect(() => reg.issue("RESTRICTED_TERMINAL_COMMAND", {}, 60_000, "nope")).toThrow(LensPortError);
		try {
			reg.issue("MUTATING_FILE_WRITE", {}, 60_000, "nope");
		} catch (e) {
			expect((e as LensPortError).code).toBe("POLICY_DENIED");
		}
	});

	it("throws POLICY_DENIED when no grant exists, and detects expiry", () => {
		const reg = new CapabilityGrantRegistry("/ws");
		expect(() => reg.require("READ_ONLY_INSPECTION")).toThrow(LensPortError);

		const future = Date.now() + 60_000;
		reg.issue("READ_ONLY_INSPECTION", {}, 10, "short-lived");
		// Simulate expiry: require with a clock past the grant's expiry.
		expect(() => reg.require("READ_ONLY_INSPECTION", future)).toThrow(LensPortError);
		// The audit trail should show both a denial and an expiry record.
		const kinds = reg.getAuditTrail().map((r) => r.kind);
		expect(kinds).toContain("grant-denied");
		expect(kinds).toContain("grant-expired");
	});

	it("keeps an append-only audit trail of decisions", () => {
		const reg = new CapabilityGrantRegistry("/ws");
		reg.issue("READ_ONLY_INSPECTION", {}, 60_000, "session start");
		reg.require("READ_ONLY_INSPECTION");
		const trail = reg.getAuditTrail();
		expect(trail.length).toBeGreaterThanOrEqual(2);
		expect(trail[0].kind).toBe("grant-issued");
		expect(trail[1].kind).toBe("grant-verified");
		// Append-only: same array reference grows but records are never replaced.
		const snapshot = [...trail];
		reg.require("READ_ONLY_INSPECTION");
		expect(reg.getAuditTrail().slice(0, snapshot.length)).toEqual(snapshot);
	});
});
