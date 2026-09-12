"use client";

import {
	BUILTIN_PERSONAS,
	getDefaultSquadConfig,
	getSquadPresets,
	type SpecialistPersonaId,
	type SquadConfig,
	type SquadPresetId,
} from "@cline/shared/browser";
import {
	ChevronDown,
	Code2,
	Compass,
	Database,
	FileText,
	Globe,
	Layers,
	ListChecks,
	Sparkles,
	TestTube2,
	Users,
} from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { getLensTranslations } from "@/lib/lens-i18n";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "lens.ultra.squad-config.v1";

const PERSONA_ICONS: Record<
	SpecialistPersonaId,
	React.ComponentType<{ className?: string }>
> = {
	orion: Globe,
	lyra: Compass,
	athena: ListChecks,
	atlas: Layers,
	cipher: Code2,
	vector: Database,
	sentinel: TestTube2,
	echo: FileText,
};

export type SquadConfigPopoverProps = {
	onConfigChange?: (config: SquadConfig) => void;
	className?: string;
};

export function SquadConfigPopover({
	onConfigChange,
	className,
}: SquadConfigPopoverProps) {
	const t = getLensTranslations().ultraAgency;
	const [config, setConfig] = useState<SquadConfig>(() => {
		if (typeof window === "undefined") {
			return getDefaultSquadConfig();
		}
		try {
			const saved = window.localStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				if (
					Array.isArray(parsed.activePersonaIds) &&
					parsed.activePersonaIds.length > 0
				) {
					return parsed;
				}
			}
		} catch {
			// Fallback to default
		}
		return getDefaultSquadConfig();
	});

	const [isOpen, setIsOpen] = useState(false);
	const presets = getSquadPresets();

	const updateConfig = useCallback(
		(nextConfig: SquadConfig) => {
			setConfig(nextConfig);
			try {
				window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConfig));
			} catch {
				// Ignore storage errors
			}
			onConfigChange?.(nextConfig);
		},
		[onConfigChange],
	);

	const handleSelectPreset = useCallback(
		(presetId: SquadPresetId) => {
			const preset = presets.find((p) => p.id === presetId);
			if (!preset) return;
			updateConfig({
				...config,
				presetId,
				activePersonaIds: [...preset.personaIds],
			});
		},
		[config, presets, updateConfig],
	);

	const handleTogglePersona = useCallback(
		(personaId: SpecialistPersonaId) => {
			// Orion and Cipher are core and required
			if (personaId === "orion" || personaId === "cipher") return;

			const current = new Set(config.activePersonaIds);
			if (current.has(personaId)) {
				current.delete(personaId);
			} else {
				current.add(personaId);
			}

			const nextIds = Array.from(current) as SpecialistPersonaId[];
			updateConfig({
				...config,
				presetId: "custom",
				activePersonaIds: nextIds,
			});
		},
		[config, updateConfig],
	);

	const handleToggleCheckpoints = useCallback(
		(checked: boolean) => {
			updateConfig({
				...config,
				checkpointGatesEnabled: checked,
			});
		},
		[config, updateConfig],
	);

	const allPersonas = Object.values(BUILTIN_PERSONAS);
	const activeCount = config.activePersonaIds.length;

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className={cn(
						"h-7 gap-1.5 px-2 text-xs font-medium border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-primary",
						className,
					)}
					title={t.configureSquad}
					aria-label={t.configureSquad}
				>
					<Users className="h-3.5 w-3.5 text-primary" />
					<span>
						{t.squadLabel} ({activeCount})
					</span>
					<ChevronDown className="h-3 w-3 opacity-60" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				sideOffset={8}
				className="w-80 max-w-[90vw] p-4 bg-popover/95 backdrop-blur-md shadow-xl border-border/70 rounded-xl"
			>
				<div className="space-y-4">
					{/* Header */}
					<div>
						<div className="flex items-center gap-1.5 font-semibold text-sm">
							<Sparkles className="h-4 w-4 text-primary" />
							<span>{t.badge}</span>
							<Badge
								variant="outline"
								className="ml-auto text-[10px] uppercase tracking-wider font-mono"
							>
								{config.presetId}
							</Badge>
						</div>
						<p className="text-xs text-muted-foreground mt-0.5">{t.subtitle}</p>
					</div>

					{/* Presets */}
					<div className="space-y-1.5">
						<span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
							{t.squadPresetsLabel}
						</span>
						<div className="grid grid-cols-3 gap-1.5">
							{presets.map((p) => {
								const isSelected = config.presetId === p.id;
								const presetLabel =
									p.id === "core"
										? t.presetCore
										: p.id === "full"
											? t.presetFull
											: t.presetRapid;
								return (
									<button
										key={p.id}
										type="button"
										onClick={() => handleSelectPreset(p.id)}
										title={presetLabel}
										className={cn(
											"flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all",
											isSelected
												? "border-primary bg-primary/10 text-primary font-medium shadow-xs"
												: "border-border/60 hover:border-border hover:bg-accent/40 text-muted-foreground",
										)}
									>
										<span className="text-xs font-semibold capitalize truncate max-w-full">
											{p.id}
										</span>
										<span className="text-[10px] opacity-70">
											{p.personaIds.length} {t.agentsSuffix}
										</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* Specialist Personas Grid */}
					<div className="space-y-1.5">
						<span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
							{t.specialistPersonasLabel}
						</span>
						<div className="space-y-1 max-h-48 overflow-y-auto pr-1">
							{allPersonas.map((persona) => {
								const isActive = config.activePersonaIds.includes(persona.id);
								const isRequired =
									persona.id === "orion" || persona.id === "cipher";
								const Icon = PERSONA_ICONS[persona.id] ?? Globe;
								const checkboxId = `squad-persona-${persona.id}`;

								return (
									<label
										htmlFor={checkboxId}
										key={persona.id}
										className={cn(
											"flex items-center gap-2.5 p-1.5 rounded-md border text-xs cursor-pointer select-none transition-colors",
											isActive
												? "border-primary/30 bg-primary/5"
												: "border-transparent hover:bg-accent/30 text-muted-foreground opacity-60",
											isRequired && "cursor-default",
										)}
									>
										<div className="w-5 h-5 rounded-full flex items-center justify-center text-foreground bg-muted shrink-0 border border-border/60">
											<Icon className="h-3 w-3" />
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-1.5">
												<span className="font-semibold text-foreground truncate">
													{persona.name}
												</span>
												<span className="text-[10px] text-muted-foreground truncate">
													{persona.role}
												</span>
											</div>
										</div>
										<Checkbox
											id={checkboxId}
											checked={isActive}
											disabled={isRequired}
											onCheckedChange={() => handleTogglePersona(persona.id)}
											className="h-3.5 w-3.5"
										/>
									</label>
								);
							})}
						</div>
					</div>

					{/* Checkpoint Gates Toggle */}
					<div className="pt-2 border-t border-border/50">
						<div className="flex items-start gap-2.5">
							<Checkbox
								id="squad-checkpoints-toggle"
								checked={config.checkpointGatesEnabled}
								onCheckedChange={(checked) =>
									handleToggleCheckpoints(Boolean(checked))
								}
								className="mt-0.5"
							/>
							<label
								htmlFor="squad-checkpoints-toggle"
								className="space-y-0.5 cursor-pointer"
							>
								<span className="text-xs font-medium block">
									{t.checkpointGates}
								</span>
								<span className="text-[11px] text-muted-foreground block leading-snug">
									{t.checkpointGatesDesc}
								</span>
							</label>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
