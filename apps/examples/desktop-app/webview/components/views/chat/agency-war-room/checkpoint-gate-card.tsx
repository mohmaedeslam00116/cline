"use client";

import {
	BUILTIN_PERSONAS,
	getAllPersonas,
	getBuiltinRuntimePersona,
	type PersonaId,
	type RuntimePersonaDefinition,
} from "@cline/shared/browser";
import {
	AlertTriangle,
	BookOpen,
	Check,
	CheckCircle2,
	CheckSquare,
	ChevronDown,
	ChevronUp,
	Edit3,
	FileText,
	MessageSquare,
	Radio,
	Send,
	ShieldCheck,
	Square,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { PersonaAvatar } from "@/components/personas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getLensTranslations } from "@/lib/lens-i18n";
import { cn } from "@/lib/utils";
import { getPersonaIdentity } from "../squad-selection-model";
import type {
	WarRoomCheckpointGate,
	WarRoomCheckpointMemoryProposal,
} from "./types";

export interface CheckpointGateCardProps {
	gate: WarRoomCheckpointGate;
	onApprove: (
		gateId: string,
		approvedLearnings?: WarRoomCheckpointMemoryProposal[],
	) => void;
	onReject: (
		gateId: string,
		feedback: string,
		options?: { discardProposals?: boolean },
	) => void;
	className?: string;
	personaById?: ReadonlyMap<PersonaId, RuntimePersonaDefinition>;
}

const BUILTIN_PERSONA_BY_ID = new Map(
	getAllPersonas().map((persona) => [
		persona.id,
		getBuiltinRuntimePersona(persona.id),
	]),
);

export const CheckpointGateCard: React.FC<CheckpointGateCardProps> = ({
	gate,
	onApprove,
	onReject,
	className,
	personaById = BUILTIN_PERSONA_BY_ID,
}) => {
	const t = getLensTranslations().ultraAgency;
	const [showFeedbackInput, setShowFeedbackInput] = useState(false);
	const [feedback, setFeedback] = useState("");
	const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
	const [proposals, setProposals] = useState<WarRoomCheckpointMemoryProposal[]>(
		() =>
			(gate.proposedLearnings ?? []).map((p) => ({
				...p,
				approved: p.approved ?? true,
			})),
	);
	const [editingProposalId, setEditingProposalId] = useState<string | null>(
		null,
	);
	const [editTopic, setEditTopic] = useState("");
	const [editLearning, setEditLearning] = useState("");
	const [discardProposalsOnReject, setDiscardProposalsOnReject] =
		useState(true);

	useEffect(() => {
		if (gate.proposedLearnings) {
			setProposals(
				gate.proposedLearnings.map((p) => ({
					...p,
					approved: p.approved ?? true,
				})),
			);
		}
	}, [gate.proposedLearnings]);

	const handleToggleProposal = (id: string) => {
		setProposals((prev) =>
			prev.map((p) => (p.id === id ? { ...p, approved: !p.approved } : p)),
		);
	};

	const handleStartEdit = (prop: WarRoomCheckpointMemoryProposal) => {
		setEditingProposalId(prop.id);
		setEditTopic(prop.topic);
		setEditLearning(prop.learning);
	};

	const handleSaveEdit = (id: string) => {
		setProposals((prev) =>
			prev.map((p) =>
				p.id === id
					? {
							...p,
							topic: editTopic.trim() || p.topic,
							learning: editLearning.trim() || p.learning,
						}
					: p,
			),
		);
		setEditingProposalId(null);
	};

	const handleCancelEdit = () => {
		setEditingProposalId(null);
	};

	const handleApprove = () => {
		const approvedList = proposals.filter((p) => p.approved);
		if (proposals.length > 0) {
			onApprove(gate.id, approvedList);
		} else {
			onApprove(gate.id);
		}
	};

	const requestingPersona = getPersonaIdentity(gate.personaId, personaById);
	const isPending = gate.status === "pending";
	const isApproved = gate.status === "approved";
	const isRejected = gate.status === "rejected";

	const handleSendFeedback = () => {
		if (!feedback.trim()) return;
		setIsSubmittingFeedback(true);
		onReject(gate.id, feedback.trim(), {
			discardProposals: discardProposalsOnReject,
		});
		setIsSubmittingFeedback(false);
		setShowFeedbackInput(false);
	};

	return (
		<Card
			role="region"
			aria-label={`${gate.title} - ${isApproved ? t.checkpointApproved : isPending ? t.checkpointPending : t.checkpointRejected}`}
			className={cn(
				"relative overflow-hidden transition-colors duration-300 border rounded-xl p-5 my-3",
				isPending && "bg-[#211d17] border-amber-500/50",
				isApproved && "bg-[#17211d] border-emerald-500/40",
				isRejected && "bg-[#24191c] border-rose-500/40",
				className,
			)}
		>
			{/* Top HUD accent bar */}
			<div
				className={cn(
					"absolute top-0 left-0 right-0 h-1",
					isPending && "bg-amber-500 animate-pulse",
					isApproved && "bg-emerald-500",
					isRejected && "bg-rose-500",
				)}
			/>

			{/* Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
				<div className="flex items-center gap-3">
					<div className="relative shrink-0">
						<PersonaAvatar
							personaId={gate.personaId}
							chassis={
								requestingPersona.scope === "unknown"
									? undefined
									: requestingPersona.avatar.chassis
							}
							accentColor={requestingPersona.avatar.accentColor}
							size={44}
							state={
								isPending ? "checkpoint" : isApproved ? "idle" : "thinking"
							}
							title={`${requestingPersona.name} - ${requestingPersona.role}`}
						/>
						{isPending && (
							<span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-black ring-2 ring-slate-900 animate-ping" />
						)}
					</div>

					<div>
						<div className="flex items-center gap-2">
							<Badge
								variant="outline"
								className={cn(
									"font-mono text-[10px] uppercase tracking-wider px-2 py-0.5",
									isPending &&
										"border-amber-500/50 text-amber-400 bg-amber-950/40",
									isApproved &&
										"border-emerald-500/50 text-emerald-400 bg-emerald-950/40",
									isRejected &&
										"border-rose-500/50 text-rose-400 bg-rose-950/40",
								)}
							>
								<Radio className="size-2.5 mr-1 animate-pulse" />
								GATE #{gate.gateNumber}
							</Badge>
							<span className="text-xs text-slate-400 font-mono">
								{requestingPersona.name} ({requestingPersona.role})
							</span>
						</div>
						<h3 className="text-sm font-semibold text-slate-100 mt-1 font-mono tracking-wide">
							{gate.title}
						</h3>
					</div>
				</div>

				{/* Status Badge */}
				<div className="shrink-0">
					{isPending && (
						<Badge
							variant="outline"
							className="border-amber-500 text-amber-400 bg-amber-950/60 text-xs px-2.5 py-1 gap-1.5 font-medium animate-pulse"
						>
							<AlertTriangle className="size-3.5" />
							{t.checkpointPending}
						</Badge>
					)}
					{isApproved && (
						<Badge
							variant="outline"
							className="border-emerald-500 text-emerald-400 bg-emerald-950/60 text-xs px-2.5 py-1 gap-1.5 font-medium"
						>
							<CheckCircle2 className="size-3.5" />
							{t.checkpointApproved}
						</Badge>
					)}
					{isRejected && (
						<Badge
							variant="outline"
							className="border-rose-500 text-rose-400 bg-rose-950/60 text-xs px-2.5 py-1 gap-1.5 font-medium"
						>
							<AlertTriangle className="size-3.5" />
							{t.checkpointRejected}
						</Badge>
					)}
				</div>
			</div>

			{/* Description */}
			<p className="text-xs text-slate-300 mt-3 leading-relaxed font-sans">
				{gate.description}
			</p>

			{/* Deliverables List */}
			{gate.deliverables && gate.deliverables.length > 0 && (
				<div className="mt-3.5 space-y-2">
					<span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
						{t.deliverablesForSignOff}
					</span>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{gate.deliverables.map((item) => (
							<div
								key={`${gate.id}-deliv-${item.title}`}
								className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80"
							>
								<FileText className="size-3.5 text-cyan-400 shrink-0 mt-0.5" />
								<div className="min-w-0 flex-1">
									<div className="flex items-center justify-between gap-1">
										<span className="text-xs font-medium text-slate-200 truncate">
											{item.title}
										</span>
										{item.badge && (
											<span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
												{item.badge}
											</span>
										)}
									</div>
									<p className="text-[11px] text-slate-400 truncate mt-0.5">
										{item.summary}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Proposed Team Memory Updates */}
			{proposals.length > 0 && (
				<div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<BookOpen className="size-3.5 text-muted-foreground shrink-0" />
							<span className="text-[11px] font-mono uppercase text-slate-300 font-semibold tracking-wider">
								{t.teamMemoryProposalsTitle}
							</span>
						</div>
						<Badge
							variant="outline"
							className="text-[10px] font-mono px-2 py-0.5 border-border bg-[#161616] text-foreground"
						>
							{proposals.filter((p) => p.approved).length} / {proposals.length}
						</Badge>
					</div>
					<p className="text-[11px] text-slate-400 font-sans leading-relaxed">
						{t.teamMemoryProposalsDesc}
					</p>

					<div className="space-y-2">
						{proposals.map((item) => {
							const isEditing = editingProposalId === item.id;
							const persona = BUILTIN_PERSONAS[item.personaId];
							const formattedDate =
								typeof item.timestamp === "number"
									? new Date(item.timestamp).toLocaleTimeString([], {
											hour: "2-digit",
											minute: "2-digit",
										})
									: new Date(item.timestamp).toLocaleDateString();

							return (
								<div
									key={`memory-prop-${item.id}`}
									className={cn(
										"p-3 rounded-lg border transition-all duration-200",
										item.approved
											? "bg-[#161616] border-border/80 shadow-sm"
											: "bg-[#111111]/60 border-border/40 opacity-60",
									)}
								>
									{isEditing ? (
										<div className="space-y-2">
											<div>
												<label
													htmlFor={`proposal-topic-${item.id}`}
													className="text-[10px] font-mono uppercase text-slate-400 block mb-1"
												>
													{t.learningTopicLabel}
												</label>
												<Input
													id={`proposal-topic-${item.id}`}
													value={editTopic}
													onChange={(e) => setEditTopic(e.target.value)}
													className="text-xs h-7 bg-[#111111] border-border text-foreground"
													aria-label={t.learningTopicLabel}
												/>
											</div>
											<div>
												<label
													htmlFor={`proposal-learning-${item.id}`}
													className="text-[10px] font-mono uppercase text-slate-400 block mb-1"
												>
													{t.learningContentLabel}
												</label>
												<Textarea
													id={`proposal-learning-${item.id}`}
													value={editLearning}
													onChange={(e) => setEditLearning(e.target.value)}
													rows={2}
													className="text-xs bg-[#111111] border-border text-foreground resize-none"
													aria-label={t.learningContentLabel}
												/>
											</div>
											<div className="flex justify-end gap-2 pt-1">
												<Button
													type="button"
													size="sm"
													variant="ghost"
													onClick={handleCancelEdit}
													className="text-xs h-6 px-2"
												>
													{t.cancel}
												</Button>
												<Button
													type="button"
													size="sm"
													onClick={() => handleSaveEdit(item.id)}
													disabled={!editTopic.trim() || !editLearning.trim()}
													className="text-xs h-6 px-2.5 bg-[#1E1E1E] hover:bg-border text-foreground border border-border/60 font-medium gap-1"
												>
													<Check className="size-3" />
													{t.saveProposal}
												</Button>
											</div>
										</div>
									) : (
										<div className="flex items-start gap-2.5">
											{/* Toggle Approval Checkbox */}
											{isPending && (
												<button
													type="button"
													data-testid={`toggle-proposal-${item.id}`}
													onClick={() => handleToggleProposal(item.id)}
													className="mt-0.5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0"
													aria-label={
														item.approved
															? `${t.excludeProposal}: ${item.topic}`
															: `${t.approveProposal}: ${item.topic}`
													}
												>
													{item.approved ? (
														<CheckSquare className="size-4 text-foreground" />
													) : (
														<Square className="size-4 text-muted-foreground" />
													)}
												</button>
											)}

											{/* Persona Avatar */}
											<div className="shrink-0 mt-0.5">
												<PersonaAvatar
													personaId={item.personaId}
													size={28}
													state={item.approved ? "idle" : "sleeping"}
													title={persona?.name || item.personaId}
												/>
											</div>

											{/* Proposal Details */}
											<div className="min-w-0 flex-1">
												<div className="flex items-center justify-between gap-1 flex-wrap">
													<div className="flex items-center gap-1.5 flex-wrap">
														<span className="text-xs font-semibold text-slate-200">
															{item.topic}
														</span>
														<span className="text-[10px] text-slate-400 font-mono">
															{t.proposalAttributionBy}{" "}
															{persona?.name || item.personaId} ·{" "}
															{formattedDate}
														</span>
													</div>
													<div className="flex items-center gap-1.5">
														<Badge
															variant="outline"
															className={cn(
																"text-[9px] font-mono px-1.5 py-0.2",
																item.approved
																	? "border-border text-foreground bg-[#1E1E1E]"
																	: "border-border/40 text-muted-foreground bg-[#111111]",
															)}
														>
															{item.approved
																? t.proposalsApprovedBadge
																: t.proposalsExcludedBadge}
														</Badge>
														{isPending && (
															<Button
																type="button"
																size="sm"
																variant="ghost"
																onClick={() => handleStartEdit(item)}
																className="h-5 px-1.5 text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800"
																aria-label={`${t.editProposal} ${item.topic}`}
															>
																<Edit3 className="size-2.5 mr-1" />
																{t.editProposal}
															</Button>
														)}
													</div>
												</div>
												<p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
													{item.learning}
												</p>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Feedback Display if already rejected */}
			{gate.feedback && (
				<div className="mt-3 p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/50 text-xs text-rose-300">
					<span className="font-semibold text-rose-400">
						{t.userDirective}{" "}
					</span>
					{gate.feedback}
				</div>
			)}

			{/* Actions (Only when pending) */}
			{isPending && (
				<div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
					<div className="flex items-center gap-2">
						{proposals.length > 0 && (
							<span className="text-[11px] text-slate-400 font-mono">
								{proposals.filter((p) => p.approved).length} /{" "}
								{proposals.length} {t.proposalsApprovedBadge.toLowerCase()}
							</span>
						)}
					</div>

					<div className="flex items-center gap-2.5">
						<Button
							type="button"
							size="sm"
							variant="ghost"
							onClick={() => setShowFeedbackInput((prev) => !prev)}
							className="text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-800/80 border border-slate-800"
						>
							<MessageSquare className="size-3.5 mr-1.5 text-amber-400" />
							{t.requestChanges}
							{showFeedbackInput ? (
								<ChevronUp className="size-3 ml-1" />
							) : (
								<ChevronDown className="size-3 ml-1" />
							)}
						</Button>

						<Button
							type="button"
							size="sm"
							onClick={handleApprove}
							className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs border border-emerald-400/30 gap-1.5 transition-colors cursor-pointer"
						>
							<ShieldCheck className="size-4" />
							<span>{t.approveAndProceed}</span>
						</Button>
					</div>
				</div>
			)}

			{/* Expandable Feedback Input */}
			{isPending && showFeedbackInput && (
				<div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2.5">
					<Textarea
						value={feedback}
						onChange={(e) => setFeedback(e.target.value)}
						placeholder={t.feedbackPlaceholder}
						rows={2}
						className="text-xs bg-[#111111] border-border text-foreground resize-none focus-visible:ring-border"
					/>
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
						{proposals.length > 0 ? (
							<label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none">
								<input
									type="checkbox"
									checked={discardProposalsOnReject}
									onChange={(e) =>
										setDiscardProposalsOnReject(e.target.checked)
									}
									className="rounded border-border bg-[#111111] text-foreground focus:ring-0"
								/>
								<span>{t.discardProposalsOnReject}</span>
							</label>
						) : (
							<div />
						)}
						<div className="flex justify-end gap-2 shrink-0 ml-auto">
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() => setShowFeedbackInput(false)}
								className="text-xs h-7"
							>
								{t.cancel}
							</Button>
							<Button
								type="button"
								size="sm"
								onClick={handleSendFeedback}
								disabled={!feedback.trim() || isSubmittingFeedback}
								className="text-xs h-7 bg-amber-600 hover:bg-amber-500 text-black font-semibold gap-1"
							>
								<Send className="size-3" />
								{t.sendFeedback}
							</Button>
						</div>
					</div>
				</div>
			)}
		</Card>
	);
};
