"use client";

import {
	BookOpen,
	Clock3,
	FileText,
	RefreshCw,
	ShieldAlert,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	PageEmptyState,
	PageFrame,
	PageHeader,
} from "@/components/views/page-layout";
import { desktopClient } from "@/lib/desktop-client";

export interface EvidenceBundleMetadata {
	readonly digest: string;
	readonly createdAt: string;
	readonly topic: string;
	readonly claimCount: number;
}

export interface PolicyAuditRecord {
	readonly seq: number;
	readonly timestamp: string;
	readonly kind: string;
	readonly capability: string;
	readonly detail: string;
}

export interface RecentPolicyDecision {
	readonly toolCallId: string;
	readonly approved: boolean;
	readonly policyDenied: boolean;
	readonly reason: string;
}

export interface EvidencePanelProps {
	readonly sessionId?: string | null;
	readonly onBackToChat?: () => void;
	readonly className?: string;
}

export function EvidencePanel({
	sessionId,
	onBackToChat,
	className,
}: EvidencePanelProps) {
	const [bundles, setBundles] = useState<EvidenceBundleMetadata[]>([]);
	const [auditTrail, setAuditTrail] = useState<PolicyAuditRecord[]>([]);
	const [recentDecisions, setRecentDecisions] = useState<
		RecentPolicyDecision[]
	>([]);
	const [lensMode, setLensMode] = useState<boolean>(true);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [activeTab, setActiveTab] = useState<"evidence" | "policy">("evidence");

	const loadData = useCallback(async () => {
		if (!sessionId) {
			setBundles([]);
			setAuditTrail([]);
			setRecentDecisions([]);
			return;
		}
		setIsLoading(true);
		try {
			const indexResponse = await desktopClient.invoke<{
				lensMode: boolean;
				sessionId: string;
				bundles: EvidenceBundleMetadata[];
			}>("lens_evidence_index", { sessionId });

			if (indexResponse) {
				setLensMode(indexResponse.lensMode);
				setBundles(indexResponse.bundles ?? []);
			}

			const auditResponse = await desktopClient.invoke<{
				lensMode: boolean;
				sessionId: string;
				auditTrail: PolicyAuditRecord[];
				recentDecisions: RecentPolicyDecision[];
			}>("lens_policy_audit", { sessionId });

			if (auditResponse) {
				setAuditTrail(auditResponse.auditTrail ?? []);
				setRecentDecisions(auditResponse.recentDecisions ?? []);
			}
		} catch (error) {
			console.error("Failed to load LENS evidence/audit data", error);
		} finally {
			setIsLoading(false);
		}
	}, [sessionId]);

	useEffect(() => {
		void loadData();

		// Subscribe to real-time policy denials to update audit records live
		const unsubscribe = desktopClient.subscribe("lens_policy_denied", () => {
			void loadData();
		});

		return () => {
			unsubscribe();
		};
	}, [loadData]);

	const totalClaims = bundles.reduce((acc, b) => acc + (b.claimCount ?? 0), 0);

	return (
		<PageFrame className={className}>
			<PageHeader
				icon={BookOpen}
				title="LENS Evidence & Claims"
				description="Research Loop (Loop 1) Evidence Store — immutable, content-addressed bundles and policy audit trail."
				meta={
					<div className="flex items-center gap-2">
						<Badge
							variant="outline"
							className="border-primary/40 bg-primary/10 text-primary"
						>
							<Sparkles className="mr-1 h-3 w-3" />
							Phase 1: Read-Only Containment
						</Badge>
						<Badge
							variant="destructive"
							className="bg-amber-600/20 text-amber-500 border-amber-500/40"
						>
							<ShieldAlert className="mr-1 h-3 w-3" />
							Zero-Trust: Untrusted Research Data
						</Badge>
						{lensMode ? (
							<Badge
								variant="outline"
								className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
							>
								LENS: Active
							</Badge>
						) : null}
					</div>
				}
				actions={
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => void loadData()}
							disabled={isLoading}
						>
							<RefreshCw
								className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
							/>
							Refresh
						</Button>
						{onBackToChat ? (
							<Button variant="default" size="sm" onClick={onBackToChat}>
								Back to Chat
							</Button>
						) : null}
					</div>
				}
			/>

			{/* Top Summary Metrics */}
			<div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardDescription className="text-xs uppercase tracking-wider">
							Evidence Bundles
						</CardDescription>
						<CardTitle className="text-2xl font-bold">
							{bundles.length}
						</CardTitle>
					</CardHeader>
					<CardContent className="text-xs text-muted-foreground">
						Content-addressed SHA-256 artifacts
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription className="text-xs uppercase tracking-wider">
							Synthesized Claims
						</CardDescription>
						<CardTitle className="text-2xl font-bold">{totalClaims}</CardTitle>
					</CardHeader>
					<CardContent className="text-xs text-muted-foreground">
						BM25 verified passage hits
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardDescription className="text-xs uppercase tracking-wider">
							Policy Enforcement
						</CardDescription>
						<CardTitle className="text-2xl font-bold">
							{recentDecisions.length} Decisions
						</CardTitle>
					</CardHeader>
					<CardContent className="text-xs text-muted-foreground">
						{recentDecisions.filter((d) => !d.approved).length} fail-closed
						denials
					</CardContent>
				</Card>
			</div>

			{/* Navigation Tabs */}
			<div className="mb-4 flex items-center gap-2 border-b border-border pb-2">
				<Button
					variant={activeTab === "evidence" ? "default" : "ghost"}
					size="sm"
					onClick={() => setActiveTab("evidence")}
				>
					<FileText className="mr-1.5 h-4 w-4" />
					Evidence Bundles ({bundles.length})
				</Button>
				<Button
					variant={activeTab === "policy" ? "default" : "ghost"}
					size="sm"
					onClick={() => setActiveTab("policy")}
				>
					<ShieldCheck className="mr-1.5 h-4 w-4" />
					Policy & Grants Audit ({auditTrail.length})
				</Button>
			</div>

			{/* Tab 1: Evidence Bundles */}
			{activeTab === "evidence" ? (
				bundles.length === 0 ? (
					<PageEmptyState className="py-12 text-center">
						<BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
						<h3 className="text-base font-medium text-foreground">
							No Evidence Bundles for this session
						</h3>
						<p className="mt-1 text-sm text-muted-foreground">
							When the agent runs research passes in Loop 1, immutable
							content-addressed bundles will appear here, tagged with verified
							claims and source citations.
						</p>
					</PageEmptyState>
				) : (
					<div className="space-y-4">
						{bundles.map((bundle) => (
							<Card
								key={bundle.digest}
								className="overflow-hidden border-border/80"
							>
								<CardHeader className="bg-muted/30 pb-3">
									<div className="flex flex-wrap items-start justify-between gap-2">
										<div>
											<CardTitle className="text-lg font-semibold flex items-center gap-2">
												<span>{bundle.topic}</span>
												<Badge
													variant="outline"
													className="font-mono text-[10px] text-muted-foreground"
												>
													digest: {bundle.digest.slice(0, 12)}…
												</Badge>
											</CardTitle>
											<CardDescription className="mt-1 flex items-center gap-2 text-xs">
												<Clock3 className="h-3 w-3" />
												<span>
													Created: {new Date(bundle.createdAt).toLocaleString()}
												</span>
											</CardDescription>
										</div>
										<Badge variant="secondary" className="px-2.5 py-1 text-xs">
											{bundle.claimCount} Claims Verified
										</Badge>
									</div>
								</CardHeader>
								<CardContent className="pt-4">
									<div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400">
										<div className="flex items-center gap-1.5 font-medium mb-1">
											<ShieldAlert className="h-3.5 w-3.5" />
											Zero-Trust Boundary Contract
										</div>
										All claims in this bundle are marked{" "}
										<code className="rounded bg-amber-500/20 px-1 py-0.5 font-mono">
											contentIsUntrusted: true
										</code>
										. They inform coding decisions but cannot authorize tool
										elevation or policy override. Excerpts are retrieved on
										demand via{" "}
										<code className="rounded bg-amber-500/20 px-1 py-0.5 font-mono">
											get_evidence_detail
										</code>
										.
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)
			) : null}

			{/* Tab 2: Policy & Grants Audit */}
			{activeTab === "policy" ? (
				<div className="space-y-6">
					<div>
						<h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
							<ShieldCheck className="h-4 w-4 text-primary" />
							Recent Tool Call Decisions
						</h3>
						{recentDecisions.length === 0 ? (
							<PageEmptyState>
								No tool approval decisions recorded for this session yet.
							</PageEmptyState>
						) : (
							<div className="space-y-2">
								{recentDecisions.map((decision) => (
									<div
										key={decision.toolCallId}
										className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 text-sm"
									>
										<div className="min-w-0">
											<div className="font-mono text-xs font-semibold text-foreground">
												Tool Call: {decision.toolCallId}
											</div>
											<div className="text-xs text-muted-foreground mt-0.5">
												{decision.reason}
											</div>
										</div>
										<Badge
											variant={decision.approved ? "outline" : "destructive"}
											className="shrink-0"
										>
											{decision.approved
												? "Approved"
												: "Policy Denied (Fail Closed)"}
										</Badge>
									</div>
								))}
							</div>
						)}
					</div>

					<div>
						<h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
							<Clock3 className="h-4 w-4 text-primary" />
							Append-Only Grant Registry Audit Trail
						</h3>
						{auditTrail.length === 0 ? (
							<PageEmptyState>
								Grant registry is empty for this session (Phase-1 read-only
								containment).
							</PageEmptyState>
						) : (
							<div className="space-y-1.5 font-mono text-xs">
								{auditTrail.map((record) => (
									<div
										key={record.seq}
										className="rounded border border-border/60 bg-muted/20 p-2 text-muted-foreground"
									>
										<span className="text-primary">#{record.seq}</span>{" "}
										<span className="text-foreground/80">[{record.kind}]</span>{" "}
										<span className="text-foreground">
											{record.capability}:
										</span>{" "}
										{record.detail}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			) : null}
		</PageFrame>
	);
}
