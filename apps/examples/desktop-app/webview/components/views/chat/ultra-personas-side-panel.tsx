"use client";

import {
	BUILTIN_PERSONAS,
	getSquadPresets,
	type SpecialistPersona,
	type SpecialistPersonaId,
	type SquadPresetId,
} from "@cline/shared/browser";
import {
	Check,
	ChevronDown,
	ChevronRight,
	Code2,
	Compass,
	Database,
	ExternalLink,
	FileText,
	Globe,
	Layers,
	ListChecks,
	ShieldAlert,
	ShieldCheck,
	Sparkles,
	TestTube2,
	Users,
	Workflow,
} from "lucide-react";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { useSquadConfig } from "@/hooks/use-squad-config";
import { getLensDirection, getLensTranslations } from "@/lib/lens-i18n";
import { cn } from "@/lib/utils";

export const PERSONA_ICONS: Record<
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

const PERSONA_ACCENT_CLASSES: Record<
	SpecialistPersonaId,
	{ badge: string; border: string; bg: string; text: string; glow: string }
> = {
	orion: {
		badge: "bg-blue-500/15 text-blue-500 border-blue-500/30",
		border: "border-blue-500/30 hover:border-blue-500/60",
		bg: "bg-blue-500/10",
		text: "text-blue-500",
		glow: "shadow-blue-500/20",
	},
	lyra: {
		badge: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
		border: "border-cyan-500/30 hover:border-cyan-500/60",
		bg: "bg-cyan-500/10",
		text: "text-cyan-500",
		glow: "shadow-cyan-500/20",
	},
	athena: {
		badge: "bg-purple-500/15 text-purple-500 border-purple-500/30",
		border: "border-purple-500/30 hover:border-purple-500/60",
		bg: "bg-purple-500/10",
		text: "text-purple-500",
		glow: "shadow-purple-500/20",
	},
	atlas: {
		badge: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
		border: "border-emerald-500/30 hover:border-emerald-500/60",
		bg: "bg-emerald-500/10",
		text: "text-emerald-500",
		glow: "shadow-emerald-500/20",
	},
	vector: {
		badge: "bg-amber-500/15 text-amber-500 border-amber-500/30",
		border: "border-amber-500/30 hover:border-amber-500/60",
		bg: "bg-amber-500/10",
		text: "text-amber-500",
		glow: "shadow-amber-500/20",
	},
	cipher: {
		badge: "bg-orange-500/15 text-orange-500 border-orange-500/30",
		border: "border-orange-500/30 hover:border-orange-500/60",
		bg: "bg-orange-500/10",
		text: "text-orange-500",
		glow: "shadow-orange-500/20",
	},
	sentinel: {
		badge: "bg-rose-500/15 text-rose-500 border-rose-500/30",
		border: "border-rose-500/30 hover:border-rose-500/60",
		bg: "bg-rose-500/10",
		text: "text-rose-500",
		glow: "shadow-rose-500/20",
	},
	echo: {
		badge: "bg-violet-500/15 text-violet-500 border-violet-500/30",
		border: "border-violet-500/30 hover:border-violet-500/60",
		bg: "bg-violet-500/10",
		text: "text-violet-500",
		glow: "shadow-violet-500/20",
	},
};

/**
 * Slide-over side panel displaying all Ultra Mode personas, their responsibilities,
 * active presets, and golden checkpoint gate configurations.
 */
