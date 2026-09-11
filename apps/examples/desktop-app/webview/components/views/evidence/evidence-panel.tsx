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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getLensTranslations } from "@/lib/lens-i18n";

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
	const translations = useMemo(() => getLensTranslations(), []);
	const t = translations.evidencePanel;
	const b = translations.brand;

	const [bundles, setBundles] = useState<EvidenceBundleMetadata[]>([]);
	const [auditTrail, setAuditTrail] = useState<PolicyAuditRecord[]>([]);
	const [recentDecisions, setRecentDecisions] = useState<
		RecentPolicyDecision[]
	>([]);
	const [lensMode, setLensMode] = useState<boolean>(true);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<"evidence" | "policy">("evidence");

	const requestSeqRef = useRef(0);

	const loadData = useCallback(async () => {
		const currentSeq = ++requestSeqRef.current;
		if (!sessionId) {
			setBundles([]);
			setAuditTrail([]);
			setRecentDecisions([]);
			setError(null);
			return;
		}
		setIsLoading(true);
		setError(null);
		try {
			const [indexResponse, auditResponse] = await Promise.all([
				desktopClient.invoke<{
					lensMode: boolean;
					sessionId: string;
					bundles: EvidenceBundleMetadata[];
				}>("lens_evidence_index", { sessionId }),
				desktopClient.invoke<{
					lensMode: boolean;
					sessionId: string;
					auditTrail: PolicyAuditRecord[];
					recentDecisions: RecentPolicyDecision[];
				}>("lens_policy_audit", { sessionId }),
			]);

			if (currentSeq !== requestSeqRef.current) {
				return;
			}

			if (indexResponse) {
				setLensMode(indexResponse.lensMode);
				setBundles(indexResponse.bundles ?? []);
			}

			if (auditResponse) {
				setAuditTrail(auditResponse.auditTrail ?? []);
				setRecentDecisions(auditResponse.recentDecisions ?? []);
			}
		} catch (err: unknown) {
			if (currentSeq === requestSeqRef.current) {
				setError(err instanceof Error ? err.message : t.errorTitle);
			}
		} finally {
			if (currentSeq === requestSeqRef.current) {
				setIsLoading(false);
			}
		}
	}, [sessionId, t.errorTitle]);

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

	const handleTabsKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
			e.preventDefault();
			setActiveTab((prev) => (prev === "evidence" ? "policy" : "evidence"));
		}
	};

	const totalClaims = bundles.reduce(
		(acc, bundle) => acc + (bundle.claimCount ?? 0),
		0,
	);

	return (
		<PageFrame className={className}>
			<PageHeader
				icon={BookOpen}
				title={t.title}
				description={t.description}
				meta={
					<div className="flex flex-wrap items-center gap-2">
						<Badge
							variant="outline"
							className="border-border bg-muted/60 text-foreground"
						>
							<Sparkles className="mr-1 h-3 w-3" />
							{b.phase1Badge}
						</Badge>
						<Badge
							variant="outline"
							className="border-border bg-muted/60 text-foreground font-mono text-[11px]"
						>
							<ShieldAlert className="mr-1 h-3 w-3" />
							{b.untrustedBadgeExact}
						</Badge>
						{lensMode ? (
							<Badge
								variant="outline"
								className="border-border bg-muted/60 text-foreground"
							>
								{b.lensActive}
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
							{t.refresh}
						</Button>
						{onBackToChat ? (
							<Button variant="default" size="sm" onClick={onBackToChat}>
								{t.backToChat}
							</Button>
						) : null}
					</div>
				}
			/>

			{/* Error State with Retry */}
			{error ? (
				<div className="mb-4 flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
					<div className="flex items-center gap-2">
						<ShieldAlert className="h-4 w-4 shrink-0" />
						<span>{error}</span>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => void loadData()}
						disabled={isLoading}
						className="border-destructive/30 hover:bg-destructive/20"
					>
						<RefreshCw
							className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
						/>
						{t.retryButton}
					</Button>
				</div>
			) : null}

			{/* Top Summary Metrics */}
			<div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Card className="border-border bg-card">
					<CardHeader className="pb-2">
						<CardDescription className="text-xs uppercase tracking-wider">
							{t.metricBundles}
						</CardDescription>
						<CardTitle className="text-2xl font-bold">
							{bundles.length}
						</CardTitle>
					</CardHeader>
					<CardContent className="text-xs text-muted-foreground">
						{t.metricBundlesDesc}
					</CardContent>
				</Card>

				<Card className="border-border bg-card">
					<CardHeader className="pb-2">
						<CardDescription className="text-xs uppercase tracking-wider">
							{t.metricClaims}
						</CardDescription>
						<CardTitle className="text-2xl font-bold">{totalClaims}</CardTitle>
					</CardHeader>
					<CardContent className="text-xs text-muted-foreground">
						{t.metricClaimsDesc}
					</CardContent>
				</Card>

				<Card className="border-border bg-card">
					<CardHeader className="pb-2">
						<CardDescription className="text-xs uppercase tracking-wider">
							{t.metricPolicy}
						</CardDescription>
						<CardTitle className="text-2xl font-bold">
							{recentDecisions.length} {t.metricPolicyDecisions}
						</CardTitle>
					</CardHeader>
					<CardContent className="text-xs text-muted-foreground">
						{recentDecisions.filter((d) => !d.approved).length}{" "}
						{t.metricPolicyFailClosed}
					</CardContent>
				</Card>
			</div>

			{/* Accessible Navigation Tabs */}
			<div
				role="tablist"
				aria-label={t.title}
				className="mb-4 flex items-center gap-2 border-b border-border pb-2"
				onKeyDown={handleTabsKeyDown}
			>
				<Button
					role="tab"
					id="lens-tab-evidence"
					aria-controls="lens-tabpanel-evidence"
					aria-selected={activeTab === "evidence"}
					tabIndex={activeTab === "evidence" ? 0 : -1}
					variant={activeTab === "evidence" ? "default" : "ghost"}
					size="sm"
					onClick={() => setActiveTab("evidence")}
				>
					<FileText className="mr-1.5 h-4 w-4" />
					{t.tabEvidence} ({bundles.length})
				</Button>
				<Button
					role="tab"
					id="lens-tab-policy"
					aria-controls="lens-tabpanel-policy"
					aria-selected={activeTab === "policy"}
					tabIndex={activeTab === "policy" ? 0 : -1}
					variant={activeTab === "policy" ? "default" : "ghost"}
					size="sm"
					onClick={() => setActiveTab("policy")}
				>
					<ShieldCheck className="mr-1.5 h-4 w-4" />
					{t.tabPolicy} ({auditTrail.length})
				</Button>
			</div>

			{/* Tab 1: Evidence Bundles */}
			<div
				role="tabpanel"
				id="lens-tabpanel-evidence"
				aria-labelledby="lens-tab-evidence"
				hidden={activeTab !== "evidence"}
			>
				{activeTab === "evidence" ? (
					bundles.length === 0 ? (
						<PageEmptyState className="py-12 text-center">
							<BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
							<h3 className="text-base font-medium text-foreground">
								{t.emptyBundlesTitle}
							</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								{t.emptyBundlesDesc}
							</p>
						</PageEmptyState>
					) : (
						<div className="space-y-4">
							{bundles.map((bundle) => (
								<Card
									key={bundle.digest}
									className="overflow-hidden border-border"
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
														{t.digestLabel}: {bundle.digest.slice(0, 12)}…
													</Badge>
												</CardTitle>
												<CardDescription className="mt-1 flex items-center gap-2 text-xs">
													<Clock3 className="h-3 w-3" />
													<span>
														{t.createdLabel}:{" "}
														{new Date(bundle.createdAt).toLocaleString()}
													</span>
												</CardDescription>
											</div>
											<Badge
												variant="secondary"
												className="px-2.5 py-1 text-xs font-mono"
											>
												{bundle.claimCount} {t.claimsVerified}
											</Badge>
										</div>
									</CardHeader>
									<CardContent className="pt-4">
										<div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-foreground">
											<div className="flex items-center gap-1.5 font-medium mb-1">
												<ShieldAlert className="h-3.5 w-3.5 text-foreground" />
												<span>{t.zeroTrustContract}</span>
												<Badge
													variant="outline"
													className="ml-auto font-mono text-[10px] border-border bg-background"
												>
													{b.untrustedBadgeExact}
												</Badge>
											</div>
											<p className="text-muted-foreground leading-relaxed">
												{t.zeroTrustExplanation}
											</p>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)
				) : null}
			</div>

			{/* Tab 2: Policy & Grants Audit */}
			<div
				role="tabpanel"
				id="lens-tabpanel-policy"
				aria-labelledby="lens-tab-policy"
				hidden={activeTab !== "policy"}
			>
				{activeTab === "policy" ? (
					<div className="space-y-6">
						<div>
							<h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
								<ShieldCheck className="h-4 w-4 text-foreground" />
								{t.recentDecisionsTitle}
							</h3>
							{recentDecisions.length === 0 ? (
								<PageEmptyState>{t.emptyDecisions}</PageEmptyState>
							) : (
								<div className="space-y-2">
									{recentDecisions.map((decision) => (
										<div
											key={decision.toolCallId}
											className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-3 text-sm"
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
												variant={
													decision.approved ? "secondary" : "destructive"
												}
												className="shrink-0 font-mono text-[11px]"
											>
												{decision.approved ? t.approvedBadge : t.deniedBadge}
											</Badge>
										</div>
									))}
								</div>
							)}
						</div>

						<div>
							<h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
								<Clock3 className="h-4 w-4 text-foreground" />
								{t.auditTrailTitle}
							</h3>
							{auditTrail.length === 0 ? (
								<PageEmptyState>{t.emptyAudit}</PageEmptyState>
							) : (
								<div className="space-y-1.5 font-mono text-xs">
									{auditTrail.map((record) => (
										<div
											key={record.seq}
											className="rounded border border-border bg-muted/20 p-2 text-muted-foreground"
										>
											<span className="text-foreground font-semibold">
												#{record.seq}
											</span>{" "}
											<span className="text-foreground/80">
												[{record.kind}]
											</span>{" "}
											<span className="text-foreground font-medium">
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
			</div>
		</PageFrame>
	);
}
