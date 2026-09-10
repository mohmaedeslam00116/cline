import { afterAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { RuntimeCapabilities } from "@cline/core";
import { bundleDigestOf, EvidenceStore } from "@lens/research";
import {
	attachLensRuntimeCapabilities,
	attachLensSession,
	createLensEvidenceTool,
	detachLensSession,
	getLensSessionState,
	isLensModeEnabled,
} from "./lens-sidecar";
import { createSidecarContext } from "./context";
import { handleCommand } from "./commands";
import type { SidecarContext, SidecarWebSocketClient } from "./types";

const tempDirs: string[] = [];
afterAll(async () => {
	await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
});

/** Records every broadcast event so denials can be asserted on the transport. */
function makeRecordedContext(workspaceRoot = "/"): {
	ctx: SidecarContext;
	events: { name: string; payload: unknown }[];
} {
	const events: { name: string; payload: unknown }[] = [];
	const ctx = createSidecarContext(workspaceRoot);
	// The wire envelope is encodeSidecarEvent's:
	// { type: "event", event: { name, payload } } — a fake client is a
	// faithful recorder of everything broadcast.
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

const approvalRequest = (toolName: string, toolCallId = "call-1") =>
	({
		sessionId: "sess-lens",
		agentId: "agent-1",
		conversationId: "conv-1",
		iteration: 1,
		toolCallId,
		toolName,
		input: {},
		policy: { autoApprove: false },
	}) as Parameters<NonNullable<RuntimeCapabilities["requestToolApproval"]>>[0];

describe("lens-sidecar wiring", () => {
	it("isLensModeEnabled is env-driven and defaults off", () => {
		const previous = process.env.LENS_MODE;
		try {
			delete process.env.LENS_MODE;
			expect(isLensModeEnabled()).toBe(false);
			process.env.LENS_MODE = "1";
			expect(isLensModeEnabled()).toBe(true);
			process.env.LENS_MODE = "off";
			expect(isLensModeEnabled()).toBe(false);
		} finally {
			if (previous === undefined) {
				delete process.env.LENS_MODE;
			} else {
				process.env.LENS_MODE = previous;
			}
		}
	});

	it("mutating tools are denied by policy BEFORE the user surface, and the denial is transport-observable", async () => {
		process.env.LENS_MODE = "1";
		const { ctx, events } = makeRecordedContext();
		attachLensSession(ctx, "sess-lens");
		const base: RuntimeCapabilities = {
			requestToolApproval: () =>
				Promise.resolve({ approved: true, reason: "user approved (should never happen)" }),
		};
		const wrapped = attachLensRuntimeCapabilities(base, ctx);

		const denial = await wrapped.requestToolApproval?.(
			approvalRequest("write_to_file", "deny-1"),
		);
		expect(denial?.approved).toBe(false);
		expect(denial?.reason).toContain("[LENS policy]");

		// The DoD: the denial is observable on the transport.
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(events).toContainEqual(
			expect.objectContaining({
				name: "lens_policy_denied",
				payload: expect.objectContaining({
					sessionId: "sess-lens",
					toolCallId: "deny-1",
					toolName: "write_to_file",
				}),
			}),
		);
	});

	it("read-only allowlist calls pass through to the sidecar approval surface", async () => {
		process.env.LENS_MODE = "1";
		const { ctx } = makeRecordedContext();
		attachLensSession(ctx, "sess-lens");
		let reachedBase = false;
		const base: RuntimeCapabilities = {
			requestToolApproval: () => {
				reachedBase = true;
				return { approved: true, reason: "user surface" };
			},
		};
		const wrapped = attachLensRuntimeCapabilities(base, ctx);
		const result = await wrapped.requestToolApproval?.(
			approvalRequest("read_file", "allow-1"),
		);
		expect(reachedBase).toBe(true);
		expect(result?.approved).toBe(true);
	});

	it("the evidence tool returns verified excerpts through the total error boundary", async () => {
		process.env.LENS_MODE = "1";
	const root = await mkdtemp(path.join(tmpdir(), "lens-sidecar-"));
	tempDirs.push(root);
	// Bind the whole context (and therefore the LENS store/engine/executor
	// graph) to the temp workspace — no patching required.
	const { ctx } = makeRecordedContext(root);
	const store = new EvidenceStore({ workspaceRoot: root });
		const createdAt = "2026-09-10T00:00:00.000Z";
		const claims = [
			{
				claimId: "claim-0001",
				statement: "Rust prevents data races at compile time.",
				quotations: ["Rust prevents data races at compile time — quoted."],
				sourceUrls: ["https://example.com/rust"],
				confidence: 0.8,
			},
		];
		const digest = bundleDigestOf({ createdAt, topic: "rust", claims });
		await store.saveBundle("sess-lens", {
			contentIsUntrusted: true,
			metadata: { digest, createdAt, topic: "rust", claimCount: 1 },
			claims,
		});

		attachLensSession(ctx, "sess-lens");

		const tool = createLensEvidenceTool(ctx, () => "sess-lens");
		const output = await tool.execute(
			{ bundleDigest: digest, claimId: "claim-0001" },
			{ agentId: "agent-1", iteration: 1 },
		);
		const parsed = JSON.parse(output) as Record<string, unknown>;
		expect(parsed.ok).toBe(true);
		expect(parsed.contentIsUntrusted).toBe(true);
		expect(parsed.claimId).toBe("claim-0001");
	});

	it("unknown sessions get a structured error, never a throw", async () => {
		process.env.LENS_MODE = "1";
		const { ctx } = makeRecordedContext();
		const tool = createLensEvidenceTool(ctx, () => "sess-missing");
		const output = await tool.execute(
			{ bundleDigest: "a".repeat(64), claimId: "claim-0001" },
			{ agentId: "agent-1", iteration: 1 },
		);
		const parsed = JSON.parse(output) as { ok: boolean };
		expect(parsed.ok).toBe(false);
	});

	it("transport commands expose metadata only, and detach clears session state", async () => {
		process.env.LENS_MODE = "1";
		const { ctx } = makeRecordedContext();
		attachLensSession(ctx, "sess-cmds");

		const index = (await handleCommand(ctx, "lens_evidence_index", {
			sessionId: "sess-cmds",
		})) as { lensMode: boolean; bundles: unknown[] };
		expect(index.lensMode).toBe(true);
		expect(Array.isArray(index.bundles)).toBe(true);

		const audit = (await handleCommand(ctx, "lens_policy_audit", {
			sessionId: "sess-cmds",
		})) as { lensMode: boolean; auditTrail: unknown[] };
		expect(audit.lensMode).toBe(true);
		expect(Array.isArray(audit.auditTrail)).toBe(true);

		detachLensSession(ctx, "sess-cmds");
		expect(getLensSessionState(ctx, "sess-cmds")).toBeNull();
	});
});
