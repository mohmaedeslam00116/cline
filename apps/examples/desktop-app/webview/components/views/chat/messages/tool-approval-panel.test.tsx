// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	AUTONOMOUS_MUTATING_TOOLS,
	getGrantCheckpointStatus,
	PHASE1_READ_ONLY_TOOLS,
	resolveCheckpoint,
	ToolApprovalPanel,
	type ToolApprovalRequestItem,
} from "./tool-approval-panel";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.restoreAllMocks();
});

describe("getGrantCheckpointStatus", () => {
	it("returns read_only status for Phase-1 read-only tools", () => {
		for (const tool of PHASE1_READ_ONLY_TOOLS) {
			const cp = getGrantCheckpointStatus(tool);
			expect(cp.status).toBe("read_only");
			expect(cp.isAllowed).toBe(true);
			expect(cp.capability).toBe("READ_ONLY_INSPECTION");
			expect(cp.badgeVariant).toBe("secondary");
		}
	});

	it("returns mutating_allowed for autonomous coding tools (editor, apply_patch, run_commands)", () => {
		for (const tool of AUTONOMOUS_MUTATING_TOOLS) {
			const cp = getGrantCheckpointStatus(tool);
			expect(cp.status).toBe("mutating_allowed");
			expect(cp.isAllowed).toBe(true);
			expect(cp.badgeVariant).toBe("default");
			if (tool === "run_commands") {
				expect(cp.capability).toBe("RESTRICTED_TERMINAL_COMMAND");
				expect(cp.label).toBe("Terminal Command");
			} else {
				expect(cp.capability).toBe("MUTATING_FILE_WRITE");
				expect(cp.label).toBe("File Modification");
			}
		}
	});

	it("returns mutating_denied for unauthorized tools", () => {
		for (const tool of ["write_to_file", "execute_command", "arbitrary_tool"]) {
			const cp = getGrantCheckpointStatus(tool);
			expect(cp.status).toBe("mutating_denied");
			expect(cp.isAllowed).toBe(false);
			expect(cp.badgeVariant).toBe("destructive");
			expect(cp.label).toBe("Mutation Blocked");
		}
	});
});

describe("resolveCheckpoint", () => {
	it("resolves from checkpoint metadata when present", () => {
		const item: ToolApprovalRequestItem = {
			requestId: "req-1",
			sessionId: "sess-1",
			createdAt: new Date().toISOString(),
			toolCallId: "call-1",
			toolName: "editor",
			checkpoint: {
				capability: "MUTATING_FILE_WRITE",
				isAllowed: true,
				label: "File Modification",
			},
		};
		const resolved = resolveCheckpoint(item);
		expect(resolved.status).toBe("mutating_allowed");
		expect(resolved.isAllowed).toBe(true);
		expect(resolved.badgeVariant).toBe("default");
		expect(resolved.capability).toBe("MUTATING_FILE_WRITE");
		expect(resolved.label).toBe("File Modification");
	});

	it("falls back to getGrantCheckpointStatus when item checkpoint is absent", () => {
		const item: ToolApprovalRequestItem = {
			requestId: "req-2",
			sessionId: "sess-1",
			createdAt: new Date().toISOString(),
			toolCallId: "call-2",
			toolName: "run_commands",
		};
		const resolved = resolveCheckpoint(item);
		expect(resolved.status).toBe("mutating_allowed");
		expect(resolved.capability).toBe("RESTRICTED_TERMINAL_COMMAND");
	});

	it("rejects string boolean values such as 'false' or 'true' and falls back to safe default", () => {
		const itemStringFalse: ToolApprovalRequestItem = {
			requestId: "req-str-false",
			sessionId: "sess-1",
			createdAt: new Date().toISOString(),
			toolCallId: "call-str-false",
			toolName: "write_to_file",
			checkpoint: {
				capability: "MUTATING_FILE_WRITE",
				isAllowed: "false",
				label: "Allowed String",
			},
		};
		const resolvedFalse = resolveCheckpoint(itemStringFalse);
		expect(resolvedFalse.status).toBe("mutating_denied");
		expect(resolvedFalse.isAllowed).toBe(false);
		expect(resolvedFalse.badgeVariant).toBe("destructive");
		expect(resolvedFalse.label).toBe("Mutation Blocked");

		const itemStringTrue: ToolApprovalRequestItem = {
			requestId: "req-str-true",
			sessionId: "sess-1",
			createdAt: new Date().toISOString(),
			toolCallId: "call-str-true",
			toolName: "write_to_file",
			checkpoint: {
				capability: "MUTATING_FILE_WRITE",
				isAllowed: "true",
				label: "Allowed String",
			},
		};
		const resolvedTrue = resolveCheckpoint(itemStringTrue);
		expect(resolvedTrue.status).toBe("mutating_denied");
		expect(resolvedTrue.isAllowed).toBe(false);
	});

	it("rejects mismatched capabilities and falls back to safe default", () => {
		const itemMismatched: ToolApprovalRequestItem = {
			requestId: "req-mismatch",
			sessionId: "sess-1",
			createdAt: new Date().toISOString(),
			toolCallId: "call-mismatch",
			toolName: "editor",
			checkpoint: {
				capability: "READ_ONLY_INSPECTION",
				isAllowed: true,
				label: "Spoofed Read-Only",
			},
		};
		const resolved = resolveCheckpoint(itemMismatched);
		expect(resolved.status).toBe("mutating_allowed");
		expect(resolved.capability).toBe("MUTATING_FILE_WRITE");
		expect(resolved.label).toBe("File Modification");

		const itemMismatchedCmd: ToolApprovalRequestItem = {
			requestId: "req-mismatch-cmd",
			sessionId: "sess-1",
			createdAt: new Date().toISOString(),
			toolCallId: "call-mismatch-cmd",
			toolName: "run_commands",
			checkpoint: {
				capability: "MUTATING_FILE_WRITE",
				isAllowed: true,
			},
		};
		const resolvedCmd = resolveCheckpoint(itemMismatchedCmd);
		expect(resolvedCmd.status).toBe("mutating_allowed");
		expect(resolvedCmd.capability).toBe("RESTRICTED_TERMINAL_COMMAND");
	});
});

