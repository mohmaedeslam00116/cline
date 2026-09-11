"use client";

import type { WalkthroughArtifact } from "@cline/shared/browser";
import {
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	FileCheck,
	ListChecks,
	Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export type WalkthroughData = WalkthroughArtifact;

export function WalkthroughPanel({
	walkthrough,
}: {
	walkthrough: WalkthroughData;
}) {
	const [isExpanded, setIsExpanded] = useState(true);

	const hasChanges = walkthrough.changesMade.length > 0;
	const hasVerification = walkthrough.verificationResults.length > 0;

	return (
		<section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xs transition-all">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/15 pb-3">
				<div className="flex items-center gap-2.5">
					<div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
						<Sparkles className="size-4" />
					</div>
					<div>
						<div className="flex items-center gap-2">
							<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Task Walkthrough
							</span>
							<Badge
								variant="secondary"
								className="bg-emerald-500/15 px-1.5 py-0 text-[10px] text-emerald-600 dark:text-emerald-400"
							>
								<CheckCircle2 className="mr-1 size-3 text-emerald-500 inline" />
								Verification Complete
							</Badge>
						</div>
						<h3 className="mt-0.5 text-sm font-semibold text-foreground">
							{walkthrough.title}
						</h3>
					</div>
				</div>

				<button
					type="button"
					onClick={() => setIsExpanded((prev) => !prev)}
					className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
				>
					{isExpanded ? (
						<>
							<span>Collapse</span>
							<ChevronDown className="size-3.5" />
						</>
					) : (
						<>
							<span>Expand</span>
							<ChevronRight className="size-3.5" />
						</>
					)}
				</button>
			</div>

			{/* Walkthrough Body */}
			{isExpanded && (
				<div className="mt-3 space-y-3.5 text-xs text-foreground/90">
					{/* Changes Made */}
					{hasChanges && (
						<div>
							<div className="flex items-center gap-1.5 font-medium text-foreground">
								<FileCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
								<span>Changes Made ({walkthrough.changesMade.length})</span>
							</div>
							<ul className="mt-2 space-y-1 pl-4 list-disc text-foreground/80">
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
								<ListChecks className="size-3.5 text-emerald-600 dark:text-emerald-400" />
								<span>Verification & Validation Results</span>
							</div>
							<div className="mt-2 rounded-lg border border-border/70 bg-card/60 p-3">
								<ul className="space-y-1 pl-4 list-disc font-mono text-[11px] text-foreground/80">
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
