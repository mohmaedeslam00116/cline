/**
 * Reusable spawn_agent tool for delegating tasks to sub-agents.
 */

import {
	type AgentConfig,
	type AgentEvent,
	type AgentHooks,
	type AgentResult,
	type AgentTool,
	type AgentToolContext,
	type BasicLogger,
	createTool,
	detectPersonaId,
	type HookErrorMode,
	type ITelemetryService,
	type ResolvedSquadSnapshot,
	type RuntimePersonaDefinition,
	type ToolApprovalRequest,
	type ToolApprovalResult,
	type ToolPolicy,
	zodToJsonSchema,
} from "@cline/shared";
import { z } from "zod";
import {
	createDelegatedAgent,
	type DelegatedAgentConfigProvider,
} from "./delegated-agent";

type AgentExtension = NonNullable<AgentConfig["extensions"]>[number];
type AgentFinishReason = AgentResult["finishReason"];

export const SpawnAgentInputSchema = z.object({
	systemPrompt: z
		.string()
		.describe("System prompt defining the sub-agent's behavior"),
	task: z.string().describe("Task for the sub-agent to complete"),
	personaId: z
		.string()
		.regex(/^[a-z0-9_-]+$/)
		.optional()
		.describe("Active specialist persona ID from the current squad manifest"),
});

export type SpawnAgentInput = z.infer<typeof SpawnAgentInputSchema>;

export interface SpawnAgentOutput {
	text: string;
	iterations: number;
	finishReason: AgentFinishReason;
	usage: {
		inputTokens: number;
		outputTokens: number;
	};
}

export interface SubAgentStartContext {
	subAgentId: string;
	conversationId: string;
	parentAgentId: string;
	personaId?: string;
	input: SpawnAgentInput;
}

export interface SubAgentEndContext {
	subAgentId: string;
	conversationId: string;
	parentAgentId: string;
	personaId?: string;
	input: SpawnAgentInput;
	result?: SpawnAgentOutput;
	agentResult?: AgentResult;
	error?: Error;
}

export interface SpawnAgentToolConfig {
	configProvider: DelegatedAgentConfigProvider;
	defaultMaxIterations?: number;
	subAgentTools?: AgentTool[];
	createSubAgentTools?: (
		input: SpawnAgentInput,
		context: AgentToolContext,
	) => AgentTool[] | Promise<AgentTool[]>;
	onSubAgentEvent?: (event: AgentEvent) => void;
	/**
	 * Lifecycle hooks forwarded to spawned sub-agent runs.
	 */
	hooks?: AgentHooks;
	/**
	 * Extension list forwarded to spawned sub-agent runs.
	 */
	extensions?: AgentExtension[];
	/**
	 * Error handling mode for forwarded lifecycle hooks.
	 */
	hookErrorMode?: HookErrorMode;
	/**
	 * Called after a sub-agent instance is created and before it starts running.
	 * Errors are ignored so lifecycle observers cannot break task execution.
	 */
	onSubAgentStart?: (context: SubAgentStartContext) => void | Promise<void>;
	/**
	 * Called once a sub-agent run finishes (success or error).
	 * Errors are ignored so lifecycle observers cannot break task execution.
	 */
	onSubAgentEnd?: (context: SubAgentEndContext) => void | Promise<void>;
	/**
	 * Optional per-tool policy for spawned sub-agents.
	 */
	toolPolicies?: Record<string, ToolPolicy>;
	/**
	 * Optional approval callback for spawned sub-agent tool calls.
	 */
	requestToolApproval?: (
		request: ToolApprovalRequest,
	) => Promise<ToolApprovalResult> | ToolApprovalResult;
	/**
	 * Optional logger forwarded to spawned sub-agent runs.
	 */
	logger?: BasicLogger;
	telemetry?: ITelemetryService;
	resolvedSquad?: ResolvedSquadSnapshot;
}

const PERSONA_TOOL_ALIASES: Readonly<Record<string, readonly string[]>> = {
	read_file: ["read_file", "read_files"],
	list_files: ["list_files", "read_files"],
	search_files: ["search_files", "search_codebase"],
	edit_file: ["edit_file", "editor", "apply_patch"],
	write_file: ["write_file", "editor", "apply_patch"],
	run_command: ["run_command", "run_commands"],
	browser: ["browser", "fetch_web_content", "web_search"],
};

function findActivePersona(
	snapshot: ResolvedSquadSnapshot | undefined,
	personaId: string | undefined,
): RuntimePersonaDefinition | undefined {
	if (!snapshot || !personaId) return undefined;
	const persona = snapshot.personas.find((entry) => entry.id === personaId);
	if (!persona)
		throw new Error(
			`Persona "${personaId}" is not active in this Ultra squad.`,
		);
	return persona;
}

