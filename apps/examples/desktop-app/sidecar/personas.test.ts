import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AgentFrontmatter } from "@cline/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	deleteCustomPersona,
	listCustomPersonas,
	readCustomPersona,
	resolveGlobalPersonasDir,
	resolveWorkspacePersonasDir,
	saveCustomPersona,
} from "./personas";

describe("Custom Personas Hybrid Storage Resolver", () => {
	let testWorkspaceRoot: string;
	let testGlobalRoot: string;
	const originalEnvGlobal = process.env.LENS_GLOBAL_PERSONAS_DIR;

	beforeAll(async () => {
		testWorkspaceRoot = await mkdtemp(join(tmpdir(), "lens-ws-test-"));
		testGlobalRoot = await mkdtemp(join(tmpdir(), "lens-global-test-"));
		process.env.LENS_GLOBAL_PERSONAS_DIR = testGlobalRoot;
	});

	afterAll(async () => {
		if (originalEnvGlobal !== undefined) {
			process.env.LENS_GLOBAL_PERSONAS_DIR = originalEnvGlobal;
		} else {
			delete process.env.LENS_GLOBAL_PERSONAS_DIR;
		}
		await Promise.all([
			rm(testWorkspaceRoot, { recursive: true, force: true }),
			rm(testGlobalRoot, { recursive: true, force: true }),
		]);
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
		// Save a global version of the same ID
		const globalAuditor: AgentFrontmatter = {
			id: "solidity-auditor",
			name: "Global Generic Auditor",
			version: "0.9.0",
			description: "Generic contract auditor from global scope",
			role: "Generic Auditor",
			stage: "qa",
			avatar: {
				chassis: "echo",
				accentColor: "#f59e0b",
			},
			tools: ["read_file"],
			toolPolicy: "auto",
		};

		await saveCustomPersona(testWorkspaceRoot, {
			frontmatter: globalAuditor,
			instructions: "Generic global instructions.",
			scope: "global",
		});

		// When listing personas, the workspace version of solidity-auditor must take precedence
		const allPersonas = await listCustomPersonas(testWorkspaceRoot);
		expect(allPersonas.length).toBe(2);

		const auditor = allPersonas.find((p) => p.frontmatter.id === "solidity-auditor");
		expect(auditor).toBeDefined();
		expect(auditor?.frontmatter.name).toBe("Workspace Solidity Auditor");
		expect(auditor?.scope).toBe("workspace");
		expect(auditor?.frontmatter.avatar.chassis).toBe("sentinel");
		expect(auditor?.instructions).toContain("Analyze Foundry tests");

		const researcher = allPersonas.find((p) => p.frontmatter.id === "deep-researcher");
		expect(researcher).toBeDefined();
		expect(researcher?.scope).toBe("global");
	});

	it("reads a specific persona by ID respecting precedence", async () => {
		const auditor = await readCustomPersona(testWorkspaceRoot, "solidity-auditor");
		expect(auditor).not.toBeNull();
		expect(auditor?.scope).toBe("workspace");
		expect(auditor?.frontmatter.name).toBe("Workspace Solidity Auditor");

		const researcher = await readCustomPersona(testWorkspaceRoot, "deep-researcher");
		expect(researcher).not.toBeNull();
		expect(researcher?.scope).toBe("global");
		expect(researcher?.frontmatter.name).toBe("Global Deep Researcher");

		const nonExistent = await readCustomPersona(testWorkspaceRoot, "unknown-agent");
		expect(nonExistent).toBeNull();
	});

	it("skips invalid or malformed files gracefully during directory scan", async () => {
		const badFilePath = join(testWorkspaceRoot, ".lens", "personas", "corrupted.agent.md");
		await writeFile(badFilePath, "This is not valid YAML or frontmatter", "utf8");

		const personas = await listCustomPersonas(testWorkspaceRoot);
		expect(personas.length).toBe(2);
		expect(personas.every((p) => p.frontmatter.id !== "corrupted")).toBe(true);
	});

	it("deletes personas safely and reports accurate success flags", async () => {
		// Delete workspace version
		const deleteWsResult = await deleteCustomPersona(
			testWorkspaceRoot,
			"solidity-auditor",
			"workspace",
		);
		expect(deleteWsResult.success).toBe(true);

		// Now read should fall back to the global version!
		const fallbackAuditor = await readCustomPersona(testWorkspaceRoot, "solidity-auditor");
		expect(fallbackAuditor).not.toBeNull();
		expect(fallbackAuditor?.scope).toBe("global");
		expect(fallbackAuditor?.frontmatter.name).toBe("Global Generic Auditor");

		// Delete global version
		const deleteGlobalResult = await deleteCustomPersona(
			testWorkspaceRoot,
			"solidity-auditor",
			"global",
		);
		expect(deleteGlobalResult.success).toBe(true);

		// Now it should be completely gone
		const deletedAuditor = await readCustomPersona(testWorkspaceRoot, "solidity-auditor");
		expect(deletedAuditor).toBeNull();

		// Deleting already deleted agent returns false
		const repeatDelete = await deleteCustomPersona(
			testWorkspaceRoot,
			"solidity-auditor",
		);
		expect(repeatDelete.success).toBe(false);
	});

	describe("Sidecar Command Router (handleCommand)", () => {
		it("dispatches lens_personas_list, save, read, and delete via handleCommand", async () => {
			const { createSidecarContext } = await import("./context");
			const { handleCommand } = await import("./commands");
			const ctx = createSidecarContext(testWorkspaceRoot);

			// 1. Save via command
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

			// 2. Read via command
			const readResult = (await handleCommand(ctx, "lens_persona_read", {
				id: "router-agent",
			})) as { persona: { frontmatter: { name: string } } | null };

			expect(readResult.persona).not.toBeNull();
			expect(readResult.persona?.frontmatter.name).toBe("Router Test Agent");

			// 3. List via command
			const listResult = (await handleCommand(ctx, "lens_personas_list", {})) as {
				personas: Array<{ frontmatter: { id: string } }>;
			};

			expect(listResult.personas).toBeDefined();
			expect(
				listResult.personas.some((p) => p.frontmatter.id === "router-agent"),
			).toBe(true);

			// 4. Delete via command
			const deleteResult = (await handleCommand(ctx, "lens_persona_delete", {
				id: "router-agent",
			})) as { success: boolean };

			expect(deleteResult.success).toBe(true);

			// 5. Verify gone
			const verifyRead = (await handleCommand(ctx, "lens_persona_read", {
				id: "router-agent",
			})) as { persona: unknown };
			expect(verifyRead.persona).toBeNull();
		});
	});
});

