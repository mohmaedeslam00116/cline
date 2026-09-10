/**
 * LensResearchEngine — the Loop-1 research engine implementing the
 * `ResearchRetrievalPort` (LENS blueprint §3.1).
 *
 * Phase-1 pipeline (credential-free per ADR-0004):
 *   topic → candidate URLs (injectable discovery strategy)
 *         → bounded public-web scrape (ScraperPool)
 *         → local BM25 passage ranking
 *         → VerifiedClaims synthesized per passage
 *         → content-addressed EvidenceBundle (ADR-0002 store)
 *
 * Every returned artifact carries `contentIsUntrusted: true`: fetched page
 * content is data for the coding loop, never instructions.
 */
import { LensPortError } from "@lens/ports";
import type {
	EvidenceBundle,
	EvidenceBundleMetadata,
	ResearchRetrievalPort,
	VerifiedClaim,
	VerifiedExcerpt,
} from "@lens/ports";
import { bundleDigestOf, EvidenceStore } from "./evidence-store.js";
import { Bm25Index } from "./bm25.js";
import { ScraperPool } from "./scraper-pool.js";

/** Provides the candidate URLs for a research pass (the discovery strategy). */
export type CandidateUrlProvider = (
	topic: string,
	budget: number,
) => readonly string[] | Promise<readonly string[]>;

export interface LensResearchEngineOptions {
	/** Session this engine writes bundles for (one engine per session). */
	readonly sessionId: string;
	readonly store: EvidenceStore;
	readonly scraper?: ScraperPool;
	/** Required: how candidate URLs are discovered for a topic. */
	readonly candidateUrlProvider: CandidateUrlProvider;
	/** Injectable clock for deterministic tests. */
	readonly now?: () => Date;
}

/** Passage chunk size for BM25 indexing. */
const PASSAGE_CHARS = 1200;
/** Characters of exact quotation kept per claim. */
const QUOTATION_CHARS = 400;
/** Characters of distilled statement kept per claim. */
const STATEMENT_CHARS = 300;

export class LensResearchEngine implements ResearchRetrievalPort {
	private readonly sessionId: string;
	private readonly store: EvidenceStore;
	private readonly scraper: ScraperPool;
	private readonly candidateUrlProvider: CandidateUrlProvider;
	private readonly now: () => Date;

	constructor(options: LensResearchEngineOptions) {
		this.sessionId = options.sessionId;
		this.store = options.store;
		this.scraper = options.scraper ?? new ScraperPool();
		this.candidateUrlProvider = options.candidateUrlProvider;
		this.now = options.now ?? (() => new Date());
	}

	async queryResearch(
		topic: string,
		budget: number,
		signal?: AbortSignal,
	): Promise<EvidenceBundle> {
		if (typeof topic !== "string" || topic.trim().length === 0) {
			throw new LensPortError("ADAPTER_FAILURE", "Research topic must be a non-empty string");
		}
		if (!Number.isFinite(budget) || budget < 1) {
			throw new LensPortError("ADAPTER_FAILURE", "Research budget must be a number >= 1");
		}
		if (signal?.aborted) {
			throw new LensPortError("CANCELLED", "Research pass cancelled before it started");
		}

		let urls: readonly string[];
		try {
			urls = await this.candidateUrlProvider(topic, budget);
		} catch (error) {
			throw new LensPortError("ADAPTER_FAILURE", "Candidate URL discovery failed", { cause: error });
		}

		let pages;
		try {
			pages = await this.scraper.scrape(urls, budget, signal);
		} catch (error) {
			if (error instanceof Error && error.name === "AbortError") {
				throw new LensPortError("CANCELLED", "Research pass cancelled mid-scrape");
			}
			throw new LensPortError("ADAPTER_FAILURE", "Scrape phase failed", { cause: error });
		}

		const claims = this.synthesizeClaims(topic, pages.pages);
		const createdAt = this.now().toISOString();
		const digest = bundleDigestOf({ createdAt, topic, claims });
		const bundle: EvidenceBundle = {
			contentIsUntrusted: true,
			metadata: {
				digest,
				createdAt,
				topic,
				claimCount: claims.length,
			},
			claims,
		};
		await this.store.saveBundle(this.sessionId, bundle);
		return bundle;
	}

