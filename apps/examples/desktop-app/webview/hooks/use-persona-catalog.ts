"use client";

import {
	type CustomPersonaRecord,
	getAllPersonas,
	getBuiltinRuntimePersona,
	isBuiltinPersonaId,
	type PersonaId,
	type RuntimePersonaDefinition,
} from "@cline/shared/browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import { desktopClient } from "@/lib/desktop-client";

export interface PersonaCatalogState {
	personas: RuntimePersonaDefinition[];
	byId: ReadonlyMap<PersonaId, RuntimePersonaDefinition>;
	status: "loading" | "ready" | "error";
	error: string | null;
	reload(): Promise<void>;
}

function toRuntimePersona(
	record: CustomPersonaRecord,
): RuntimePersonaDefinition {
	return {
		id: record.frontmatter.id,
		name: record.frontmatter.name,
		role: record.frontmatter.role,
		stage: record.frontmatter.stage,
		avatar: record.frontmatter.avatar,
		instructions: record.instructions,
		tools: [...record.frontmatter.tools],
		toolPolicy: record.frontmatter.toolPolicy,
		model: record.frontmatter.model,
		temperature: record.frontmatter.temperature,
		scope: record.scope,
	};
}

export function buildPersonaCatalog(
	customPersonas: readonly CustomPersonaRecord[],
): RuntimePersonaDefinition[] {
	const builtins = getAllPersonas().map((persona) =>
		getBuiltinRuntimePersona(persona.id),
	);
	const customById = new Map<string, CustomPersonaRecord>();
	for (const record of customPersonas) {
		if (record.isBuiltin || isBuiltinPersonaId(record.frontmatter.id)) continue;
		const existing = customById.get(record.frontmatter.id);
		if (!existing || record.scope === "workspace") {
			customById.set(record.frontmatter.id, record);
		}
	}
	return [...builtins, ...Array.from(customById.values(), toRuntimePersona)];
}

export function usePersonaCatalog(workspaceRoot?: string): PersonaCatalogState {
	const builtins = useMemo(() => buildPersonaCatalog([]), []);
	const [personas, setPersonas] =
		useState<RuntimePersonaDefinition[]>(builtins);
	const [status, setStatus] =
		useState<PersonaCatalogState["status"]>("loading");
	const [error, setError] = useState<string | null>(null);

	const reload = useCallback(async () => {
		setStatus("loading");
		setError(null);
		try {
			const customPersonas = await desktopClient.listPersonas(workspaceRoot);
			setPersonas(buildPersonaCatalog(customPersonas));
			setStatus("ready");
		} catch (cause) {
			setPersonas(builtins);
			setStatus("error");
			setError(cause instanceof Error ? cause.message : String(cause));
		}
	}, [builtins, workspaceRoot]);

	useEffect(() => {
		void reload();
	}, [reload]);

	const byId = useMemo(
		() => new Map(personas.map((persona) => [persona.id, persona])),
		[personas],
	);

	return { personas, byId, status, error, reload };
}
