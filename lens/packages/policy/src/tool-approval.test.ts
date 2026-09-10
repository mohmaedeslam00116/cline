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

	it("emits deterministic policy events through the telemetry port", () => {
		const events: Array<Record<string, unknown>> = [];
		const telemetry = {
			emitEvent: (event: Record<string, unknown>) => events.push(event),
			emitTokenDelta: () => {},
		};
		const approve = createPhase1ToolApproval(telemetry, "s1");

		approve(request("read_file"));
		approve(request("write_to_file"));

		expect(events).toHaveLength(2);
		const [approvalEvent, denialEvent] = events as Array<{
			type: string;
			sessionId: string;
			data?: Record<string, unknown>;
		}>;
		expect(approvalEvent?.type).toBe("tool-call-started");
		expect(approvalEvent?.sessionId).toBe("s1");
		expect(approvalEvent?.data).toMatchObject({ toolName: "read_file", approved: true });
		expect(denialEvent?.type).toBe("policy-denied");
		expect(denialEvent?.sessionId).toBe("s1");
		expect(denialEvent?.data).toMatchObject({ toolName: "write_to_file", approved: false });
	});
});

describe("CapabilityGrantRegistry", () => {
	it("issues and verifies READ_ONLY_INSPECTION grants", () => {
		const reg = new CapabilityGrantRegistry("/ws");
		const g = reg.issue("READ_ONLY_INSPECTION", {}, 60_000, "session start");
		expect(reg.active().map((x) => x.grantId)).toContain(g.grantId);
		expect(reg.require("READ_ONLY_INSPECTION").grantId).toBe(g.grantId);
	});

	it("refuses non-finite, zero, and negative TTLs (fail-closed; Infinity would never expire)", () => {
		const reg = new CapabilityGrantRegistry("/ws");
		for (const badTtl of [Number.POSITIVE_INFINITY, Number.NaN, 0, -1_000]) {
			try {
				reg.issue("READ_ONLY_INSPECTION", {}, badTtl, "bad ttl");
				expect.unreachable();
			} catch (error) {
				expect(error).toBeInstanceOf(LensPortError);
				expect((error as LensPortError).code).toBe("POLICY_DENIED");
			}
			expect(reg.active()).toHaveLength(0);
		}
	});

	it("cannot be re-rooted through the scope argument", () => {
		const reg = new CapabilityGrantRegistry("/ws");
		const grant = reg.issue(
			"READ_ONLY_INSPECTION",
			{ workspaceRoot: "/elsewhere" } as never,
			60_000,
			"scope override attempt",
		);
		expect(grant.scope.workspaceRoot).toBe("/ws");
	});

	it("issues grants that are frozen at the capability boundary", () => {
		const reg = new CapabilityGrantRegistry("/ws");
		const grant = reg.issue("READ_ONLY_INSPECTION", { pathPrefixes: ["src"] }, 60_000, "frozen");
		expect(Object.isFrozen(grant)).toBe(true);
		expect(Object.isFrozen(grant.scope)).toBe(true);
		expect(Object.isFrozen(grant.scope.pathPrefixes)).toBe(true);
	});

	it("getAuditTrail returns cloned records that cannot mutate the trail", () => {
		const reg = new CapabilityGrantRegistry("/ws");
		reg.issue("READ_ONLY_INSPECTION", {}, 60_000, "session start");
		const trail = reg.getAuditTrail();
		const record = trail[0] as { kind: string; detail: string };
		expect(() => {
			(record as { detail: string }).detail = "tampered";
		}).not.toThrow();
		expect(reg.getAuditTrail()[0]?.detail).not.toBe("tampered");
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
