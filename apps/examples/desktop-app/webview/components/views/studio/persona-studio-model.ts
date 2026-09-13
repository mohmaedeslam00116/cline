import {
	BUILTIN_PERSONAS,
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
