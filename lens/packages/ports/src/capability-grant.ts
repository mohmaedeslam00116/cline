/**
 * CapabilityGrant model — the bounded, policy-evaluated permission tickets
 * from the LENS domain model. The policy layer (@lens/policy) issues and
 * verifies grants; every mutating capability requires an active grant.
 *
 * Phase 1 (read-only containment): only READ_ONLY_INSPECTION is ever
 * granted; MUTATING_FILE_WRITE and RESTRICTED_TERMINAL_COMMAND exist in
 * the model now so Phase 2 needs no breaking change.
 */

export const CAPABILITY_TYPES = [
	"READ_ONLY_INSPECTION",
	"MUTATING_FILE_WRITE",
	"RESTRICTED_TERMINAL_COMMAND",
] as const;

export type CapabilityType = (typeof CAPABILITY_TYPES)[number];

export interface CapabilityGrant {
	/** Unique grant id (opaque). */
	grantId: string;
	/** Which capability this grant authorizes. */
	capability: CapabilityType;
	/** Exact scope of the authorization, interpreted by the policy layer. */
	scope: {
		/** Absolute canonical workspace root the grant is bound to. */
		workspaceRoot: string;
		/** Optional narrower path prefixes (relative, POSIX-style) the grant covers. */
		pathPrefixes?: string[];
		/** For RESTRICTED_TERMINAL_COMMAND: the single allowed executable. */
		executable?: string;
		/** For RESTRICTED_TERMINAL_COMMAND: allowed structured argument templates. */
		argumentTemplates?: string[][];
	};
	/** Epoch milliseconds — the grant is invalid past this instant. */
	expiresAt: number;
	/** Human-readable justification recorded in the audit trail. */
	reason: string;
}

export function isCapabilityType(value: unknown): value is CapabilityType {
	return typeof value === "string" && (CAPABILITY_TYPES as readonly string[]).includes(value);
}

/** True when the grant covers `capability` and has not expired. Time-bound checks are the caller's clock. */
export function isActiveGrant(grant: CapabilityGrant, capability: CapabilityType, nowMs: number): boolean {
	return grant.capability === capability && grant.expiresAt > nowMs;
}
