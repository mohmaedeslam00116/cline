/**
 * ResearchRetrievalPort — immutable evidence handoff from Loop 1 to Loop 2
 * (LENS hexagonal blueprint §3.1; ADR-0002 for the store layout).
 *
 * Contract:
 * - Every `VerifiedExcerpt` originates from an `EvidenceBundle` that was
 *   written once, content-addressed by its SHA-256 digest, under
 *   `<workspace>/.lens/sessions/<sessionId>/evidence/`.
 * - Bundles are immutable: callers never mutate retrieved data; a new
 *   research pass supersedes the session's index manifest instead.
 * - Everything returned here is UNTRUSTED content (`contentIsUntrusted:
 *   true` at the consumer boundary): it can inform, never authorize.
 */
import type { LensErrorCode } from "./errors.js";

export interface VerifiedClaim {
	/** Stable claim id within the bundle (e.g. `claim-0007`). */
	claimId: string;
	/** The distilled, self-contained statement of the claim. */
	statement: string;
	/** Exact quotation(s) supporting the claim. */
	quotations: string[];
	/** Source URLs backing the claim. */
	sourceUrls: string[];
	/** Bundle-relative confidence in [0,1] from the synthesis step. */
	confidence: number;
}

export interface EvidenceBundleMetadata {
	/** SHA-256 hex digest of the canonical bundle serialization. */
	digest: string;
	/** ISO-8601 creation timestamp. */
	createdAt: string;
	/** Research topic / query that produced the bundle. */
	topic: string;
	/** Number of verified claims. */
	claimCount: number;
}

export interface EvidenceBundle {
	readonly metadata: EvidenceBundleMetadata;
	readonly claims: VerifiedClaim[];
}

export interface VerifiedExcerpt {
	claimId: string;
	/** The exact quoted excerpt, traceable to its source. */
	excerpt: string;
	sourceUrl: string;
	/** The bundle this excerpt belongs to (digest for verification). */
	bundleDigest: string;
}

export interface ResearchRetrievalPort {
	/**
	 * Run a research pass and persist its bundle to the Evidence Store.
	 * `budget` bounds the pass (adapters map it to fetch count / time).
	 */
	queryResearch(topic: string, budget: number, signal?: AbortSignal): Promise<EvidenceBundle>;
	/** Fetch one claim's full excerpt on demand (stratified on-demand claims). */
	getCitationExcerpt(bundleDigest: string, claimId: string): Promise<VerifiedExcerpt>;
	/** Load the current bundle index for a session (the Claims Index source). */
	listBundles(sessionId: string): Promise<EvidenceBundleMetadata[]>;
	/** Load one full bundle by digest (verification-friendly). */
	getBundle(sessionId: string, digest: string): Promise<EvidenceBundle>;
}

/** Error codes this port rejects with (subset contract for adapters). */
export type ResearchRetrievalError = Extract<LensErrorCode, "EVIDENCE_NOT_FOUND" | "POLICY_DENIED" | "CANCELLED" | "ADAPTER_FAILURE">;
