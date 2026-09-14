"use client";

import type { PersonaId } from "@cline/shared/browser";
import {
	Activity,
	Cpu,
	Maximize2,
	Minimize2,
	Pause,
	Play,
	Radio,
	RotateCcw,
	Send,
	SkipForward,
	Users,
	Wrench,
	X,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PersonaAvatar } from "@/components/personas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLensTranslations } from "@/lib/lens-i18n";
import { cn } from "@/lib/utils";
import { AgentMessageBubble } from "./agent-message-bubble";
import { useWarRoom } from "./war-room-context";

export interface AgencyWarRoomPanelProps {
	className?: string;
	onClose?: () => void;
}

export const AgencyWarRoomPanel: React.FC<AgencyWarRoomPanelProps> = ({
	className,
	onClose,
}) => {
	const t = getLensTranslations().ultraAgency;
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const previousFocusRef = useRef<HTMLElement | null>(null);
	const [directDirective, setDirectDirective] = useState("");

	const {
		viewMode,
		toggleFullscreen,
		closeWarRoom,
		messages,
		activeFilterPersona,
		setFilterPersona,
		checkpointGates,
		activePersonaStates,
		isSimulating,
		playSimulation,
		pauseSimulation,
		stepSimulation,
		resetSimulation,
		approveCheckpoint,
		rejectCheckpoint,
		addMessage,
		activePersonaIds,
		personaById,
		resolvePersona,
	} = useWarRoom();
	const filterPersonaIds = useMemo(() => {
		const ids = new Set<PersonaId>(activePersonaIds);
		for (const message of messages) {
			ids.add(message.senderPersonaId);
			if (message.recipientPersonaId && message.recipientPersonaId !== "all") {
				ids.add(message.recipientPersonaId);
			}
		}
		return [...ids];
	}, [activePersonaIds, messages]);

	// Keyboard focus containment & Escape key trap for fullscreen dialog mode
	useEffect(() => {
		if (viewMode === "fullscreen") {
			previousFocusRef.current = document.activeElement as HTMLElement | null;

			const handleKeyDown = (e: KeyboardEvent) => {
				if (e.key === "Escape") {
					toggleFullscreen();
				}
			};

			window.addEventListener("keydown", handleKeyDown);
			return () => {
				window.removeEventListener("keydown", handleKeyDown);
				previousFocusRef.current?.focus?.();
			};
		}
	}, [viewMode, toggleFullscreen]);

	const handleClose = onClose || closeWarRoom;

	// Filter messages by active persona
	const filteredMessages = useMemo(() => {
		if (activeFilterPersona === "all") return messages;
		return messages.filter(
			(m) =>
				m.senderPersonaId === activeFilterPersona ||
				m.recipientPersonaId === activeFilterPersona,
		);
	}, [messages, activeFilterPersona]);

	// Gate lookup map
	const gateMap = useMemo(() => {
		const map = new Map<string, (typeof checkpointGates)[0]>();
		for (const gate of checkpointGates) {
			map.set(gate.id, gate);
		}
		return map;
	}, [checkpointGates]);

	// Metrics
	const pendingGatesCount = useMemo(
		() => checkpointGates.filter((g) => g.status === "pending").length,
		[checkpointGates],
	);

	const activeToolCallsCount = useMemo(
		() => messages.filter((m) => m.type === "tool_call").length,
		[messages],
	);

	const handleSendDirective = (e: React.FormEvent) => {
		e.preventDefault();
		if (!directDirective.trim()) return;

		addMessage({
			senderPersonaId: "orion",
			recipientPersonaId: "all",
			stage: "strategy",
			type: "chat",
			content: `${t.directiveReceived} "${directDirective.trim()}". ${t.directiveRealigning}`,
		});

		setDirectDirective("");
	};

	const innerContent = (
		<>
			{/* Top Cyberpunk War Room Header */}
			<div className="flex flex-col gap-3 border-b border-[#2f2f37] bg-[#18191b] px-4 py-3 shrink-0">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex min-w-0 items-center gap-2.5">
						<span className="relative flex h-2.5 w-2.5">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
							<span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
						</span>
						<div className="flex min-w-0 flex-wrap items-center gap-2">
							<h2 className="whitespace-nowrap text-sm font-bold tracking-wider uppercase font-mono text-cyan-400">
								{t.warRoomTitle}
							</h2>
							<Badge
								variant="outline"
								className="border-cyan-500/30 text-cyan-400 bg-cyan-950/40 text-[10px] font-mono"
							>
								{t.liveSwarmBadge}
							</Badge>
							{pendingGatesCount > 0 && (
								<Badge
									variant="outline"
									className="border-amber-500/50 text-amber-400 bg-amber-950/50 text-[10px] font-mono animate-pulse"
								>
									<Radio className="size-2.5 mr-1" />
									{pendingGatesCount} {t.gatePendingBadge}
								</Badge>
							)}
						</div>
					</div>

					{/* Actions: Simulation Controls & Layout Controls */}
					<div className="flex max-w-full items-center gap-1.5 overflow-x-auto no-scrollbar">
						{/* Simulation Controls */}
						<div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-md border border-slate-800 mr-1">
							<Button
								type="button"
								size="icon-sm"
								variant="ghost"
								onClick={isSimulating ? pauseSimulation : playSimulation}
								className="h-6 w-6 text-cyan-400 hover:text-cyan-200 hover:bg-cyan-950/50"
								title={isSimulating ? t.simulationPause : t.simulationPlay}
								aria-label={isSimulating ? t.simulationPause : t.simulationPlay}
							>
								{isSimulating ? (
									<Pause className="size-3" />
								) : (
									<Play className="size-3" />
								)}
							</Button>
							<Button
								type="button"
								size="icon-sm"
								variant="ghost"
								onClick={stepSimulation}
								className="h-6 w-6 text-slate-300 hover:text-slate-100 hover:bg-slate-800"
								title={t.simulationStep}
								aria-label={t.simulationStep}
							>
								<SkipForward className="size-3" />
							</Button>
							<Button
								type="button"
								size="icon-sm"
								variant="ghost"
								onClick={resetSimulation}
								className="h-6 w-6 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
								title={t.simulationReset}
								aria-label={t.simulationReset}
							>
								<RotateCcw className="size-3" />
							</Button>
						</div>

						{/* Fullscreen Toggle */}
						<Button
							type="button"
							size="icon-sm"
							variant="ghost"
							onClick={toggleFullscreen}
							className="h-7 w-7 text-slate-400 hover:text-slate-200"
							title={
								viewMode === "fullscreen" ? t.exitFullScreen : t.fullScreen
							}
							aria-label={
								viewMode === "fullscreen" ? t.exitFullScreen : t.fullScreen
							}
						>
							{viewMode === "fullscreen" ? (
								<Minimize2 className="size-3.5" />
							) : (
								<Maximize2 className="size-3.5" />
							)}
						</Button>

						{/* Close Panel */}
						<Button
							type="button"
							size="icon-sm"
							variant="ghost"
							onClick={handleClose}
							className="h-7 w-7 text-slate-400 hover:text-slate-200"
							title={t.closeWarRoom}
							aria-label={t.closeWarRoom}
						>
							<X className="size-4" />
						</Button>
					</div>
				</div>

				{/* Active Squad Mini-Avatar Strip */}
				<div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
					<span className="text-[10px] font-mono uppercase text-slate-400 shrink-0">
						{t.squadRosterLabel}
					</span>
					{activePersonaIds.map((personaId) => {
						const persona = resolvePersona(personaId);
						const state = activePersonaStates[personaId] || "idle";
						const isSelected = activeFilterPersona === personaId;

						return (
							<button
								key={personaId}
								type="button"
								onClick={() => setFilterPersona(isSelected ? "all" : personaId)}
								className={cn(
									"relative group p-1 rounded-lg border transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
									isSelected
										? "bg-[#212225] border-[#6e56cf]"
										: "bg-[#18191b] border-[#2f2f37] hover:border-[#4b4b55]",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6958ad] focus-visible:ring-offset-2 focus-visible:ring-offset-[#18191b]",
								)}
								style={
									isSelected
										? { borderColor: persona.avatar.accentColor }
										: undefined
								}
								title={`${persona.name} (${persona.role}) - ${state}`}
								aria-label={`${persona.name} - ${t.filterPersonaAria}`}
							>
								<PersonaAvatar
									personaId={personaId}
									chassis={
										persona.scope === "unknown"
											? undefined
											: persona.avatar.chassis
									}
									accentColor={persona.avatar.accentColor}
									size={24}
									state={state}
									title={`${persona.name} - ${persona.role}`}
								/>
								<span className="text-[11px] font-mono text-slate-300 pr-1">
									{persona.name}
								</span>
								{state === "checkpoint" && (
									<span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
								)}
								{state === "working" && (
									<span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
								)}
							</button>
						);
					})}
				</div>

				{/* Persona Filter Chips */}
				<div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
					<button
						type="button"
						onClick={() => setFilterPersona("all")}
						className={cn(
							"px-2.5 py-0.5 rounded-full text-[10px] font-mono transition-colors shrink-0 cursor-pointer",
							activeFilterPersona === "all"
								? "bg-[#6e56cf] text-white font-semibold"
								: "bg-slate-800/80 text-slate-400 hover:text-slate-200",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6958ad]",
						)}
					>
						{t.filterAll} ({messages.length})
					</button>
					{filterPersonaIds.map((pId) => {
						const persona = resolvePersona(pId);
						const count = messages.filter(
							(m) => m.senderPersonaId === pId || m.recipientPersonaId === pId,
						).length;
						const isSelected = activeFilterPersona === pId;

						return (
							<button
								key={pId}
								type="button"
								onClick={() => setFilterPersona(isSelected ? "all" : pId)}
								className={cn(
									"px-2 py-0.5 rounded-full text-[10px] font-mono transition-colors shrink-0 cursor-pointer flex items-center gap-1",
									isSelected
										? "bg-[#212225] text-white border border-[#6e56cf]"
										: "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6958ad]",
								)}
							>
								<span>{persona.name}</span>
								<span className="opacity-60">({count})</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Main Chat Stream */}
			<div
				className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3"
				ref={scrollAreaRef}
			>
				{filteredMessages.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-48 text-center p-6 text-slate-500">
						<Users className="size-8 text-slate-600 mb-2" />
						<p className="text-xs font-mono">{t.noFilteredMessages}</p>
					</div>
				) : (
					filteredMessages.map((message) => {
						const gate = message.checkpointGateId
							? gateMap.get(message.checkpointGateId)
							: undefined;

						return (
							<AgentMessageBubble
								key={message.id}
								message={message}
								associatedGate={gate}
								personaById={personaById}
								onApproveGate={approveCheckpoint}
								onRejectGate={rejectCheckpoint}
							/>
						);
					})
				)}
			</div>

			{/* Footer: Live Swarm Telemetry & Direct Directive Composer */}
			<div className="shrink-0 space-y-2 border-t border-[#2f2f37] bg-[#18191b] p-3">
				{/* Telemetry Bar */}
				<div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono text-slate-400 px-1">
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
						<span className="flex items-center gap-1 text-slate-300">
							<Cpu className="size-3 text-cyan-400" />
							{t.telemetryActiveSquad}: {activePersonaIds.length} Specialists
						</span>
						<span className="flex items-center gap-1">
							<Activity className="size-3 text-emerald-400" />
							{filteredMessages.length} {t.telemetryMessages}
						</span>
						<span className="flex items-center gap-1">
							<Wrench className="size-3 text-blue-400" />
							{activeToolCallsCount} {t.telemetryToolCalls}
						</span>
					</div>

					<span className="whitespace-nowrap text-slate-500 text-[10px]">
						{t.ultraSopProtocol}
					</span>
				</div>

				{/* Quick Directive Input */}
				<form
					onSubmit={handleSendDirective}
					className="flex items-center gap-2"
				>
					<Input
						value={directDirective}
						onChange={(e) => setDirectDirective(e.target.value)}
						placeholder={t.directivePlaceholder}
						className="h-8 text-xs bg-slate-900/90 border-slate-800 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-500/40"
					/>
					<Button
						type="submit"
						size="sm"
						disabled={!directDirective.trim()}
						className="h-8 px-3 bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-xs gap-1 cursor-pointer shrink-0"
					>
						<Send className="size-3" />
						<span>{t.sendButton}</span>
					</Button>
				</form>
			</div>
		</>
	);

	if (viewMode === "fullscreen") {
		return (
			<div
				role="dialog"
				aria-modal="true"
				aria-label={t.warRoomTitle}
				className={cn(
					"fixed inset-0 z-50 flex flex-col h-full bg-[#121216] text-[#fcfcfd] border-0 overflow-hidden font-sans",
					className,
				)}
			>
				{innerContent}
			</div>
		);
	}

	return (
		<aside
			aria-label={t.warRoomTitle}
			className={cn(
				"flex flex-col h-full bg-[#121216] text-[#fcfcfd] border-l border-[#2f2f37] overflow-hidden font-sans",
				className,
			)}
		>
			{innerContent}
		</aside>
	);
};
