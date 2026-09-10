/**
 * Canonical error codes thrown by LENS ports and the policy layer.
 * These are part of the port contract: adapters must reject with
 * `LensPortError` carrying one of these codes.
 */
export type LensErrorCode =
	/** Path escaped the workspace boundary (traversal, symlink escape, drive escape). */
	| "SECURITY_ACCESS_DENIED"
	/** The policy layer denied the requested capability (no active grant). */
	| "POLICY_DENIED"
	/** The requested evidence bundle or claim id does not exist. */
	| "EVIDENCE_NOT_FOUND"
	/** The operation was cancelled via the CancellationPort signal. */
	| "CANCELLED"
	/** Adapter-specific failure (bad upstream state, unsupported operation, ...). */
	| "ADAPTER_FAILURE";

export class LensPortError extends Error {
	readonly code: LensErrorCode;

	constructor(code: LensErrorCode, message: string, options?: { cause?: unknown }) {
		super(message, options ? { cause: options.cause } : undefined);
		this.name = "LensPortError";
		this.code = code;
	}
}
