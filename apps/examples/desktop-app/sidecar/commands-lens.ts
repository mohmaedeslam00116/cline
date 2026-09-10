/**
 * LENS transport commands (Phase 1, ticket #11).
 *
 * Security posture (ADR-0004): raw provider API keys never cross the
 * transport — these commands expose evidence *metadata* and policy *state*
 * only. Evidence claim statements/quotations are untrusted research content
 * and are deliberately NOT returned here; the model fetches a single claim's
 * excerpt on demand via the `get_evidence_detail` tool.
 */
import type { SidecarContext } from "./types";
import { getLensSessionState, isLensModeEnabled } from "./lens-sidecar";

/** The session's evidence index (bundle metadata only) — the Claims Index source. */
export function lensEvidenceIndex(ctx: SidecarContext, sessionId: string) {
	const state = getLensSessionState(ctx, sessionId);
	if (!state) {
		return { lensMode: isLensModeEnabled(), sessionId, bundles: [] };
	}
	return state.engine.listBundles(sessionId).then((bundles) => ({
		lensMode: isLensModeEnabled(),
		sessionId,
		bundles,
	}));
}

/** Read-only audit of every grant decision this process has made. */
export function lensPolicyAudit(ctx: SidecarContext, sessionId: string) {
	const state = getLensSessionState(ctx, sessionId);
	return {
		lensMode: isLensModeEnabled(),
		sessionId,
		auditTrail: state?.grants.getAuditTrail() ?? [],
		recentDecisions: state
			? [...state.lastDecisions.entries()].map(([toolCallId, decision]) => ({
					toolCallId,
					approved: decision.approved,
					policyDenied: decision.policyDenied,
					reason: decision.reason,
				}))
			: [],
	};
}
