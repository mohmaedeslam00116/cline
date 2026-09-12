import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleCommand } from "./commands";
import { createSidecarContext, getTeamMemoryService } from "./context";

describe("Sidecar Team Memory Commands", () => {
	let testWorkspaceRoot: string;
	const trustedOptions = {
		connection: { data: { canApproveTools: true } },
	} as any;
	const untrustedOptions = {
		connection: { data: { canApproveTools: false } },
	} as any;

	beforeEach(async () => {
		testWorkspaceRoot = await mkdtemp(join(tmpdir(), "lens-memory-sidecar-"));
	});

	afterEach(async () => {
		await rm(testWorkspaceRoot, { recursive: true, force: true });
	});

	it("rejects team memory operations when connection lacks canApproveTools", async () => {
		const ctx = createSidecarContext(testWorkspaceRoot);

		let commitErr: any;
		try {
			await handleCommand(ctx, "lens_team_memory_commit", {}, untrustedOptions);
		} catch (e) {
			commitErr = e;
		}
		expect(commitErr?.message).toContain("trusted desktop connection");

		let clearErr: any;
		try {
			await handleCommand(ctx, "lens_team_memory_clear", {}, untrustedOptions);
		} catch (e) {
			clearErr = e;
		}
		expect(clearErr?.message).toContain("trusted desktop connection");

		let readErr: any;
		try {
			await handleCommand(
				ctx,
				"lens_team_memory_read",
				{ category: "decisions" },
				untrustedOptions,
			);
		} catch (e) {
			readErr = e;
		}
		expect(readErr?.message).toContain("trusted desktop connection");
	});

	it("commits approved learnings to .lens/memory/learnings.md via lens_team_memory_commit", async () => {
		const ctx = createSidecarContext(testWorkspaceRoot);

		const result = (await handleCommand(
			ctx,
			"lens_team_memory_commit",
			{
				approvedLearnings: [
					{
						id: "test-prop-1",
						topic: "Vitest Config Native",
						learning: "Use ESM config to prevent CommonJS warnings.",
						timestamp: "2026-09-13T00:00:00.000Z",
						personaId: "sentinel",
					},
				],
			},
			trustedOptions,
		)) as { ok: boolean; count: number };

		expect(result.ok).toBe(true);
		expect(result.count).toBe(1);

		const learningsPath = join(
			testWorkspaceRoot,
			".lens",
			"memory",
			"learnings.md",
		);
		const diskContent = await readFile(learningsPath, "utf-8");
		expect(diskContent).toContain("### Vitest Config Native [sentinel]");
		expect(diskContent).toContain(
			"Use ESM config to prevent CommonJS warnings.",
		);
	});

	it("rejects invalid IPC input payloads with strict Zod validation", async () => {
		const ctx = createSidecarContext(testWorkspaceRoot);

		await expect(
			handleCommand(
				ctx,
				"lens_team_memory_commit",
				{
					approvedLearnings: [
						{
							id: "test-prop-1",
							topic: 123, // Invalid type
							learning: "Some learning",
							timestamp: "2026-09-13T00:00:00.000Z",
						},
					],
				},
				trustedOptions,
			),
		).rejects.toThrow();
	});

	it("reads memory categories via lens_team_memory_read", async () => {
		const ctx = createSidecarContext(testWorkspaceRoot);

		const result = (await handleCommand(
			ctx,
			"lens_team_memory_read",
			{
				category: "decisions",
			},
			trustedOptions,
		)) as { ok: boolean; category: string; content: string };

		expect(result.ok).toBe(true);
		expect(result.category).toBe("decisions");
		expect(result.content).toContain("# Architectural Decisions");
	});

	it("clears staged learnings from shared service via lens_team_memory_clear", async () => {
		const ctx = createSidecarContext(testWorkspaceRoot);
		const service = await getTeamMemoryService(ctx);

		// Seed staged learning in the shared service
		service.stageLearning(
			"Shared Service Proposal",
			"Proposals must be cleared on the active service instance.",
			{ id: "test-shared-1", personaId: "athena" },
		);
		expect(service.getStagedLearnings()).toHaveLength(1);

		const result = (await handleCommand(
			ctx,
			"lens_team_memory_clear",
			{},
			trustedOptions,
		)) as { ok: boolean };

		expect(result.ok).toBe(true);
		// Verify proposal was cleared on the shared service instance
		expect(service.getStagedLearnings()).toHaveLength(0);
	});
});
