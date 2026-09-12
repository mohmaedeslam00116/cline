/**
 * Universal Agent Specification (.agent.md) Parser & Serializer.
 *
 * Implements the open Agent Specification standard (YAML frontmatter + Markdown body)
 * adhering to ADR 0006 and universal agent harness conventions (compatible across
 * Claude Code, Cursor, Windsurf, and Cline / LENS Workstation).
 */

import YAML from "yaml";
import { z } from "zod";

/** Operational stages for specialist agents */
export const AgentStageSchema = z.enum([
	"strategy",
	"research",
	"architecture",
	"development",
	"qa",
	"documentation",
]);
export type AgentStage = z.infer<typeof AgentStageSchema>;

/** Base vector SVG avatar chassis supported in LENS Workstation */
export const AgentChassisSchema = z.enum([
	"orion",
	"lyra",
	"athena",
	"atlas",
	"cipher",
	"vector",
	"sentinel",
	"echo",
]);
export type AgentChassis = z.infer<typeof AgentChassisSchema>;

/** Cyberpunk avatar configuration */
export const AgentAvatarSchema = z.strictObject({
	chassis: AgentChassisSchema,
	accentColor: z
		.string()
		.min(1, "accentColor cannot be empty")
		.regex(
			/^(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|[a-zA-Z]+|rgba?\([^)]+\)|hsla?\([^)]+\))$/,
			"accentColor must be a valid hex color, CSS color name, or rgb/hsl expression",
		),
});
export type AgentAvatar = z.infer<typeof AgentAvatarSchema>;

/** Tool approval policy: auto execution or human approval required */
export const AgentToolPolicySchema = z.enum(["auto", "require_approval"]);
export type AgentToolPolicy = z.infer<typeof AgentToolPolicySchema>;

/**
 * Universal YAML Frontmatter Schema for .agent.md files.
 */
export const AgentFrontmatterSchema = z.strictObject({
	id: z
		.string()
		.min(1, "Agent ID cannot be empty")
		.regex(
			/^[a-z0-9_-]+$/,
			"Agent ID must consist only of lowercase letters, digits, hyphens, and underscores",
		),
	name: z.string().min(1, "Agent name cannot be empty"),
	version: z.string().default("1.0.0"),
	description: z.string().min(1, "Agent description cannot be empty"),
	role: z.string().min(1, "Agent role cannot be empty"),
	stage: AgentStageSchema,
	avatar: AgentAvatarSchema,
	tools: z.array(z.string()).default([]),
	toolPolicy: AgentToolPolicySchema.default("auto"),
	model: z.string().optional(),
	temperature: z.number().min(0).max(2).optional(),
});
export type AgentFrontmatter = z.infer<typeof AgentFrontmatterSchema>;

/** Complete custom persona model schema including runtime metadata and markdown instructions */
export const CustomPersonaRecordSchema = z.object({
	/** Validated frontmatter metadata */
	frontmatter: AgentFrontmatterSchema,
	/** Markdown body containing system prompt instructions */
	instructions: z.string(),
	/** Complete raw file content (.agent.md) */
	rawContent: z.string(),
	/** Storage scope: workspace (.lens/personas/) or global (~/.lens/personas/) */
	scope: z.enum(["workspace", "global"]),
	/** Absolute or resolved filesystem path */
	filePath: z.string(),
	/** True if this is an immutable built-in system persona */
	isBuiltin: z.boolean().optional(),
});
export type CustomPersonaRecord = z.infer<typeof CustomPersonaRecordSchema>;

/** Response schema for lens_personas_list */
export const PersonasListResponseSchema = z.object({
	personas: z.array(CustomPersonaRecordSchema),
});
export type PersonasListResponse = z.infer<typeof PersonasListResponseSchema>;

/** Response schema for lens_persona_read */
export const PersonaReadResponseSchema = z.object({
	persona: CustomPersonaRecordSchema.nullable(),
});
export type PersonaReadResponse = z.infer<typeof PersonaReadResponseSchema>;

/** Response schema for lens_persona_save */
export const PersonaSaveResponseSchema = z.object({
	success: z.boolean(),
	filePath: z.string(),
	persona: CustomPersonaRecordSchema.optional(),
});
export type PersonaSaveResponse = z.infer<typeof PersonaSaveResponseSchema>;

