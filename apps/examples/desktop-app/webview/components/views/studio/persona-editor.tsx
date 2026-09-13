import type { AgentStage } from "@cline/shared/browser";
import { Copy, LockKeyhole, Save } from "lucide-react";
import { PersonaAvatar } from "@/components/personas/svg/persona-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LensTranslations } from "@/lib/lens-i18n";
import { AvatarBuilder } from "./avatar-builder";
import { CapabilityMatrix } from "./capability-matrix";
import { MarkdownPromptEditor } from "./markdown-prompt-editor";
import type { PersonaDraft, PersonaLibraryEntry } from "./persona-studio-model";

interface PersonaEditorProps {
	readonly draft: PersonaDraft | null;
	readonly onDraftChange: (draft: PersonaDraft) => void;
	readonly onDuplicate: (
		entry: Extract<PersonaLibraryEntry, { kind: "builtin" }>,
	) => void;
	readonly onSave: () => void;
	readonly selectedEntry: PersonaLibraryEntry | undefined;
	readonly saving: boolean;
	readonly translations: LensTranslations["personaStudio"];
	readonly validationErrors: Readonly<Record<string, string>>;
	readonly workspaceAvailable: boolean;
}

const AGENT_STAGES: readonly AgentStage[] = [
	"strategy",
	"research",
	"architecture",
	"development",
	"qa",
	"documentation",
];

