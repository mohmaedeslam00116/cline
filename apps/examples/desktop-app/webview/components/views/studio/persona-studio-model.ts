import {
	BUILTIN_PERSONAS,
	type AgentChassis,
	type AgentStage,
	type CustomPersonaRecord,
	type SpecialistPersonaId,
} from "@cline/shared/browser";

const BUILTIN_PERSONA_ORDER: readonly SpecialistPersonaId[] = [
	"orion",
	"lyra",
	"athena",
	"atlas",
	"cipher",
	"vector",
	"sentinel",
	"echo",
];

const BUILTIN_PERSONA_STAGES: Record<SpecialistPersonaId, AgentStage> = {
	orion: "strategy",
	lyra: "research",
	athena: "strategy",
	atlas: "architecture",
	cipher: "development",
	vector: "architecture",
	sentinel: "qa",
	echo: "documentation",
};

export interface PersonaDraft {
	id: string;
	name: string;
	version: string;
	description: string;
	role: string;
	stage: AgentStage;
	model: string;
	temperature: string;
	chassis: AgentChassis;
	accentColor: string;
	tools: string[];
	instructions: string;
	scope: "workspace" | "global";
}

const BLANK_PERSONA_DRAFT: PersonaDraft = {
	id: "",
	name: "",
	version: "1.0.0",
	description: "",
	role: "",
	stage: "development",
	model: "",
	temperature: "",
	chassis: "orion",
	accentColor: "#22d3ee",
	tools: ["read_file"],
	instructions: "# Operational Guidelines\n\n",
	scope: "workspace",
};

export type PersonaLibraryEntry =
	| {
			kind: "builtin";
			key: `builtin:${SpecialistPersonaId}`;
			id: SpecialistPersonaId;
			name: string;
			role: string;
			chassis: SpecialistPersonaId;
			accentColor: string;
	  }
	| {
			kind: "custom";
			key: `custom:${"workspace" | "global"}:${string}`;
			id: string;
			name: string;
			role: string;
			chassis: CustomPersonaRecord["frontmatter"]["avatar"]["chassis"];
			accentColor: string;
			scope: "workspace" | "global";
			record: CustomPersonaRecord;
	  };

export function buildPersonaLibrary(
	customPersonas: readonly CustomPersonaRecord[],
): PersonaLibraryEntry[] {
	const builtins: PersonaLibraryEntry[] = BUILTIN_PERSONA_ORDER.map((id) => {
		const persona = BUILTIN_PERSONAS[id];
		return {
			kind: "builtin",
			key: `builtin:${id}`,
			id,
			name: persona.name,
			role: persona.role,
			chassis: id,
			accentColor: persona.color,
		};
	});

	const custom: PersonaLibraryEntry[] = customPersonas
		.filter((record) => !record.isBuiltin)
		.map((record) => ({
			kind: "custom",
			key: `custom:${record.scope}:${record.frontmatter.id}`,
			id: record.frontmatter.id,
			name: record.frontmatter.name,
			role: record.frontmatter.role,
			chassis: record.frontmatter.avatar.chassis,
			accentColor: record.frontmatter.avatar.accentColor,
			scope: record.scope,
			record,
		}));

	return [...builtins, ...custom];
}

export function filterPersonaLibrary(
	entries: readonly PersonaLibraryEntry[],
	query: string,
): PersonaLibraryEntry[] {
	const normalizedQuery = query.trim().toLocaleLowerCase();
	if (!normalizedQuery) {
		return [...entries];
	}
	return entries.filter((entry) =>
		[entry.id, entry.name, entry.role].some((value) =>
			value.toLocaleLowerCase().includes(normalizedQuery),
		),
	);
}

export function createBlankPersonaDraft(): PersonaDraft {
	return { ...BLANK_PERSONA_DRAFT, tools: [...BLANK_PERSONA_DRAFT.tools] };
}

export function duplicateBuiltinPersona(
	entry: Extract<PersonaLibraryEntry, { kind: "builtin" }>,
): PersonaDraft {
	const persona = BUILTIN_PERSONAS[entry.id];
	return {
		...createBlankPersonaDraft(),
		id: `${persona.id}-custom`,
		name: `${persona.name} Custom`,
		description: persona.tagline,
		role: persona.role,
		stage: BUILTIN_PERSONA_STAGES[persona.id],
		chassis: persona.id,
		accentColor: persona.color,
		instructions: `# ${persona.name}\n\n${persona.systemPromptSnippet}`,
	};
}

export function draftFromCustomPersona(
	record: CustomPersonaRecord,
): PersonaDraft {
	const { frontmatter } = record;
	return {
		id: frontmatter.id,
		name: frontmatter.name,
		version: frontmatter.version,
		description: frontmatter.description,
		role: frontmatter.role,
		stage: frontmatter.stage,
		model: frontmatter.model ?? "",
		temperature:
			typeof frontmatter.temperature === "number"
				? String(frontmatter.temperature)
				: "",
		chassis: frontmatter.avatar.chassis,
		accentColor: frontmatter.avatar.accentColor,
		tools: [...frontmatter.tools],
		instructions: record.instructions,
		scope: record.scope,
	};
}
