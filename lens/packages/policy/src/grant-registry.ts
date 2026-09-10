/**
 * CapabilityGrant registry — issues and verifies bounded permission tickets.
 * In-memory for Phase 1 (grants live and die with the sidecar session);
 * the audit trail is append-only so every grant decision is traceable.
 */
import type { CapabilityGrant, CapabilityType, TelemetryPort } from "@lens/ports";
import { isActiveGrant, LensPortError } from "@lens/ports";

export interface AuditRecord {
	readonly seq: number;
	readonly timestamp: string;
	readonly kind: "grant-issued" | "grant-verified" | "grant-denied" | "grant-expired";
	readonly capability: CapabilityType;
	readonly sessionId: string;
	readonly detail: string;
}

export class CapabilityGrantRegistry {
	private readonly grants = new Map<string, CapabilityGrant>();
	private readonly auditTrail: AuditRecord[] = [];
	private seq = 0;

	constructor(
		private readonly workspaceRoot: string,
		private readonly telemetry?: TelemetryPort,
		private readonly sessionId = "lens-session",
	) {}

	/** Issue a grant. Phase 1 policy: only READ_ONLY_INSPECTION may be issued (ADR-0003). */
	issue(
		capability: CapabilityType,
		scope: Omit<CapabilityGrant["scope"], "workspaceRoot">,
		ttlMs: number,
		reason: string,
	): CapabilityGrant {
		if (capability !== "READ_ONLY_INSPECTION") {
			throw new LensPortError("POLICY_DENIED", `Phase 1 forbids issuing ${capability} grants (read-only containment)`);
		}
		const grant: CapabilityGrant = {
			grantId: `grant-${++this.seq}`,
			capability,
			scope: { workspaceRoot: this.workspaceRoot, ...scope },
			expiresAt: Date.now() + ttlMs,
			reason,
		};
		this.grants.set(grant.grantId, grant);
		this.audit("grant-issued", capability, `issued ${grant.grantId} ttl=${ttlMs}ms: ${reason}`);
		return grant;
	}

	/** Verify an active grant of `capability` within the given scope, or throw POLICY_DENIED. */
	require(capability: CapabilityType, nowMs = Date.now()): CapabilityGrant {
		for (const grant of this.grants.values()) {
			if (grant.capability !== capability) continue;
			if (!isActiveGrant(grant, capability, nowMs)) continue;
			this.audit("grant-verified", capability, `verified ${grant.grantId}`);
			return grant;
		}
		const anyExpired = [...this.grants.values()].some((g) => g.capability === capability);
		this.audit(anyExpired ? "grant-expired" : "grant-denied", capability, `no active ${capability} grant`);
		throw new LensPortError("POLICY_DENIED", `no active ${capability} grant`);
	}

	/** List active grants (inspection/debugging). */
	active(nowMs = Date.now()): readonly CapabilityGrant[] {
		return [...this.grants.values()].filter((g) => isActiveGrant(g, g.capability, nowMs));
	}

	/** Append-only audit trail. */
	getAuditTrail(): readonly AuditRecord[] {
		return this.auditTrail;
	}

	private audit(kind: AuditRecord["kind"], capability: CapabilityType, detail: string): void {
		this.auditTrail.push({ seq: this.auditTrail.length, timestamp: new Date().toISOString(), kind, capability, sessionId: this.sessionId, detail });
		this.telemetry?.emitEvent({ type: kind === "grant-verified" ? "tool-call-started" : "policy-denied", sessionId: this.sessionId, seq: this.auditTrail.length, timestamp: new Date().toISOString(), data: { kind, capability, detail } });
	}
}
