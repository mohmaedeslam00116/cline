"use client";

import type { CustomPersonaRecord } from "@cline/shared/browser";
import { Bot } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/views/page-layout";
import { desktopClient } from "@/lib/desktop-client";
import { getLensTranslations } from "@/lib/lens-i18n";
import { PersonaLibraryPanel } from "./persona-library-panel";
import { PersonaEditor } from "./persona-editor";
import {
	buildPersonaLibrary,
	createBlankPersonaDraft,
	draftFromCustomPersona,
	duplicateBuiltinPersona,
	filterPersonaLibrary,
	type PersonaDraft,
	type PersonaLibraryEntry,
} from "./persona-studio-model";

export interface PersonaStudioViewProps {
	readonly workspaceRoot?: string;
}

export function PersonaStudioView({ workspaceRoot }: PersonaStudioViewProps) {
	const t = getLensTranslations().personaStudio;
	const [customPersonas, setCustomPersonas] = useState<CustomPersonaRecord[]>([]);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
		"loading",
	);
	const [query, setQuery] = useState("");
	const [selectedKey, setSelectedKey] = useState("builtin:orion");
	const [draft, setDraft] = useState<PersonaDraft | null>(null);
	const requestIdRef = useRef(0);

	const reloadPersonas = useCallback(async () => {
		const requestId = ++requestIdRef.current;
		setLoadState("loading");
		setLoadError(null);
		try {
			const personas = await desktopClient.listPersonas(workspaceRoot);
			if (requestId !== requestIdRef.current) return;
			setCustomPersonas(personas);
			setLoadState("ready");
		} catch (error) {
			if (requestId !== requestIdRef.current) return;
			setLoadError(error instanceof Error ? error.message : String(error));
			setLoadState("error");
		}
	}, [workspaceRoot]);

	useEffect(() => {
		void reloadPersonas();
		return () => {
			requestIdRef.current += 1;
		};
	}, [reloadPersonas]);

	const entries = useMemo(
		() => buildPersonaLibrary(customPersonas),
		[customPersonas],
	);
	const filteredEntries = useMemo(
		() => filterPersonaLibrary(entries, query),
		[entries, query],
	);
	const selectedEntry = entries.find((entry) => entry.key === selectedKey);
	const visibleSelectedEntry =
		query && !filteredEntries.some((entry) => entry.key === selectedKey)
			? filteredEntries[0]
			: selectedEntry;
	const handleSelect = useCallback(
		(key: PersonaLibraryEntry["key"]) => {
			const entry = entries.find((candidate) => candidate.key === key);
			setSelectedKey(key);
			setDraft(
				entry?.kind === "custom" ? draftFromCustomPersona(entry.record) : null,
			);
		},
		[entries],
	);
	const handleNew = useCallback(() => {
		setSelectedKey("new");
		setDraft({
			...createBlankPersonaDraft(),
			scope: workspaceRoot ? "workspace" : "global",
		});
	}, [workspaceRoot]);

	return (
		<div className="flex h-full min-h-0 flex-col bg-background">
			<div className="border-b border-border px-8 pt-7 max-[720px]:px-4 max-[720px]:pt-5">
				<PageHeader
					className="mb-6"
					description={t.description}
					icon={Bot}
					title={t.title}
				/>
			</div>
			<div className="grid min-h-0 flex-1 grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)] max-[760px]:grid-cols-1">
				<PersonaLibraryPanel
					entries={filteredEntries}
					loadError={loadError}
					loadState={loadState}
					onNew={handleNew}
					onRetry={() => void reloadPersonas()}
					onSelect={handleSelect}
					query={query}
					selectedKey={selectedKey}
					setQuery={setQuery}
					translations={t}
				/>
				<section className="min-h-0 overflow-auto p-8 max-[760px]:p-4">
					<p className="mx-auto mb-5 max-w-5xl font-mono text-xs text-muted-foreground">
						{workspaceRoot || t.globalOnly}
					</p>
					<PersonaEditor
						draft={draft}
						onDraftChange={setDraft}
						onDuplicate={(entry) => {
							setSelectedKey("new");
							setDraft(duplicateBuiltinPersona(entry));
						}}
						selectedEntry={visibleSelectedEntry}
						translations={t}
					/>
				</section>
			</div>
		</div>
	);
}
