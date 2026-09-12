import { z } from "zod";

/**
 * Valid memory categories for structured institutional memory (.lens/memory/).
 */
export const TeamMemoryCategorySchema = z.enum([
	"decisions",
	"conventions",
	"learnings",
]);
export type TeamMemoryCategory = z.infer<typeof TeamMemoryCategorySchema>;

/**
 * Schema for read_team_memory tool input.
 */
export const ReadTeamMemoryInputSchema = z.strictObject({
	category: TeamMemoryCategorySchema,
});
export type ReadTeamMemoryInput = z.infer<typeof ReadTeamMemoryInputSchema>;

/**
 * Schema for record_team_learning tool input.
 */
export const RecordTeamLearningInputSchema = z.strictObject({
	topic: z.string().min(1, "topic cannot be empty"),
	learning: z.string().min(1, "learning cannot be empty"),
});
export type RecordTeamLearningInput = z.infer<
	typeof RecordTeamLearningInputSchema
>;

/**
 * Schema for an in-memory staged learning awaiting human Checkpoint Gate approval.
 */
export const StagedTeamLearningSchema = z.strictObject({
	topic: z.string(),
	learning: z.string(),
	timestamp: z.string(),
});
export type StagedTeamLearning = z.infer<typeof StagedTeamLearningSchema>;

/**
 * File mapping for each team memory category.
 */
export const TEAM_MEMORY_FILES: Record<TeamMemoryCategory, string> = {
	decisions: "decisions.md",
	conventions: "conventions.md",
	learnings: "learnings.md",
};

/**
 * Default clean Markdown templates created when .lens/memory/ files are absent.
 */
export const TEAM_MEMORY_TEMPLATES: Record<TeamMemoryCategory, string> = {
	decisions: `# Architectural Decisions & ADR Notes

Institutional record of architectural choices, trade-offs, and design constraints governing this repository.

## Active Decisions

<!-- Add architectural decisions and ADR summaries below -->
`,
	conventions: `# Repository Conventions & Coding Guidelines

Institutional standards for code style, directory structure, testing practices, and engineering idioms.

## Active Conventions

<!-- Add established team conventions below -->
`,
	learnings: `# Operational Learnings & Historical Bug Resolutions

Verified operational insights, environment workarounds, and debugging solutions accumulated across sessions.

## Verified Learnings

<!-- Human-approved learnings committed via Checkpoint Gates -->
`,
};

/** Default character budget for system prompt memory injection (~1,500 tokens) */
export const DEFAULT_TEAM_MEMORY_BUDGET_CHARS = 6000;

export interface TeamMemorySummaryOptions {
	decisionsContent?: string;
	conventionsContent?: string;
	maxChars?: number;
}

/**
 * Cleans Markdown comments and empty placeholder sections from text.
 * Returns empty string if content only contains default template scaffolding.
 */
function cleanMemoryContent(content?: string): string {
	if (!content) return "";
	const cleaned = content
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/\r\n/g, "\n")
		.trim();

	// Check if there is any user content beyond default template scaffolding
	const strippedOfScaffolding = cleaned
		.replace(/# Architectural Decisions & ADR Notes/g, "")
		.replace(
			/Institutional record of architectural choices, trade-offs, and design constraints governing this repository\./g,
			"",
		)
		.replace(/## Active Decisions/g, "")
		.replace(/# Repository Conventions & Coding Guidelines/g, "")
		.replace(
			/Institutional standards for code style, directory structure, testing practices, and engineering idioms\./g,
			"",
		)
		.replace(/## Active Conventions/g, "")
		.replace(/# Operational Learnings & Historical Bug Resolutions/g, "")
		.replace(
			/Verified operational insights, environment workarounds, and debugging solutions accumulated across sessions\./g,
			"",
		)
		.replace(/## Verified Learnings/g, "")
		.trim();

	if (!strippedOfScaffolding) {
		return "";
	}

	return cleaned;
}

const FULL_TRUNCATION_NOTICE =
	"\n\n[Full context truncated to preserve context budget. Call read_team_memory(category) for complete section text.]";
const HARD_TRUNCATION_NOTICE =
	"...\n\n[Truncated to preserve context budget. Call read_team_memory(category) for complete section text.]";

/**
 * Generates a concise, token-budgeted stratified summary of active decisions and conventions.
 * If the content fits within the budget, it is returned intact.
 * If it exceeds the budget, it extracts headings and active bullet points with a truncation notice,
 * strictly guaranteeing that the returned string never exceeds maxChars.
 */
export function formatTeamMemorySummary(
	options: TeamMemorySummaryOptions = {},
): string {
	const maxChars = options.maxChars ?? DEFAULT_TEAM_MEMORY_BUDGET_CHARS;
	const decisions = cleanMemoryContent(options.decisionsContent);
	const conventions = cleanMemoryContent(options.conventionsContent);

	if (!decisions && !conventions) {
		return "No institutional decisions or conventions recorded yet in .lens/memory/.";
	}

	const sections: string[] = [];

	if (decisions) {
		sections.push(`### Decisions\n${decisions}`);
	}
	if (conventions) {
		sections.push(`### Conventions\n${conventions}`);
	}

	const combined = sections.join("\n\n");

	if (combined.length <= maxChars) {
		return combined;
	}

	// Stratified compression: extract headers and bullet lists
	const condensedSections: string[] = [];

	for (const [title, raw] of [
		["Decisions", decisions],
		["Conventions", conventions],
	] as const) {
		if (!raw) continue;
		const lines = raw.split("\n");
		const keyLines = lines.filter((line) => {
			const trimmed = line.trim();
			return (
				trimmed.startsWith("#") ||
				trimmed.startsWith("- ") ||
				trimmed.startsWith("* ") ||
				/^\d+\.\s/.test(trimmed)
			);
		});

		const condensed = keyLines.join("\n").trim();
		if (condensed) {
			condensedSections.push(`### ${title} (Index)\n${condensed}`);
		}
	}

	const condensedCombined = condensedSections.join("\n\n");
	if (condensedCombined.length + FULL_TRUNCATION_NOTICE.length <= maxChars) {
		return `${condensedCombined}${FULL_TRUNCATION_NOTICE}`;
	}

	if (maxChars <= HARD_TRUNCATION_NOTICE.length) {
		return HARD_TRUNCATION_NOTICE.slice(0, maxChars);
	}

	const sliceLen = maxChars - HARD_TRUNCATION_NOTICE.length;
	const result = `${condensedCombined.slice(0, sliceLen).trimEnd()}${HARD_TRUNCATION_NOTICE}`;
	return result.length > maxChars ? result.slice(0, maxChars) : result;
}

/**
 * Formats the team memory block for inclusion in the system prompt.
 */
export function formatTeamMemoryPromptSection(summary: string): string {
	const trimmed = summary.trim();
	if (!trimmed) return "";

	return `# Agent Team Institutional Memory (.lens/memory/)

The following repository decisions and conventions are established for this workspace:

<team_memory>
${trimmed}
</team_memory>

Autonomous agents must adhere to these institutional guidelines. To inspect full unedited context, invoke \`read_team_memory(category)\`. To propose newly discovered operational insights or bug fixes, invoke \`record_team_learning(topic, learning)\`.`;
}
