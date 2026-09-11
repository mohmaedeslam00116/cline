"use client";

import type { WalkthroughArtifact } from "@cline/shared/browser";
import {
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	FileCheck,
	ListChecks,
	Sparkles,
} from "lucide-react";
import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getLensDirection, getLensTranslations } from "@/lib/lens-i18n";

export type WalkthroughData = WalkthroughArtifact;

export function WalkthroughPanel({
	walkthrough,
	isVerified = false,
}: {
	walkthrough: WalkthroughData;
	isVerified?: boolean;
}) {
	const [isExpanded, setIsExpanded] = useState(true);
	const bodyId = useId();
	const t = getLensTranslations().walkthrough;
	const isRtl = getLensDirection() === "rtl";

	const hasChanges = walkthrough.changesMade.length > 0;
	const hasVerification = walkthrough.verificationResults.length > 0;

	const ChevronExpandIcon = isRtl ? ChevronLeft : ChevronRight;

	return (
		<section className="rounded-xl border border-border/80 bg-card p-4 shadow-xs transition-all">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
				<div className="flex items-center gap-2.5">
					<div className="flex size-7 items-center justify-center rounded-lg border border-border/70 bg-muted/60 text-foreground">
						<Sparkles className="size-4" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								{t.badge}
							</span>
							{isVerified && (
								<Badge
									variant="outline"
									className="border-border/80 bg-muted/60 px-1.5 py-0 text-[10px] text-foreground"
								>
									<CheckCircle2 className="me-1 inline size-3 text-foreground" />
									{t.verificationComplete}
								</Badge>
							)}
						</div>
						<h3 className="mt-0.5 text-sm font-semibold text-foreground">
							{walkthrough.title}
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

			{/* Walkthrough Body */}
			{isExpanded && (
				<div
					id={bodyId}
					className="mt-3 space-y-3.5 text-xs text-foreground/90"
				>
					{/* Changes Made */}
					{hasChanges && (
						<div>
							<div className="flex items-center gap-1.5 font-medium text-foreground">
								<FileCheck className="size-3.5 text-muted-foreground" />
								<span>
									{t.changesMade} ({walkthrough.changesMade.length})
								</span>
							</div>
							<ul className="mt-2 space-y-1 ps-4 list-disc text-foreground/80">
								{walkthrough.changesMade.map((item) => (
									<li key={item}>{item}</li>
								))}
							</ul>
						</div>
					)}

					{/* Verification Results */}
					{hasVerification && (
						<div>
							<div className="flex items-center gap-1.5 font-medium text-foreground">
								<ListChecks className="size-3.5 text-muted-foreground" />
								<span>{t.verificationResults}</span>
							</div>
							<div className="mt-2 rounded-lg border border-border/70 bg-muted/30 p-3">
								<ul className="space-y-1 ps-4 list-disc font-mono text-[11px] text-foreground/80">
									{walkthrough.verificationResults.map((res) => (
										<li key={res}>{res}</li>
									))}
								</ul>
							</div>
						</div>
					)}
				</div>
			)}
		</section>
	);
}
