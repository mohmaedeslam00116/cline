import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleCommand } from "./commands";
import { createSidecarContext } from "./context";

describe("Sidecar Team Memory Commands", () => {
	let testWorkspaceRoot: string;

	beforeEach(async () => {
		testWorkspaceRoot = await mkdtemp(join(tmpdir(), "lens-memory-sidecar-"));
	});

	afterEach(async () => {
		await rm(testWorkspaceRoot, { recursive: true, force: true });
	});

	it("commits approved learnings to .lens/memory/learnings.md via lens_team_memory_commit", async () => {
		const ctx = createSidecarContext(testWorkspaceRoot);

		const result = (await handleCommand(ctx, "lens_team_memory_commit", {
			approvedLearnings: [
				{
					id: "test-prop-1",
					topic: "Vitest Config Native",
					learning: "Use ESM config to prevent CommonJS warnings.",
					timestamp: "2026-09-13T00:00:00.000Z",
					personaId: "sentinel",
				},
			],
		})) as { ok: boolean; count: number };

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

	it("reads memory categories via lens_team_memory_read", async () => {
		const ctx = createSidecarContext(testWorkspaceRoot);

		const result = (await handleCommand(ctx, "lens_team_memory_read", {
			category: "decisions",
		})) as { ok: boolean; category: string; content: string };

		expect(result.ok).toBe(true);
		expect(result.category).toBe("decisions");
		expect(result.content).toContain("# Architectural Decisions");
	});

	it("clears staged learnings via lens_team_memory_clear", async () => {
		const ctx = createSidecarContext(testWorkspaceRoot);

		const result = (await handleCommand(
			ctx,
			"lens_team_memory_clear",
			{},
		)) as { ok: boolean };

		expect(result.ok).toBe(true);
	});
});
