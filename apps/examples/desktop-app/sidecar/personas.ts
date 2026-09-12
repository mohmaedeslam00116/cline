/**
 * Hybrid Storage Resolver for Custom Specialist Personas (ADR 0006).
 *
 * Resolves .agent.md specifications across:
 * - Workspace: `<workspaceRoot>/.lens/personas/*.agent.md` (Git-tracked team personas)
 * - Global: `~/.lens/personas/*.agent.md` (Workstation developer personas)
 *
 * Implements strict workspace precedence: if a workspace persona shares an `id`
 * with a global persona, the workspace definition overrides the global one.
 */

import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import {
	type AgentFrontmatter,
	type CustomPersonaRecord,
	parseAgentSpecification,
	serializeAgentSpecification,
} from "@cline/shared";

/** Safe identifier pattern: lowercase alphanumeric, hyphens, and underscores */
export const PERSONA_ID_REGEX = /^[a-z0-9_-]+$/;

/** Resolve the workspace-scoped personas directory: `<workspace>/.lens/personas` */
export function resolveWorkspacePersonasDir(workspaceRoot: string): string {
	return join(resolve(workspaceRoot), ".lens", "personas");
}

/** Resolve the global user-scoped personas directory: `~/.lens/personas` */
export function resolveGlobalPersonasDir(): string {
	return (
		process.env.LENS_GLOBAL_PERSONAS_DIR?.trim() ||
		join(homedir(), ".lens", "personas")
	);
}

/** Scans a directory for .agent.md files and returns parsed personas */
async function scanDirectoryForPersonas(
	dirPath: string,
	scope: "workspace" | "global",
): Promise<CustomPersonaRecord[]> {
	try {
		const entries = await readdir(dirPath, { withFileTypes: true });
		const agentFiles = entries.filter(
			(entry) =>
				entry.isFile() &&
				(entry.name.endsWith(".agent.md") || entry.name.endsWith(".agent.markdown")),
		);

		const personas: CustomPersonaRecord[] = [];

		for (const file of agentFiles) {
			const filePath = join(dirPath, file.name);
			try {
				const content = await readFile(filePath, "utf8");
				const parsed = parseAgentSpecification(content, {
					scope,
					filePath,
					isBuiltin: false,
				});

				if (parsed.success && parsed.persona) {
					personas.push(parsed.persona);
				} else {
					console.warn(
						`[Personas] Skipping invalid persona file "${filePath}": ${parsed.errors?.join(", ")}`,
					);
				}
			} catch (readErr) {
				console.warn(
					`[Personas] Failed to read persona file "${filePath}":`,
					readErr,
				);
			}
		}

		return personas;
	} catch (err: unknown) {
		// Directory not existing is a normal state, return empty list
		const error = err as { code?: string };
		if (error.code === "ENOENT") {
			return [];
		}
		console.error(`[Personas] Error scanning directory "${dirPath}":`, err);
		throw err;
	}
}

/**
 * Lists all available custom personas with workspace precedence.
 *
 * 1. Scans global personas directory `~/.lens/personas/`.
 * 2. Scans workspace personas directory `<workspace>/.lens/personas/`.
 * 3. Personas in workspace override global personas with matching `id`.
 */
export async function listCustomPersonas(
	workspaceRoot: string,
): Promise<CustomPersonaRecord[]> {
	const globalDir = resolveGlobalPersonasDir();
	const workspaceDir = resolveWorkspacePersonasDir(workspaceRoot);

	const [globalPersonas, workspacePersonas] = await Promise.all([
		scanDirectoryForPersonas(globalDir, "global"),
		scanDirectoryForPersonas(workspaceDir, "workspace"),
	]);

	const personaMap = new Map<string, CustomPersonaRecord>();

	// Insert global personas first
	for (const persona of globalPersonas) {
		personaMap.set(persona.frontmatter.id, persona);
	}

	// Workspace personas override global ones
	for (const persona of workspacePersonas) {
		personaMap.set(persona.frontmatter.id, persona);
	}

	return Array.from(personaMap.values()).sort((a, b) =>
		a.frontmatter.name.localeCompare(b.frontmatter.name),
	);
}