export function PersonaEditor({
	draft,
	onDraftChange,
	onDuplicate,
	onSave,
	selectedEntry,
	saving,
	translations: t,
	validationErrors,
	workspaceAvailable,
}: PersonaEditorProps) {
	if (selectedEntry?.kind === "builtin" && !draft) {
		return (
			<section className="mx-auto max-w-4xl">
				<div className="flex flex-wrap items-start justify-between gap-5 border-b border-border pb-6">
					<div className="flex min-w-0 items-center gap-5">
						<PersonaAvatar
							personaId={selectedEntry.chassis}
							size={104}
							state="idle"
							title={`${selectedEntry.name} avatar`}
						/>
						<div>
							<Badge variant="outline">
								<LockKeyhole className="size-3" />
								{t.builtinTemplate}
							</Badge>
							<h2 className="mt-3 text-3xl font-semibold tracking-[-0.025em]">
								{selectedEntry.name}
							</h2>
							<p className="mt-2 text-sm text-muted-foreground">
								{selectedEntry.role}
							</p>
						</div>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button onClick={() => onDuplicate(selectedEntry)} type="button">
							<Copy className="size-4" />
							{t.duplicateToCustomize}
						</Button>
						<Button disabled type="button" variant="outline">
							<Save className="size-4" />
							{t.savePersona}
						</Button>
					</div>
				</div>
				<p className="mt-6 max-w-2xl text-sm leading-6 text-muted-foreground">
					{t.builtinTemplateDescription}
				</p>
			</section>
		);
	}

	if (!draft) return null;

	return (
		<form className="mx-auto max-w-5xl space-y-8" onSubmit={(event) => event.preventDefault()}>
			<div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
				<div>
					<h2 className="text-2xl font-semibold tracking-[-0.02em]">
						{draft.name || t.newPersona}
					</h2>
					<p className="mt-2 text-sm text-muted-foreground">
						{t.draftDescription}
					</p>
				</div>
				<div className="flex flex-wrap items-end gap-3">
					<label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
						{t.saveDestination}
						<select
							aria-label={t.saveDestination}
							className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm text-foreground outline-none focus-visible:ring-[3px]"
							disabled={saving}
							onChange={(event) =>
								onDraftChange({
									...draft,
									scope: event.target.value as "workspace" | "global",
								})
							}
							value={draft.scope}
						>
							<option disabled={!workspaceAvailable} value="workspace">
								{t.workspaceBadge}
							</option>
							<option value="global">{t.globalBadge}</option>
						</select>
					</label>
				<Button disabled={saving} onClick={onSave} type="button">
					<Save className="size-4" />
					{saving
						? t.savingPersona
						: selectedEntry?.kind === "custom" &&
							selectedEntry.id !== draft.id
							? t.saveAsNewPersona
							: t.savePersona}
				</Button>
				</div>
			</div>

			<section aria-labelledby="metadata-title">
				<h3 className="text-base font-semibold" id="metadata-title">
					{t.metadataTitle}
				</h3>
				<p className="mt-1 text-sm text-muted-foreground">
					{t.metadataDescription}
				</p>
				<div className="mt-4 grid grid-cols-2 gap-4 max-[760px]:grid-cols-1">
				<label className="grid gap-1.5 text-sm font-medium">
					{t.idLabel}
					<Input
						aria-label={t.idLabel}
						aria-invalid={validationErrors.id ? true : undefined}
						data-studio-field="id"
						onChange={(event) =>
							onDraftChange({ ...draft, id: event.target.value })
						}
						value={draft.id}
					/>
					{validationErrors.id ? (
						<span className="text-xs text-destructive">{validationErrors.id}</span>
					) : null}
				</label>
				<label className="grid gap-1.5 text-sm font-medium">
					{t.nameLabel}
					<Input
						aria-label={t.nameLabel}
						aria-invalid={validationErrors.name ? true : undefined}
						data-studio-field="name"
						onChange={(event) =>
							onDraftChange({ ...draft, name: event.target.value })
						}
						value={draft.name}
					/>
					{validationErrors.name ? (
						<span className="text-xs text-destructive">
							{validationErrors.name}
						</span>
					) : null}
				</label>
				<label className="grid gap-1.5 text-sm font-medium">
					{t.versionLabel}
					<Input
						aria-label={t.versionLabel}
						aria-invalid={validationErrors.version ? true : undefined}
						data-studio-field="version"
						onChange={(event) =>
							onDraftChange({ ...draft, version: event.target.value })
						}
						value={draft.version}
					/>
					{validationErrors.version ? (
						<span className="text-xs text-destructive">
							{validationErrors.version}
						</span>
					) : null}
				</label>
				<label className="grid gap-1.5 text-sm font-medium">
					{t.roleLabel}
					<Input
						aria-label={t.roleLabel}
						aria-invalid={validationErrors.role ? true : undefined}
						data-studio-field="role"
						onChange={(event) =>
							onDraftChange({ ...draft, role: event.target.value })
						}
						value={draft.role}
					/>
					{validationErrors.role ? (
						<span className="text-xs text-destructive">
							{validationErrors.role}
						</span>
					) : null}
				</label>
				<label className="grid gap-1.5 text-sm font-medium">
					{t.stageLabel}
					<select
						aria-label={t.stageLabel}
						aria-invalid={validationErrors.stage ? true : undefined}
						data-studio-field="stage"
						className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
						onChange={(event) =>
							onDraftChange({
								...draft,
								stage: event.target.value as AgentStage,
							})
						}
						value={draft.stage}
					>
						{AGENT_STAGES.map((stage) => (
							<option key={stage} value={stage}>
								{stage}
							</option>
						))}
					</select>
				</label>
				<label className="grid gap-1.5 text-sm font-medium">
					{t.modelLabel}
					<Input
						aria-label={t.modelLabel}
						aria-invalid={validationErrors.model ? true : undefined}
						data-studio-field="model"
						onChange={(event) =>
							onDraftChange({ ...draft, model: event.target.value })
						}
						placeholder={t.modelPlaceholder}
						value={draft.model}
					/>
				</label>
				<label className="grid gap-1.5 text-sm font-medium">
					{t.temperatureLabel}
					<Input
						aria-label={t.temperatureLabel}
						aria-invalid={validationErrors.temperature ? true : undefined}
						data-studio-field="temperature"
						max="2"
						min="0"
						onChange={(event) =>
							onDraftChange({ ...draft, temperature: event.target.value })
						}
						placeholder={t.temperaturePlaceholder}
						step="0.1"
						type="number"
						value={draft.temperature}
					/>
					{validationErrors.temperature ? (
						<span className="text-xs text-destructive">
							{validationErrors.temperature}
						</span>
					) : null}
				</label>
				<label className="col-span-2 grid gap-1.5 text-sm font-medium max-[760px]:col-span-1">
					{t.descriptionLabel}
					<Textarea
						aria-label={t.descriptionLabel}
						aria-invalid={validationErrors.description ? true : undefined}
						className="min-h-20 resize-y"
						data-studio-field="description"
						onChange={(event) =>
							onDraftChange({ ...draft, description: event.target.value })
						}
						value={draft.description}
					/>
					{validationErrors.description ? (
						<span className="text-xs text-destructive">
							{validationErrors.description}
						</span>
					) : null}
				</label>
				</div>
			</section>

			<AvatarBuilder
				accentColor={draft.accentColor}
				chassis={draft.chassis}
				onAccentColorChange={(accentColor) =>
					onDraftChange({ ...draft, accentColor })
				}
				onChassisChange={(chassis) => onDraftChange({ ...draft, chassis })}
				translations={t}
			/>

			<CapabilityMatrix
				onToolsChange={(tools) => onDraftChange({ ...draft, tools })}
				tools={draft.tools}
				translations={t}
			/>

			<MarkdownPromptEditor
				onChange={(instructions) =>
					onDraftChange({ ...draft, instructions })
				}
				translations={t}
				value={draft.instructions}
			/>
		</form>
	);
}
