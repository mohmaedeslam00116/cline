export type { IndexedDocument, ScoredDocument } from "./bm25.js";

export { Bm25Index, tokenize } from "./bm25.js";
export { canonicalJson } from "./canonical-json.js";
export type {
	CandidateUrlProvider,
	LensResearchEngineOptions,
} from "./engine.js";
export { LensResearchEngine } from "./engine.js";
export type { EvidenceStoreOptions } from "./evidence-store.js";
export { bundleDigestOf, EvidenceStore, sha256Hex } from "./evidence-store.js";
export type {
	EvidenceDetailTarget,
	GetEvidenceDetailDeps,
	GetEvidenceDetailFn,
} from "./evidence-tool.js";
export { createGetEvidenceDetailExecutor } from "./evidence-tool.js";
export type {
	FetchedPage,
	FetchLike,
	ScrapeResult,
	ScraperPoolOptions,
	SkippedPage,
} from "./scraper-pool.js";
export { extractText, ScraperPool } from "./scraper-pool.js";
