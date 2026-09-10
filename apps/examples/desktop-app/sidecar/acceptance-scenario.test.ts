import { createHash } from "node:crypto";
import {
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { RuntimeCapabilities } from "@cline/core";
import { type FetchLike, ScraperPool } from "@lens/research";
import { afterAll, describe, expect, it } from "vitest";
import { handleCommand } from "./commands";
import { createSidecarContext } from "./context";
import {
	attachLensRuntimeCapabilities,
	attachLensSession,
	createLensEvidenceTool,
	detachLensSession,
	isLensModeEnabled,
} from "./lens-sidecar";
import type { SidecarContext, SidecarWebSocketClient } from "./types";

const tempDirs: string[] = [];
afterAll(async () => {
	await Promise.all(
		tempDirs.map((dir) => rm(dir, { recursive: true, force: true })),
	);
});

/**
 * Computes a deterministic SHA-256 snapshot hash over all repository source files.
 * Ignores LENS runtime artifacts (.lens/) and version control (.git/).
 * Proves that zero repository mutations occurred during Phase 1 operations.
 */
async function computeRepoSnapshotHash(workspaceRoot: string): Promise<string> {
	const entries = await readdir(workspaceRoot, {
		recursive: true,
		withFileTypes: true,
	});
	const regularFiles = entries
		.filter((dirent) => dirent.isFile())
		.map((dirent) => {
			const parent =
				"parentPath" in dirent &&
				typeof (dirent as { parentPath?: unknown }).parentPath === "string"
					? (dirent as { parentPath: string }).parentPath
					: workspaceRoot;
			const full = path.join(parent, dirent.name);
			const rel = path.relative(workspaceRoot, full).replace(/\\/g, "/");
			return { rel, full };
		})
		.filter(
			({ rel }) =>
				!rel.startsWith(".lens/") &&
				!rel.startsWith(".git/") &&
				!rel.startsWith("node_modules/"),
		)
		.sort((a, b) => a.rel.localeCompare(b.rel));

	const hasher = createHash("sha256");
	for (const file of regularFiles) {
		const content = await readFile(file.full);
		const contentHash = createHash("sha256").update(content).digest("hex");
		hasher.update(`${file.rel}:${contentHash}\n`);
	}
	return hasher.digest("hex");
}

function makeRecordedContext(workspaceRoot: string): {
	ctx: SidecarContext;
	events: { name: string; payload: unknown }[];
} {
	const events: { name: string; payload: unknown }[] = [];
	const ctx = createSidecarContext(workspaceRoot);
	const recorder: SidecarWebSocketClient = {
		send: (message) => {
			const parsed = JSON.parse(message) as {
				event?: { name?: string; payload?: unknown };
			};
			if (parsed.event?.name) {
				events.push({ name: parsed.event.name, payload: parsed.event.payload });
			}
		},
	};
	ctx.wsClients.add(recorder);
	return { ctx, events };
}

const makeApprovalRequest = (
	sessionId: string,
	toolName: string,
	toolCallId = "call-1",
) =>
	({
		sessionId,
		agentId: "agent-acceptance",
		conversationId: "conv-acceptance",
		iteration: 1,
		toolCallId,
		toolName,
		input: {},
		policy: { autoApprove: false },
	}) as Parameters<NonNullable<RuntimeCapabilities["requestToolApproval"]>>[0];

describe("LENS Phase 1 Acceptance Scenario", () => {
	it("executes prompt → deep research → persisted EvidenceBundle → Claims Index → citations → zero mutation", async () => {
		process.env.LENS_MODE = "1";
		expect(isLensModeEnabled()).toBe(true);

		// 1. Initialize clean workspace repository with sample files
		const wsRoot = await mkdtemp(path.join(tmpdir(), "lens-acceptance-"));
		tempDirs.push(wsRoot);

		await mkdir(path.join(wsRoot, "src"), { recursive: true });
		await writeFile(
			path.join(wsRoot, "src", "index.ts"),
			`export function greet(name: string): string {\n\treturn "Hello, " + name;\n}\n`,
			"utf8",
		);
		await writeFile(
			path.join(wsRoot, "src", "utils.ts"),
			`export const add = (a: number, b: number): number => a + b;\n`,
			"utf8",
		);
		await writeFile(
			path.join(wsRoot, "package.json"),
			JSON.stringify({ name: "demo-repo", version: "0.1.0" }, null, 2),
			"utf8",
		);

		// 2. Compute initial RepoSnapshotHash (clean base state)
		const initialSnapshotHash = await computeRepoSnapshotHash(wsRoot);
		expect(typeof initialSnapshotHash).toBe("string");
		expect(initialSnapshotHash.length).toBe(64);

		// 3. Setup Sidecar Context & Mock Web Research
		const { ctx, events } = makeRecordedContext(wsRoot);

		const mockDocumentationHtml = `
<!DOCTYPE html>
<html>
<head><title>TypeScript Strict Null Checks Guide</title></head>
<body>
<main>
	<h1>Strict Null Checks in TypeScript</h1>
	<p>When strictNullChecks is enabled, null and undefined have their own distinct types.</p>
	<p>Rust prevents data races at compile time through its ownership and borrowing system.</p>
	<p>TypeScript compiler ensures null safety by preventing accidental dereferencing of undefined objects.</p>
</main>
</body>
</html>
		`.trim();

		const candidateUrl = "https://example.com/docs/strict-null-checks";
		const candidateUrlProvider = async (topic: string, budget: number) => {
			expect(topic).toContain("strict null checks");
			expect(budget).toBeGreaterThanOrEqual(1);
			return [candidateUrl];
		};

		const mockFetch: FetchLike = async (_url) => {
			return new Response(mockDocumentationHtml, {
				status: 200,
				headers: { "content-type": "text/html" },
			});
		};

		const scraper = new ScraperPool({ fetchImpl: mockFetch });

		// Phase 1 Step 1: Prompt → Deep web research → EvidenceBundle persisted content-addressed
		const researchSessionId = "session-loop1-research";
		const researchState = attachLensSession(ctx, researchSessionId, {
			candidateUrlProvider,
			scraper,
		});

		const bundle = await researchState.engine.queryResearch(
			"TypeScript strict null checks",
			2,
		);

		// Verify EvidenceBundle properties and untrusted marker
		expect(bundle.contentIsUntrusted).toBe(true);
		expect(bundle.metadata.topic).toBe("TypeScript strict null checks");
		expect(bundle.metadata.claimCount).toBeGreaterThan(0);
		expect(bundle.claims.length).toBeGreaterThan(0);
		expect(bundle.claims.every((c) => c.contentIsUntrusted === true)).toBe(
			true,
		);

		// Verify bundle is persisted content-addressed under <workspace>/.lens/sessions/<id>/evidence/<digest>.json
		const bundleDigest = bundle.metadata.digest;
		expect(bundleDigest).toMatch(/^[a-f0-9]{64}$/);

		const persistedBundlePath = path.join(
			wsRoot,
			".lens",
			"sessions",
			researchSessionId,
			"evidence",
			`${bundleDigest}.json`,
		);
		const persistedRaw = await readFile(persistedBundlePath, "utf8");
		const persistedParsed = JSON.parse(persistedRaw) as typeof bundle;
		expect(persistedParsed.metadata.digest).toBe(bundleDigest);
		expect(persistedParsed.contentIsUntrusted).toBe(true);

		// Phase 1 Step 2: New session with Claims Index
		const codingSessionId = "session-loop2-coding";
		attachLensSession(ctx, codingSessionId);

		// Verify Claims Index can be listed via transport command
		const evidenceIndexResponse = (await handleCommand(
			ctx,
			"lens_evidence_index",
			{
				sessionId: researchSessionId,
			},
		)) as {
			lensMode: boolean;
			bundles: Array<{ digest: string; claimCount: number; topic: string }>;
		};

		expect(evidenceIndexResponse.lensMode).toBe(true);
		expect(evidenceIndexResponse.bundles).toHaveLength(1);
		expect(evidenceIndexResponse.bundles[0].digest).toBe(bundleDigest);
		expect(evidenceIndexResponse.bundles[0].claimCount).toBe(
			bundle.claims.length,
		);

		// Phase 1 Step 3: Repo questions answered with get_evidence_detail citations
		const evidenceTool = createLensEvidenceTool(ctx, () => researchSessionId);
		expect(evidenceTool.name).toBe("get_evidence_detail");

		const targetClaim = bundle.claims[0];
		const toolOutputStr = await evidenceTool.execute(
			{
				bundleDigest,
				claimId: targetClaim.claimId,
			},
			{ agentId: "agent-acceptance", iteration: 1 },
		);

		const toolOutput = JSON.parse(toolOutputStr) as {
			ok: boolean;
			claimId: string;
			bundleDigest: string;
			contentIsUntrusted: boolean;
			excerpt: string;
			sourceUrl: string;
		};

		expect(toolOutput.ok).toBe(true);
		expect(toolOutput.contentIsUntrusted).toBe(true);
		expect(toolOutput.claimId).toBe(targetClaim.claimId);
		expect(toolOutput.bundleDigest).toBe(bundleDigest);
		expect(toolOutput.sourceUrl).toBe(candidateUrl);
		expect(typeof toolOutput.excerpt).toBe("string");
		expect(toolOutput.excerpt.length).toBeGreaterThan(0);

		// Phase 1 Step 4: Policy denial tests prove mutating tools fail closed
		let reachedBaseForReadOnly = false;
		const baseCapabilities: RuntimeCapabilities = {
			requestToolApproval: (request) => {
				if (request.toolName === "read_file") {
					reachedBaseForReadOnly = true;
				}
				return Promise.resolve({ approved: true, reason: "base approved" });
			},
		};

		const lensCapabilities = attachLensRuntimeCapabilities(
			baseCapabilities,
			ctx,
		);

		// Mutating tool write_to_file MUST fail closed
		const writeDenial = await lensCapabilities.requestToolApproval?.(
			makeApprovalRequest(codingSessionId, "write_to_file", "write-call-1"),
		);
		expect(writeDenial?.approved).toBe(false);
		expect(writeDenial?.reason).toContain("[LENS policy]");

		// Mutating tool execute_command MUST fail closed
		const execDenial = await lensCapabilities.requestToolApproval?.(
			makeApprovalRequest(codingSessionId, "execute_command", "exec-call-1"),
		);
		expect(execDenial?.approved).toBe(false);
		expect(execDenial?.reason).toContain("[LENS policy]");

		// Read-only tool read_file passes through to base approval
		const readResult = await lensCapabilities.requestToolApproval?.(
			makeApprovalRequest(codingSessionId, "read_file", "read-call-1"),
		);
		expect(readResult?.approved).toBe(true);
		expect(reachedBaseForReadOnly).toBe(true);

		// Transport audit verification
		const policyAuditResponse = (await handleCommand(ctx, "lens_policy_audit", {
			sessionId: codingSessionId,
		})) as {
			lensMode: boolean;
			auditTrail: unknown[];
			recentDecisions: Array<{
				toolCallId: string;
				approved: boolean;
				policyDenied?: boolean;
				reason: string;
			}>;
		};

		expect(policyAuditResponse.lensMode).toBe(true);
		expect(policyAuditResponse.recentDecisions.length).toBeGreaterThanOrEqual(
			2,
		);
		expect(
			policyAuditResponse.recentDecisions.some(
				(entry) => entry.toolCallId === "write-call-1" && !entry.approved,
			),
		).toBe(true);
		expect(
			policyAuditResponse.recentDecisions.some(
				(entry) => entry.toolCallId === "exec-call-1" && !entry.approved,
			),
		).toBe(true);

		// Verify observable denial events were emitted to the WebSocket client
		await new Promise((resolve) => setTimeout(resolve, 25));
		const deniedEvents = events.filter((e) => e.name === "lens_policy_denied");
		expect(deniedEvents.length).toBeGreaterThanOrEqual(2);
		expect(deniedEvents).toContainEqual(
			expect.objectContaining({
				payload: expect.objectContaining({
					sessionId: codingSessionId,
					toolName: "write_to_file",
					toolCallId: "write-call-1",
				}),
			}),
		);

		// Phase 1 Step 5: RepoSnapshotHash provably unchanged (zero mutation)
		const finalSnapshotHash = await computeRepoSnapshotHash(wsRoot);
		expect(finalSnapshotHash).toBe(initialSnapshotHash);

		// Cleanup sessions
		detachLensSession(ctx, researchSessionId);
		detachLensSession(ctx, codingSessionId);
	});
});
