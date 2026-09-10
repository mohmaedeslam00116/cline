import { afterAll, describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { LensPortError } from "@lens/ports";
import type { EvidenceBundle } from "@lens/ports";
import { bundleDigestOf, EvidenceStore } from "./evidence-store.js";

const tempDirs: string[] = [];
afterAll(async () => {
	await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
});

async function makeStore(): Promise<{ store: EvidenceStore; root: string }> {
	const root = await mkdtemp(path.join(tmpdir(), "lens-store-"));
	tempDirs.push(root);
	return { store: new EvidenceStore({ workspaceRoot: root }), root };
}

const makeBundle = (topic: string, claims: string[]): EvidenceBundle => {
	const createdAt = "2026-09-10T00:00:00.000Z";
	const claimList = claims.map((statement, i) => ({
		claimId: `claim-${String(i + 1).padStart(4, "0")}`,
		statement,
		quotations: [`${statement} — quoted verbatim`],
		sourceUrls: ["https://example.com/source"],
		confidence: 0.5,
	}));
	return {
		contentIsUntrusted: true,
		metadata: {
			digest: bundleDigestOf({ createdAt, topic, claims: claimList }),
			createdAt,
			topic,
			claimCount: claimList.length,
		},
		claims: claimList,
	};
};

describe("EvidenceStore", () => {
	it("saves a bundle content-addressed and loads it back verified", async () => {
		const { store, root } = await makeStore();
		const bundle = makeBundle("rust async", ["Tokio is the de facto runtime"]);
		await store.saveBundle("sess-1", bundle);
		const filePath = path.join(
			root,
			".lens",
			"sessions",
			"sess-1",
			"evidence",
			`${bundle.metadata.digest}.json`,
		);
		const raw = await readFile(filePath, "utf8");
		expect(JSON.parse(raw).contentIsUntrusted).toBe(true);
		const loaded = await store.loadBundle("sess-1", bundle.metadata.digest);
		expect(loaded.metadata.topic).toBe("rust async");
		expect(loaded.claims[0]?.claimId).toBe("claim-0001");
	});

	it("writing the same digest twice is a no-op (content addressing)", async () => {
		const { store } = await makeStore();
		const bundle = makeBundle("topic", ["claim one"]);
		await store.saveBundle("sess", bundle);
		await store.saveBundle("sess", bundle);
		const index = await store.loadIndex("sess");
		expect(index).toHaveLength(1);
	});

	it("loadBundle rejects EVIDENCE_NOT_FOUND for unknown digests", async () => {
		const { store } = await makeStore();
		const missing = "a".repeat(64);
		expect(store.loadBundle("sess", missing)).rejects.toMatchObject({
			code: "EVIDENCE_NOT_FOUND",
		});
	});

	it("detects tampered bundle content via digest mismatch", async () => {
		const { store, root } = await makeStore();
		const bundle = makeBundle("topic", ["untampered claim"]);
		await store.saveBundle("sess", bundle);
		const filePath = path.join(
			root,
			".lens",
			"sessions",
			"sess",
			"evidence",
			`${bundle.metadata.digest}.json`,
		);
		const parsed = JSON.parse(await readFile(filePath, "utf8")) as {
			claims: { statement: string }[];
		};
		parsed.claims[0]!.statement = "TAMPERED";
		await writeFile(filePath, JSON.stringify(parsed));
		expect(store.loadBundle("sess", bundle.metadata.digest)).rejects.toMatchObject({
			code: "ADAPTER_FAILURE",
		});
	});

	it("rejects malformed digests and unsafe session ids", async () => {
		const { store } = await makeStore();
		expect(store.loadBundle("sess", "../escape")).rejects.toMatchObject({
			code: "EVIDENCE_NOT_FOUND",
		});
		expect(
			store.loadBundle("../../evil", "a".repeat(64)),
		).rejects.toMatchObject({ code: "SECURITY_ACCESS_DENIED" });
	});

	it("maintains the manifest in insertion order and lists it", async () => {
		const { store } = await makeStore();
		const first = makeBundle("first topic", ["claim a"]);
		await store.saveBundle("sess", first);
		const second = makeBundle("second topic", ["claim b"]);
		await store.saveBundle("sess", second);
		const index = await store.loadIndex("sess");
		expect(index.map((m) => m.topic)).toEqual(["first topic", "second topic"]);
	});

	it("returns an empty manifest for unknown sessions", async () => {
		const { store } = await makeStore();
		expect(await store.loadIndex("nope")).toEqual([]);
	});
});

async function writeFile(filePath: string, content: string): Promise<void> {
	const { writeFile: fsWriteFile } = await import("node:fs/promises");
	await fsWriteFile(filePath, content, "utf8");
}
