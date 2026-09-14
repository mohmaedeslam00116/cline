"use client";

import {
	getAllPersonas,
	getBuiltinRuntimePersona,
	type PersonaId,
	type RuntimePersonaDefinition,
} from "@cline/shared/browser";
import {
	ArrowRight,
	Check,
	Code2,
	Copy,
	ExternalLink,
	FileText,
	Terminal,
	Wrench,
	Zap,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
	type PersonaActivityState,
	PersonaAvatar,
} from "@/components/personas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLensTranslations } from "@/lib/lens-i18n";
import { cn } from "@/lib/utils";
import { getPersonaIdentity } from "../squad-selection-model";
import { CheckpointGateCard } from "./checkpoint-gate-card";
import type {
	WarRoomCheckpointGate,
	WarRoomCheckpointMemoryProposal,
	WarRoomMessage,
	WarRoomStage,
} from "./types";

export interface AgentMessageBubbleProps {
	message: WarRoomMessage;
	associatedGate?: WarRoomCheckpointGate;
	onApproveGate?: (
		gateId: string,
		approvedLearnings?: WarRoomCheckpointMemoryProposal[],
	) => void;
	onRejectGate?: (
		gateId: string,
		feedback: string,
		options?: { discardProposals?: boolean },
	) => void;
	onOpenArtifact?: (uri: string) => void;
	className?: string;
	personaById?: ReadonlyMap<PersonaId, RuntimePersonaDefinition>;
}

const BUILTIN_PERSONA_BY_ID = new Map(
	getAllPersonas().map((persona) => [
		persona.id,
		getBuiltinRuntimePersona(persona.id),
	]),
);

const STAGE_BADGE_CLASSES: Record<
	WarRoomStage,
	{ label: string; bg: string; text: string; border: string }
> = {
	strategy: {
		label: "Strategy",
		bg: "bg-blue-950/40",
		text: "text-blue-400",
		border: "border-blue-500/30",
	},
	research: {
		label: "Research",
		bg: "bg-cyan-950/40",
		text: "text-cyan-400",
		border: "border-cyan-500/30",
	},
	architecture: {
		label: "Architecture",
		bg: "bg-emerald-950/40",
		text: "text-emerald-400",
		border: "border-emerald-500/30",
	},
	development: {
		label: "Development",
		bg: "bg-orange-950/40",
		text: "text-orange-400",
		border: "border-orange-500/30",
	},
	qa: {
		label: "QA & Audit",
		bg: "bg-rose-950/40",
		text: "text-rose-400",
		border: "border-rose-500/30",
	},
	documentation: {
		label: "Documentation",
		bg: "bg-violet-950/40",
		text: "text-violet-400",
		border: "border-violet-500/30",
	},
};

