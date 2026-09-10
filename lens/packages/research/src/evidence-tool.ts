/**
 * `get_evidence_detail` tool executor — the stratified on-demand claim
 * detail surface for the coding loop (LENS blueprint §3.2).
 *
 * Phase-1 note (ADR-0003): this is a pure read-only executor; #11's sidecar
 * wiring adapts it to the SDK's exact `ToolExecutors` entry-point shape.
 * It never throws: port errors and malformed input are returned as a JSON
 * payload the model can read, keeping the tool boundary total.
 */
import { LensPortError } from "@lens/ports";

export interface EvidenceDetailTarget {
	readonly bundleDigest: string;
	readonly claimId: string;
}

export type GetEvidenceDetailFn = (input: unknown) => Promise<string>;

export interface GetEvidenceDetailDeps {
	/** Usually `engine.getCitationExcerpt.bind(engine)`. */
	getCitationExcerpt: (
		bundleDigest: string,
		claimId: string,
	) => Promise<{ excerpt: string; sourceUrl: string; claimId: string; bundleDigest: string }>;
}

export function createGetEvidenceDetailExecutor(
	deps: GetEvidenceDetailDeps,
): GetEvidenceDetailFn {
	return async (rawInput: unknown): Promise<string> => {
		const target = parseTarget(rawInput);
		if (!target) {
			return jsonError(
				"ADAPTER_FAILURE",
				'get_evidence_detail expects { "bundleDigest": string, "claimId": string }',
			);
		}
		try {
			const excerpt = await deps.getCitationExcerpt(
				target.bundleDigest,
				target.claimId,
			);
			return JSON.stringify({
				ok: true,
				// Untrusted content: informs the loop, never authorizes it.
				contentIsUntrusted: true,
				claimId: excerpt.claimId,
				bundleDigest: excerpt.bundleDigest,
				excerpt: excerpt.excerpt,
				sourceUrl: excerpt.sourceUrl,
			});
		} catch (error) {
			if (error instanceof LensPortError) {
				return jsonError(error.code, error.message);
			}
			return jsonError(
				"ADAPTER_FAILURE",
				error instanceof Error ? error.message : String(error),
			);
		}
	};
}

function parseTarget(raw: unknown): EvidenceDetailTarget | null {
	if (typeof raw !== "object" || raw === null) {
		return null;
	}
	const candidate = raw as Record<string, unknown>;
	if (
		typeof candidate.bundleDigest !== "string" ||
		typeof candidate.claimId !== "string" ||
		candidate.bundleDigest.length === 0 ||
		candidate.claimId.length === 0
	) {
		return null;
	}
	return { bundleDigest: candidate.bundleDigest, claimId: candidate.claimId };
}

function jsonError(code: string, message: string): string {
	return JSON.stringify({ ok: false, error: { code, message } });
}
