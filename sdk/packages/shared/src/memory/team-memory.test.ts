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

	it("validates StagedTeamLearningSchema", () => {
		const valid = StagedTeamLearningSchema.safeParse({
			topic: "Cache Invalidation",
			learning: "Clear cache before re-running test suites",
			timestamp: "2026-09-13T00:00:00Z",
		});
		expect(valid.success).toBe(true);
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

	it("condenses content when exceeding maxChars and appends truncation note", () => {
		const longDecisions = [
			"# Header 1",
			"- Bullet 1: Important architectural rule",
			"Paragraph explaining something that takes up space without bullet point.",
			"- Bullet 2: Another rule",
			"# Header 2",
			"More rambling explanation that should be compressed.",
			"- Bullet 3: Final rule",
		].join("\n");

		const summary = formatTeamMemorySummary({
			decisionsContent: longDecisions,
			maxChars: 120,
		});

		expect(summary).toContain("[Truncated to preserve context budget");
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
