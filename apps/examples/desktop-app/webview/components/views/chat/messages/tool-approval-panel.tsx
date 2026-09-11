"use client";

import { AgentApprovalCard } from "@cline/ui";
import { Clock3, ShieldAlert, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { getLensTranslations } from "@/lib/lens-i18n";

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
	checkpoint?: unknown;
};

export const PHASE1_READ_ONLY_TOOLS = new Set([
	"read_file",
	"list_files",
	"search_files",
	"list_code_definition_names",
	"search_symbols",
	"get_evidence_detail",
]);

export const AUTONOMOUS_MUTATING_TOOLS = new Set([
	"editor",
	"apply_patch",
	"run_commands",
]);

export interface GrantCheckpoint {
	readonly status: "read_only" | "mutating_allowed" | "mutating_denied";
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
	if (AUTONOMOUS_MUTATING_TOOLS.has(toolName)) {
		return {
			status: "mutating_allowed",
			label:
				toolName === "run_commands" ? "Terminal Command" : "File Modification",
			capability:
				toolName === "run_commands"
					? "RESTRICTED_TERMINAL_COMMAND"
					: "MUTATING_FILE_WRITE",
			isAllowed: true,
			badgeVariant: "default",
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

export function expectedCapabilityForTool(toolName: string): string {
	if (toolName === "run_commands" || toolName === "execute_command") {
		return "RESTRICTED_TERMINAL_COMMAND";
	}
	if (AUTONOMOUS_MUTATING_TOOLS.has(toolName) || toolName === "write_to_file") {
		return "MUTATING_FILE_WRITE";
	}
	return "READ_ONLY_INSPECTION";
}

export function resolveCheckpoint(
	item: ToolApprovalRequestItem,
): GrantCheckpoint {
	if (
		item.checkpoint &&
		typeof item.checkpoint === "object" &&
		!Array.isArray(item.checkpoint)
	) {
		const cp = item.checkpoint as Record<string, unknown>;
		const rawAllowed =
			typeof cp.isAllowed === "boolean"
				? cp.isAllowed
				: typeof cp.allowed === "boolean"
					? cp.allowed
					: null;
		const capability =
			typeof cp.capability === "string" ? cp.capability.trim() : null;

		if (
			rawAllowed !== null &&
			capability !== null &&
			capability === expectedCapabilityForTool(item.toolName)
		) {
			const isAllowed = rawAllowed;
			const isMutating = AUTONOMOUS_MUTATING_TOOLS.has(item.toolName);
			return {
				status: isAllowed
					? isMutating
						? "mutating_allowed"
						: "read_only"
					: "mutating_denied",
				label:
					typeof cp.label === "string"
						? cp.label
						: isAllowed
							? isMutating
								? item.toolName === "run_commands"
									? "Terminal Command"
									: "File Modification"
								: "Read-Only Inspection"
							: "Mutation Blocked",
				capability,
				isAllowed,
				badgeVariant: isAllowed
					? isMutating
						? "default"
						: "secondary"
					: "destructive",
			};
		}
	}
	return getGrantCheckpointStatus(item.toolName);
}

export function formatApprovalTimestamp(
	raw: string,
	pendingNowText = "Pending now",
): string {
	const parsed = new Date(raw);
	if (Number.isNaN(parsed.getTime())) {
		return pendingNowText;
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
	const translations = useMemo(() => getLensTranslations(), []);
	const t = translations.toolApproval;

	return (
		<section className="rounded-xl border border-border bg-card p-3 shadow-xs">
			<div className="flex items-center gap-2 text-sm font-medium text-foreground">
				<ShieldAlert className="h-4 w-4 text-foreground" />
				{t.title}
			</div>
			<p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
			<div className="mt-3 flex flex-col gap-2">
				{items.map((item) => {
					const pendingAction = pendingActions[item.requestId];
					const error = requestErrors[item.requestId];
					const checkpoint = resolveCheckpoint(item);
					return (
						<AgentApprovalCard
							description={
								<div className="space-y-1">
									<div>
										{t.request} {item.requestId}
										{item.iteration != null
											? ` · ${t.iteration} ${item.iteration}`
											: ""}
									</div>
									<div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
										<span className="font-medium text-foreground/80">
											{t.grantCheckpoint}
										</span>
										<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">
											{checkpoint.capability}
										</code>
										{!checkpoint.isAllowed && (
											<span className="font-medium text-destructive">
												{t.failClosed}
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
									{formatApprovalTimestamp(item.createdAt, t.pendingNow)}
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
											<ShieldCheck className="mr-0.5 h-3 w-3 text-foreground inline" />
										) : null}
										{checkpoint.status === "mutating_allowed"
											? item.toolName === "run_commands"
												? t.terminalExecution
												: t.fileModification
											: checkpoint.isAllowed
												? t.readOnlyInspection
												: t.mutationBlocked}
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
