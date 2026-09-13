import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AgentFrontmatter, SquadConfig } from "@cline/shared";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	deleteCustomPersona,
	listCustomPersonas,
	readCustomPersona,
	resolveGlobalPersonasDir,
	resolveSquadSnapshot,
	resolveWorkspacePersonasDir,
	saveCustomPersona,
} from "./personas";

describe("Custom Personas Hybrid Storage Resolver", () => {
	let testWorkspaceRoot: string;
	let testGlobalRoot: string;
	const originalEnvGlobal = process.env.LENS_GLOBAL_PERSONAS_DIR;

	beforeEach(async () => {
		testWorkspaceRoot = await mkdtemp(join(tmpdir(), "lens-ws-test-"));
		testGlobalRoot = await mkdtemp(join(tmpdir(), "lens-global-test-"));
		process.env.LENS_GLOBAL_PERSONAS_DIR = testGlobalRoot;
	});

	afterEach(async () => {
		await Promise.all([
			rm(testWorkspaceRoot, { recursive: true, force: true }),
			rm(testGlobalRoot, { recursive: true, force: true }),
		]);
	});

	afterAll(() => {
		if (originalEnvGlobal !== undefined) {
			process.env.LENS_GLOBAL_PERSONAS_DIR = originalEnvGlobal;
		} else {
			delete process.env.LENS_GLOBAL_PERSONAS_DIR;
		}
	});

	it("resolves storage paths correctly", () => {
		const wsDir = resolveWorkspacePersonasDir(testWorkspaceRoot);
		expect(wsDir).toBe(join(testWorkspaceRoot, ".lens", "personas"));

		const globalDir = resolveGlobalPersonasDir();
		expect(globalDir).toBe(testGlobalRoot);
	});

	it("returns an empty array when persona directories do not yet exist", async () => {
		const emptyWs = await mkdtemp(join(tmpdir(), "lens-empty-ws-"));
		try {
			const personas = await listCustomPersonas(emptyWs);
			expect(personas).toEqual([]);
		} finally {
			await rm(emptyWs, { recursive: true, force: true });
		}
	});

	it("saves personas to workspace and global scopes with valid .agent.md format", async () => {
		const workspaceAuditor: AgentFrontmatter = {
			id: "solidity-auditor",
			name: "Workspace Solidity Auditor",
			version: "1.0.0",
			description: "Workspace-specific smart contract audit specialist",
			role: "Security Auditor",
			stage: "qa",
			avatar: {
				chassis: "sentinel",
				accentColor: "#10b981",
			},
			tools: ["read_file", "run_command"],
			toolPolicy: "require_approval",
		};

		const wsSaveResult = await saveCustomPersona(testWorkspaceRoot, {
			frontmatter: workspaceAuditor,
			instructions: "Analyze Foundry tests for reentrancy vulnerabilities.",
			scope: "workspace",
		});

		expect(wsSaveResult.success).toBe(true);
		expect(wsSaveResult.filePath).toBe(
			join(testWorkspaceRoot, ".lens", "personas", "solidity-auditor.agent.md"),
		);

		const globalResearcher: AgentFrontmatter = {
			id: "deep-researcher",
			name: "Global Deep Researcher",
			version: "2.0.0",
			description: "Global cross-repository web and academic researcher",
			role: "Domain Researcher",
			stage: "research",
			avatar: {
				chassis: "lyra",
				accentColor: "#06b6d4",
			},
			tools: ["read_file"],
			toolPolicy: "auto",
		};

		const globalSaveResult = await saveCustomPersona(testWorkspaceRoot, {
			frontmatter: globalResearcher,
			instructions: "Gather arXiv papers and official documentation.",
			scope: "global",
		});

		expect(globalSaveResult.success).toBe(true);
		expect(globalSaveResult.filePath).toBe(
			join(testGlobalRoot, "deep-researcher.agent.md"),
		);
	});

	it("enforces workspace precedence when global and workspace personas share the same id", async () => {
		const workspaceAuditor: AgentFrontmatter = {
			id: "solidity-auditor",
			name: "Workspace Solidity Auditor",
			version: "1.0.0",
			description: "Workspace-specific audit specialist",
			role: "Security Auditor",
			stage: "qa",
			avatar: { chassis: "sentinel", accentColor: "#10b981" },
			tools: ["read_file"],
			toolPolicy: "require_approval",
		};

		const globalAuditor: AgentFrontmatter = {
			id: "solidity-auditor",
			name: "Global Generic Auditor",
			version: "0.9.0",
			description: "Generic contract auditor from global scope",
			role: "Generic Auditor",
			stage: "qa",
			avatar: { chassis: "echo", accentColor: "#f59e0b" },
			tools: ["read_file"],
			toolPolicy: "auto",
		};

		await saveCustomPersona(testWorkspaceRoot, {
			frontmatter: globalAuditor,
			instructions: "Generic global instructions.",
			scope: "global",
		});

		await saveCustomPersona(testWorkspaceRoot, {
			frontmatter: workspaceAuditor,
			instructions: "Analyze Foundry tests.",
			scope: "workspace",
		});

		const allPersonas = await listCustomPersonas(testWorkspaceRoot);
		expect(allPersonas.length).toBe(1);

		const auditor = allPersonas.find(
			(p) => p.frontmatter.id === "solidity-auditor",
		);
		expect(auditor).toBeDefined();
		expect(auditor?.frontmatter.name).toBe("Workspace Solidity Auditor");
		expect(auditor?.scope).toBe("workspace");
		expect(auditor?.frontmatter.avatar.chassis).toBe("sentinel");
	});

	it("resolves and freezes a workspace-preferred Ultra squad snapshot", async () => {
		const globalAgent: AgentFrontmatter = {
			id: "audit-bot",
			name: "Global Audit Bot",
			version: "1.0.0",
			description: "Global release auditor",
			role: "Global Auditor",
			stage: "qa",
			avatar: { chassis: "echo", accentColor: "#f59e0b" },
			tools: ["read_file"],
			toolPolicy: "auto",
		};
		const workspaceAgent: AgentFrontmatter = {
			...globalAgent,
			name: "Workspace Audit Bot",
			role: "Release Auditor",
			avatar: { chassis: "sentinel", accentColor: "#10b981" },
			model: "audit-model",
			temperature: 0.2,
		};
		await saveCustomPersona(testWorkspaceRoot, {
			frontmatter: globalAgent,
			instructions: "Global instructions.",
			scope: "global",
		});
		await saveCustomPersona(testWorkspaceRoot, {
			frontmatter: workspaceAgent,
			instructions: "Workspace instructions.",
			scope: "workspace",
		});

		const config: SquadConfig = {
			presetId: "custom:release-review",
			activePersonaIds: ["orion", "audit-bot"],
			checkpointGatesEnabled: true,
		};
		const snapshot = await resolveSquadSnapshot(testWorkspaceRoot, config);
		expect(snapshot.personas.map((persona) => persona.id)).toEqual([
			"orion",
			"audit-bot",
		]);
		expect(snapshot.personas[1]).toMatchObject({
			name: "Workspace Audit Bot",
			instructions: "Workspace instructions.",
			scope: "workspace",
			model: "audit-model",
			temperature: 0.2,
		});
		expect(Object.isFrozen(snapshot)).toBe(true);
		expect(Object.isFrozen(snapshot.config)).toBe(true);
		expect(Object.isFrozen(snapshot.config.activePersonaIds)).toBe(true);
		expect(Object.isFrozen(snapshot.personas)).toBe(true);
		expect(Object.isFrozen(snapshot.personas[1].tools)).toBe(true);

		await saveCustomPersona(testWorkspaceRoot, {
			frontmatter: { ...workspaceAgent, name: "Changed Later" },
			instructions: "Changed later.",
			scope: "workspace",
		});
		expect(snapshot.personas[1].name).toBe("Workspace Audit Bot");
	});

	it("rejects unsafe or unavailable Ultra squad identifiers", async () => {
		const base: SquadConfig = {
			presetId: "custom:invalid",
			activePersonaIds: ["orion", "missing"],
			checkpointGatesEnabled: true,
		};
		await expect(resolveSquadSnapshot(testWorkspaceRoot, base)).rejects.toThrow(
			'Persona "missing" is unavailable',
		);
		await expect(
			resolveSquadSnapshot(testWorkspaceRoot, {
				...base,
				activePersonaIds: ["orion", "orion"],
			}),
		).rejects.toThrow("duplicate persona identifiers");
		await expect(
			resolveSquadSnapshot(testWorkspaceRoot, {
				...base,
				activePersonaIds: ["missing"],
			}),
		).rejects.toThrow("Orion is required");
	});

	it("reads a specific persona by ID respecting precedence", async () => {
		const workspaceAuditor: AgentFrontmatter = {
			id: "solidity-auditor",
			name: "Workspace Solidity Auditor",
			version: "1.0.0",
			description: "Workspace auditor",
			role: "Auditor",
			stage: "qa",
			avatar: { chassis: "sentinel", accentColor: "#10b981" },
			tools: ["read_file"],
			toolPolicy: "auto",
		};

		const globalResearcher: AgentFrontmatter = {
			id: "deep-researcher",
			name: "Global Deep Researcher",
			version: "2.0.0",
			description: "Global researcher",
			role: "Researcher",
			stage: "research",
			avatar: { chassis: "lyra", accentColor: "#06b6d4" },
			tools: ["read_file"],
			toolPolicy: "auto",
		};

		await saveCustomPersona(testWorkspaceRoot, {
			frontmatter: workspaceAuditor,
			instructions: "Workspace rules",
			scope: "workspace",
		});

		await saveCustomPersona(testWorkspaceRoot, {
			frontmatter: globalResearcher,
			instructions: "Global rules",
			scope: "global",
		});

		const auditor = await readCustomPersona(
			testWorkspaceRoot,
			"solidity-auditor",
		);
		expect(auditor?.scope).toBe("workspace");
		expect(auditor?.frontmatter.name).toBe("Workspace Solidity Auditor");

		const researcher = await readCustomPersona(
			testWorkspaceRoot,
			"deep-researcher",
		);
		expect(researcher?.scope).toBe("global");
		expect(researcher?.frontmatter.name).toBe("Global Deep Researcher");

		const nonExistent = await readCustomPersona(
			testWorkspaceRoot,
			"unknown-agent",
		);
		expect(nonExistent).toBeNull();
	});

	it("skips invalid or malformed files gracefully during directory scan", async () => {
		const validAgent: AgentFrontmatter = {
			id: "valid-agent",
			name: "Valid Agent",
			version: "1.0.0",
			description: "Valid agent",
			role: "Worker",
			stage: "development",
			avatar: { chassis: "vector", accentColor: "#8b5cf6" },
			tools: [],
			toolPolicy: "auto",
		};

		await saveCustomPersona(testWorkspaceRoot, {
			frontmatter: validAgent,
			instructions: "Valid body",
			scope: "workspace",
		});

		const badFilePath = join(
			testWorkspaceRoot,
			".lens",
			"personas",
			"corrupted.agent.md",
		);
		await writeFile(
			badFilePath,
			"This is not valid YAML or frontmatter",
			"utf8",
		);

		const personas = await listCustomPersonas(testWorkspaceRoot);
		expect(personas.length).toBe(1);
		expect(personas[0].frontmatter.id).toBe("valid-agent");
	});

	it("rejects path traversal persona IDs during delete and save", async () => {
		const traversalDelete = await deleteCustomPersona(
			testWorkspaceRoot,
			"../../unsafe-path",
		);
		expect(traversalDelete.success).toBe(false);

		await expect(
			saveCustomPersona(testWorkspaceRoot, {
				frontmatter: {
					id: "../traversal",
					name: "Bad",
					version: "1.0.0",
					description: "Bad",
					role: "Bad",
					stage: "qa",
					avatar: { chassis: "echo", accentColor: "#fff" },
					tools: [],
					toolPolicy: "auto",
				},
				instructions: "",
				scope: "workspace",
			}),
		).rejects.toThrow("Invalid persona ID");
	});

	it("deletes personas supporting both .agent.md and .agent.markdown extensions", async () => {
		const auditor: AgentFrontmatter = {
			id: "solidity-auditor",
			name: "Workspace Solidity Auditor",
			version: "1.0.0",
			description: "Auditor",
			role: "Auditor",
			stage: "qa",
			avatar: { chassis: "sentinel", accentColor: "#10b981" },
			tools: ["read_file"],
			toolPolicy: "auto",
		};

		// 1. Test .agent.md deletion
		await saveCustomPersona(testWorkspaceRoot, {
			frontmatter: auditor,
			instructions: "Rules",
			scope: "workspace",
		});

		const deleteMdResult = await deleteCustomPersona(
			testWorkspaceRoot,
			"solidity-auditor",
			"workspace",
		);
		expect(deleteMdResult.success).toBe(true);

		// 2. Test .agent.markdown deletion
		const markdownPath = join(
			testWorkspaceRoot,
			".lens",
			"personas",
			"solidity-auditor.agent.markdown",
		);
		const content = `---
id: solidity-auditor
name: Markdown Extension Auditor
description: Desc
role: Auditor
stage: qa
avatar:
  chassis: sentinel
  accentColor: "#10b981"
---
Markdown content
`;
		await writeFile(markdownPath, content, "utf8");

		const listed = await listCustomPersonas(testWorkspaceRoot);
		expect(listed.some((p) => p.frontmatter.id === "solidity-auditor")).toBe(
			true,
		);

		const deleteMarkdownResult = await deleteCustomPersona(
			testWorkspaceRoot,
			"solidity-auditor",
			"workspace",
		);
		expect(deleteMarkdownResult.success).toBe(true);

		const remaining = await listCustomPersonas(testWorkspaceRoot);
		expect(
			remaining.every((p) => p.frontmatter.id !== "solidity-auditor"),
		).toBe(true);
	});

	describe("Sidecar Command Router (handleCommand)", () => {
		it("dispatches lens_personas_list, save, read, and delete via handleCommand using ctx.workspaceRoot", async () => {
			const { createSidecarContext } = await import("./context");
			const { handleCommand } = await import("./commands");
			const ctx = createSidecarContext(testWorkspaceRoot);

			// 1. Save valid persona
			const saveResult = (await handleCommand(ctx, "lens_persona_save", {
				frontmatter: {
					id: "router-agent",
					name: "Router Test Agent",
					version: "1.0.0",
					description: "Agent created via handleCommand",
					role: "Router Specialist",
					stage: "development",
					avatar: {
						chassis: "cipher",
						accentColor: "#3b82f6",
					},
					tools: ["read_file"],
					toolPolicy: "auto",
				},
				instructions: "Handle command instructions.",
				scope: "workspace",
			})) as { success: boolean; filePath: string };

			expect(saveResult.success).toBe(true);
			expect(saveResult.filePath).toContain("router-agent.agent.md");

			// 2. Rejects invalid frontmatter
			await expect(
				handleCommand(ctx, "lens_persona_save", {
					frontmatter: {
						id: "bad-agent",
						name: "Bad Agent",
						// missing stage, description, role, avatar
					},
					instructions: "",
				}),
			).rejects.toThrow("Invalid persona frontmatter");

			// 3. Read via command
			const readResult = (await handleCommand(ctx, "lens_persona_read", {
				id: "router-agent",
			})) as { persona: { frontmatter: { name: string } } | null };

			expect(readResult.persona).not.toBeNull();
			expect(readResult.persona?.frontmatter.name).toBe("Router Test Agent");

			// 4. List via command
			const listResult = (await handleCommand(
				ctx,
				"lens_personas_list",
				{},
			)) as {
				personas: Array<{ frontmatter: { id: string } }>;
			};

			expect(listResult.personas).toBeDefined();
			expect(
				listResult.personas.some((p) => p.frontmatter.id === "router-agent"),
			).toBe(true);

			// 5. Delete via command
			const deleteResult = (await handleCommand(ctx, "lens_persona_delete", {
				id: "router-agent",
			})) as { success: boolean };

			expect(deleteResult.success).toBe(true);

			// 6. Verify deleted
			const verifyRead = (await handleCommand(ctx, "lens_persona_read", {
				id: "router-agent",
			})) as { persona: unknown };
			expect(verifyRead.persona).toBeNull();
		});
	});
});