export function UltraPersonasSidePanel({
	open,
	onOpenChange,
	trigger,
}: {
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	trigger?: React.ReactNode;
}) {
	const [config, updateConfig] = useSquadConfig();
	const t = getLensTranslations().ultraAgency;
	const dir = getLensDirection();
	const presets = getSquadPresets();
	const allPersonas = useMemo(() => Object.values(BUILTIN_PERSONAS), []);
	const [expandedPersona, setExpandedPersona] =
		useState<SpecialistPersonaId | null>(null);

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
			if (personaId === "orion" || personaId === "cipher") return;
			const current = new Set(config.activePersonaIds);
			if (current.has(personaId)) {
				current.delete(personaId);
			} else {
				current.add(personaId);
			}
			updateConfig({
				...config,
				presetId: "custom",
				activePersonaIds: Array.from(current),
			});
		},
		[config, updateConfig],
	);

	const handleToggleCheckpoints = useCallback(
		(enabled: boolean) => {
			updateConfig({
				...config,
				checkpointGatesEnabled: enabled,
			});
		},
		[config, updateConfig],
	);

	const activeCount = config.activePersonaIds.length;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			{trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}
			<SheetContent
				side="right"
				className="w-full sm:max-w-md p-0 flex flex-col bg-background/95 backdrop-blur-md border-l border-border/70 shadow-2xl"
				dir={dir}
			>
				{/* Header */}
				<SheetHeader className="p-5 border-b border-border/60 shrink-0 bg-muted/20">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<div className="size-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
								<Workflow className="size-4.5" />
							</div>
							<div>
								<SheetTitle className="text-base font-semibold flex items-center gap-2">
									<span>{t.badge}</span>
									<Badge
										variant="outline"
										className="text-[10px] font-mono uppercase bg-primary/10 text-primary border-primary/30"
									>
										{config.presetId} • {activeCount} {t.agentsSuffix}
									</Badge>
								</SheetTitle>
								<SheetDescription className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
									{t.subtitle}
								</SheetDescription>
							</div>
						</div>
					</div>
				</SheetHeader>

				{/* Scrollable Content */}
				<ScrollArea className="flex-1 min-h-0">
					<div className="p-5 space-y-6">
						{/* Preset Selector */}
						<div>
							<span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
								{t.squadPresetsLabel}
							</span>
							<div className="grid grid-cols-3 gap-2">
								{presets.map((preset) => {
									const isSelected = config.presetId === preset.id;
									const presetLabel =
										preset.id === "core"
											? t.presetCore
											: preset.id === "full"
												? t.presetFull
												: t.presetRapid;
									return (
										<button
											key={preset.id}
											type="button"
											onClick={() => handleSelectPreset(preset.id)}
											className={cn(
												"flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all cursor-pointer",
												isSelected
													? "border-primary bg-primary/10 text-primary font-medium shadow-xs"
													: "border-border/60 hover:border-border hover:bg-accent/40 text-muted-foreground",
											)}
										>
											<span className="text-xs font-semibold capitalize truncate max-w-full">
												{preset.id}
											</span>
											<span className="text-[10px] opacity-75 mt-0.5">
												{preset.personaIds.length} {t.agentsSuffix}
											</span>
										</button>
									);
								})}
							</div>
						</div>

						{/* Personas Cards */}
						<div>
							<div className="flex items-center justify-between mb-2">
								<span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
									{t.specialistPersonasLabel}
								</span>
								<span className="text-[11px] text-muted-foreground">
									{activeCount} / {allPersonas.length}
								</span>
							</div>

							<div className="space-y-2">
								{allPersonas.map((persona) => {
									const Icon = PERSONA_ICONS[persona.id] ?? Globe;
									const isActive = config.activePersonaIds.includes(persona.id);
									const isRequired =
										persona.id === "orion" || persona.id === "cipher";
									const isExpanded = expandedPersona === persona.id;
									const colors = PERSONA_ACCENT_CLASSES[persona.id];

									return (
										<div
											key={persona.id}
											className={cn(
												"rounded-xl border transition-all overflow-hidden",
												isActive
													? cn(
															"bg-card/70 border-border/80 shadow-xs",
															isExpanded && colors.border,
														)
													: "bg-muted/30 border-transparent opacity-60 hover:opacity-80",
											)}
										>
											{/* Main row */}
											<div className="p-3 flex items-center gap-3">
												{/* Avatar Icon */}
												<div
													className={cn(
														"size-8 rounded-lg flex items-center justify-center shrink-0 border",
														colors.bg,
														colors.border,
														colors.text,
													)}
												>
													<Icon className="size-4" />
												</div>

												{/* Name & Role */}
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2">
														<span className="text-sm font-semibold text-foreground">
															{persona.name}
														</span>
														<Badge
															variant="outline"
															className={cn(
																"text-[10px] py-0 px-1.5 font-normal",
																colors.badge,
															)}
														>
															{persona.role}
														</Badge>
													</div>
													<p className="text-[11px] text-muted-foreground truncate mt-0.5">
														{persona.tagline}
													</p>
												</div>

												{/* Actions */}
												<div className="flex items-center gap-1.5 shrink-0">
													<button
														type="button"
														onClick={() =>
															setExpandedPersona(
																isExpanded ? null : persona.id,
															)
														}
														className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
														title="Details"
													>
														{isExpanded ? (
															<ChevronDown className="size-3.5" />
														) : (
															<ChevronRight className="size-3.5" />
														)}
													</button>
													<Checkbox
														id={`side-panel-${persona.id}`}
														checked={isActive}
														disabled={isRequired}
														onCheckedChange={() =>
															handleTogglePersona(persona.id)
														}
														className="size-4"
													/>
												</div>
											</div>

											{/* Expanded Details */}
											{isExpanded && (
												<div className="px-3.5 pb-3.5 pt-1 border-t border-border/40 text-xs space-y-2.5 bg-muted/10">
													<div>
														<span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block mb-1">
															Responsibilities
														</span>
														<ul className="space-y-1 text-muted-foreground text-[11px]">
															{persona.responsibilities.map((resp, i) => (
																<li key={i} className="flex items-start gap-1.5">
																	<span className="text-primary mt-1">•</span>
																	<span>{resp}</span>
																</li>
															))}
														</ul>
													</div>

													<div className="flex items-center justify-between text-[11px] pt-1 text-muted-foreground border-t border-border/30">
														<span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
															{persona.deliverableFile}
														</span>
														<span className="text-[10px] font-medium text-foreground">
															{persona.deliverableName}
														</span>
													</div>
												</div>
											)}
										</div>
									);
								})}
							</div>
						</div>

						{/* Golden Checkpoint Gates */}
						<div className="p-3.5 rounded-xl border border-border/70 bg-card/50 space-y-3">
							<div className="flex items-start justify-between gap-3">
								<div className="space-y-0.5">
									<div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
										<Sparkles className="size-3.5 text-primary" />
										<span>{t.checkpointGates}</span>
									</div>
									<p className="text-[11px] text-muted-foreground leading-relaxed">
										{t.checkpointGatesDesc}
									</p>
								</div>
								<Checkbox
									id="side-panel-checkpoints"
									checked={config.checkpointGatesEnabled}
									onCheckedChange={(checked) =>
										handleToggleCheckpoints(Boolean(checked))
									}
									className="size-4 mt-0.5"
								/>
							</div>

							<div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-border/40">
								<div className="p-2 rounded bg-muted/40 border border-border/40">
									<span className="font-semibold text-foreground block">
										Gate 1: Blueprint
									</span>
									<span className="text-muted-foreground">
										PRD & System Architecture review
									</span>
								</div>
								<div className="p-2 rounded bg-muted/40 border border-border/40">
									<span className="font-semibold text-foreground block">
										Gate 2: Pre-Ship
									</span>
									<span className="text-muted-foreground">
										Test suites & Verification check
									</span>
								</div>
							</div>
						</div>
					</div>
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}

