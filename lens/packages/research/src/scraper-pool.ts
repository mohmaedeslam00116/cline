/**
 * Bounded public-web scraper pool (ADR-0004: the Phase-1 research engine is
 * credential-free — local BM25 + bounded public scraping only).
 *
 * Safety posture:
 * - `budget` is a hard cap on fetches per pass; `concurrency` caps in-flight.
 * - Fetch failures are soft: a failed page is skipped and reported, never fatal.
 * - Fetched text is UNTRUSTED by definition: it is data to index, never
 *   instructions to follow. Nothing here ever executes page content.
 * - Per-page text is clipped to `maxPageChars` before it can reach the index.
 */

export interface FetchedPage {
	readonly url: string;
	readonly title: string;
	readonly text: string;
	/** Raw HTML size seen on the wire, before extraction/clipping. */
	readonly byteLength: number;
}

export interface SkippedPage {
	readonly url: string;
	readonly reason: string;
}

export interface ScrapeResult {
	readonly pages: readonly FetchedPage[];
	readonly skipped: readonly SkippedPage[];
}

export type FetchLike = (url: string, signal?: AbortSignal) => Promise<Response>;

export interface ScraperPoolOptions {
	/** Max fetches in flight per batch. Default 3. */
	readonly concurrency?: number;
	/** Max characters of extracted text kept per page. Default 20_000. */
	readonly maxPageChars?: number;
	/** Per-fetch timeout in ms. Default 10_000. */
	readonly fetchTimeoutMs?: number;
	/** Injectable fetch (tests pass a stub). Default: global fetch. */
	readonly fetchImpl?: FetchLike;
}

export class ScraperPool {
	private readonly concurrency: number;
	private readonly maxPageChars: number;
	private readonly fetchTimeoutMs: number;
	private readonly fetchImpl: FetchLike;

	constructor(options: ScraperPoolOptions = {}) {
		this.concurrency = Math.max(1, options.concurrency ?? 3);
		this.maxPageChars = Math.max(1, options.maxPageChars ?? 20_000);
		this.fetchTimeoutMs = Math.max(1, options.fetchTimeoutMs ?? 10_000);
		this.fetchImpl = options.fetchImpl ?? ((url, signal) => fetch(url, { signal }));
	}

	/**
	 * Fetch up to `budget` unique URLs. Batches of `concurrency` run in
	 * parallel; an aborted `signal` stops before the next batch. If the
	 * caller's signal was already aborted, rejects immediately with an
	 * `AbortError` (callers translate that to their cancellation contract).
	 */
	async scrape(
		urls: readonly string[],
		budget: number,
		signal?: AbortSignal,
	): Promise<ScrapeResult> {
		if (signal?.aborted) {
			throw abortError();
		}
		const targets = [...new Set(urls)].slice(0, Math.max(0, budget));
		const pages: FetchedPage[] = [];
		const skipped: SkippedPage[] = [];
		for (let i = 0; i < targets.length; i += this.concurrency) {
			if (signal?.aborted) {
				throw abortError();
			}
			const batch = targets.slice(i, i + this.concurrency);
			const settled = await Promise.allSettled(
				batch.map((url) => this.fetchPage(url, signal)),
			);
			for (let j = 0; j < batch.length; j++) {
				const outcome = settled[j];
				if (outcome?.status === "fulfilled") {
					pages.push(outcome.value);
				} else if (outcome?.status === "rejected") {
					skipped.push({
						url: batch[j] as string,
						reason: errorReason(outcome.reason),
					});
				}
			}
		}
		return { pages, skipped };
	}

	private async fetchPage(url: string, signal?: AbortSignal): Promise<FetchedPage> {
		if (isBlockedUrl(url)) {
			throw new Error("Blocked internal or non-HTTP URL");
		}
		const controller = new AbortController();
		const abortAll = () => controller.abort();
		const timer = setTimeout(abortAll, this.fetchTimeoutMs);
		signal?.addEventListener("abort", abortAll, { once: true });
		try {
			const response = await this.fetchImpl(url, controller.signal);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			const html = await response.text();
			const { title, text } = extractText(html);
			return {
				url,
				title,
				text: text.slice(0, this.maxPageChars),
				byteLength: html.length,
			};
		} finally {
			clearTimeout(timer);
			signal?.removeEventListener("abort", abortAll);
		}
	}
}

function abortError(): Error {
	const error = new Error("Scrape aborted");
	error.name = "AbortError";
	return error;
}

function errorReason(reason: unknown): string {
	if (reason instanceof Error) {
		return reason.message;
	}
	return String(reason);
}

function isBlockedUrl(urlString: string): boolean {
	try {
		const parsed = new URL(urlString);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			return true;
		}
		const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
		if (
			host === "localhost" ||
			host === "127.0.0.1" ||
			host === "::1" ||
			host === "0.0.0.0" ||
			host.startsWith("127.") ||
			host.startsWith("169.254.") ||
			host.startsWith("10.") ||
			host.startsWith("192.168.") ||
			/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
		) {
			return true;
		}
		return false;
	} catch {
		return true;
	}
}

/**
 * Tolerant HTML → text extraction: drop script/style blocks, strip tags,
 * decode a minimal entity set, collapse whitespace. Phase-1 keeps this
 * dependency-free; it is deliberately best-effort.
 */
export function extractText(html: string): { title: string; text: string } {
	const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
	const title = decodeEntities(titleMatch?.[1] ?? "").trim();
	const withoutHeadAndScripts = html
		// The title is metadata (already extracted); head content must not
		// duplicate into the body text.
		.replace(/<head[\s\S]*?<\/head>/gi, " ")
		.replace(/<script[\s\S]*?<\/script>/gi, " ")
		.replace(/<style[\s\S]*?<\/style>/gi, " ")
		.replace(/<[^>]+>/g, " ");
	const text = decodeEntities(withoutHeadAndScripts).replace(/\s+/g, " ").trim();
	return { title, text };
}

function decodeEntities(input: string): string {
	return input
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#0?39;/g, "'")
		.replace(/&nbsp;/g, " ");
}
