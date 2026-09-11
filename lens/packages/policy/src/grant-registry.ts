/**
 * CapabilityGrant registry — issues and verifies bounded permission tickets.
 * In-memory for Phase 1 (grants live and die with the sidecar session);
 * the audit trail is append-only so every grant decision is traceable.
 */
import type {
	CapabilityGrant,
	CapabilityType,
	TelemetryPort,
} from "@lens/ports";
import {
	freezeGrant,
	isActiveGrant,
	isCapabilityType,
	LensPortError,
} from "@lens/ports";
import { resolveSafePath, scopeCoversPath } from "./path-boundary.js";

export interface OperationScope {
	readonly executable?: string;
	readonly relativePath?: string;
}

export interface AuditRecord {
	readonly seq: number;
	readonly timestamp: string;
	readonly kind:
		| "grant-issued"
		| "grant-verified"
		| "grant-denied"
		| "grant-expired";
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

	/** Issue a grant for any valid capability type. */
	issue(
		capability: CapabilityType,
		scope: Omit<CapabilityGrant["scope"], "workspaceRoot">,
		ttlMs: number,
		reason: string,
	): CapabilityGrant {
		if (!isCapabilityType(capability)) {
			throw new LensPortError(
				"POLICY_DENIED",
				`unknown capability '${String(capability)}'`,
			);
		}
		// Fail-closed TTL validation: non-finite, zero, and negative lifetimes
		// would otherwise mint non-expiring grants (Infinity passes any
		// isActiveGrant clock comparison).
		if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
			throw new LensPortError(
				"POLICY_DENIED",
				`grant ttl must be a finite, positive number of ms (got ${String(ttlMs)})`,
			);
		}
		// Spread caller scope FIRST so a hostile caller cannot override the
		// registry-bound workspaceRoot; the fixed root wins.
		const grant: CapabilityGrant = freezeGrant({
			grantId: `grant-${++this.seq}`,
			capability,
			scope: { ...scope, workspaceRoot: this.workspaceRoot },
			expiresAt: Date.now() + ttlMs,
			reason,
		});
		this.grants.set(grant.grantId, grant);
		this.audit(
			"grant-issued",
			capability,
			`issued ${grant.grantId} ttl=${ttlMs}ms: ${reason}`,
		);
		return grant;
	}

	/** Verify an active grant of `capability` within the given scope, or throw POLICY_DENIED. */
	require(
		capability: CapabilityType,
		scopeOrNowMs?: OperationScope | number,
		nowMs?: number,
	): CapabilityGrant {
		const operationScope =
			typeof scopeOrNowMs === "object" && scopeOrNowMs !== null
				? scopeOrNowMs
				: undefined;
		const effectiveNowMs =
			typeof scopeOrNowMs === "number" ? scopeOrNowMs : (nowMs ?? Date.now());

		let sawScopeMismatch = false;
		for (const grant of this.grants.values()) {
			if (grant.capability !== capability) continue;
			if (!isActiveGrant(grant, capability, effectiveNowMs)) continue;

			if (operationScope) {
				if (operationScope.executable !== undefined) {
					if (grant.scope.executable !== operationScope.executable) {
						sawScopeMismatch = true;
						continue;
					}
				}
				if (operationScope.relativePath !== undefined) {
					const resolved = resolveSafePath(
						this.workspaceRoot,
						operationScope.relativePath,
					);
					if (
						!scopeCoversPath(
							grant as Parameters<typeof scopeCoversPath>[0],
							resolved,
						)
					) {
						sawScopeMismatch = true;
						continue;
					}
				}
			}

			this.audit("grant-verified", capability, `verified ${grant.grantId}`);
			return grant;
		}
		const anyExpired = [...this.grants.values()].some(
			(g) => g.capability === capability,
		);
		const detail = sawScopeMismatch
			? `no active ${capability} grant matches the requested operation scope`
			: anyExpired
				? `all ${capability} grants have expired`
				: `no active ${capability} grant`;
		this.audit(
			anyExpired && !sawScopeMismatch ? "grant-expired" : "grant-denied",
			capability,
			detail,
		);
		throw new LensPortError("POLICY_DENIED", detail);
	}

	/** List active grants (inspection/debugging). */
	active(nowMs = Date.now()): readonly CapabilityGrant[] {
		return [...this.grants.values()].filter((g) =>
			isActiveGrant(g, g.capability, nowMs),
		);
	}

	/** Append-only audit trail, cloned per call: callers cannot mutate records or observe later appends. */
	getAuditTrail(): readonly AuditRecord[] {
		return this.auditTrail.map((record) => ({ ...record }));
	}

	private audit(
		kind: AuditRecord["kind"],
		capability: CapabilityType,
		detail: string,
	): void {
		this.auditTrail.push({
			seq: this.auditTrail.length,
			timestamp: new Date().toISOString(),
			kind,
			capability,
			sessionId: this.sessionId,
			detail,
		});
		this.telemetry?.emitEvent({
			type: kind === "grant-verified" ? "tool-call-started" : "policy-denied",
			sessionId: this.sessionId,
			seq: this.auditTrail.length,
			timestamp: new Date().toISOString(),
			data: { kind, capability, detail },
		});
	}
}