export const AgentMessageBubble: React.FC<AgentMessageBubbleProps> = ({
	message,
	associatedGate,
	onApproveGate,
	onRejectGate,
	onOpenArtifact,
	className,
	personaById = BUILTIN_PERSONA_BY_ID,
}) => {
	const t = getLensTranslations().ultraAgency;
	const [copiedCode, setCopiedCode] = useState(false);

	const sender = getPersonaIdentity(message.senderPersonaId, personaById);
	const recipient =
		message.recipientPersonaId && message.recipientPersonaId !== "all"
			? getPersonaIdentity(message.recipientPersonaId, personaById)
			: null;

	const stageLabelMap: Record<WarRoomStage, string> = {
		strategy: t.stageStrategy,
		research: t.stageResearch,
		architecture: t.stageArchitecture,
		development: t.stageDevelopment,
		qa: t.stageQa,
		documentation: t.stageDocumentation,
	};

	const stageConfig =
		STAGE_BADGE_CLASSES[message.stage] || STAGE_BADGE_CLASSES.strategy;
	const stageLabel = stageLabelMap[message.stage] || stageConfig.label;

	const handleCopyCode = async (code: string) => {
		try {
			await navigator.clipboard.writeText(code);
			setCopiedCode(true);
			setTimeout(() => setCopiedCode(false), 2000);
		} catch {
			// ignore clipboard write failure
		}
	};

	// Determine activity state based on message type
	const avatarState: PersonaActivityState =
		message.type === "checkpoint"
			? "checkpoint"
			: message.type === "tool_call"
				? "working"
				: message.type === "artifact"
					? "thinking"
					: "speaking";

	return (
		<div
			className={cn(
				"flex flex-col gap-2 p-4 rounded-xl transition-all duration-200 border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900/90 backdrop-blur-sm",
				message.type === "checkpoint" && "border-amber-500/40 bg-slate-900/90",
				className,
			)}
		>
			{/* Sender & Recipient Bar */}
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2.5">
					<div className="shrink-0">
						<PersonaAvatar
							personaId={message.senderPersonaId}
							chassis={
								sender.scope === "unknown" ? undefined : sender.avatar.chassis
							}
							accentColor={sender.avatar.accentColor}
							size={36}
							state={avatarState}
							title={`${sender.name} - ${sender.role}`}
						/>
					</div>

					<div className="flex flex-col">
						<div className="flex items-center gap-1.5 flex-wrap">
							<span className="text-xs font-semibold text-slate-200 font-mono">
								{sender.name}
							</span>

							{recipient ? (
								<>
									<ArrowRight className="size-3 text-cyan-400" />
									<span className="text-xs font-medium text-cyan-400 font-mono">
										{recipient.name}
									</span>
								</>
							) : (
								<>
									<ArrowRight className="size-3 text-slate-500" />
									<span className="text-[11px] font-mono text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
										{t.broadcastToAll}
									</span>
								</>
							)}
						</div>
						<span className="text-[10px] text-slate-400 font-sans">
							{sender.role}
						</span>
					</div>
				</div>

				{/* Badges & Meta */}
				<div className="flex items-center gap-1.5 shrink-0 flex-wrap">
					<Badge
						variant="outline"
						className={cn(
							"text-[10px] font-mono px-2 py-0.5",
							stageConfig.bg,
							stageConfig.text,
							stageConfig.border,
						)}
					>
						{stageLabel}
					</Badge>

					{(message.untrusted || message.artifact?.untrusted) && (
						<Badge
							variant="outline"
							className="text-[9px] font-mono border-amber-500/50 text-amber-300 bg-amber-950/50 px-1.5 py-0.5"
						>
							{t.untrustedEvidenceBadge}
						</Badge>
					)}

					{message.type === "handoff" && (
						<Badge
							variant="outline"
							className="text-[10px] font-mono border-purple-500/40 text-purple-400 bg-purple-950/40"
						>
							<Zap className="size-2.5 mr-1" />
							{t.handoffTo}
						</Badge>
					)}

					{message.type === "tool_call" && (
						<Badge
							variant="outline"
							className="text-[10px] font-mono border-blue-500/40 text-blue-400 bg-blue-950/40"
						>
							<Wrench className="size-2.5 mr-1" />
							{t.statusWorking}
						</Badge>
					)}

					<span className="text-[10px] font-mono text-slate-500">
						{new Date(message.timestamp).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
							second: "2-digit",
						})}
					</span>
				</div>
			</div>

			{/* Message Content */}
			<div className="pl-11 pr-1 text-xs text-slate-200 leading-relaxed font-sans">
				{message.content}
			</div>

			{/* Tool Call Payload Block */}
			{message.toolCall && (
				<div className="ml-11 mt-1 rounded-lg border border-slate-800 bg-[#06080d] p-3 font-mono text-xs">
					<div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-800/80 text-blue-400">
						<div className="flex items-center gap-1.5">
							<Terminal className="size-3.5" />
							<span className="font-semibold text-slate-200">
								{message.toolCall.toolName}
							</span>
						</div>
						<Badge
							variant="outline"
							className={cn(
								"text-[9px] px-1.5 py-0.2",
								message.toolCall.status === "completed" &&
									"border-emerald-500/40 text-emerald-400 bg-emerald-950/30",
								message.toolCall.status === "running" &&
									"border-blue-500/40 text-blue-400 bg-blue-950/30 animate-pulse",
								message.toolCall.status === "error" &&
									"border-rose-500/40 text-rose-400 bg-rose-950/30",
							)}
						>
							{message.toolCall.status}
						</Badge>
					</div>

					{message.toolCall.args && (
						<pre className="text-[11px] text-slate-400 overflow-x-auto whitespace-pre-wrap">
							{JSON.stringify(message.toolCall.args, null, 2)}
						</pre>
					)}

					{message.toolCall.output && (
						<div className="mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-emerald-400/90">
							<span className="text-slate-500">{t.outputLabel} </span>
							{message.toolCall.output}
						</div>
					)}
				</div>
			)}

			{/* Code Snippet Block */}
			{message.codeSnippet && (
				<div className="ml-11 mt-1 rounded-lg border border-slate-800 bg-[#05070c] p-3 font-mono text-xs">
					<div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-800/80 text-slate-400">
						<div className="flex items-center gap-1.5">
							<Code2 className="size-3.5 text-orange-400" />
							<span className="text-[11px] text-slate-300">
								{message.codeSnippet.filename || message.codeSnippet.language}
							</span>
						</div>
						<Button
							type="button"
							size="icon-sm"
							variant="ghost"
							onClick={() => handleCopyCode(message.codeSnippet?.code || "")}
							className="h-6 w-6 text-slate-400 hover:text-slate-200"
							aria-label={t.copyCodeSnippet}
							title={copiedCode ? t.codeSnippetCopied : t.copyCodeSnippet}
						>
							{copiedCode ? (
								<Check className="size-3 text-emerald-400" />
							) : (
								<Copy className="size-3" />
							)}
						</Button>
					</div>
					<pre className="text-[11px] text-orange-200/90 overflow-x-auto whitespace-pre-wrap">
						{message.codeSnippet.code}
					</pre>
				</div>
			)}

			{/* Artifact Attachment Block */}
			{message.artifact && (
				<div className="ml-11 mt-1 flex items-center justify-between gap-3 p-2.5 rounded-lg border border-cyan-500/30 bg-cyan-950/20 text-xs">
					<div className="flex items-center gap-2.5 min-w-0">
						<FileText className="size-4 text-cyan-400 shrink-0" />
						<div className="min-w-0">
							<div className="flex items-center gap-2 flex-wrap">
								<span className="font-semibold text-slate-100 truncate font-mono">
									{message.artifact.title}
								</span>
								<span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-700/40">
									{message.artifact.type}
								</span>
								{(message.artifact.untrusted || message.untrusted) && (
									<Badge
										variant="outline"
										className="text-[9px] font-mono border-amber-500/50 text-amber-300 bg-amber-950/50 px-1.5 py-0.2"
									>
										{t.untrustedEvidenceBadge}
									</Badge>
								)}
							</div>
							{message.artifact.summary && (
								<p className="text-[11px] text-slate-300 truncate mt-0.5">
									{message.artifact.summary}
								</p>
							)}
						</div>
					</div>
					{message.artifact.uri && (
						<Button
							type="button"
							size="icon-sm"
							variant="ghost"
							onClick={() =>
								message.artifact?.uri && onOpenArtifact?.(message.artifact.uri)
							}
							className="h-7 w-7 text-cyan-400 hover:text-cyan-200"
							aria-label={t.openArtifact}
							title={t.openArtifact}
						>
							<ExternalLink className="size-3.5" />
						</Button>
					)}
				</div>
			)}

			{/* Embedded Checkpoint Gate Card */}
			{associatedGate && onApproveGate && onRejectGate && (
				<div className="ml-11 mt-2">
					<CheckpointGateCard
						gate={associatedGate}
						personaById={personaById}
						onApprove={onApproveGate}
						onReject={onRejectGate}
					/>
				</div>
			)}
		</div>
	);
};
