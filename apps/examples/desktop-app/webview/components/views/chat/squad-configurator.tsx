"use client";

import {
	getSquadPresets,
	type SquadConfig,
	type SquadPreset,
} from "@cline/shared/browser";
import { AlertTriangle, RefreshCw, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { PersonaAvatar } from "@/components/personas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { usePersonaCatalog } from "@/hooks/use-persona-catalog";
import { useSquadConfig, useSquadPresets } from "@/hooks/use-squad-config";
import {
	createCustomSquadPreset,
	deleteCustomSquadPreset,
	saveCustomSquadPreset,
	validateSquadPresetName,
} from "@/lib/squad-presets";
import { cn } from "@/lib/utils";
import {
	findUnavailablePersonaIds,
	toggleSquadPersona,
} from "./squad-selection-model";

function titleCase(value: string): string {
	return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

export interface SquadConfiguratorProps {
	workspaceRoot?: string;
	compact?: boolean;
	onConfigChange?: (config: SquadConfig) => void;
}

export function SquadConfigurator({
	workspaceRoot,
	compact = false,
	onConfigChange,
}: SquadConfiguratorProps) {
	const catalog = usePersonaCatalog(workspaceRoot);
	const [config, updateConfig] = useSquadConfig();
	const [customPresets, updateCustomPresets] = useSquadPresets();
	const [isSaving, setIsSaving] = useState(false);
	const [presetName, setPresetName] = useState("");
	const [saveError, setSaveError] = useState<string | null>(null);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const builtInPresets = useMemo(() => getSquadPresets(), []);
	const presets = useMemo(
		() => [...builtInPresets, ...customPresets],
		[builtInPresets, customPresets],
	);
	const unavailablePersonaIds = findUnavailablePersonaIds(config, catalog.byId);
	function commitConfig(nextConfig: SquadConfig) {
		updateConfig(nextConfig);
		onConfigChange?.(nextConfig);
	}

	function selectPreset(preset: SquadPreset) {
		commitConfig({
			presetId: preset.id,
			activePersonaIds: [...preset.personaIds],
			checkpointGatesEnabled: preset.checkpointGatesEnabled,
		});
		setSaveError(null);
	}

	function beginSave() {
		const selected = customPresets.find(
			(preset) => preset.id === config.presetId,
		);
		setPresetName(selected?.name ?? "");
		setSaveError(null);
		setIsSaving(true);
	}

	function persistPreset() {
		const overwriteId = customPresets.some(
			(preset) => preset.id === config.presetId,
		)
			? config.presetId
			: undefined;
		const nameError = validateSquadPresetName(
			presetName,
			customPresets,
			overwriteId,
		);
		if (nameError) {
			setSaveError(nameError);
			return;
		}
		try {
			const preset = createCustomSquadPreset({
				name: presetName,
				personaIds: config.activePersonaIds,
				checkpointGatesEnabled: config.checkpointGatesEnabled,
			});
			const nextPreset = overwriteId ? { ...preset, id: overwriteId } : preset;
			updateCustomPresets(
				saveCustomSquadPreset(customPresets, nextPreset, overwriteId),
			);
			commitConfig({
				...config,
				presetId: nextPreset.id,
			});
			setIsSaving(false);
			setSaveError(null);
		} catch (cause) {
			setSaveError(cause instanceof Error ? cause.message : String(cause));
		}
	}

	function confirmDelete(presetId: string) {
		updateCustomPresets(deleteCustomSquadPreset(customPresets, presetId));
		if (config.presetId === presetId) selectPreset(builtInPresets[0]);
		setDeleteTargetId(null);
	}

	return (
		<div className={cn("space-y-4", compact ? "text-xs" : "text-sm")}>
			<section aria-labelledby="squad-presets-heading" className="space-y-2">
				<div className="flex items-center justify-between gap-3">
					<h3
						className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
						id="squad-presets-heading"
					>
						Squad presets
					</h3>
					<Button
						className="h-7 gap-1.5 px-2 text-xs"
						onClick={beginSave}
						size="sm"
						type="button"
						variant="outline"
					>
						<Save className="size-3.5" />
						Save preset
					</Button>
				</div>

				<div className="grid grid-cols-2 gap-1.5">
					{presets.map((preset) => {
						const selected = preset.id === config.presetId;
						const deleting = deleteTargetId === preset.id;
						return (
							<div
								className={cn(
									"min-w-0 rounded-lg border p-2",
									selected
										? "border-primary/55 bg-primary/10"
										: "border-border/70 bg-card hover:border-border",
								)}
								key={preset.id}
							>
								<div className="flex items-start gap-1">
									<button
										aria-pressed={selected}
										className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
										onClick={() => selectPreset(preset)}
										type="button"
									>
										<span className="block truncate text-xs font-semibold text-foreground">
											{preset.name}
										</span>
										<span className="mt-0.5 block text-[10px] text-muted-foreground">
											{preset.personaIds.length} agents
										</span>
									</button>
									{preset.source === "custom" ? (
										<button
											aria-label={`Delete ${preset.name}`}
											className="rounded p-1 text-muted-foreground outline-none hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-primary/70"
											onClick={() => setDeleteTargetId(preset.id)}
											type="button"
										>
											<Trash2 className="size-3.5" />
										</button>
									) : null}
								</div>
								{deleting ? (
									<div className="mt-2 border-t border-border/60 pt-2">
										<p className="text-[11px] font-medium text-foreground">
											Delete this preset?
										</p>
										<p className="mt-0.5 text-[10px] text-muted-foreground">
											Persona files stay unchanged.
										</p>
										<div className="mt-2 flex gap-1.5">
											<Button
												className="h-6 px-2 text-[10px]"
												onClick={() => confirmDelete(preset.id)}
												size="sm"
												type="button"
												variant="destructive"
											>
												Confirm delete
											</Button>
											<Button
												className="h-6 px-2 text-[10px]"
												onClick={() => setDeleteTargetId(null)}
												size="sm"
												type="button"
												variant="ghost"
											>
												Cancel
											</Button>
										</div>
									</div>
								) : null}
							</div>
						);
					})}
				</div>

				{isSaving ? (
					<div className="rounded-lg border border-border/70 bg-muted/25 p-2.5">
						<label
							className="text-[11px] font-medium text-foreground"
							htmlFor="squad-preset-name"
						>
							Preset name
						</label>
						<div className="mt-1.5 flex gap-1.5">
							<Input
								aria-label="Preset name"
								className="h-8 text-xs"
								id="squad-preset-name"
								onChange={(event) => setPresetName(event.target.value)}
								placeholder="Release Review"
								value={presetName}
							/>
							<Button
								className="h-8 text-xs"
								onClick={persistPreset}
								size="sm"
								type="button"
							>
								{customPresets.some((preset) => preset.id === config.presetId)
									? "Overwrite preset"
									: "Create preset"}
							</Button>
						</div>
						{saveError ? (
							<p className="mt-1.5 text-[11px] text-destructive" role="alert">
								{saveError}
							</p>
						) : null}
					</div>
				) : null}
			</section>

			<section aria-labelledby="squad-personas-heading" className="space-y-2">
				<div className="flex items-center justify-between gap-3">
					<h3
						className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
						id="squad-personas-heading"
					>
						Specialist personas
					</h3>
					<span className="font-mono text-[10px] tabular-nums text-muted-foreground">
						{config.activePersonaIds.length} / {catalog.personas.length}
					</span>
				</div>

				{catalog.status === "error" ? (
					<div
						className="flex items-center gap-2 rounded-lg border border-destructive/35 bg-destructive/8 p-2 text-[11px] text-foreground"
						role="alert"
					>
						<AlertTriangle className="size-3.5 shrink-0 text-destructive" />
						<span className="min-w-0 flex-1 truncate">
							Custom personas unavailable: {catalog.error}
						</span>
						<Button
							className="h-6 gap-1 px-2 text-[10px]"
							onClick={() => void catalog.reload()}
							size="sm"
							type="button"
							variant="outline"
						>
							<RefreshCw className="size-3" /> Retry
						</Button>
					</div>
				) : null}

				{unavailablePersonaIds.length > 0 ? (
					<div
						className="rounded-lg border border-amber-500/40 bg-amber-500/8 p-2 text-[11px] text-amber-200"
						role="alert"
					>
						Unavailable personas: {unavailablePersonaIds.join(", ")}. Repair the
						selection before starting Ultra mode.
					</div>
				) : null}

				<div
					className={cn(
						"space-y-1 overflow-y-auto pr-1",
						compact ? "max-h-64" : "max-h-[52vh]",
					)}
				>
					{catalog.personas.map((persona) => {
						const selected = config.activePersonaIds.includes(persona.id);
						const required = persona.id === "orion";
						return (
							<label
								className={cn(
									"flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors",
									selected
										? "border-primary/35 bg-primary/7"
										: "border-transparent bg-muted/20 text-muted-foreground hover:bg-muted/40",
									required && "cursor-default",
								)}
								htmlFor={`squad-persona-${persona.id}`}
								key={persona.id}
							>
								<PersonaAvatar
									accentColor={persona.avatar.accentColor}
									chassis={persona.avatar.chassis}
									personaId={persona.id}
									showGlow={selected}
									showStatusRing={selected}
									size={32}
									state="idle"
									title={`${persona.name} — ${persona.role}`}
								/>
								<span className="min-w-0 flex-1">
									<span className="flex items-center gap-1.5">
										<span className="truncate text-xs font-semibold text-foreground">
											{persona.name}
										</span>
										{required ? (
											<Badge
												className="h-4 px-1.5 text-[9px]"
												variant="outline"
											>
												Required leader
											</Badge>
										) : null}
										{persona.scope !== "builtin" ? (
											<Badge
												className="h-4 px-1.5 text-[9px]"
												variant="secondary"
											>
												{titleCase(persona.scope)}
											</Badge>
										) : null}
									</span>
									<span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
										<span className="truncate">{persona.role}</span>
										<span aria-hidden="true">·</span>
										<span className="tracking-wide">
											{persona.stage.toUpperCase()}
										</span>
									</span>
								</span>
								<Checkbox
									aria-label={`Toggle ${persona.name}`}
									checked={selected}
									disabled={required}
									id={`squad-persona-${persona.id}`}
									onCheckedChange={() =>
										commitConfig(toggleSquadPersona(config, persona.id))
									}
								/>
							</label>
						);
					})}
				</div>
			</section>

			<section className="border-t border-border/70 pt-3">
				<label
					className="flex cursor-pointer items-start gap-2.5"
					htmlFor="squad-checkpoints-toggle"
				>
					<Checkbox
						checked={config.checkpointGatesEnabled}
						className="mt-0.5"
						id="squad-checkpoints-toggle"
						onCheckedChange={(checked) =>
							commitConfig({
								...config,
								checkpointGatesEnabled: Boolean(checked),
							})
						}
					/>
					<span>
						<span className="block text-xs font-medium text-foreground">
							Golden checkpoint gates
						</span>
						<span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
							Pause after blueprint alignment and before shipping verified
							changes.
						</span>
					</span>
				</label>
			</section>
		</div>
	);
}