function isPersonaToolAllowed(
	toolName: string,
	allowlist: readonly string[],
): boolean {
	return allowlist.some((capability) => {
		if (capability === "mcp")
			return toolName === "mcp" || toolName.startsWith("mcp_");
		return (PERSONA_TOOL_ALIASES[capability] ?? [capability]).includes(
			toolName,
		);
	});
}

function filterPersonaTools(
	tools: AgentTool[],
	persona: RuntimePersonaDefinition | undefined,
): AgentTool[] {
	if (!persona) return tools;
	if (persona.scope === "builtin" && persona.tools.length === 0) return tools;
	return tools.filter((tool) => isPersonaToolAllowed(tool.name, persona.tools));
}

function personaToolPolicies(
	base: Record<string, ToolPolicy> | undefined,
	persona: RuntimePersonaDefinition | undefined,
	tools: readonly AgentTool[],
): Record<string, ToolPolicy> | undefined {
	if (!persona || persona.toolPolicy !== "require_approval") return base;
	const narrowed = { ...(base ?? {}) };
	for (const tool of tools) {
		narrowed[tool.name] = {
			...(base?.[tool.name] ?? {}),
			autoApprove: false,
		};
	}
	return narrowed;
}

function personaPrompt(
	persona: RuntimePersonaDefinition | undefined,
	missionNote: string,
): string {
	if (!persona) return missionNote;
	const contract =
		persona.instructions.trim() ||
		`You are ${persona.name}, ${persona.role}. Follow the active squad contract.`;
	return `${contract}\n\n## Current mission\n\n${missionNote.trim()}`;
}

/**
 * Create a spawn_agent tool that can run a delegated task with a focused sub-agent.
 */
export function createSpawnAgentTool(
	config: SpawnAgentToolConfig,
): AgentTool<SpawnAgentInput, SpawnAgentOutput> {
	return createTool<SpawnAgentInput, SpawnAgentOutput>({
		name: "spawn_agent",
		description: `Spawn a sub-agent with a custom system prompt for specialized tasks. Use when delegating work that benefits from focused expertise.`,
		inputSchema: zodToJsonSchema(SpawnAgentInputSchema),
		execute: async (input, context) => {
			const personaId = input.personaId || detectPersonaId(input.systemPrompt);
			const persona = findActivePersona(config.resolvedSquad, personaId);
			const availableTools = config.createSubAgentTools
				? await config.createSubAgentTools(input, context)
				: (config.subAgentTools ?? []);
			const tools = filterPersonaTools(availableTools, persona);

			const parentAgentId = context.agentId;

			const subAgent = createDelegatedAgent({
				kind: "subagent",
				prompt: personaPrompt(persona, input.systemPrompt),
				configProvider: config.configProvider,
				tools,
				connectionOverrides: persona
					? {
							...(persona.model ? { modelId: persona.model } : {}),
							...(persona.temperature !== undefined
								? { temperature: persona.temperature }
								: {}),
						}
					: undefined,
				maxIterations: config.defaultMaxIterations,
				parentAgentId,
				abortSignal: context.signal,
				onEvent: config.onSubAgentEvent
					? (event) => {
							config.onSubAgentEvent?.({
								...event,
								agentId: subAgent.getAgentId(),
								parentAgentId,
								conversationId: subAgent.getConversationId(),
								...(personaId ? { personaId } : {}),
							} as AgentEvent);
						}
					: undefined,
				hookErrorMode: config.hookErrorMode,
				toolPolicies: personaToolPolicies(config.toolPolicies, persona, tools),
				requestToolApproval: config.requestToolApproval,
				role: persona?.role,
			});
			const subAgentId = subAgent.getAgentId();
			const conversationId = subAgent.getConversationId();
			if (config.onSubAgentStart) {
				try {
					await config.onSubAgentStart({
						subAgentId,
						conversationId,
						parentAgentId,
						personaId,
						input,
					});
				} catch {
					// Best-effort observer callback.
				}
			}
			try {
				const result = await subAgent.run(input.task);
				const output: SpawnAgentOutput = {
					text: result.text,
					iterations: result.iterations,
					finishReason: result.finishReason,
					usage: {
						inputTokens: result.usage.inputTokens,
						outputTokens: result.usage.outputTokens,
					},
				};
				if (config.onSubAgentEnd) {
					try {
						await config.onSubAgentEnd({
							subAgentId,
							conversationId,
							parentAgentId,
							personaId,
							input,
							result: output,
							agentResult: result,
						});
					} catch {
						// Best-effort observer callback.
					}
				}
				return output;
			} catch (error) {
				if (config.onSubAgentEnd) {
					try {
						await config.onSubAgentEnd({
							subAgentId,
							conversationId,
							parentAgentId,
							personaId,
							input,
							error: error instanceof Error ? error : new Error(String(error)),
						});
					} catch {
						// Best-effort observer callback.
					}
				}
				throw error;
			}
		},
		timeoutMs: 300000,
		retryable: false,
	});
}