/** Response schema for lens_persona_delete */
export const PersonaDeleteResponseSchema = z.object({
	success: z.boolean(),
	deletedPath: z.string().optional(),
});
export type PersonaDeleteResponse = z.infer<typeof PersonaDeleteResponseSchema>;

/** Result of parsing an .agent.md specification file */
export interface AgentSpecParseResult {
	success: boolean;
	persona?: CustomPersonaRecord;
	errors?: string[];
}

/** Frontmatter delimiter pattern: matches leading `---` block */
const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n([\s\S]*))?$/;

/**
 * Parses raw .agent.md file content into a validated CustomPersonaRecord.
 *
 * Catches YAML parsing issues and Zod validation errors, returning structured
 * diagnostic messages without throwing unhandled exceptions.
 */
export function parseAgentSpecification(
	rawContent: string,
	meta: {
		scope?: "workspace" | "global";
		filePath?: string;
		isBuiltin?: boolean;
	} = {},
): AgentSpecParseResult {
	if (typeof rawContent !== "string" || !rawContent.trim()) {
		return {
			success: false,
			errors: ["Agent specification content is empty"],
		};
	}

	const normalized = rawContent.replace(/^\uFEFF/, ""); // strip BOM
	const match = normalized.match(FRONTMATTER_REGEX);

	if (!match) {
		return {
			success: false,
			errors: [
				"Missing or malformed YAML frontmatter. Specification must start with '---' and contain closing '---'",
			],
		};
	}

	const yamlPart = match[1];
	const rawInstructions = match[2] ?? "";
	// Remove only the single newline separator immediately following the closing ---
	const instructions = rawInstructions.replace(/^\r?\n/, "");

	let parsedYaml: unknown;
	try {
		parsedYaml = YAML.parse(yamlPart);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return {
			success: false,
			errors: [`YAML parse error: ${message}`],
		};
	}

	if (!parsedYaml || typeof parsedYaml !== "object" || Array.isArray(parsedYaml)) {
		return {
			success: false,
			errors: ["YAML frontmatter must evaluate to an object"],
		};
	}

	const validationResult = AgentFrontmatterSchema.safeParse(parsedYaml);
	if (!validationResult.success) {
		const formattedErrors = validationResult.error.issues.map(
			(issue) => `[${issue.path.join(".") || "root"}]: ${issue.message}`,
		);
		return {
			success: false,
			errors: formattedErrors,
		};
	}

	const persona: CustomPersonaRecord = {
		frontmatter: validationResult.data,
		instructions,
		rawContent: normalized,
		scope: meta.scope ?? "workspace",
		filePath: meta.filePath ?? "",
		isBuiltin: meta.isBuiltin ?? false,
	};

	return {
		success: true,
		persona,
	};
}

/**
 * Serializes an AgentFrontmatter object and Markdown instructions into
 * standard .agent.md format with YAML frontmatter.
 */
export function serializeAgentSpecification(
	frontmatter: AgentFrontmatter,
	instructions: string,
): string {
	// Clean undefined fields before serializing
	const cleanFrontmatter: Record<string, unknown> = {
		id: frontmatter.id,
		name: frontmatter.name,
		version: frontmatter.version || "1.0.0",
		description: frontmatter.description,
		role: frontmatter.role,
		stage: frontmatter.stage,
		avatar: {
			chassis: frontmatter.avatar.chassis,
			accentColor: frontmatter.avatar.accentColor,
		},
		tools: frontmatter.tools ?? [],
		toolPolicy: frontmatter.toolPolicy ?? "auto",
	};

	if (frontmatter.model) {
		cleanFrontmatter.model = frontmatter.model;
	}
	if (typeof frontmatter.temperature === "number") {
		cleanFrontmatter.temperature = frontmatter.temperature;
	}

	const yamlString = YAML.stringify(cleanFrontmatter, {
		indent: 2,
		lineWidth: 0,
	}).trim();

	if (!instructions) {
		return `---\n${yamlString}\n---\n`;
	}

	return `---\n${yamlString}\n---\n\n${instructions}`;
}
