"use client";

import { AgentApprovalCard } from "@cline/ui";
import { Clock3, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ToolApprovalRequestItem = {
	requestId: string;
	sessionId: string;
	createdAt: string;
	toolCallId: string;
	toolName: string;
	input?: unknown;
	iteration?: number;
	agentId?: string;
	conversationId?: string;
};

export const PHASE1_READ_ONLY_TOOLS = new Set([
	"read_file",
	"list_files",
	"search_files",
	"list_code_definition_names",
	"search_symbols",
	"get_evidence_detail",
]);

export interface GrantCheckpoint {
	readonly status: "read_only" | "mutating_denied";
	readonly label: string;
	readonly capability: string;
	readonly isAllowed: boolean;
	readonly badgeVariant: "default" | "destructive" | "outline" | "secondary";
}

export function getGrantCheckpointStatus(toolName: string): GrantCheckpoint {
	if (PHASE1_READ_ONLY_TOOLS.has(toolName)) {
		return {
			status: "read_only",
			label: "Read-Only Inspection",
			capability: "READ_ONLY_INSPECTION",
			isAllowed: true,
			badgeVariant: "secondary",
		};
	}
	return {
		status: "mutating_denied",
		label: "Mutation Blocked",
		capability:
			toolName === "execute_command"
				? "RESTRICTED_TERMINAL_COMMAND"
				: "MUTATING_FILE_WRITE",
		isAllowed: false,
		badgeVariant: "destructive",
	};
}

export function formatApprovalTimestamp(raw: string): string {
	const parsed = new Date(raw);
	if (Number.isNaN(parsed.getTime())) {
		return "Pending now";
	}
	return parsed.toLocaleString();
}

function formatApprovalInput(input: unknown): string {
	if (input == null) {
		return "{}";
	}
	if (typeof input === "string") {
		return input;
	}
	try {
		return JSON.stringify(input, null, 2);
	} catch {
		return String(input);
	}
}

export function ToolApprovalPanel({
	items,
	pendingActions,
	requestErrors,
	onApprove,
	onReject,
}: {
	items: ToolApprovalRequestItem[];
	pendingActions: Record<string, "approving" | "rejecting">;
	requestErrors: Record<string, string>;
	onApprove: (requestId: string) => void;
	onReject: (requestId: string) => void;
}) {
	return (
		<section className="rounded-xl border border-amber-400/40 bg-amber-500/5 p-3">
			<div className="flex items-center gap-2 text-sm font-medium text-foreground">
				<ShieldAlert className="h-4 w-4 text-amber-500" />
				Tool approval required
			</div>
			<p className="mt-1 text-xs text-muted-foreground">
				Review each tool call and policy grant checkpoint before execution.
			</p>
			<div className="mt-3 flex flex-col gap-2">
				{items.map((item) => {
					const pendingAction = pendingActions[item.requestId];
					const error = requestErrors[item.requestId];
					const checkpoint = getGrantCheckpointStatus(item.toolName);
					return (
						<AgentApprovalCard
							description={
								<div className="space-y-1">
									<div>
										Request {item.requestId}
										{item.iteration != null
											? ` · Iteration ${item.iteration}`
											: ""}
									</div>
									<div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
										<span className="font-medium text-foreground/80">
											Grant Checkpoint:
										</span>
										<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">
											{checkpoint.capability}
										</code>
										{!checkpoint.isAllowed && (
											<span className="font-medium text-destructive">
												(Phase-1 Fail Closed)
											</span>
										)}
									</div>
								</div>
							}
							detail={formatApprovalInput(item.input)}
							error={error}
							key={item.requestId}
							meta={
								<>
									<Clock3 className="h-3 w-3" />
									{formatApprovalTimestamp(item.createdAt)}
								</>
							}
							onApprove={() => onApprove(item.requestId)}
							onReject={() => onReject(item.requestId)}
							responding={
								pendingAction === "approving"
									? "approve"
									: pendingAction === "rejecting"
										? "reject"
										: undefined
							}
							title={
								<div className="flex flex-wrap items-center gap-2">
									<span>{item.toolName}</span>
									<Badge
										variant={checkpoint.badgeVariant}
										className="px-1.5 py-0 text-[10px] font-normal"
									>
										{checkpoint.isAllowed ? (
											<ShieldCheck className="mr-0.5 h-3 w-3 text-emerald-500 inline" />
										) : null}
										{checkpoint.label}
									</Badge>
								</div>
							}
						/>
					);
				})}
			</div>
		</section>
	);
}
