"use client";

import type { CustomPersonaRecord } from "@cline/shared/browser";
import { Bot } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/views/page-layout";
import { desktopClient } from "@/lib/desktop-client";
import { getLensTranslations } from "@/lib/lens-i18n";
import { PersonaEditor } from "./persona-editor";
import { PersonaLibraryPanel } from "./persona-library-panel";
import {
	buildPersonaLibrary,
	createBlankPersonaDraft,
	draftFromCustomPersona,
	duplicateBuiltinPersona,
	filterPersonaLibrary,
	type PersonaDraft,
	type PersonaLibraryEntry,
	validatePersonaDraft,
} from "./persona-studio-model";

export interface PersonaStudioViewProps {
	readonly workspaceRoot?: string;
}

const FIELD_FOCUS_ORDER = [
	"id",
	"name",
	"version",
	"description",
	"role",
	"stage",
	"model",
	"temperature",
	"avatar.accentColor",
	"instructions",
] as const;

export function PersonaStudioView({ workspaceRoot }: PersonaStudioViewProps) {
	const t = getLensTranslations().personaStudio;
	const [customPersonas, setCustomPersonas] = useState<CustomPersonaRecord[]>(
		[],
	);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
		"loading",
	);
	const [query, setQuery] = useState("");
	const [selectedKey, setSelectedKey] = useState("builtin:orion");
	const [draft, setDraft] = useState<PersonaDraft | null>(null);
	const [operationError, setOperationError] = useState<string | null>(null);
	const [operationNotice, setOperationNotice] = useState<string | null>(null);
	const [pendingAction, setPendingAction] = useState<"save" | "delete" | null>(
		null,
	);
	const [deleteTarget, setDeleteTarget] = useState<
		Extract<PersonaLibraryEntry, { kind: "custom" }> | undefined
	>();
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});
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
			setValidationErrors({});
			setOperationError(null);
			setOperationNotice(null);
		},
		[entries],
	);
	const handleNew = useCallback(() => {
		setSelectedKey("new");
		setDraft({
			...createBlankPersonaDraft(),
			scope: workspaceRoot ? "workspace" : "global",
		});
		setValidationErrors({});
		setOperationError(null);
		setOperationNotice(null);
	}, [workspaceRoot]);
	const handleDraftChange = useCallback((nextDraft: PersonaDraft) => {
		setDraft(nextDraft);
		setValidationErrors({});
		setOperationError(null);
		setOperationNotice(null);
	}, []);
	const handleSave = useCallback(async () => {
		if (!draft || pendingAction) return;
		const validation = validatePersonaDraft(draft);
		if (!validation.success) {
			setValidationErrors(validation.errors);
			setOperationError(null);
			setOperationNotice(null);
			const firstInvalidField = FIELD_FOCUS_ORDER.find(
				(field) => validation.errors[field],
			);
			if (firstInvalidField) {
				setTimeout(() => {
					document
						.querySelector<HTMLElement>(
							`[data-studio-field="${firstInvalidField}"]`,
						)
						?.focus();
				}, 0);
			}
			return;
		}

		setPendingAction("save");
		setValidationErrors({});
		setOperationError(null);
		setOperationNotice(null);
		try {
			const result = await desktopClient.savePersona(
				validation.frontmatter,
				draft.instructions,
				draft.scope,
				workspaceRoot,
			);
			if (!result.success) throw new Error("The sidecar rejected the save.");
			setSelectedKey(`custom:${draft.scope}:${draft.id}`);
			setOperationNotice(
				`${draft.scope === "workspace" ? t.savedToWorkspace : t.savedToGlobal}: ${result.filePath}`,
			);
			await reloadPersonas();
		} catch (error) {
			const detail = error instanceof Error ? error.message : String(error);
			setOperationError(`${t.saveError}: ${detail}`);
		} finally {
			setPendingAction(null);
		}
	}, [draft, pendingAction, reloadPersonas, t, workspaceRoot]);
	const handleDelete = useCallback(async () => {
		if (!deleteTarget || pendingAction) return;
		const target = deleteTarget;
		setPendingAction("delete");
		setOperationError(null);
		setOperationNotice(null);
		try {
			const result = await desktopClient.deletePersona(
				target.record.frontmatter.id,
				target.record.scope,
				workspaceRoot,
			);
			if (!result.success)
				throw new Error("The sidecar rejected the deletion.");
			await reloadPersonas();
			setSelectedKey("builtin:orion");
			setDraft(null);
			setValidationErrors({});
			setOperationNotice(`${t.deletedPersona}: ${target.name}`);
		} catch (error) {
			const detail = error instanceof Error ? error.message : String(error);
			setOperationError(`${t.deleteError}: ${detail}`);
		} finally {
			setDeleteTarget(undefined);
			setPendingAction(null);
		}
	}, [deleteTarget, pendingAction, reloadPersonas, t, workspaceRoot]);

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
			<div className="grid min-h-0 flex-1 grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)] max-[760px]:grid-cols-1 max-[760px]:grid-rows-[minmax(14rem,38vh)_minmax(0,1fr)]">
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
					{operationNotice ? (
						<output className="mx-auto mb-5 max-w-5xl rounded-lg border border-success-border bg-success-surface px-3 py-2 text-sm text-success-text">
							{operationNotice}
						</output>
					) : null}
					{operationError ? (
						<p
							className="mx-auto mb-5 max-w-5xl rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
							role="alert"
						>
							{operationError}
						</p>
					) : null}
					<PersonaEditor
						draft={draft}
						onDraftChange={handleDraftChange}
						onDuplicate={(entry) => {
							setSelectedKey("new");
							setDraft(duplicateBuiltinPersona(entry));
							setValidationErrors({});
							setOperationError(null);
							setOperationNotice(null);
						}}
						onRequestDelete={() => {
							if (visibleSelectedEntry?.kind === "custom") {
								setDeleteTarget(visibleSelectedEntry);
							}
						}}
						onSave={() => void handleSave()}
						selectedEntry={visibleSelectedEntry}
						saving={pendingAction !== null}
						translations={t}
						validationErrors={validationErrors}
						workspaceAvailable={Boolean(workspaceRoot)}
					/>
				</section>
			</div>
			<AlertDialog
				onOpenChange={(open) => {
					if (!open && pendingAction !== "delete") setDeleteTarget(undefined);
				}}
				open={Boolean(deleteTarget)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{deleteTarget
								? t.deleteConfirmation
										.replace("{name}", deleteTarget.name)
										.replace(
											"{scope}",
											deleteTarget.scope === "workspace"
												? t.workspaceBadge
												: t.globalBadge,
										)
								: t.deletePersona}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t.deleteDescription}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={pendingAction === "delete"}>
							{t.cancel}
						</AlertDialogCancel>
						<AlertDialogAction
							disabled={pendingAction === "delete"}
							onClick={(event) => {
								event.preventDefault();
								void handleDelete();
							}}
						>
							{pendingAction === "delete" ? t.deletingPersona : t.deletePersona}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
