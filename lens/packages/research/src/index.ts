export { canonicalJson } from "./canonical-json.js";

export { Bm25Index, tokenize } from "./bm25.js";
export type { IndexedDocument, ScoredDocument } from "./bm25.js";

export { ScraperPool, extractText } from "./scraper-pool.js";
export type {
	FetchedPage,
	FetchLike,
	ScrapeResult,
	SkippedPage,
	ScraperPoolOptions,
} from "./scraper-pool.js";

export { EvidenceStore, bundleDigestOf, sha256Hex } from "./evidence-store.js";
export type { EvidenceStoreOptions } from "./evidence-store.js";

export { LensResearchEngine } from "./engine.js";
export type { CandidateUrlProvider, LensResearchEngineOptions } from "./engine.js";

export { createGetEvidenceDetailExecutor } from "./evidence-tool.js";
export type {
	EvidenceDetailTarget,
	GetEvidenceDetailDeps,
	GetEvidenceDetailFn,
} from "./evidence-tool.js";
