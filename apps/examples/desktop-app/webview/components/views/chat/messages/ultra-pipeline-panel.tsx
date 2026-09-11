"use client";

import {
	AlertCircle,
	Check,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Code2,
	Compass,
	Copy,
	Database,
	FileCode2,
	FileText,
	GitBranch,
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
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLensDirection, getLensTranslations } from "@/lib/lens-i18n";
import { cn } from "@/lib/utils";
import { MemoizedMarkdown } from "../../../ui/markdown";
import type { UltraPipeline } from "./ultra-pipeline-parser";

export type UltraPipelinePanelProps = {
	pipeline: UltraPipeline;
	className?: string;
	onProceedCheckpoint?: (feedback?: string) => void;
};

type PipelineTab =
	| "prd"
	| "architect"
	| "tasks"
	| "code"
	| "qa"
	| "lyra"
	| "vector"
	| "echo";

const PERSONA_INDICATOR_COLOR = "#161616";

export const UltraPipelinePanel = memo(function UltraPipelinePanel({
	pipeline,
	className,
	onProceedCheckpoint,
}: UltraPipelinePanelProps) {
	const t = getLensTranslations().ultraPipeline;
	const tAgency = getLensTranslations().ultraAgency;
	const dir = getLensDirection();
	const [isExpanded, setIsExpanded] = useState(true);
	const [showFeed, setShowFeed] = useState(true);
	const [activeTab, setActiveTab] = useState<PipelineTab>("prd");
	const [copiedTab, setCopiedTab] = useState<string | null>(null);
	const [feedbackText, setFeedbackText] = useState("");
	const [isProceeding, setIsProceeding] = useState(false);

	const tabs = useMemo(() => {
		const list: Array<{
			key: PipelineTab;
			label: string;
			personaName: string;
			personaColor: string;
			icon: React.ComponentType<{ className?: string }>;
		}> = [];

		if (pipeline.lyra) {
			list.push({
				key: "lyra",
				label: tAgency.tabLyraLabel,
				personaName: "Lyra",
				personaColor: PERSONA_INDICATOR_COLOR,
				icon: Compass,
			});
		}

		list.push(
			{
				key: "prd",
				label: tAgency.tabPrdLabel,
				personaName: "Athena",
				personaColor: PERSONA_INDICATOR_COLOR,
				icon: ListChecks,
			},
			{
				key: "architect",
				label: tAgency.tabArchLabel,
				personaName: "Atlas",
				personaColor: PERSONA_INDICATOR_COLOR,
				icon: Layers,
			},
		);

		if (pipeline.vector) {
			list.push({
				key: "vector",
				label: tAgency.tabVectorLabel,
				personaName: "Vector",
				personaColor: PERSONA_INDICATOR_COLOR,
				icon: Database,
			});
		}

		list.push(
			{
				key: "tasks",
				label: tAgency.tabTasksLabel,
				personaName: "Orion",
				personaColor: PERSONA_INDICATOR_COLOR,
				icon: GitBranch,
			},
			{
				key: "code",
				label: tAgency.tabCodeLabel,
				personaName: "Cipher",
				personaColor: PERSONA_INDICATOR_COLOR,
				icon: Code2,
			},
			{
				key: "qa",
				label: tAgency.tabQaLabel,
				personaName: "Sentinel",
				personaColor: PERSONA_INDICATOR_COLOR,
				icon: TestTube2,
			},
		);

		if (pipeline.echo) {
			list.push({
				key: "echo",
				label: tAgency.tabDocsLabel,
				personaName: "Echo",
				personaColor: PERSONA_INDICATOR_COLOR,
				icon: FileText,
			});
		}

		return list;
	}, [
		pipeline.lyra,
		pipeline.vector,
		pipeline.echo,
		tAgency.tabLyraLabel,
		tAgency.tabPrdLabel,
		tAgency.tabArchLabel,
		tAgency.tabVectorLabel,
		tAgency.tabTasksLabel,
		tAgency.tabCodeLabel,
		tAgency.tabQaLabel,
		tAgency.tabDocsLabel,
	]);

	useEffect(() => {
		const tabKeys = tabs.map((t) => t.key);
		if (!tabKeys.includes(activeTab) && tabKeys.length > 0) {
			setActiveTab(tabKeys[0]);
		}
	}, [activeTab, tabs]);

	const handleTabKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLDivElement>) => {
			if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
				return;
			}
			event.preventDefault();
			const tabKeys = tabs.map((t) => t.key);
			const currentIndex = tabKeys.indexOf(activeTab);
			const delta =
				(event.key === "ArrowRight" ? 1 : -1) * (dir === "rtl" ? -1 : 1);
			const nextIndex =
				(currentIndex + delta + tabKeys.length) % tabKeys.length;
			const nextTab = tabKeys[nextIndex];
			setActiveTab(nextTab);
			const nextButton = document.getElementById(`ultra-tab-${nextTab}`);
			nextButton?.focus();
		},
		[activeTab, dir, tabs],
	);

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

	const checkpointGate = pipeline.checkpointStatus?.gate;
	const checkpointTitle = pipeline.checkpointStatus?.title;
	const isAwaitingApproval = Boolean(
		pipeline.checkpointStatus?.isAwaitingApproval,
	);
	useEffect(() => {
		if (
			checkpointGate !== undefined ||
			checkpointTitle !== undefined ||
			isAwaitingApproval
		) {
			setIsProceeding(false);
		}
	}, [checkpointGate, checkpointTitle, isAwaitingApproval]);

	const handleProceed = useCallback(() => {
		if (onProceedCheckpoint) {
			setIsProceeding(true);
			onProceedCheckpoint(feedbackText.trim() || undefined);
		}
	}, [feedbackText, onProceedCheckpoint]);

	useEffect(() => {
		if (!isProceeding) return;
		const timer = setTimeout(() => setIsProceeding(false), 15000);
		return () => clearTimeout(timer);
	}, [isProceeding]);

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
			className: "bg-primary/10 text-primary border-primary/20",
		};
	}, [qaStatus, pipeline.qa?.retries, t]);

	const activeContentForCopy = useMemo(() => {
		switch (activeTab) {
			case "prd":
				return pipeline.prd?.rawMarkdown;
			case "architect":
				return pipeline.architect?.rawMarkdown;
			case "tasks":
				return pipeline.tasks?.rawMarkdown;
			case "code":
				return pipeline.engineer?.rawMarkdown;
			case "qa":
				return pipeline.qa?.rawMarkdown;
			case "lyra":
				return pipeline.lyra?.rawMarkdown;
			case "vector":
				return pipeline.vector?.rawMarkdown;
			case "echo":
				return pipeline.echo?.rawMarkdown;
			default:
				return undefined;
		}
	}, [activeTab, pipeline]);

	const squadMembers = useMemo(() => {
		return [
			{
				id: "orion",
				name: "Orion",
				role: tAgency.roleOrchestrator,
				color: PERSONA_INDICATOR_COLOR,
				done: Boolean(pipeline.tasks),
			},
			...(pipeline.lyra
				? [
						{
							id: "lyra",
							name: "Lyra",
							role: tAgency.roleResearcher,
							color: PERSONA_INDICATOR_COLOR,
							done: true,
						},
					]
				: []),
			{
				id: "athena",
				name: "Athena",
				role: tAgency.roleProductLead,
				color: PERSONA_INDICATOR_COLOR,
				done: Boolean(pipeline.prd),
			},
			{
				id: "atlas",
				name: "Atlas",
				role: tAgency.roleArchitect,
				color: PERSONA_INDICATOR_COLOR,
				done: Boolean(pipeline.architect),
			},
			...(pipeline.vector
				? [
						{
							id: "vector",
							name: "Vector",
							role: tAgency.roleDataArchitect,
							color: PERSONA_INDICATOR_COLOR,
							done: true,
						},
					]
				: []),
			{
				id: "cipher",
				name: "Cipher",
				role: tAgency.roleEngineer,
				color: PERSONA_INDICATOR_COLOR,
				done: Boolean(pipeline.engineer),
			},
			{
				id: "sentinel",
				name: "Sentinel",
				role: tAgency.roleQaLead,
				color: PERSONA_INDICATOR_COLOR,
				done: pipeline.qa?.status === "passed",
			},
			...(pipeline.echo
				? [
						{
							id: "echo",
							name: "Echo",
							role: tAgency.roleDocs,
							color: PERSONA_INDICATOR_COLOR,
							done: true,
						},
					]
				: []),
		];
	}, [
		pipeline,
		tAgency.roleOrchestrator,
		tAgency.roleResearcher,
		tAgency.roleProductLead,
		tAgency.roleArchitect,
		tAgency.roleDataArchitect,
		tAgency.roleEngineer,
		tAgency.roleQaLead,
		tAgency.roleDocs,
	]);

	return (
		<section
			aria-label={tAgency.badge}
			className={cn(
				"my-3 overflow-hidden rounded-xl border border-border/80 bg-card shadow-md transition-colors",
				className,
			)}
			dir={dir}
		>
			{/* Top Header */}
			<div className="flex items-center justify-between border-b border-border/50 bg-muted/40 px-3 py-2 text-xs">
				<div className="flex items-center gap-2">
					<div className="flex size-5 items-center justify-center rounded bg-primary/10 text-primary">
						<Workflow className="size-3.5" />
					</div>
					<span className="font-semibold text-foreground">{tAgency.badge}</span>
					<span className="text-muted-foreground hidden sm:inline">
						• {tAgency.subtitle}
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
					{/* Squad Lineup Bar */}
					<div className="flex flex-wrap items-center gap-2 border-b border-border/30 bg-muted/20 px-3 py-2 text-xs overflow-x-auto">
						<span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0 me-1 flex items-center gap-1">
							<Users className="size-3 text-muted-foreground" />
							{tAgency.squadBarTitle}:
						</span>
						{squadMembers.map((member) => (
							<div
								key={member.id}
								className={cn(
									"inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 border text-[11px] font-medium transition-all shrink-0",
									member.done
										? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
										: "border-border/60 bg-background/50 text-foreground",
								)}
							>
								<div
									className="size-2 rounded-full shrink-0"
									style={{ backgroundColor: member.color }}
								/>
								<span className="font-semibold">{member.name}</span>
								<span className="text-[9px] opacity-70">({member.role})</span>
								{member.done && (
									<Check className="size-3 text-emerald-500 shrink-0" />
								)}
							</div>
						))}
					</div>

					{/* Inter-Agent Collaboration Feed */}
					{pipeline.collaborationFeed.length > 0 && (
						<div className="border-b border-border/30 bg-muted/10 px-3 py-2 text-xs">
							<button
								type="button"
								aria-expanded={showFeed}
								aria-controls="ultra-collaboration-feed"
								className="flex w-full items-center justify-between cursor-pointer select-none text-[11px] font-medium text-foreground mb-1 focus-visible:outline-none"
								onClick={() => setShowFeed((prev) => !prev)}
							>
								<span className="flex items-center gap-1.5">
									<Sparkles className="size-3 text-primary" />
									{tAgency.collaborationFeedTitle} (
									{pipeline.collaborationFeed.length})
								</span>
								<span className="text-[10px] text-muted-foreground opacity-80">
									{showFeed ? t.collapse : t.expand}
								</span>
							</button>

							{showFeed && (
								<div
									id="ultra-collaboration-feed"
									className="space-y-1.5 max-h-36 overflow-y-auto pe-1 mt-1.5"
								>
									{pipeline.collaborationFeed.map((entry, idx) => (
										<div
											// biome-ignore lint/suspicious/noArrayIndexKey: feed is static per parse
											key={idx}
											className="flex items-start gap-1.5 rounded bg-background/80 border border-border/40 p-1.5 text-[11px] leading-relaxed shadow-2xs"
										>
											<div className="inline-flex items-center gap-1 shrink-0 font-semibold font-mono text-[10px] text-primary">
												<span>{entry.from}</span>
												<span>→</span>
												<span>{entry.to}</span>
												<span>:</span>
											</div>
											<span className="text-foreground/90">
												{entry.message}
											</span>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					{/* Specialist Deliverable Tabs Navigation */}
					<div
						aria-label={tAgency.deliverablesAriaLabel}
						className="flex overflow-x-auto border-b border-border/40 bg-muted/20 px-2 py-1 text-xs"
						onKeyDown={handleTabKeyDown}
						role="tablist"
					>
						{tabs.map((tab) => {
							const Icon = tab.icon;
							const isSelected = activeTab === tab.key;
							return (
								<button
									key={tab.key}
									aria-controls={`ultra-tabpanel-${tab.key}`}
									aria-selected={isSelected}
									className={cn(
										"inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0",
										isSelected
											? "bg-background text-primary shadow-2xs font-semibold"
											: "text-muted-foreground hover:text-foreground",
									)}
									id={`ultra-tab-${tab.key}`}
									onClick={() => setActiveTab(tab.key)}
									role="tab"
									tabIndex={isSelected ? 0 : -1}
									type="button"
								>
									<div
										className="size-2 rounded-full shrink-0"
										style={{ backgroundColor: tab.personaColor }}
									/>
									<Icon className="size-3.5" />
									<span>
										{tab.personaName} ({tab.label})
									</span>
								</button>
							);
						})}
					</div>

					{/* Tab Panels */}
					<div className="p-3 text-xs">
						{/* Tab: Lyra Research */}
						{activeTab === "lyra" && pipeline.lyra && (
							<div
								aria-labelledby="ultra-tab-lyra"
								className="space-y-3"
								id="ultra-tabpanel-lyra"
								role="tabpanel"
							>
								<div className="flex items-center justify-between gap-2">
									<h4 className="font-semibold text-foreground flex items-center gap-1.5">
										<Compass className="size-3.5 text-cyan-500" />
										<span>{tAgency.tabLyra}</span>
									</h4>
									<span className="inline-flex items-center gap-1 font-mono text-[11px] rounded border border-border/80 bg-muted/60 px-2 py-0.5 text-foreground">
										<ShieldAlert className="size-3 text-amber-500" />
										{tAgency.untrustedBadgeExact}
									</span>
								</div>
								<div className="rounded border border-border/40 bg-muted/20 p-2.5">
									<MemoizedMarkdown content={pipeline.lyra.findings} />
								</div>
							</div>
						)}

						{/* Tab: Athena PRD */}
						{activeTab === "prd" && (
							<div
								aria-labelledby="ultra-tab-prd"
								className="space-y-3"
								id="ultra-tabpanel-prd"
								role="tabpanel"
							>
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
													<thead className="bg-muted/50 text-muted-foreground border-b border-border/30">
														<tr>
															<th className="p-1.5 font-medium">
																{t.requirementLabel}
															</th>
															<th className="p-1.5 font-medium w-20">
																{t.priorityLabel}
															</th>
														</tr>
													</thead>
													<tbody className="divide-y divide-border/30">
														{pipeline.prd.requirementPool.map((req, idx) => (
															// biome-ignore lint/suspicious/noArrayIndexKey: requirement list is static
															<tr key={idx} className="hover:bg-muted/30">
																<td className="p-1.5">{req.requirement}</td>
																<td className="p-1.5">
																	<span
																		className={cn(
																			"rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold",
																			req.priority.toUpperCase() === "P0"
																				? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
																				: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30",
																		)}
																	>
																		{req.priority}
																	</span>
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
											{t.uiDraftTitle}
										</h4>
										<div className="rounded border border-border/30 bg-muted/30 p-2 text-muted-foreground whitespace-pre-wrap">
											{pipeline.prd.uiDesignDraft}
										</div>
									</div>
								)}
							</div>
						)}

						{/* Tab: Atlas Architecture */}
						{activeTab === "architect" && (
							<div
								aria-labelledby="ultra-tab-architect"
								className="space-y-3"
								id="ultra-tabpanel-architect"
								role="tabpanel"
							>
								{pipeline.architect?.implementationApproach && (
									<div>
										<h4 className="font-semibold text-foreground mb-1">
											{t.techStackTitle}
										</h4>
										<p className="text-muted-foreground leading-relaxed">
											{pipeline.architect.implementationApproach}
										</p>
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
														className="rounded border border-border/40 bg-muted/40 px-2 py-0.5 font-mono text-[11px]"
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
										<div className="overflow-x-auto rounded border border-border/40 bg-muted/20 p-2 font-mono text-[11px]">
											<MemoizedMarkdown
												content={`\`\`\`mermaid\n${pipeline.architect.classDiagram}\n\`\`\``}
											/>
										</div>
									</div>
								)}

								{pipeline.architect?.sequenceDiagram && (
									<div>
										<h4 className="font-semibold text-foreground mb-1">
											{t.sequenceDiagramTitle}
										</h4>
										<div className="overflow-x-auto rounded border border-border/40 bg-muted/20 p-2 font-mono text-[11px]">
											<MemoizedMarkdown
												content={`\`\`\`mermaid\n${pipeline.architect.sequenceDiagram}\n\`\`\``}
											/>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Tab: Vector Data Schemas */}
						{activeTab === "vector" && pipeline.vector && (
							<div
								aria-labelledby="ultra-tab-vector"
								className="space-y-3"
								id="ultra-tabpanel-vector"
								role="tabpanel"
							>
								<div className="rounded border border-border/40 bg-muted/20 p-2.5">
									<MemoizedMarkdown content={pipeline.vector.schemas} />
								</div>
							</div>
						)}

						{/* Tab: Orion Tasks */}
						{activeTab === "tasks" && (
							<div
								aria-labelledby="ultra-tab-tasks"
								className="space-y-3"
								id="ultra-tabpanel-tasks"
								role="tabpanel"
							>
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
														className="rounded border border-border/40 bg-muted/40 px-2 py-0.5 font-mono text-[11px]"
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
													<li key={task}>{task}</li>
												))}
											</ol>
										</div>
									)}
							</div>
						)}

						{/* Tab: Cipher Code */}
						{activeTab === "code" && (
							<div
								aria-labelledby="ultra-tab-code"
								className="space-y-3"
								id="ultra-tabpanel-code"
								role="tabpanel"
							>
								<div>
									<h4 className="font-semibold text-foreground mb-1">
										{t.engineerTitle}
									</h4>
									<p className="text-muted-foreground mb-2">{t.engineerDesc}</p>
									{pipeline.engineer?.filesImplemented &&
										pipeline.engineer.filesImplemented.length > 0 && (
											<div className="flex flex-wrap gap-1.5 mb-2">
												{pipeline.engineer.filesImplemented.map((file) => (
													<span
														key={file}
														className="rounded border border-border/40 bg-muted/40 px-2 py-0.5 font-mono text-[11px]"
													>
														{file}
													</span>
												))}
											</div>
										)}
									{pipeline.engineer?.summary && (
										<div className="rounded border border-border/30 bg-muted/30 p-2 text-muted-foreground">
											{pipeline.engineer.summary}
										</div>
									)}
								</div>
							</div>
						)}

						{/* Tab: Sentinel QA */}
						{activeTab === "qa" && (
							<div
								aria-labelledby="ultra-tab-qa"
								className="space-y-3"
								id="ultra-tabpanel-qa"
								role="tabpanel"
							>
								{pipeline.qa?.testExecutionSummary && (
									<div>
										<h4 className="font-semibold text-foreground mb-1">
											{t.testExecutionTitle}
										</h4>
										<p className="text-muted-foreground leading-relaxed">
											{pipeline.qa.testExecutionSummary}
										</p>
									</div>
								)}

								<div className="rounded border border-border/40 bg-muted/20 p-2.5 space-y-2">
									<div className="flex items-center justify-between">
										<span className="font-semibold text-foreground">
											{t.retriesTitle}
										</span>
										<span className="font-mono font-medium">
											{pipeline.qa?.retries ?? 0} /{" "}
											{pipeline.qa?.maxRetries ?? 3}
										</span>
									</div>

									{pipeline.qa?.status === "passed" && (
										<div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
											<Check className="size-4" />
											<span>{t.verificationPassed}</span>
										</div>
									)}

									{pipeline.qa?.status === "failed" && (
										<div className="space-y-2">
											<div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
												<AlertCircle className="size-4" />
												<span>{tAgency.qaStatusFailed}</span>
											</div>
											{pipeline.qa.errors && pipeline.qa.errors.length > 0 && (
												<div className="space-y-1">
													<span className="text-[11px] font-semibold text-muted-foreground">
														{t.errorTracebacksTitle}:
													</span>
													<div className="rounded bg-background/80 border border-rose-500/30 p-2 font-mono text-[11px] text-rose-500 dark:text-rose-400 max-h-36 overflow-y-auto whitespace-pre-wrap">
														{pipeline.qa.errors.join("\n")}
													</div>
												</div>
											)}
										</div>
									)}
								</div>
							</div>
						)}

						{/* Tab: Echo Docs */}
						{activeTab === "echo" && pipeline.echo && (
							<div
								aria-labelledby="ultra-tab-echo"
								className="space-y-3"
								id="ultra-tabpanel-echo"
								role="tabpanel"
							>
								<div className="rounded border border-border/40 bg-muted/20 p-2.5">
									<MemoizedMarkdown content={pipeline.echo.docs} />
								</div>
							</div>
						)}
					</div>

					{/* Interactive Checkpoint Action Bar */}
					{pipeline.checkpointStatus?.isAwaitingApproval && (
						<div className="border-t border-border/80 bg-muted/30 p-3 text-xs space-y-2.5">
							<div className="flex items-start gap-2">
								<ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
								<div className="space-y-0.5">
									<span className="font-semibold text-foreground block">
										{pipeline.checkpointStatus.title ||
											(pipeline.checkpointStatus.gate === 1
												? tAgency.checkpoint1Title
												: tAgency.checkpoint2Title)}
									</span>
									<p className="text-[11px] text-muted-foreground leading-snug">
										{pipeline.checkpointStatus.summary ||
											(pipeline.checkpointStatus.gate === 1
												? tAgency.checkpoint1Desc
												: tAgency.checkpoint2Desc)}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2 pt-1">
								<Input
									placeholder={tAgency.feedbackPlaceholder}
									value={feedbackText}
									onChange={(e) => setFeedbackText(e.target.value)}
									className="h-8 text-xs bg-background/80"
								/>
								<Button
									size="sm"
									className="h-8 gap-1.5 px-3 font-medium shrink-0"
									onClick={handleProceed}
									disabled={isProceeding}
								>
									{isProceeding ? (
										<span>{tAgency.proceedingButton}</span>
									) : (
										<>
											<span>{tAgency.approveAndProceed}</span>
											<CheckCircle2 className="size-3.5" />
										</>
									)}
								</Button>
							</div>
						</div>
					)}

					{/* Footer Actions */}
					<div className="flex items-center justify-between border-t border-border/40 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
						<span>
							{t.footerPhase}{" "}
							<span className="font-medium text-foreground">
								{activeTab.toUpperCase()}
							</span>
						</span>

						{activeContentForCopy && (
							<button
								className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground focus-visible:outline-none transition-colors"
								onClick={() => handleCopy(activeContentForCopy)}
								type="button"
							>
								{copiedTab === activeTab ? (
									<>
										<Check className="size-3 text-emerald-500" />
										<span className="text-emerald-500">{t.copied}</span>
									</>
								) : (
									<>
										<Copy className="size-3" />
										<span>{t.copyDeliverable}</span>
									</>
								)}
							</button>
						)}
					</div>
				</div>
			)}
		</section>
	);
});
