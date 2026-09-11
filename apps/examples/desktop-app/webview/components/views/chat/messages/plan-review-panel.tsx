"use client";

import type {
	ImplementationPlanArtifact,
	ProposedChangeItem,
	ProposedFileAction,
	VerificationPlan,
} from "@cline/shared/browser";
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ClipboardList,
	FileCode2,
	HelpCircle,
	ListChecks,
} from "lucide-react";
import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLensDirection, getLensTranslations } from "@/lib/lens-i18n";
import { cn } from "@/lib/utils";

export type { ProposedChangeItem, ProposedFileAction, VerificationPlan };
export type ImplementationPlanData = ImplementationPlanArtifact;

export function PlanReviewPanel({
	plan,
	onApprove,
	onRequestFeedback,
	isApproved = false,
	isApproving = false,
}: {
	plan: ImplementationPlanData;
	onApprove?: () => void | Promise<void>;
	onRequestFeedback?: () => void;
	isApproved?: boolean;
	isApproving?: boolean;
}) {
	const [isExpanded, setIsExpanded] = useState(true);
	const bodyId = useId();
	const t = getLensTranslations().planReview;
	const isRtl = getLensDirection() === "rtl";

	const hasReviewItems = plan.userReviewRequired.length > 0;
	const hasQuestions = plan.openQuestions.length > 0;
	const hasChanges = plan.proposedChanges.length > 0;
	const hasVerification =
		plan.verificationPlan.automated.length > 0 ||
		plan.verificationPlan.manual.length > 0;

	const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
	const ChevronExpandIcon = isRtl ? ChevronLeft : ChevronRight;

	return (
		<section className="rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
				<div className="flex items-center gap-2.5">
					<div className="flex size-7 items-center justify-center rounded-lg border border-border/70 bg-muted/60 text-foreground">
						<ClipboardList className="size-4" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								{t.badge}
							</span>
							<Badge
								variant={isApproved ? "secondary" : "outline"}
								className={cn(
									"px-1.5 py-0 text-[10px] font-mono",
									isApproved
										? "border-border/80 bg-muted/60 text-foreground"
										: "border-border/70 text-muted-foreground",
								)}
							>
								{isApproved ? (
									<>
										<CheckCircle2 className="me-1 inline size-3 text-foreground" />
										{t.approved}
									</>
								) : (
									t.reviewRequired
								)}
							</Badge>
						</div>
						<h3 className="mt-0.5 text-sm font-semibold text-foreground">
							{plan.goal}
						</h3>
					</div>
				</div>

				<button
					type="button"
					aria-expanded={isExpanded}
					aria-controls={bodyId}
					onClick={() => setIsExpanded((prev) => !prev)}
					className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
				>
					{isExpanded ? (
						<>
							<span>{t.collapse}</span>
							<ChevronDown className="size-3.5" />
						</>
					) : (
						<>
							<span>{t.expand}</span>
							<ChevronExpandIcon className="size-3.5" />
						</>
					)}
				</button>
			</div>

			{/* Plan Body */}
			{isExpanded && (
				<div
					id={bodyId}
					className="mt-3 space-y-3.5 text-xs text-foreground/90"
				>
					{/* User Review Required */}
					{hasReviewItems && (
						<div className="rounded-lg border border-border/80 bg-muted/40 p-3">
							<div className="flex items-center gap-1.5 font-medium text-foreground">
								<AlertTriangle className="size-3.5 text-muted-foreground" />
								<span>{t.userReviewRequired}</span>
							</div>
							<ul className="mt-2 space-y-1 ps-4 list-disc text-foreground/80">
								{plan.userReviewRequired.map((item) => (
									<li key={item}>{item}</li>
								))}
							</ul>
						</div>
					)}

					{/* Open Questions */}
					{hasQuestions && (
						<div className="rounded-lg border border-border/80 bg-muted/40 p-3">
							<div className="flex items-center gap-1.5 font-medium text-foreground">
								<HelpCircle className="size-3.5 text-muted-foreground" />
								<span>{t.openQuestions}</span>
							</div>
							<ul className="mt-2 space-y-1 ps-4 list-disc text-muted-foreground">
								{plan.openQuestions.map((q) => (
									<li key={q}>{q}</li>
								))}
							</ul>
						</div>
					)}

					{/* Proposed Changes */}
					{hasChanges && (
						<div>
							<div className="flex items-center gap-1.5 font-medium text-foreground">
								<FileCode2 className="size-3.5 text-muted-foreground" />
								<span>
									{t.proposedChanges} ({plan.proposedChanges.length})
								</span>
							</div>
							<div className="mt-2 divide-y divide-border/60 rounded-lg border border-border/70 bg-muted/20">
								{plan.proposedChanges.map((change) => (
									<div
										key={`${change.action}:${change.file}`}
										className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs font-mono"
									>
										<span className="truncate text-foreground/90">
											{change.file}
										</span>
										<Badge
											variant={
												change.action === "new"
													? "default"
													: change.action === "delete"
														? "destructive"
														: "secondary"
											}
											className="px-1.5 py-0 text-[9px] uppercase"
										>
											{change.action}
										</Badge>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Verification Plan */}
					{hasVerification && (
						<div>
							<div className="flex items-center gap-1.5 font-medium text-foreground">
								<ListChecks className="size-3.5 text-muted-foreground" />
								<span>{t.verificationPlan}</span>
							</div>
							<div className="mt-2 space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3">
								{plan.verificationPlan.automated.length > 0 && (
									<div>
										<span className="font-semibold text-[11px] text-muted-foreground uppercase">
											{t.automatedTests}
										</span>
										<ul className="mt-1 space-y-0.5 ps-4 list-disc font-mono text-[11px] text-foreground/80">
											{plan.verificationPlan.automated.map((cmd) => (
												<li key={cmd}>{cmd}</li>
											))}
										</ul>
									</div>
								)}
								{plan.verificationPlan.manual.length > 0 && (
									<div>
										<span className="font-semibold text-[11px] text-muted-foreground uppercase">
											{t.manualVerification}
										</span>
										<ul className="mt-1 space-y-0.5 ps-4 list-disc text-muted-foreground">
											{plan.verificationPlan.manual.map((step) => (
												<li key={step}>{step}</li>
											))}
										</ul>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			)}

			{/* Action Footer */}
			<div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
				<p className="text-[11px] text-muted-foreground">
					{isApproved ? t.approvedFooter : t.reviewFooter}
				</p>

				{!isApproved && onApprove && (
					<div className="flex items-center gap-2">
						{onRequestFeedback && (
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs"
								onClick={onRequestFeedback}
							>
								Request Feedback
							</Button>
						)}
						<Button
							variant="default"
							size="sm"
							className="h-7 gap-1 text-xs"
							disabled={isApproving}
							onClick={() => onApprove()}
						>
							<span>{isApproving ? t.approvingButton : t.approveButton}</span>
							<ArrowIcon className="size-3.5" />
						</Button>
					</div>
				)}
			</div>
		</section>
	);
}
