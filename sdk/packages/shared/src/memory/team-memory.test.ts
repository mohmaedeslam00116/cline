import { describe, expect, it } from "vitest";
import {
	DEFAULT_TEAM_MEMORY_BUDGET_CHARS,
	formatTeamMemoryPromptSection,
	formatTeamMemorySummary,
	ReadTeamMemoryInputSchema,
	RecordTeamLearningInputSchema,
	StagedTeamLearningSchema,
	TEAM_MEMORY_FILES,
	TEAM_MEMORY_TEMPLATES,
	TeamMemoryCategorySchema,
} from "./team-memory";

describe("Team Memory Domain & Schemas", () => {
	it("validates allowed memory categories and rejects unknown ones", () => {
		expect(TeamMemoryCategorySchema.safeParse("decisions").success).toBe(true);
		expect(TeamMemoryCategorySchema.safeParse("conventions").success).toBe(true);
		expect(TeamMemoryCategorySchema.safeParse("learnings").success).toBe(true);

		const invalid = TeamMemoryCategorySchema.safeParse("secrets");
		expect(invalid.success).toBe(false);
	});

	it("validates ReadTeamMemoryInputSchema with strictness", () => {
		const valid = ReadTeamMemoryInputSchema.safeParse({ category: "decisions" });
		expect(valid.success).toBe(true);

		const extraKey = ReadTeamMemoryInputSchema.safeParse({
			category: "decisions",
			extra: true,
		});
		expect(extraKey.success).toBe(false);

		const missingCategory = ReadTeamMemoryInputSchema.safeParse({});
		expect(missingCategory.success).toBe(false);
	});

	it("validates RecordTeamLearningInputSchema strictly", () => {
		const valid = RecordTeamLearningInputSchema.safeParse({
			topic: "Vitest Configuration",
			learning: "Use native ESM config in package.json to avoid warnings",
		});
		expect(valid.success).toBe(true);

		const validWithPersona = RecordTeamLearningInputSchema.safeParse({
			topic: "Vitest Configuration",
			learning: "Use native ESM config in package.json to avoid warnings",
			personaId: "sentinel",
		});
		expect(validWithPersona.success).toBe(true);

		const emptyTopic = RecordTeamLearningInputSchema.safeParse({
			topic: "",
			learning: "Some learning",
		});
		expect(emptyTopic.success).toBe(false);

		const extraField = RecordTeamLearningInputSchema.safeParse({
			topic: "Topic",
			learning: "Learning",
			unauthorized: true,
		});
		expect(extraField.success).toBe(false);
	});

	it("validates StagedTeamLearningSchema with optional id and personaId", () => {
		const valid = StagedTeamLearningSchema.safeParse({
			id: "learning-123",
			topic: "Cache Invalidation",
			learning: "Clear cache before re-running test suites",
			timestamp: "2026-09-13T00:00:00Z",
			personaId: "atlas",
		});
		expect(valid.success).toBe(true);

		const validWithoutOptionals = StagedTeamLearningSchema.safeParse({
			topic: "Cache Invalidation",
			learning: "Clear cache before re-running test suites",
			timestamp: "2026-09-13T00:00:00Z",
		});
		expect(validWithoutOptionals.success).toBe(true);
	});

	it("provides file mappings and default templates for all categories", () => {
		expect(TEAM_MEMORY_FILES.decisions).toBe("decisions.md");
		expect(TEAM_MEMORY_FILES.conventions).toBe("conventions.md");
		expect(TEAM_MEMORY_FILES.learnings).toBe("learnings.md");

		expect(TEAM_MEMORY_TEMPLATES.decisions).toContain("# Architectural Decisions");
		expect(TEAM_MEMORY_TEMPLATES.conventions).toContain("# Repository Conventions");
		expect(TEAM_MEMORY_TEMPLATES.learnings).toContain("# Operational Learnings");
	});
});

describe("formatTeamMemorySummary", () => {
	it("returns fallback message when both decisions and conventions are empty", () => {
		const summary = formatTeamMemorySummary();
		expect(summary).toBe(
			"No institutional decisions or conventions recorded yet in .lens/memory/.",
		);
	});

	it("formats decisions and conventions within budget intact", () => {
		const decisions = "## Active Decisions\n- Use ADR for design choices.";
		const conventions = "## Active Conventions\n- Run typecheck before committing.";

		const summary = formatTeamMemorySummary({
			decisionsContent: decisions,
			conventionsContent: conventions,
		});

		expect(summary).toContain("### Decisions\n" + decisions);
		expect(summary).toContain("### Conventions\n" + conventions);
		expect(summary).not.toContain("[Full context truncated");
	});

	it("strips HTML comments from templates", () => {
		const raw = "# Decisions\n<!-- comment -->\n- Rule 1";
		const summary = formatTeamMemorySummary({ decisionsContent: raw });
		expect(summary).not.toContain("<!-- comment -->");
		expect(summary).toContain("- Rule 1");
	});

	it("recognizes untouched default templates as empty memory", () => {
		const summary = formatTeamMemorySummary({
			decisionsContent: TEAM_MEMORY_TEMPLATES.decisions,
			conventionsContent: TEAM_MEMORY_TEMPLATES.conventions,
		});
		expect(summary).toBe(
			"No institutional decisions or conventions recorded yet in .lens/memory/.",
		);
	});

	it("strictly keeps the complete returned summary within maxChars in all truncation branches", () => {
		const longDecisions = [
			"# Header 1",
			"- Bullet 1: Important architectural rule",
			"Paragraph explaining something that takes up space without bullet point in multiple sentences to easily exceed three hundred characters total.",
			"Another long paragraph of explanatory narrative that takes up plenty of characters.",
			"- Bullet 2: Another rule",
			"# Header 2",
			"More rambling explanation that should be compressed and omitted during indexing.",
			"- Bullet 3: Final rule",
		].join("\n");

		// Branch 1: condensed fits with index notice
		const summary1 = formatTeamMemorySummary({
			decisionsContent: longDecisions,
			maxChars: 300,
		});
		expect(summary1.length).toBeLessThanOrEqual(300);
		expect(summary1).toContain("[Full context truncated");

		// Branch 2: hard truncation with slice
		const summary2 = formatTeamMemorySummary({
			decisionsContent: longDecisions,
			maxChars: 120,
		});
		expect(summary2.length).toBeLessThanOrEqual(120);

		// Branch 3: very small budget
		const summary3 = formatTeamMemorySummary({
			decisionsContent: longDecisions,
			maxChars: 40,
		});
		expect(summary3.length).toBeLessThanOrEqual(40);
	});
});

describe("formatTeamMemoryPromptSection", () => {
	it("returns empty string for empty or whitespace-only summary", () => {
		expect(formatTeamMemoryPromptSection("")).toBe("");
		expect(formatTeamMemoryPromptSection("   \n\t  ")).toBe("");
	});

	it("wraps non-empty summary with <team_memory> and instructions", () => {
		const summary = "### Decisions\n- ADR 0006 adopted";
		const section = formatTeamMemoryPromptSection(summary);

		expect(section).toContain("# Agent Team Institutional Memory (.lens/memory/)");
		expect(section).toContain("<team_memory>\n### Decisions\n- ADR 0006 adopted\n</team_memory>");
		expect(section).toContain("read_team_memory(category)");
		expect(section).toContain("record_team_learning(topic, learning)");
	});
});
