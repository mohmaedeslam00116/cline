import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type AgentToolContext } from "@cline/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TeamMemoryService } from "./team-memory-service";
import {
	createReadTeamMemoryTool,
	createRecordTeamLearningTool,
	createTeamMemoryTools,
} from "./team-memory-tools";

const mockToolContext: AgentToolContext = {
	agentId: "test-agent",
	iteration: 1,
};

describe("TeamMemoryService", () => {
	let testDir: string;
	let service: TeamMemoryService;

	beforeEach(async () => {
		testDir = await mkdtemp(join(tmpdir(), "lens-memory-test-"));
		service = new TeamMemoryService({ workspaceRoot: testDir });
	});

	afterEach(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	it("initializes .lens/memory directory and creates default markdown templates when absent", async () => {
		await service.initialize();

		const decisions = await readFile(
			join(testDir, ".lens", "memory", "decisions.md"),
			"utf-8",
		);
		const conventions = await readFile(
			join(testDir, ".lens", "memory", "conventions.md"),
			"utf-8",
		);
		const learnings = await readFile(
			join(testDir, ".lens", "memory", "learnings.md"),
			"utf-8",
		);

		expect(decisions).toContain("# Architectural Decisions & ADR Notes");
		expect(conventions).toContain("# Repository Conventions & Coding Guidelines");
		expect(learnings).toContain("# Operational Learnings & Historical Bug Resolutions");
	});

	it("preserves existing memory files upon re-initialization", async () => {
		await service.initialize();

		const customDecision = "# Custom Decision\nWe use Rust for native sidecars.";
		await writeFile(
			join(testDir, ".lens", "memory", "decisions.md"),
			customDecision,
			"utf-8",
		);

		// Re-initialize
		await service.initialize();

		const content = await readFile(
			join(testDir, ".lens", "memory", "decisions.md"),
			"utf-8",
		);
		expect(content).toBe(customDecision);
	});

	it("reads category content on demand and auto-initializes missing files", async () => {
		const content = await service.readCategory("conventions");
		expect(content).toContain("# Repository Conventions");
	});

	it("writes and updates category content cleanly", async () => {
		await service.writeCategory(
			"decisions",
			"## Decision 001\nAdopt Clean Architecture",
		);
		const content = await service.readCategory("decisions");
		expect(content).toBe("## Decision 001\nAdopt Clean Architecture");
	});

	it("generates token-budgeted stratified summary of decisions and conventions", async () => {
		await service.writeCategory(
			"decisions",
			"## Active Decisions\n- ADR 0001: Use TypeScript\n- ADR 0002: Next.js frontend",
		);
		await service.writeCategory(
			"conventions",
			"## Active Conventions\n- Use functional components\n- Run tests with Vitest",
		);

		const summary = await service.generateStratifiedSummary(2000);
		expect(summary).toContain("### Decisions");
		expect(summary).toContain("ADR 0001: Use TypeScript");
		expect(summary).toContain("### Conventions");
		expect(summary).toContain("Use functional components");
	});

	it("stages learnings in memory without writing directly to disk", async () => {
		await service.initialize();

		const staged = service.stageLearning(
			"Build Hook Timeout",
			"Increase wait time before async task kill to 10s on Windows",
		);

		expect(staged.topic).toBe("Build Hook Timeout");
		expect(staged.learning).toContain("Increase wait time");
		expect(staged.timestamp).toBeDefined();

		// Verify in-memory list has the entry
		const allStaged = service.getStagedLearnings();
		expect(allStaged).toHaveLength(1);
		expect(allStaged[0].topic).toBe("Build Hook Timeout");

		// Crucial safety check: disk file MUST NOT have been mutated yet
		const diskContent = await readFile(
			join(testDir, ".lens", "memory", "learnings.md"),
			"utf-8",
		);
		expect(diskContent).not.toContain("Build Hook Timeout");
	});

	it("commits staged learnings to disk after Checkpoint Gate approval", async () => {
		await service.initialize();

		service.stageLearning(
			"ESM Warning Fix",
			"Add type: module to package.json to silence Vite native config warnings",
		);
		service.stageLearning(
			"Path Resolution",
			"Use resolve() on both paths before comparing workspace boundaries",
		);

		expect(service.getStagedLearnings()).toHaveLength(2);

		const committedCount = await service.commitStagedLearnings();
		expect(committedCount).toBe(2);
		expect(service.getStagedLearnings()).toHaveLength(0);

		// Verify disk file now has the verified learnings appended
		const diskContent = await readFile(
			join(testDir, ".lens", "memory", "learnings.md"),
			"utf-8",
		);
		expect(diskContent).toContain("### ESM Warning Fix");
		expect(diskContent).toContain("Add type: module");
		expect(diskContent).toContain("### Path Resolution");
	});

	it("clears staged learnings when rejected without writing to disk", async () => {
		await service.initialize();

		service.stageLearning("Invalid Proposal", "Hallucinated rule");
		expect(service.getStagedLearnings()).toHaveLength(1);

		service.clearStagedLearnings();
		expect(service.getStagedLearnings()).toHaveLength(0);

		const diskContent = await readFile(
			join(testDir, ".lens", "memory", "learnings.md"),
			"utf-8",
		);
		expect(diskContent).not.toContain("Invalid Proposal");
	});

	it("propagates non-ENOENT read errors when generating stratified summary", async () => {
		const permissionError = Object.assign(new Error("Permission denied"), {
			code: "EACCES",
		});
		vi.spyOn(service, "readCategory").mockRejectedValueOnce(permissionError);

		await expect(service.generateStratifiedSummary()).rejects.toThrow(
			"Permission denied",
		);
	});

	it("propagates non-ENOENT read errors when committing staged learnings", async () => {
		service.stageLearning("Topic", "Learning");
		const ioError = Object.assign(new Error("Disk I/O failure"), {
			code: "EIO",
		});
		vi.spyOn(service, "readCategory").mockRejectedValueOnce(ioError);

		await expect(service.commitStagedLearnings()).rejects.toThrow(
			"Disk I/O failure",
		);
	});
});

describe("Team Memory Runtime Tools", () => {
	let testDir: string;
	let service: TeamMemoryService;

	beforeEach(async () => {
		testDir = await mkdtemp(join(tmpdir(), "lens-tools-test-"));
		service = new TeamMemoryService({ workspaceRoot: testDir });
		await service.initialize();
	});

	afterEach(async () => {
		await rm(testDir, { recursive: true, force: true });
	});

	it("read_team_memory retrieves full category content", async () => {
		await service.writeCategory(
			"decisions",
			"# Full Decisions\nDetailed architectural specs...",
		);

		const readTool = createReadTeamMemoryTool(service);
		expect(readTool.name).toBe("read_team_memory");

		const result = await readTool.execute(
			{ category: "decisions" },
			mockToolContext,
		);

		expect(result.ok).toBe(true);
		expect(result.category).toBe("decisions");
		expect(result.content).toBe("# Full Decisions\nDetailed architectural specs...");
	});

	it("record_team_learning stages proposal without writing to disk", async () => {
		const recordTool = createRecordTeamLearningTool(service);
		expect(recordTool.name).toBe("record_team_learning");

		const result = await recordTool.execute(
			{
				topic: "Zod Schema Mismatch",
				learning: "Export shared schemas from @cline/shared to avoid version conflicts",
			},
			mockToolContext,
		);

		expect(result.ok).toBe(true);
		expect(result.staged).toBe(true);
		expect(result.proposal?.topic).toBe("Zod Schema Mismatch");
		expect(result.message).toContain("staged successfully");

		// Verify staged in service
		const staged = service.getStagedLearnings();
		expect(staged).toHaveLength(1);
		expect(staged[0].topic).toBe("Zod Schema Mismatch");

		// Verify disk file was NOT modified
		const diskContent = await readFile(
			join(testDir, ".lens", "memory", "learnings.md"),
			"utf-8",
		);
		expect(diskContent).not.toContain("Zod Schema Mismatch");
	});

	it("createTeamMemoryTools returns both tools", () => {
		const tools = createTeamMemoryTools(service);
		expect(tools).toHaveLength(2);
		expect(tools.map((t) => t.name)).toEqual([
			"read_team_memory",
			"record_team_learning",
		]);
	});
});