/**
 * Reads a specific custom persona by its identifier.
 * Checks workspace scope first, falling back to global scope.
 */
export async function readCustomPersona(
	workspaceRoot: string,
	personaId: string,
): Promise<CustomPersonaRecord | null> {
	const trimmedId = personaId.trim();
	if (!trimmedId) return null;

	const allPersonas = await listCustomPersonas(workspaceRoot);
	const matched = allPersonas.find((p) => p.frontmatter.id === trimmedId);
	return matched ?? null;
}

/** Input for saving a custom persona */
export interface SaveCustomPersonaInput {
	frontmatter: AgentFrontmatter;
	instructions: string;
	scope: "workspace" | "global";
}

/** Result of saving a custom persona */
export interface SaveCustomPersonaResult {
	success: boolean;
	filePath: string;
	persona: CustomPersonaRecord;
}

/**
 * Saves or updates a custom persona specification file (.agent.md).
 * Writes to `<workspace>/.lens/personas/` or `~/.lens/personas/` based on requested scope.
 */
export async function saveCustomPersona(
	workspaceRoot: string,
	input: SaveCustomPersonaInput,
): Promise<SaveCustomPersonaResult> {
	const targetDir =
		input.scope === "workspace"
			? resolveWorkspacePersonasDir(workspaceRoot)
			: resolveGlobalPersonasDir();

	const trimmedId = input.frontmatter.id.trim();
	if (!PERSONA_ID_REGEX.test(trimmedId)) {
		throw new Error(
			`Invalid persona ID "${input.frontmatter.id}": must contain only lowercase letters, digits, hyphens, and underscores`,
		);
	}

	await mkdir(targetDir, { recursive: true });

	const fileName = `${trimmedId}.agent.md`;
	const targetFilePath = join(targetDir, fileName);

	const serializedContent = serializeAgentSpecification(
		input.frontmatter,
		input.instructions,
	);

	await writeFile(targetFilePath, serializedContent, "utf8");

	const persona: CustomPersonaRecord = {
		frontmatter: input.frontmatter,
		instructions: input.instructions,
		rawContent: serializedContent,
		scope: input.scope,
		filePath: targetFilePath,
		isBuiltin: false,
	};

	return {
		success: true,
		filePath: targetFilePath,
		persona,
	};
}

/**
 * Deletes a custom persona specification file.
 * If scope is specified, deletes only from that scope.
 * Otherwise checks workspace first, then global.
 */
export async function deleteCustomPersona(
	workspaceRoot: string,
	personaId: string,
	scope?: "workspace" | "global",
): Promise<{ success: boolean; deletedPath?: string }> {
	const trimmedId = personaId.trim();
	if (!trimmedId || !PERSONA_ID_REGEX.test(trimmedId)) return { success: false };

	const candidatePaths: string[] = [];
	const extensions = [".agent.md", ".agent.markdown"];

	for (const ext of extensions) {
		const fileName = `${trimmedId}${ext}`;
		if (!scope || scope === "workspace") {
			candidatePaths.push(join(resolveWorkspacePersonasDir(workspaceRoot), fileName));
		}
		if (!scope || scope === "global") {
			candidatePaths.push(join(resolveGlobalPersonasDir(), fileName));
		}
	}

	for (const candidatePath of candidatePaths) {
		try {
			await rm(candidatePath, { force: false });
			return { success: true, deletedPath: candidatePath };
		} catch (err: unknown) {
			const error = err as { code?: string };
			if (error.code !== "ENOENT") {
				console.warn(`[Personas] Failed to delete persona "${candidatePath}":`, err);
			}
		}
	}

	return { success: false };
}
