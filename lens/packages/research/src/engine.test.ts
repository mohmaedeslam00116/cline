import { afterEach, describe, expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { LensPortError } from "@lens/ports";
import { LensResearchEngine } from "./engine.js";
import { EvidenceStore } from "./evidence-store.js";
import { ScraperPool } from "./scraper-pool.js";

const tempDirs: string[] = [];
afterEach(async () => {
	while (tempDirs.length > 0) {
		const dir = tempDirs.pop();
		if (dir) {
			await rm(dir, { recursive: true, force: true });
		}
	}
});

type FetchStub = (url: string, signal?: AbortSignal) => Promise<Response>;

async function makeEngine(options?: {
	fetchImpl?: FetchStub;
	urls?: string[];
}): Promise<{
	engine: LensResearchEngine;
	store: EvidenceStore;
	sessionId: string;
}> {
	const root = await mkdtemp(path.join(tmpdir(), "lens-engine-"));
	tempDirs.push(root);
	const store = new EvidenceStore({ workspaceRoot: root });
	const sessionId = "sess-engine";
	const engine = new LensResearchEngine({
		sessionId,
		store,
		scraper: options?.fetchImpl
			? new ScraperPool({ fetchImpl: options.fetchImpl })
			: new ScraperPool({
					fetchImpl: async () => new Response("", { status: 200 }),
				}),
		candidateUrlProvider: () => options?.urls ?? ["https://example.com/one"],
		now: () => new Date("2026-09-10T12:00:00.000Z"),
	});
	return { engine, store, sessionId };
}

const html = (title: string, body: string): Response =>
	new Response(
		`<html><head><title>${title}</title></head><body>${body}</body></html>`,
		{ status: 200 },
	);

describe("LensResearchEngine.queryResearch", () => {
	it("produces a verified, content-addressed bundle with untrusted marker", async () => {
		const { engine, store, sessionId } = await makeEngine({
			fetchImpl: async () =>
				html(
					"Rust Guide",
					"Rust ownership prevents data races at compile time.",
				),
		});
		const bundle = await engine.queryResearch("rust ownership", 3);
		expect(bundle.contentIsUntrusted).toBe(true);
		expect(bundle.metadata.claimCount).toBe(bundle.claims.length);
		expect(bundle.claims.length).toBeGreaterThan(0);
		expect(bundle.claims[0]?.claimId).toBe("claim-0001");
		// The stored bundle matches the returned digest (content addressing).
		const stored = await store.loadBundle(sessionId, bundle.metadata.digest);
		expect(stored.metadata.topic).toBe("rust ownership");
	});

	it("is reproducible: same content in, same digest out", async () => {
		const page = html(
			"Stable Doc",
			"Consistent body text for hashing. Deterministic pipelines matter.",
		);
		const run = async () => {
			const { engine } = await makeEngine({
				fetchImpl: async () => page.clone(),
			});
			return (await engine.queryResearch("deterministic", 1)).metadata.digest;
		};
		expect(await run()).toBe(await run());
	});

	it("empty scrape results yield a zero-claim bundle, still persisted", async () => {
		const { engine } = await makeEngine({
			fetchImpl: async () => new Response("", { status: 404 }),
		});
		const bundle = await engine.queryResearch("nothing found", 1);
		expect(bundle.claims).toHaveLength(0);
		expect(bundle.metadata.claimCount).toBe(0);
	});

	it("rejects CANCELLED when the signal is pre-aborted", async () => {
		const { engine } = await makeEngine();
		const controller = new AbortController();
		controller.abort();
		await expect(
			engine.queryResearch("topic", 1, controller.signal),
		).rejects.toMatchObject({ code: "CANCELLED" });
	});

	it("validates topic and budget up front", async () => {
		const { engine } = await makeEngine();
		await expect(engine.queryResearch("   ", 1)).rejects.toMatchObject({
			code: "ADAPTER_FAILURE",
		});
		await expect(engine.queryResearch("topic", 0)).rejects.toMatchObject({
			code: "ADAPTER_FAILURE",
		});
	});

	it("wraps candidate-provider failure as ADAPTER_FAILURE", async () => {
		const root = await mkdtemp(path.join(tmpdir(), "lens-engine-"));
		tempDirs.push(root);
		const engine = new LensResearchEngine({
			sessionId: "s",
			store: new EvidenceStore({ workspaceRoot: root }),
			candidateUrlProvider: () => {
				throw new Error("discovery down");
			},
		});
		await expect(engine.queryResearch("topic", 1)).rejects.toMatchObject({
			code: "ADAPTER_FAILURE",
		});
	});
});

describe("LensResearchEngine citation surface", () => {
	it("getCitationExcerpt returns a verified excerpt and rejects unknown claims", async () => {
		const { engine } = await makeEngine({
			fetchImpl: async () => html("Doc", "Facts live here for citation."),
		});
		const bundle = await engine.queryResearch("facts", 1);
		const claim = bundle.claims[0];
		if (!claim) {
			throw new Error("Expected at least one claim");
		}
		const excerpt = await engine.getCitationExcerpt(
			bundle.metadata.digest,
			claim.claimId,
		);
		expect(excerpt.contentIsUntrusted).toBe(true);
		expect(excerpt.bundleDigest).toBe(bundle.metadata.digest);
		expect(excerpt.excerpt.length).toBeGreaterThan(0);
		expect(
			engine.getCitationExcerpt(bundle.metadata.digest, "claim-9999"),
		).rejects.toMatchObject({ code: "EVIDENCE_NOT_FOUND" });
	});

	it("listBundles and getBundle round-trip through the store", async () => {
		const { engine, sessionId } = await makeEngine({
			fetchImpl: async () => html("Doc", "Body for listing."),
		});
		const bundle = await engine.queryResearch("listing", 1);
		const index = await engine.listBundles(sessionId);
		expect(index.map((m) => m.digest)).toContain(bundle.metadata.digest);
		const loaded = await engine.getBundle(sessionId, bundle.metadata.digest);
		expect(loaded.claims).toEqual(bundle.claims);
	});

	it("getBundle rejects missing bundles with EVIDENCE_NOT_FOUND", async () => {
		const { engine, sessionId } = await makeEngine();
		await expect(
			engine.getBundle(sessionId, "b".repeat(64)),
		).rejects.toBeInstanceOf(LensPortError);
	});
});