/**
 * Prominent banner displayed on the Welcome Screen when Ultra Mode is active,
 * giving immediate, unmistakable visual proof of the 8 specialist personas.
 */
export function UltraSquadShowcase({
	onOpenPanel,
}: {
	onOpenPanel?: () => void;
}) {
	const [config] = useSquadConfig();
	const t = getLensTranslations().ultraAgency;
	const dir = getLensDirection();
	const allPersonas = useMemo(() => Object.values(BUILTIN_PERSONAS), []);

	return (
		<div
			dir={dir}
			className="w-full rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-background p-4 sm:p-5 shadow-lg backdrop-blur-md mb-4 transition-all"
		>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/50">
				<div className="flex items-center gap-2.5">
					<div className="size-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-500 shadow-xs">
						<Workflow className="size-5" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<h3 className="text-sm font-semibold text-foreground tracking-tight">
								{t.badge}
							</h3>
							<Badge
								variant="outline"
								className="text-[10px] font-mono uppercase bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
							>
								{config.activePersonaIds.length} {t.agentsSuffix} Active
							</Badge>
						</div>
						<p className="text-xs text-muted-foreground mt-0.5">
							{t.subtitle}
						</p>
					</div>
				</div>

				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onOpenPanel}
					className="h-8 gap-1.5 text-xs font-medium border-indigo-500/30 hover:border-indigo-500/60 hover:bg-indigo-500/10 text-indigo-400 self-start sm:self-auto cursor-pointer"
				>
					<Users className="size-3.5" />
					<span>{t.configureSquad}</span>
				</Button>
			</div>

			{/* Personas Row */}
			<div className="pt-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
				{allPersonas.map((persona) => {
					const Icon = PERSONA_ICONS[persona.id] ?? Globe;
					const isActive = config.activePersonaIds.includes(persona.id);
					const colors = PERSONA_ACCENT_CLASSES[persona.id];

					return (
						<button
							key={persona.id}
							type="button"
							onClick={onOpenPanel}
							className={cn(
								"flex flex-col items-center p-2 rounded-xl border text-center transition-all cursor-pointer",
								isActive
									? cn("bg-card/60 hover:bg-card border-border/70", colors.border)
									: "bg-muted/20 border-transparent opacity-40 hover:opacity-60",
							)}
						>
							<div
								className={cn(
									"size-7 rounded-lg flex items-center justify-center mb-1.5 border",
									colors.bg,
									colors.border,
									colors.text,
								)}
							>
								<Icon className="size-3.5" />
							</div>
							<span className="text-xs font-semibold text-foreground truncate max-w-full">
								{persona.name}
							</span>
							<span className="text-[10px] text-muted-foreground truncate max-w-full">
								{persona.role}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
