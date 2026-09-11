import { describe, expect, it } from "bun:test";
import { LensPortError } from "@lens/ports";
import { createGetEvidenceDetailExecutor } from "./evidence-tool.js";

const deps = {
	getCitationExcerpt: async (bundleDigest: string, claimId: string) => ({
		claimId,
		excerpt: "Exact quoted excerpt from the source.",
		sourceUrl: "https://example.com/source",
		bundleDigest,
	}),
};

describe("createGetEvidenceDetailExecutor", () => {
	it("returns ok JSON with the untrusted marker for a valid target", async () => {
		const executor = createGetEvidenceDetailExecutor(deps);
		const output = await executor({
			bundleDigest: "a".repeat(64),
			claimId: "claim-0001",
		});
		const parsed = JSON.parse(output) as Record<string, unknown>;
		expect(parsed.ok).toBe(true);
		expect(parsed.contentIsUntrusted).toBe(true);
		expect(parsed.excerpt).toBe("Exact quoted excerpt from the source.");
		expect(parsed.claimId).toBe("claim-0001");
	});

	it("never throws: malformed input becomes an error payload", async () => {
		const executor = createGetEvidenceDetailExecutor(deps);
		for (const bad of [
			undefined,
			null,
			"text",
			{},
			{ bundleDigest: "a".repeat(64) },
			42,
		]) {
			const output = await executor(bad);
			const parsed = JSON.parse(output) as { ok: boolean };
			expect(parsed.ok).toBe(false);
		}
	});

	it("maps LensPortError codes into the error payload", async () => {
		const executor = createGetEvidenceDetailExecutor({
			getCitationExcerpt: async () => {
				throw new LensPortError("EVIDENCE_NOT_FOUND", "no such claim");
			},
		});
		const output = await executor({
			bundleDigest: "a".repeat(64),
			claimId: "claim-0001",
		});
		const parsed = JSON.parse(output) as {
			ok: boolean;
			error: { code: string; message: string };
		};
		expect(parsed.ok).toBe(false);
		expect(parsed.error.code).toBe("EVIDENCE_NOT_FOUND");
		expect(parsed.error.message).toBe("no such claim");
	});

	it("maps unexpected adapter crashes into a generic ADAPTER_FAILURE payload", async () => {
		const executor = createGetEvidenceDetailExecutor({
			getCitationExcerpt: async () => {
				throw new Error("disk exploded");
			},
		});
		const output = await executor({
			bundleDigest: "a".repeat(64),
			claimId: "claim-0001",
		});
		const parsed = JSON.parse(output) as {
			ok: boolean;
			error: { code: string };
		};
		expect(parsed.ok).toBe(false);
		expect(parsed.error.code).toBe("ADAPTER_FAILURE");
	});
});
