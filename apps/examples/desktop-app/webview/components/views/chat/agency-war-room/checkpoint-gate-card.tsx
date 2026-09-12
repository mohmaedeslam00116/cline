"use client";

import { BUILTIN_PERSONAS } from "@cline/shared/browser";
import {
	AlertTriangle,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	FileText,
	MessageSquare,
	Radio,
	Send,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PersonaAvatar } from "@/components/personas";
import { getLensTranslations } from "@/lib/lens-i18n";
import { cn } from "@/lib/utils";
import type { WarRoomCheckpointGate } from "./types";

export interface CheckpointGateCardProps {
	gate: WarRoomCheckpointGate;
	onApprove: (gateId: string) => void;
	onReject: (gateId: string, feedback: string) => void;
	className?: string;
}

export const CheckpointGateCard: React.FC<CheckpointGateCardProps> = ({
	gate,
	onApprove,
	onReject,
	className,
}) => {
	const t = getLensTranslations().ultraAgency;
	const [showFeedbackInput, setShowFeedbackInput] = useState(false);
	const [feedback, setFeedback] = useState("");
	const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

	const requestingPersona = BUILTIN_PERSONAS[gate.personaId];
	const isPending = gate.status === "pending";
	const isApproved = gate.status === "approved";
	const isRejected = gate.status === "rejected";

	const handleSendFeedback = () => {
		if (!feedback.trim()) return;
		setIsSubmittingFeedback(true);
		onReject(gate.id, feedback.trim());
		setIsSubmittingFeedback(false);
		setShowFeedbackInput(false);
	};

	return (
		<Card
			role="region"
			aria-label={`${gate.title} - ${isApproved ? t.checkpointApproved : isPending ? t.checkpointPending : t.checkpointRejected}`}
			className={cn(
				"relative overflow-hidden transition-all duration-300 border backdrop-blur-md rounded-xl p-5 my-3 shadow-xl",
				isPending &&
					"bg-gradient-to-b from-amber-950/30 via-slate-900/90 to-[#0c0a09] border-amber-500/50 shadow-amber-500/10",
				isApproved &&
					"bg-gradient-to-b from-emerald-950/20 via-slate-900/90 to-[#022c22]/30 border-emerald-500/40 shadow-emerald-500/10",
				isRejected &&
					"bg-gradient-to-b from-rose-950/20 via-slate-900/90 to-[#1e1b4b]/30 border-rose-500/40 shadow-rose-500/10",
				className,
			)}
		>
			{/* Top HUD accent bar */}
			<div
				className={cn(
					"absolute top-0 left-0 right-0 h-1",
					isPending &&
						"bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 animate-pulse",
					isApproved && "bg-gradient-to-r from-emerald-500 to-teal-400",
					isRejected && "bg-gradient-to-r from-rose-500 to-red-600",
				)}
			/>

			{/* Header */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
				<div className="flex items-center gap-3">
					<div className="relative shrink-0">
						<PersonaAvatar
							personaId={gate.personaId}
							size={44}
							state={
								isPending ? "checkpoint" : isApproved ? "idle" : "thinking"
							}
							title={`${requestingPersona?.name || gate.personaId} - ${requestingPersona?.role || ""}`}
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
								{requestingPersona?.name} ({requestingPersona?.role})
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
						Deliverables For Sign-Off:
					</span>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
						{gate.deliverables.map((item, idx) => (
							<div
								key={idx}
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

			{/* Feedback Display if already rejected */}
			{gate.feedback && (
				<div className="mt-3 p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/50 text-xs text-rose-300">
					<span className="font-semibold text-rose-400">User Directive: </span>
					{gate.feedback}
				</div>
			)}

			{/* Actions (Only when pending) */}
			{isPending && (
				<div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-end gap-2.5">
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
						onClick={() => onApprove(gate.id)}
						className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-950/50 border border-emerald-400/30 gap-1.5 transition-all cursor-pointer"
					>
						<ShieldCheck className="size-4" />
						<span>{t.approveAndProceed}</span>
					</Button>
				</div>
			)}

			{/* Expandable Feedback Input */}
			{isPending && showFeedbackInput && (
				<div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
					<Textarea
						value={feedback}
						onChange={(e) => setFeedback(e.target.value)}
						placeholder={t.feedbackPlaceholder}
						rows={2}
						className="text-xs bg-slate-950/80 border-slate-800 text-slate-100 resize-none focus-visible:ring-amber-500/50"
					/>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={() => setShowFeedbackInput(false)}
							className="text-xs h-7"
						>
							Cancel
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
			)}
		</Card>
	);
};
