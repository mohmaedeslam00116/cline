/**
 * Fail-closed tool approval for the `@cline/core` `RuntimeCapabilities`
 * seam (ADR-0003). Phase 1 read-only containment:
 *
 * - Tools in the READ_ONLY allowlist are approved automatically (they still
 *   run through policy-wrapped executors that enforce the path boundary).
 * - Evidence retrieval (`get_evidence_detail`) is read-only and auto-approved.
 * - Everything else — writes, shell, MCP, unknown tools — is DENIED.
 *   No grants are issued in Phase 1; nothing can be "un-denied" here.
 */
import type { ToolApprovalRequest, ToolApprovalResult } from "@cline/shared";
import type { TelemetryPort } from "@lens/ports";

/** Phase-1 read-only allowlist. Keep in lockstep with the executors wired in #11. */
export const PHASE1_READ_ONLY_TOOLS = new Set([
	"read_file",
	"list_files",
	"search_files",
	"list_code_definition_names",
	"search_symbols",
	"get_evidence_detail",
]);

export interface PolicyDecision {
	readonly approved: boolean;
	readonly reason: string;
	/** True when the denial came from the static Phase-1 policy (not a runtime state). */
	readonly policyDenied: boolean;
}

/** Pure decision function: would this tool call be allowed under Phase-1 policy? */
export function decideToolCall(request: ToolApprovalRequest): PolicyDecision {
	if (PHASE1_READ_ONLY_TOOLS.has(request.toolName)) {
		return { approved: true, reason: "read-only tool allowed by Phase-1 policy", policyDenied: false };
	}
	return {
		approved: false,
		reason: `Phase 1 is read-only: '${request.toolName}' is not on the read-only allowlist`,
		policyDenied: true,
	};
}

/** The `requestToolApproval` implementation handed to `RuntimeCapabilities`. */
export function createPhase1ToolApproval(telemetry?: TelemetryPort, sessionId = "lens-session") {
	return (request: ToolApprovalRequest): ToolApprovalResult => {
		const decision = decideToolCall(request);
		telemetry?.emitEvent({
			type: decision.approved ? "tool-call-started" : "policy-denied",
			sessionId,
			seq: Date.now(),
			timestamp: new Date().toISOString(),
			data: { toolCallId: request.toolCallId, toolName: request.toolName, approved: decision.approved, reason: decision.reason },
		});
		return { approved: decision.approved, reason: decision.reason };
	};
}
