"use client";

import {
	Check,
	ChevronDown,
	ChevronUp,
	Code2,
	Compass,
	Copy,
	FileCode2,
	GitBranch,
	ListChecks,
	Sparkles,
	TestTube2,
	Workflow,
} from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";
import { getLensDirection, getLensTranslations } from "@/lib/lens-i18n";
import { cn } from "@/lib/utils";
import type { UltraPipeline } from "./ultra-pipeline-parser";

export type UltraPipelinePanelProps = {
	pipeline: UltraPipeline;
	className?: string;
};

type PipelineTab = "prd" | "architect" | "tasks" | "code" | "qa";

export const UltraPipelinePanel = memo(function UltraPipelinePanel({
	pipeline,
	className,
}: UltraPipelinePanelProps) {
	const t = getLensTranslations().ultraPipeline;
	const dir = getLensDirection();
	const [isExpanded, setIsExpanded] = useState(true);
	const [activeTab, setActiveTab] = useState<PipelineTab>("prd");
	const [copiedTab, setCopiedTab] = useState<string | null>(null);

	const handleCopy = useCallback(
		async (text?: string) => {
			if (!text) return;
			try {
				await navigator.clipboard.writeText(text);
				setCopiedTab(activeTab);
				setTimeout(() => setCopiedTab(null), 2000);
			} catch {
				// Ignore clipboard write failures
			}
		},
		[activeTab],
	);

	const qaStatus = pipeline.qa?.status ?? "in_progress";
	const statusBadge = useMemo(() => {
		if (qaStatus === "passed") {
			return {
				label: t.statusVerified,
				className:
					"bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
			};
		}
		if (qaStatus === "self_correcting") {
			return {
				label: `${t.statusSelfCorrecting} (${pipeline.qa?.retries ?? 1}/3)`,
				className:
					"bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
			};
		}
		return {
			label: t.statusInProgress,
			className:
				"bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
		};
	}, [qaStatus, pipeline.qa?.retries, t]);

	return (
		<section
			aria-label={t.badge}
			className={cn(
				"my-3 overflow-hidden rounded-lg border border-indigo-500/30 bg-gradient-to-b from-indigo-950/10 to-background shadow-xs transition-colors",
				className,
			)}
			dir={dir}
		>
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border/50 bg-muted/40 px-3 py-2 text-xs">
				<div className="flex items-center gap-2">
					<div className="flex size-5 items-center justify-center rounded bg-indigo-500/10 text-indigo-500">
						<Workflow className="size-3.5" />
					</div>
					<span className="font-semibold text-foreground">{t.badge}</span>
					<span className="text-muted-foreground hidden sm:inline">
						• {t.subtitle}
					</span>
				</div>

				<div className="flex items-center gap-2">
					<span
						className={cn(
							"rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
							statusBadge.className,
						)}
					>
						{statusBadge.label}
					</span>

					<button
						aria-label={isExpanded ? t.collapse : t.expand}
						className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none"
						onClick={() => setIsExpanded((prev) => !prev)}
						title={isExpanded ? t.collapse : t.expand}
						type="button"
					>
						{isExpanded ? (
							<ChevronUp className="size-3.5" />
						) : (
							<ChevronDown className="size-3.5" />
						)}
					</button>
				</div>
			</div>

			{isExpanded && (
				<div>
					{/* Tabs Navigation */}
					<div
						aria-label="MetaGPT Assembly Line Roles"
						className="flex overflow-x-auto border-b border-border/40 bg-muted/20 px-2 py-1 text-xs"
						role="tablist"
					>
						<button
							aria-selected={activeTab === "prd"}
							className={cn(
								"inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none",
								activeTab === "prd"
									? "bg-background text-indigo-500 shadow-2xs font-semibold"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={() => setActiveTab("prd")}
							role="tab"
							type="button"
						>
							<ListChecks className="size-3.5" />
							<span>{t.tabPrd}</span>
						</button>

						<button
							aria-selected={activeTab === "architect"}
							className={cn(
								"inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none",
								activeTab === "architect"
									? "bg-background text-indigo-500 shadow-2xs font-semibold"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={() => setActiveTab("architect")}
							role="tab"
							type="button"
						>
							<Compass className="size-3.5" />
							<span>{t.tabArchitect}</span>
						</button>

						<button
							aria-selected={activeTab === "tasks"}
							className={cn(
								"inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none",
								activeTab === "tasks"
									? "bg-background text-indigo-500 shadow-2xs font-semibold"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={() => setActiveTab("tasks")}
							role="tab"
							type="button"
						>
							<GitBranch className="size-3.5" />
							<span>{t.tabTasks}</span>
						</button>

						<button
							aria-selected={activeTab === "code"}
							className={cn(
								"inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none",
								activeTab === "code"
									? "bg-background text-indigo-500 shadow-2xs font-semibold"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={() => setActiveTab("code")}
							role="tab"
							type="button"
						>
							<Code2 className="size-3.5" />
							<span>{t.tabCode}</span>
						</button>

						<button
							aria-selected={activeTab === "qa"}
							className={cn(
								"inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none",
								activeTab === "qa"
									? "bg-background text-indigo-500 shadow-2xs font-semibold"
									: "text-muted-foreground hover:text-foreground",
							)}
							onClick={() => setActiveTab("qa")}
							role="tab"
							type="button"
						>
							<TestTube2 className="size-3.5" />
							<span>{t.tabQa}</span>
						</button>
					</div>

					{/* Tab Panels */}
					<div className="p-3 text-xs">
						{/* Tab 1: PRD */}
						{activeTab === "prd" && (
							<div className="space-y-3">
								{pipeline.prd?.goals && pipeline.prd.goals.length > 0 && (
									<div>
										<h4 className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
											<Sparkles className="size-3 text-indigo-500" />
											{t.goalsTitle}
										</h4>
										<ul className="list-inside list-disc space-y-0.5 text-muted-foreground pl-1">
											{pipeline.prd.goals.map((goal) => (
												<li key={goal}>{goal}</li>
											))}
										</ul>
									</div>
								)}

								{pipeline.prd?.userStories &&
									pipeline.prd.userStories.length > 0 && (
										<div>
											<h4 className="font-semibold text-foreground mb-1">
												{t.userStoriesTitle}
											</h4>
											<div className="space-y-1">
												{pipeline.prd.userStories.map((story) => (
													<div
														key={story}
														className="rounded bg-muted/50 p-1.5 text-muted-foreground border border-border/30"
													>
														{story}
													</div>
												))}
											</div>
										</div>
									)}

								{pipeline.prd?.requirementPool &&
									pipeline.prd.requirementPool.length > 0 && (
										<div>
											<h4 className="font-semibold text-foreground mb-1">
												{t.requirementPoolTitle}
											</h4>
											<div className="overflow-hidden rounded border border-border/40">
												<table className="w-full text-left text-xs">
													<thead className="bg-muted/60 text-muted-foreground">
														<tr>
															<th className="px-2 py-1 w-16">Priority</th>
															<th className="px-2 py-1">Requirement</th>
														</tr>
													</thead>
													<tbody className="divide-y divide-border/20">
														{pipeline.prd.requirementPool.map((item) => (
															<tr
																key={`${item.priority}-${item.requirement}`}
																className="hover:bg-muted/20"
															>
																<td className="px-2 py-1">
																	<span
																		className={cn(
																			"rounded px-1.5 py-0.5 text-[10px] font-semibold",
																			item.priority === "P0"
																				? "bg-rose-500/15 text-rose-500"
																				: item.priority === "P1"
																					? "bg-amber-500/15 text-amber-500"
																					: "bg-blue-500/15 text-blue-500",
																		)}
																	>
																		{item.priority}
																	</span>
																</td>
																<td className="px-2 py-1 text-foreground">
																	{item.requirement}
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										</div>
									)}

								{pipeline.prd?.uiDesignDraft && (
									<div>
										<h4 className="font-semibold text-foreground mb-1">
											UI Design Draft
										</h4>
										<p className="text-muted-foreground bg-muted/40 rounded p-2 border border-border/30">
											{pipeline.prd.uiDesignDraft}
										</p>
									</div>
								)}
							</div>
						)}

						{/* Tab 2: Architect */}
						{activeTab === "architect" && (
							<div className="space-y-3">
								{pipeline.architect?.implementationApproach && (
									<div>
										<h4 className="font-semibold text-foreground mb-1">
											{t.techStackTitle}
										</h4>
										<div className="rounded bg-muted/40 p-2 text-muted-foreground border border-border/30 whitespace-pre-wrap">
											{pipeline.architect.implementationApproach}
										</div>
									</div>
								)}

								{pipeline.architect?.fileList &&
									pipeline.architect.fileList.length > 0 && (
										<div>
											<h4 className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
												<FileCode2 className="size-3 text-indigo-500" />
												{t.fileListTitle} ({pipeline.architect.fileList.length})
											</h4>
											<div className="flex flex-wrap gap-1.5">
												{pipeline.architect.fileList.map((file) => (
													<span
														key={file}
														className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground border border-border/40"
													>
														{file}
													</span>
												))}
											</div>
										</div>
									)}

								{pipeline.architect?.classDiagram && (
									<div>
										<h4 className="font-semibold text-foreground mb-1">
											{t.classDiagramTitle}
										</h4>
										<pre className="rounded bg-muted/60 p-2 font-mono text-[11px] text-foreground overflow-x-auto border border-border/30">
											<code>{pipeline.architect.classDiagram}</code>
										</pre>
									</div>
								)}

								{pipeline.architect?.sequenceDiagram && (
									<div>
										<h4 className="font-semibold text-foreground mb-1">
											{t.sequenceDiagramTitle}
										</h4>
										<pre className="rounded bg-muted/60 p-2 font-mono text-[11px] text-foreground overflow-x-auto border border-border/30">
											<code>{pipeline.architect.sequenceDiagram}</code>
										</pre>
									</div>
								)}
							</div>
						)}

						{/* Tab 3: Tasks */}
						{activeTab === "tasks" && (
							<div className="space-y-3">
								{pipeline.tasks?.packages &&
									pipeline.tasks.packages.length > 0 && (
										<div>
											<h4 className="font-semibold text-foreground mb-1">
												{t.dependenciesTitle}
											</h4>
											<div className="flex flex-wrap gap-1.5">
												{pipeline.tasks.packages.map((pkg) => (
													<span
														key={pkg}
														className="rounded bg-indigo-500/10 px-2 py-0.5 font-mono text-[11px] text-indigo-500 border border-indigo-500/20"
													>
														{pkg}
													</span>
												))}
											</div>
										</div>
									)}

								{pipeline.tasks?.taskList &&
									pipeline.tasks.taskList.length > 0 && (
										<div>
											<h4 className="font-semibold text-foreground mb-1">
												{t.taskDagTitle}
											</h4>
											<ol className="list-inside list-decimal space-y-1 text-muted-foreground pl-1">
												{pipeline.tasks.taskList.map((task) => (
													<li key={task} className="font-mono text-[11px]">
														{task}
													</li>
												))}
											</ol>
										</div>
									)}

								{pipeline.tasks?.logicAnalysis &&
									pipeline.tasks.logicAnalysis.length > 0 && (
										<div>
											<h4 className="font-semibold text-foreground mb-1">
												{t.logicAnalysisTitle}
											</h4>
											<div className="space-y-1">
												{pipeline.tasks.logicAnalysis.map((item) => (
													<div
														key={item.file}
														className="rounded bg-muted/40 p-1.5 border border-border/30 text-xs"
													>
														<span className="font-mono font-semibold text-foreground">
															{item.file}:{" "}
														</span>
														<span className="text-muted-foreground">
															{item.description}
														</span>
													</div>
												))}
											</div>
										</div>
									)}
							</div>
						)}

						{/* Tab 4: Code */}
						{activeTab === "code" && (
							<div className="space-y-2">
								<h4 className="font-semibold text-foreground">
									Engineer Implementation
								</h4>
								<p className="text-muted-foreground">
									Files generated and modified according to the Architect
									interface contracts.
								</p>
								{pipeline.architect?.fileList && (
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
										{pipeline.architect.fileList.map((file) => (
											<div
												key={`code-${file}`}
												className="flex items-center gap-2 rounded bg-muted/50 p-2 border border-border/40 font-mono text-xs text-foreground"
											>
												<FileCode2 className="size-3.5 text-indigo-500" />
												<span>{file}</span>
											</div>
										))}
									</div>
								)}
							</div>
						)}

						{/* Tab 5: QA & Verification */}
						{activeTab === "qa" && (
							<div className="space-y-3">
								<div>
									<h4 className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
										<TestTube2 className="size-3.5 text-indigo-500" />
										{t.testExecutionTitle}
									</h4>
									<div
										className={cn(
											"rounded p-2.5 border font-mono text-xs whitespace-pre-wrap",
											qaStatus === "passed"
												? "bg-emerald-950/20 text-emerald-400 border-emerald-500/30"
												: qaStatus === "self_correcting"
													? "bg-amber-950/20 text-amber-400 border-amber-500/30"
													: "bg-muted text-muted-foreground border-border/40",
										)}
									>
										{pipeline.qa?.testExecutionSummary || t.verificationPassed}
									</div>
								</div>

								<div className="flex items-center justify-between rounded bg-muted/40 p-2 border border-border/30">
									<span className="text-muted-foreground">
										{t.retriesTitle}:
									</span>
									<span className="font-semibold text-foreground">
										{pipeline.qa?.retries ?? 0} / {pipeline.qa?.maxRetries ?? 3}
									</span>
								</div>

								{pipeline.qa?.errors && pipeline.qa.errors.length > 0 && (
									<div>
										<h4 className="font-semibold text-rose-500 mb-1">
											Captured Error Tracebacks
										</h4>
										<div className="space-y-1">
											{pipeline.qa.errors.map((err) => (
												<pre
													key={err}
													className="rounded bg-rose-950/30 p-2 font-mono text-[10px] text-rose-300 overflow-x-auto border border-rose-500/30"
												>
													<code>{err}</code>
												</pre>
											))}
										</div>
									</div>
								)}
							</div>
						)}
					</div>

					{/* Footer with copy deliverable button */}
					<div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-3 py-1.5 text-[11px]">
						<span className="text-muted-foreground">
							Ultra Mode • SOP Phase: {activeTab.toUpperCase()}
						</span>

						<button
							className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none"
							onClick={() => handleCopy(pipeline.rawMarkdown)}
							type="button"
						>
							{copiedTab ? (
								<Check className="size-3 text-emerald-500" />
							) : (
								<Copy className="size-3" />
							)}
							<span>{copiedTab ? t.copied : t.copyDeliverable}</span>
						</button>
					</div>
				</div>
			)}
		</section>
	);
});
