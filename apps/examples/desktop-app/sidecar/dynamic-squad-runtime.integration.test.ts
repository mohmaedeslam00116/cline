import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	buildDelegatedAgentConfig,
	createDelegatedAgentConfigProvider,
	createSpawnAgentTool,
} from "@cline/core";
import type { AgentEvent, AgentFrontmatter, AgentResult } from "@cline/shared";
import {
	afterAll,
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { resolveSquadSnapshot, saveCustomPersona } from "./personas";

type DelegatedAgentFactory = NonNullable<
	Parameters<typeof createSpawnAgentTool>[0]["delegatedAgentFactory"]
>;
type DelegatedAgentConfig = Parameters<DelegatedAgentFactory>[0];

describe("dynamic squad runtime integration", () => {
	let workspaceRoot: string;
	let globalPersonasRoot: string;
	const originalGlobalPersonasRoot = process.env.LENS_GLOBAL_PERSONAS_DIR;

	const globalPersona: AgentFrontmatter = {
		id: "release-auditor",
		name: "Global Release Auditor",
		version: "1.0.0",
		description: "Global release audit contract",
		role: "Global Auditor",
		stage: "qa",
		avatar: { chassis: "sentinel", accentColor: "#64748b" },
		tools: ["read_file"],
		toolPolicy: "require_approval",
	};

	const workspacePersona: AgentFrontmatter = {
		...globalPersona,
		name: "Workspace Release Auditor",
		description: "Workspace-specific release audit contract",
		role: "Release Auditor",
		avatar: { chassis: "sentinel", accentColor: "#10b981" },
		model: "audit-model",
		temperature: 0.2,
	};

	beforeEach(async () => {
		workspaceRoot = await mkdtemp(join(tmpdir(), "lens-squad-runtime-"));
		globalPersonasRoot = await mkdtemp(join(tmpdir(), "lens-squad-global-"));
		process.env.LENS_GLOBAL_PERSONAS_DIR = globalPersonasRoot;
	});

	afterEach(async () => {
		await Promise.all([
			rm(workspaceRoot, { recursive: true, force: true }),
			rm(globalPersonasRoot, { recursive: true, force: true }),
		]);
	});

	afterAll(() => {
		if (originalGlobalPersonasRoot === undefined) {
			delete process.env.LENS_GLOBAL_PERSONAS_DIR;
		} else {
			process.env.LENS_GLOBAL_PERSONAS_DIR = originalGlobalPersonasRoot;
		}
	});

	it("preserves a workspace custom persona ID from Ultra resolution through lifecycle events", async () => {
		await saveCustomPersona(workspaceRoot, {
			frontmatter: globalPersona,
			instructions: "Use the global audit playbook.",
			scope: "global",
		});
		await saveCustomPersona(workspaceRoot, {
			frontmatter: workspacePersona,
			instructions: "Use the workspace release gate and cite local evidence.",
			scope: "workspace",
		});

		const resolvedSquad = await resolveSquadSnapshot(workspaceRoot, {
			presetId: "release-squad",
			activePersonaIds: ["orion", "release-auditor"],
			checkpointGatesEnabled: true,
		});
		const ultraSessionConfig = { mode: "ultra" as const, resolvedSquad };
		const lifecycleEvents: AgentEvent[] = [];
		const onStart = vi.fn();
		const onEnd = vi.fn();
		let delegatedConfig: Record<string, unknown> = {};

		const delegatedAgentFactory: DelegatedAgentFactory = ((
			config: DelegatedAgentConfig,
		) => {
			delegatedConfig = buildDelegatedAgentConfig(config) as unknown as Record<
				string,
				unknown
			>;
			return {
				getAgentId: () => "subagent-release-auditor-1",
				getConversationId: () => "conversation-release-auditor-1",
				run: async () => {
					config.onEvent?.({
						type: "content_start",
						contentType: "text",
						text: "Workspace release evidence verified.",
					} as AgentEvent);
					return {
						text: "Release approved.",
						iterations: 1,
						finishReason: "completed",
						usage: { inputTokens: 3, outputTokens: 2 },
					} as AgentResult;
				},
			};
		}) as unknown as DelegatedAgentFactory;

		const tool = createSpawnAgentTool({
			configProvider: createDelegatedAgentConfigProvider({
				providerId: "anthropic",
				modelId: "parent-model",
			}),
			resolvedSquad: ultraSessionConfig.resolvedSquad,
			delegatedAgentFactory,
			onSubAgentEvent: (event) => lifecycleEvents.push(event),
			onSubAgentStart: onStart,
			onSubAgentEnd: onEnd,
		});

		await tool.execute(
			{
				personaId: "release-auditor",
				systemPrompt: "Inspect release candidate 42.",
				task: "Review the release",
			},
			{
				agentId: "root-orion",
				conversationId: "ultra-session-42",
				iteration: 1,
			},
		);

		expect(resolvedSquad.personas[1]).toMatchObject({
			id: "release-auditor",
			name: "Workspace Release Auditor",
			scope: "workspace",
		});
		expect(delegatedConfig).toMatchObject({
			modelId: "audit-model",
			temperature: 0.2,
			role: "Release Auditor",
		});
		expect(delegatedConfig.systemPrompt).toContain(
			"Use the workspace release gate",
		);
		expect(onStart).toHaveBeenCalledWith(
			expect.objectContaining({ personaId: "release-auditor" }),
		);
		expect(onEnd).toHaveBeenCalledWith(
			expect.objectContaining({ personaId: "release-auditor" }),
		);
		expect(lifecycleEvents).toContainEqual(
			expect.objectContaining({
				personaId: "release-auditor",
				agentId: "subagent-release-auditor-1",
				parentAgentId: "root-orion",
				type: "content_start",
			}),
		);
	});
});
