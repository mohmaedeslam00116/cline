/**
 * ResearchRetrievalPort — immutable evidence handoff from Loop 1 to Loop 2
 * (LENS hexagonal blueprint §3.1; ADR-0002 for the store layout).
 *
 * Contract:
 * - Every `VerifiedExcerpt` originates from an `EvidenceBundle` that was
 *   written once, content-addressed by its SHA-256 digest, under
 *   `<workspace>/.lens/sessions/<sessionId>/evidence/`.
 * - Bundles are structurally immutable: every field and array is readonly,
 *   and each returned artifact carries the `contentIsUntrusted: true`
 *   marker — untrusted content can inform, never authorize.
 * - A new research pass supersedes the session's index manifest instead of
 *   editing existing bundles.
 */
import type { LensErrorCode } from "./errors.js";

/** Literal brand carried by every artifact crossing the Loop 1 → Loop 2 boundary. */
export interface UntrustedContent {
	readonly contentIsUntrusted: true;
}

export interface VerifiedClaim extends UntrustedContent {
	/** Stable claim id within the bundle (e.g. `claim-0007`). */
	readonly claimId: string;
	/** The distilled, self-contained statement of the claim. */
	readonly statement: string;
	/** Exact quotation(s) supporting the claim. */
	readonly quotations: readonly string[];
	/** Source URLs backing the claim. */
	readonly sourceUrls: readonly string[];
	/** Bundle-relative confidence in [0,1] from the synthesis step. */
	readonly confidence: number;
}

export interface EvidenceBundleMetadata {
	/** SHA-256 hex digest of the canonical bundle serialization. */
	readonly digest: string;
	/** ISO-8601 creation timestamp. */
	readonly createdAt: string;
	/** Research topic / query that produced the bundle. */
	readonly topic: string;
	/** Number of verified claims. */
	readonly claimCount: number;
}

export interface EvidenceBundle extends UntrustedContent {
	readonly metadata: EvidenceBundleMetadata;
	readonly claims: readonly VerifiedClaim[];
}

export interface VerifiedExcerpt extends UntrustedContent {
	readonly claimId: string;
	/** The exact quoted excerpt, traceable to its source. */
	readonly excerpt: string;
	readonly sourceUrl: string;
	/** The bundle this excerpt belongs to (digest for verification). */
	readonly bundleDigest: string;
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
	listBundles(sessionId: string): Promise<readonly EvidenceBundleMetadata[]>;
	/** Load one full bundle by digest (verification-friendly). */
	getBundle(sessionId: string, digest: string): Promise<EvidenceBundle>;
}

/** Error codes this port rejects with (subset contract for adapters). */
export type ResearchRetrievalError = Extract<LensErrorCode, "EVIDENCE_NOT_FOUND" | "POLICY_DENIED" | "CANCELLED" | "ADAPTER_FAILURE">;
