import {
	type AgentTool,
	createTool,
	type ReadTeamMemoryInput,
	ReadTeamMemoryInputSchema,
	type RecordTeamLearningInput,
	RecordTeamLearningInputSchema,
	type StagedTeamLearning,
	type TeamMemoryCategory,
} from "@cline/shared";
import type { TeamMemoryService } from "./team-memory-service";

export interface ReadTeamMemoryToolResult {
	ok: boolean;
	category: TeamMemoryCategory;
	content?: string;
	error?: string;
}

export interface RecordTeamLearningToolResult {
	ok: boolean;
	staged: boolean;
	proposal?: StagedTeamLearning;
	message: string;
	error?: string;
}

/**
 * Creates the read_team_memory runtime tool.
 * Enables autonomous agents to retrieve complete category text on demand.
 */
export function createReadTeamMemoryTool(
	service: TeamMemoryService,
): AgentTool<ReadTeamMemoryInput, ReadTeamMemoryToolResult> {
	return createTool<typeof ReadTeamMemoryInputSchema, ReadTeamMemoryToolResult>({
		name: "read_team_memory",
		description:
			"Retrieve the complete institutional memory section for a category ('decisions', 'conventions', or 'learnings') from .lens/memory/.",
		inputSchema: ReadTeamMemoryInputSchema,
		execute: async (input) => {
			try {
				const content = await service.readCategory(input.category);
				return {
					ok: true,
					category: input.category,
					content,
				};
			} catch (error) {
				return {
					ok: false,
					category: input.category,
					error: error instanceof Error ? error.message : String(error),
				};
			}
		},
	});
}

/**
 * Creates the record_team_learning runtime tool.
 * Enables autonomous agents to propose newly discovered operational insights
 * which stage in runtime state for Orion Checkpoint Gate review without
 * mutating persistent disk storage during execution.
 */
export function createRecordTeamLearningTool(
	service: TeamMemoryService,
): AgentTool<RecordTeamLearningInput, RecordTeamLearningToolResult> {
	return createTool<
		typeof RecordTeamLearningInputSchema,
		RecordTeamLearningToolResult
	>({
		name: "record_team_learning",
		description:
			"Propose a newly discovered operational insight, bug resolution, or environment quirk. Stages the proposal in runtime memory for human review at Checkpoint Gates without directly mutating disk files.",
		inputSchema: RecordTeamLearningInputSchema,
		execute: async (input) => {
			try {
				const proposal = service.stageLearning(input.topic, input.learning);
				return {
					ok: true,
					staged: true,
					proposal,
					message: `Operational learning for '${proposal.topic}' staged successfully. Awaiting review at the next Checkpoint Gate.`,
				};
			} catch (error) {
				return {
					ok: false,
					staged: false,
					message: "Failed to stage operational learning",
					error: error instanceof Error ? error.message : String(error),
				};
			}
		},
	});
}

/**
 * Convenience factory creating all team memory runtime tools.
 */
export function createTeamMemoryTools(
	service: TeamMemoryService,
): AgentTool<any, any>[] {
	return [
		createReadTeamMemoryTool(service),
		createRecordTeamLearningTool(service),
	];
}