describe("ToolApprovalPanel component", () => {
	it("renders autonomous mutating tool approval card without failClosed warning", async () => {
		const onApprove = vi.fn();
		const onReject = vi.fn();
		const item: ToolApprovalRequestItem = {
			requestId: "req-editor-1",
			sessionId: "sess-1",
			createdAt: new Date().toISOString(),
			toolCallId: "call-editor-1",
			toolName: "editor",
			input: { path: "src/index.ts", content: "console.log('hello')" },
		};

		await act(async () => {
			root.render(
				<ToolApprovalPanel
					items={[item]}
					pendingActions={{}}
					requestErrors={{}}
					onApprove={onApprove}
					onReject={onReject}
				/>,
			);
		});

		expect(container.textContent).toContain("editor");
		expect(container.textContent).toContain("MUTATING_FILE_WRITE");
		expect(container.textContent).toContain("File Modification");
		expect(container.textContent).not.toContain("Phase-1 Fail Closed");

		// Find approve and reject buttons
		const buttons = container.querySelectorAll("button");
		expect(buttons.length).toBeGreaterThanOrEqual(2);

		// Click approve
		const approveBtn = Array.from(buttons).find((b) =>
			b.textContent?.includes("Approve"),
		);
		expect(approveBtn).toBeDefined();
		await act(async () => {
			approveBtn?.click();
		});
		expect(onApprove).toHaveBeenCalledWith("req-editor-1");
	});

	it("renders run_commands with Terminal Command badge", async () => {
		const onApprove = vi.fn();
		const onReject = vi.fn();
		const item: ToolApprovalRequestItem = {
			requestId: "req-cmd-1",
			sessionId: "sess-1",
			createdAt: new Date().toISOString(),
			toolCallId: "call-cmd-1",
			toolName: "run_commands",
			input: { command: "bun test" },
		};

		await act(async () => {
			root.render(
				<ToolApprovalPanel
					items={[item]}
					pendingActions={{}}
					requestErrors={{}}
					onApprove={onApprove}
					onReject={onReject}
				/>,
			);
		});

		expect(container.textContent).toContain("run_commands");
		expect(container.textContent).toContain("RESTRICTED_TERMINAL_COMMAND");
		expect(container.textContent).toContain("Terminal Command");
		expect(container.textContent).not.toContain("Phase-1 Fail Closed");
	});
});
