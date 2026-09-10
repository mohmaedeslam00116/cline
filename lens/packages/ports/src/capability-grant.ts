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
	readonly grantId: string;
	/** Which capability this grant authorizes. */
	readonly capability: CapabilityType;
	/** Exact scope of the authorization, interpreted by the policy layer. */
	readonly scope: {
		/** Absolute canonical workspace root the grant is bound to. */
		readonly workspaceRoot: string;
		/** Optional narrower path prefixes (relative, POSIX-style) the grant covers. */
		readonly pathPrefixes?: readonly string[];
		/** For RESTRICTED_TERMINAL_COMMAND: the single allowed executable. */
		readonly executable?: string;
		/** For RESTRICTED_TERMINAL_COMMAND: allowed structured argument templates. */
		readonly argumentTemplates?: readonly (readonly string[])[];
	};
	/** Epoch milliseconds — the grant is invalid past this instant. */
	readonly expiresAt: number;
	/** Human-readable justification recorded in the audit trail. */
	readonly reason: string;
}

export function isCapabilityType(value: unknown): value is CapabilityType {
	return typeof value === "string" && (CAPABILITY_TYPES as readonly string[]).includes(value);
}

/**
 * Deep-frozen copy made at the capability boundary (ADR-0003): once issued,
 * no caller can reassign capability, expiry, or nested scope data.
 */
export function freezeGrant(grant: CapabilityGrant): CapabilityGrant {
	return Object.freeze({
		...grant,
		scope: Object.freeze({
			...grant.scope,
			...(grant.scope.pathPrefixes
				? { pathPrefixes: Object.freeze([...grant.scope.pathPrefixes]) }
				: {}),
			...(grant.scope.argumentTemplates
				? {
						argumentTemplates: Object.freeze(
							grant.scope.argumentTemplates.map((template) =>
								Object.freeze([...template]),
							),
						)
					}
				: {}),
		}),
	}) as CapabilityGrant;
}

/** True when the grant covers `capability` and has not expired. Time-bound checks are the caller's clock. */
export function isActiveGrant(grant: CapabilityGrant, capability: CapabilityType, nowMs: number): boolean {
	return grant.capability === capability && grant.expiresAt > nowMs;
}
