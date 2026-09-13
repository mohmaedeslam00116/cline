import type {
	AgentAvatar,
	PersonaId,
	RuntimePersonaDefinition,
	SquadConfig,
} from "@cline/shared/browser";

export interface PersonaIdentity {
	id: PersonaId;
	name: string;
	role: string;
	stage: RuntimePersonaDefinition["stage"] | "unknown";
	avatar: AgentAvatar;
	scope: RuntimePersonaDefinition["scope"] | "unknown";
}

const UNKNOWN_PERSONA_AVATAR: AgentAvatar = {
	chassis: "orion",
	accentColor: "#64748b",
};

export function toggleSquadPersona(
	config: SquadConfig,
	personaId: PersonaId,
): SquadConfig {
	if (personaId === "orion") return config;
	const selected = config.activePersonaIds.includes(personaId);
	return {
		...config,
		presetId: "custom",
		activePersonaIds: selected
			? config.activePersonaIds.filter((id) => id !== personaId)
			: [...config.activePersonaIds, personaId],
	};
}

export function findUnavailablePersonaIds(
	config: SquadConfig,
	byId: ReadonlyMap<PersonaId, RuntimePersonaDefinition>,
): PersonaId[] {
	return config.activePersonaIds.filter((personaId) => !byId.has(personaId));
}

export function getPersonaIdentity(
	personaId: PersonaId,
	byId: ReadonlyMap<PersonaId, RuntimePersonaDefinition>,
): PersonaIdentity {
	const persona = byId.get(personaId);
	if (persona) return persona;
	return {
		id: personaId,
		name: "Unknown specialist",
		role: "Unavailable persona",
		stage: "unknown",
		avatar: UNKNOWN_PERSONA_AVATAR,
		scope: "unknown",
	};
}
