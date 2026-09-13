import type { PersonaId, SquadPreset } from "@cline/shared/browser";

export const SQUAD_PRESETS_STORAGE_KEY = [
	"lens",
	"ultra",
	"squad-presets",
	"v1",
].join(".");
export const SQUAD_PRESETS_EVENT = "lens:ultra-squad-presets-changed";

type CustomSquadPresetInput = {
	name: string;
	description?: string;
	personaIds: PersonaId[];
	checkpointGatesEnabled: boolean;
};

function slugifyPresetName(name: string): string {
	const slug = name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return slug || "custom-squad";
}

export function normalizeSquadPreset(value: unknown): SquadPreset | null {
	if (!value || typeof value !== "object") return null;
	const candidate = value as Partial<SquadPreset>;
	if (
		candidate.source !== "custom" ||
		typeof candidate.id !== "string" ||
		!candidate.id.trim() ||
		typeof candidate.name !== "string" ||
		!candidate.name.trim() ||
		typeof candidate.description !== "string" ||
		!Array.isArray(candidate.personaIds) ||
		typeof candidate.checkpointGatesEnabled !== "boolean"
	) {
		return null;
	}

	const personaIds = Array.from(
		new Set(
			candidate.personaIds.filter(
				(id): id is string => typeof id === "string" && id.trim().length > 0,
			),
		),
	);
	if (!personaIds.includes("orion")) return null;

	return {
		id: candidate.id.trim(),
		name: candidate.name.trim(),
		description: candidate.description.trim(),
		source: "custom",
		personaIds: [
			"orion",
			...personaIds.filter((personaId) => personaId !== "orion"),
		],
		checkpointGatesEnabled: candidate.checkpointGatesEnabled,
	};
}

export function createCustomSquadPreset(
	input: CustomSquadPresetInput,
): SquadPreset {
	const name = input.name.trim();
	const preset = normalizeSquadPreset({
		id: `custom:${slugifyPresetName(name)}`,
		name,
		description: input.description?.trim() || "Custom squad preset",
		source: "custom",
		personaIds: input.personaIds,
		checkpointGatesEnabled: input.checkpointGatesEnabled,
	});
	if (!preset) throw new Error("A custom squad preset requires Orion.");
	return preset;
}

export function validateSquadPresetName(
	name: string,
	presets: readonly SquadPreset[],
	overwriteId?: string,
): string | null {
	const normalizedName = name.trim().toLocaleLowerCase();
	if (!normalizedName) return "Enter a preset name.";
	const duplicate = presets.some(
		(preset) =>
			preset.id !== overwriteId &&
			preset.name.trim().toLocaleLowerCase() === normalizedName,
	);
	return duplicate ? "A preset with this name already exists." : null;
}

export function saveCustomSquadPreset(
	presets: readonly SquadPreset[],
	preset: SquadPreset,
	overwriteId?: string,
): SquadPreset[] {
	const normalized = normalizeSquadPreset(preset);
	if (!normalized) throw new Error("Invalid custom squad preset.");
	const nameError = validateSquadPresetName(
		normalized.name,
		presets,
		overwriteId,
	);
	if (nameError) throw new Error(nameError);

	if (overwriteId) {
		let replaced = false;
		const next = presets.map((current) => {
			if (current.id !== overwriteId || current.source !== "custom") {
				return current;
			}
			replaced = true;
			return normalized;
		});
		return replaced ? next : [...next, normalized];
	}
	return [...presets, normalized];
}

export function deleteCustomSquadPreset(
	presets: readonly SquadPreset[],
	presetId: string,
): SquadPreset[] {
	return presets.filter(
		(preset) => preset.id !== presetId || preset.source !== "custom",
	);
}

export function isSquadPresetAvailable(
	preset: SquadPreset,
	availablePersonaIds: ReadonlySet<PersonaId>,
): boolean {
	return preset.personaIds.every((personaId) =>
		availablePersonaIds.has(personaId),
	);
}

export function readStoredSquadPresets(): SquadPreset[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(SQUAD_PRESETS_STORAGE_KEY);
		if (!raw) return [];
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.map(normalizeSquadPreset)
			.filter((preset): preset is SquadPreset => preset !== null);
	} catch {
		return [];
	}
}

export function writeStoredSquadPresets(presets: readonly SquadPreset[]): void {
	if (typeof window === "undefined") return;
	const normalized = presets
		.map(normalizeSquadPreset)
		.filter((preset): preset is SquadPreset => preset !== null);
	try {
		window.localStorage.setItem(
			SQUAD_PRESETS_STORAGE_KEY,
			JSON.stringify(normalized),
		);
		window.dispatchEvent(
			new CustomEvent(SQUAD_PRESETS_EVENT, { detail: normalized }),
		);
	} catch {
		// Desktop profile storage can be unavailable in hardened webviews.
	}
}