	async getCitationExcerpt(
		bundleDigest: string,
		claimId: string,
	): Promise<VerifiedExcerpt> {
		const bundle = await this.store.loadBundle(this.sessionId, bundleDigest);
		const claim = bundle.claims.find((c) => c.claimId === claimId);
		if (!claim) {
			throw new LensPortError(
				"EVIDENCE_NOT_FOUND",
				`Claim ${claimId} does not exist in bundle ${bundleDigest.slice(0, 12)}…`,
			);
		}
		return {
			contentIsUntrusted: true,
			claimId: claim.claimId,
			excerpt: claim.quotations[0] ?? claim.statement,
			sourceUrl: claim.sourceUrls[0] ?? "",
			bundleDigest,
		};
	}

	async listBundles(sessionId: string): Promise<readonly EvidenceBundleMetadata[]> {
		return this.store.loadIndex(sessionId);
	}

	async getBundle(sessionId: string, digest: string): Promise<EvidenceBundle> {
		return this.store.loadBundle(sessionId, digest);
	}

	/**
	 * Rank scraped passages with BM25 and distill one claim per hit.
	 * Confidence is a rank-derived squash of the BM25 score — a Phase-1
	 * heuristic, not a semantic judgment.
	 */
	private synthesizeClaims(
		topic: string,
		pages: readonly { url: string; title: string; text: string }[],
	): readonly VerifiedClaim[] {
		const passages: { id: string; text: string; url: string }[] = [];
		for (const [pageIndex, page] of pages.entries()) {
			for (const [chunkIndex, chunk] of chunkText(page.text, PASSAGE_CHARS).entries()) {
				passages.push({
					id: `p${pageIndex}:${chunkIndex}`,
					text: `${page.title}. ${chunk}`,
					url: page.url,
				});
			}
		}
		if (passages.length === 0) {
			return [];
		}
		const index = new Bm25Index();
		index.add(...passages);
		const hits = index.search(topic, passages.length);
		return hits.map((hit, i) => {
			const passage = passages.find((p) => p.id === hit.id);
			if (!passage) {
				throw new LensPortError("ADAPTER_FAILURE", "BM25 returned an unknown passage id");
			}
			return {
				// Untrusted-content marker: research output informs the loop,
				// never authorizes it (ports contract).
				contentIsUntrusted: true,
				claimId: `claim-${String(i + 1).padStart(4, "0")}`,
				statement: distillStatement(passage.text),
				quotations: [passage.text.slice(0, QUOTATION_CHARS)],
				sourceUrls: [passage.url],
				confidence: squash(hit.score),
			};
		});
	}
}

/** Split text into bounded chunks at sentence boundaries where possible. */
function chunkText(text: string, size: number): string[] {
	const chunks: string[] = [];
	let rest = text.trim();
	while (rest.length > 0) {
		if (rest.length <= size) {
			chunks.push(rest);
			break;
		}
		let cut = rest.lastIndexOf(". ", size);
		if (cut < size / 2) {
			cut = size;
		}
		chunks.push(rest.slice(0, cut).trim());
		rest = rest.slice(cut).trim();
	}
	return chunks;
}

/** First sentence (or a bounded prefix) becomes the claim statement. */
function distillStatement(text: string): string {
	const firstSentence = text.split(/(?<=[.!?])\s+/)[0] ?? text;
	const statement =
		firstSentence.length > STATEMENT_CHARS
			? `${firstSentence.slice(0, STATEMENT_CHARS)}…`
			: firstSentence;
	return statement.trim();
}

/** Squash an unbounded positive score into (0, 1). */
function squash(score: number): number {
	return score / (score + 1);
}
