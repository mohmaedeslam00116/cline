import { describe, expect, it } from "bun:test";
import { extractText, ScraperPool } from "./scraper-pool.js";

const htmlPage = (title: string, body: string): string =>
	`<html><head><title>${title}</title></head><body>${body}</body></html>`;

const okResponse = (html: string): Response =>
	new Response(html, { status: 200, headers: { "content-type": "text/html" } });

describe("extractText", () => {
	it("strips script/style blocks and tags, decodes entities", () => {
		const { title, text } = extractText(
			"<html><head><title>Tok &amp; Tam</title></head><body><script>evil()</script><style>x{}</style><p>Rust &lt;3 safety</p></body></html>",
		);
		expect(title).toBe("Tok & Tam");
		expect(text).toBe("Rust <3 safety");
	});
});

describe("ScraperPool", () => {
	it("fetches at most budget URLs and dedupes", async () => {
		let fetches = 0;
		const pool = new ScraperPool({
			fetchImpl: async (url) => {
				fetches++;
				return okResponse(htmlPage("t", `content of ${url}`));
			},
		});
		const result = await pool.scrape(
			["https://a/1", "https://a/1", "https://a/2", "https://a/3", "https://a/4"],
			2,
		);
		expect(fetches).toBe(2);
		expect(result.pages).toHaveLength(2);
		expect(result.pages[0]?.url).toBe("https://a/1");
		expect(result.pages[0]?.title).toBe("t");
		expect(result.skipped).toHaveLength(0);
	});

	it("treats fetch failures as soft skips", async () => {
		const pool = new ScraperPool({
			fetchImpl: async (url) => {
				if (url.endsWith("bad")) {
					throw new Error("connection reset");
				}
				return okResponse(htmlPage("ok", "fine"));
			},
		});
		const result = await pool.scrape(["https://a/bad", "https://a/good"], 5);
		expect(result.pages).toHaveLength(1);
		expect(result.pages[0]?.url).toBe("https://a/good");
		expect(result.skipped).toEqual([
			{ url: "https://a/bad", reason: "connection reset" },
		]);
	});

	it("reports non-OK HTTP statuses as skips", async () => {
		const pool = new ScraperPool({
			fetchImpl: async () => new Response("nope", { status: 404 }),
		});
		const result = await pool.scrape(["https://a/404"], 1);
		expect(result.pages).toHaveLength(0);
		expect(result.skipped[0]?.reason).toBe("HTTP 404");
	});

	it("clips page text to maxPageChars", async () => {
		const pool = new ScraperPool({
			maxPageChars: 10,
			fetchImpl: async () => okResponse(htmlPage("t", "a".repeat(500))),
		});
		const result = await pool.scrape(["https://a/1"], 1);
		expect(result.pages[0]?.text).toHaveLength(10);
	});

	it("rejects immediately when the signal is already aborted", async () => {
		const pool = new ScraperPool({
			fetchImpl: async () => okResponse(htmlPage("t", "x")),
		});
		const controller = new AbortController();
		controller.abort();
		await expect(pool.scrape(["https://a/1"], 1, controller.signal)).rejects.toMatchObject({
			name: "AbortError",
		});
	});

	it("stops before the next batch when aborted mid-pass", async () => {
		let fetches = 0;
		const pool = new ScraperPool({
			concurrency: 1,
			fetchImpl: async (url, signal) => {
				fetches++;
				if (fetches === 2) {
					signal?.addEventListener("abort", () => {
						throw new Error("aborted");
					});
				}
				return okResponse(htmlPage("t", `page ${url}`));
			},
		});
		const controller = new AbortController();
		const promise = pool.scrape(
			["https://a/1", "https://a/2", "https://a/3"],
			3,
			controller.signal,
		);
		controller.abort();
		await expect(promise).rejects.toMatchObject({ name: "AbortError" });
		expect(fetches).toBe(1);
	});

	it("applies the per-fetch timeout", async () => {
		const pool = new ScraperPool({
			fetchTimeoutMs: 30,
			fetchImpl: (_url, signal) =>
				new Promise((_, reject) => {
					signal?.addEventListener(
						"abort",
						() => reject(new Error("aborted by timeout")),
						{ once: true },
					);
				}),
		});
		const result = await pool.scrape(["https://a/slow"], 1);
		expect(result.pages).toHaveLength(0);
		expect(result.skipped[0]?.reason).toBe("aborted by timeout");
	});
});
