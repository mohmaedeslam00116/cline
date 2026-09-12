"use client";

import {
	BUILTIN_PERSONAS,
	type SpecialistPersona,
	type SpecialistPersonaId,
} from "@cline/shared/browser";
import {
	CheckCircle2,
	Eye,
	Layers,
	Play,
	Radio,
	Sparkles,
	Volume2,
	Zap,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { PersonaAvatar, type PersonaActivityState } from "./svg";

const PERSONA_LIST: SpecialistPersonaId[] = [
	"orion",
	"lyra",
	"athena",
	"atlas",
	"cipher",
	"vector",
	"sentinel",
	"echo",
];

const STATE_OPTIONS: {
	id: PersonaActivityState;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	color: string;
}[] = [
	{ id: "idle", label: "Idle / Ready", icon: Eye, color: "text-emerald-400" },
	{
		id: "thinking",
		label: "Thinking / Scanning",
		icon: Sparkles,
		color: "text-purple-400",
	},
	{
		id: "speaking",
		label: "Speaking / Inter-Agent",
		icon: Volume2,
		color: "text-cyan-400",
	},
	{
		id: "working",
		label: "Working / Tool Exec",
		icon: Zap,
		color: "text-blue-400",
	},
	{
		id: "checkpoint",
		label: "Checkpoint Gate",
		icon: Radio,
		color: "text-amber-400",
	},
];

export const PersonaGallery: React.FC<{ className?: string }> = ({
	className,
}) => {
	const [activeState, setActiveState] = useState<PersonaActivityState>("idle");
	const [selectedPersonaId, setSelectedPersonaId] =
		useState<SpecialistPersonaId>("orion");

	const selectedPersona = BUILTIN_PERSONAS[selectedPersonaId];

	return (
		<div
			className={cn(
				"flex flex-col h-full bg-[#080c14] text-slate-100 p-6 rounded-xl border border-slate-800 shadow-2xl overflow-hidden",
				className,
			)}
		>
			{/* Header */}
			<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
				<div>
					<div className="flex items-center gap-2.5">
						<span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
						<h2 className="text-xl font-bold tracking-wider uppercase font-mono text-cyan-400">
							Cyberpunk Agency Persona Squad
						</h2>
						<Badge
							variant="outline"
							className="border-cyan-500/30 text-cyan-400 bg-cyan-950/40 text-xs"
						>
							8 Specialist Vectors
						</Badge>
					</div>
					<p className="text-xs text-slate-400 mt-1 font-mono">
						High-precision SVG avatars with live activity telemetry & state
						indicators
					</p>
				</div>

				{/* State Selector Switcher */}
				<div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
					{STATE_OPTIONS.map((opt) => {
						const Icon = opt.icon;
						const isSelected = activeState === opt.id;
						return (
							<Button
								key={opt.id}
								size="sm"
								variant={isSelected ? "secondary" : "ghost"}
								onClick={() => setActiveState(opt.id)}
								className={cn(
									"h-8 px-2.5 text-xs font-mono transition-all flex items-center gap-1.5",
									isSelected
										? "bg-slate-800 text-white shadow-sm border border-slate-700"
										: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50",
								)}
							>
								<Icon className={cn("w-3.5 h-3.5", opt.color)} />
								<span className="hidden sm:inline">{opt.label}</span>
							</Button>
						);
					})}
				</div>
			</div>

			{/* Main Content: Split Grid & Inspector */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 flex-1 min-h-0">
				{/* 8-Card Avatar Grid (7 Cols on large screens) */}
				<ScrollArea className="lg:col-span-7 pr-2">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pb-4">
						{PERSONA_LIST.map((pId) => {
							const persona = BUILTIN_PERSONAS[pId];
							const isSelected = selectedPersonaId === pId;

							return (
								<Card
									key={pId}
									onClick={() => setSelectedPersonaId(pId)}
									className={cn(
										"flex flex-col items-center p-3.5 rounded-xl transition-all duration-200 cursor-pointer text-center relative group border",
										isSelected
											? "bg-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-950/50 scale-[1.02]"
											: "bg-[#0c121e]/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60",
									)}
								>
									{/* Persona SVG Avatar with live state */}
									<div className="relative p-1">
										<PersonaAvatar
											personaId={pId}
											state={activeState}
											size={72}
											interactive
										/>
									</div>

									{/* Name & Role */}
									<div className="mt-2.5 w-full">
										<h4 className="text-sm font-bold tracking-wide text-slate-100 group-hover:text-cyan-300 transition-colors">
											{persona.name}
										</h4>
										<p className="text-[10px] text-slate-400 line-clamp-1 font-mono mt-0.5">
											{persona.role}
										</p>
									</div>

									{/* Active Badge */}
									<Badge
										variant="outline"
										className={cn(
											"mt-2 text-[9px] uppercase px-1.5 py-0 h-4 border",
											persona.badgeClass,
										)}
									>
										{pId}
									</Badge>
								</Card>
							);
						})}
					</div>
				</ScrollArea>

				{/* Persona Inspector Panel (5 Cols on large screens) */}
				<div className="lg:col-span-5 bg-[#0c121e] rounded-xl border border-slate-800 p-5 flex flex-col justify-between">
					{selectedPersona && (
						<div className="flex flex-col h-full">
							{/* Persona Header Preview */}
							<div className="flex items-center gap-4 pb-4 border-b border-slate-800">
								<div className="p-1 rounded-xl bg-slate-950 border border-slate-800 shadow-inner">
									<PersonaAvatar
										personaId={selectedPersona.id}
										state={activeState}
										size={96}
										showStatusRing
									/>
								</div>
								<div>
									<div className="flex items-center gap-2">
										<h3 className="text-lg font-bold text-slate-100">
											{selectedPersona.name}
										</h3>
										<Badge
											variant="outline"
											className={cn(
												"text-[10px] uppercase font-mono",
												selectedPersona.badgeClass,
											)}
										>
											{selectedPersona.id}
										</Badge>
									</div>
									<p className="text-xs text-cyan-400 font-mono mt-0.5 font-medium">
										{selectedPersona.role}
									</p>
									<p className="text-[11px] text-slate-400 mt-1 italic">
										"{selectedPersona.tagline}"
									</p>
								</div>
							</div>

							{/* Responsibilities & Deliverables */}
							<ScrollArea className="flex-1 my-4 pr-2">
								<div className="space-y-4 text-xs">
									<div>
										<h5 className="font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
											<Layers className="w-3.5 h-3.5 text-cyan-400" />
											Primary Deliverable
										</h5>
										<div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
											<div className="text-cyan-300 font-semibold">
												{selectedPersona.deliverableName}
											</div>
											<div className="text-slate-500 text-[10px] mt-0.5">
												Target: {selectedPersona.deliverableFile}
											</div>
										</div>
									</div>

									<div>
										<h5 className="font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
											<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
											Core Responsibilities
										</h5>
										<ul className="space-y-1.5 text-slate-300">
											{selectedPersona.responsibilities.map((r, i) => (
												<li key={i} className="flex items-start gap-2">
													<span className="text-cyan-400 text-xs font-bold leading-tight">
														▹
													</span>
													<span className="leading-relaxed">{r}</span>
												</li>
											))}
										</ul>
									</div>

									<div>
										<h5 className="font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
											<Sparkles className="w-3.5 h-3.5 text-purple-400" />
											System Prompt Seed
										</h5>
										<div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 font-mono text-[10.5px] text-slate-400 leading-relaxed italic">
											"{selectedPersona.systemPromptSnippet}"
										</div>
									</div>
								</div>
							</ScrollArea>

							{/* Footer Status Bar */}
							<div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
								<div className="flex items-center gap-1.5">
									<span
										className="w-2 h-2 rounded-full animate-ping"
										style={{ backgroundColor: selectedPersona.color }}
									/>
									<span>STATUS: {activeState.toUpperCase()}</span>
								</div>
								<span className="text-slate-500">LENS WORKSTATION // V0.1</span>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
