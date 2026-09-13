import { Copy, LockKeyhole, Save } from "lucide-react";
import { PersonaAvatar } from "@/components/personas/svg/persona-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LensTranslations } from "@/lib/lens-i18n";
import { AvatarBuilder } from "./avatar-builder";
import type { PersonaDraft, PersonaLibraryEntry } from "./persona-studio-model";

interface PersonaEditorProps {
	readonly draft: PersonaDraft | null;
	readonly onDraftChange: (draft: PersonaDraft) => void;
	readonly onDuplicate: (
		entry: Extract<PersonaLibraryEntry, { kind: "builtin" }>,
	) => void;
	readonly selectedEntry: PersonaLibraryEntry | undefined;
	readonly translations: LensTranslations["personaStudio"];
}

export function PersonaEditor({
	draft,
	onDraftChange,
	onDuplicate,
	selectedEntry,
	translations: t,
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
				<Button type="button">
					<Save className="size-4" />
					{t.savePersona}
				</Button>
			</div>

			<div className="grid grid-cols-2 gap-4 max-[760px]:grid-cols-1">
				<label className="grid gap-1.5 text-sm font-medium">
					{t.idLabel}
					<Input
						aria-label={t.idLabel}
						onChange={(event) =>
							onDraftChange({ ...draft, id: event.target.value })
						}
						value={draft.id}
					/>
				</label>
				<label className="grid gap-1.5 text-sm font-medium">
					{t.nameLabel}
					<Input
						aria-label={t.nameLabel}
						onChange={(event) =>
							onDraftChange({ ...draft, name: event.target.value })
						}
						value={draft.name}
					/>
				</label>
			</div>

			<AvatarBuilder
				accentColor={draft.accentColor}
				chassis={draft.chassis}
				onAccentColorChange={(accentColor) =>
					onDraftChange({ ...draft, accentColor })
				}
				onChassisChange={(chassis) => onDraftChange({ ...draft, chassis })}
				translations={t}
			/>
		</form>
	);
}
