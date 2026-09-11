/**
 * Antigravity 2 Planning & Walkthrough Subsystem Tests
 */

import type {
	AgentBeforeToolContext,
	AgentRuntimeStateSnapshot,
	AgentTool,
} from "@cline/shared";
import { describe, expect, it } from "vitest";
import { parseImplementationPlan, parseWalkthrough } from "./parser";
import {
	createPlanGateExtension,
	isMutatingTool,
	PLAN_GATE_EXTENSION_NAME,
	PLAN_MODE_MUTATION_ERROR,
} from "./plan-gate-extension";

function makeBeforeToolContext(
	toolName: string,
	input: unknown = {},
): AgentBeforeToolContext {
	return {
		snapshot: {
			agentId: "test-agent",
			conversationId: "test-conv",
			runId: "test-run",
			iteration: 1,
			status: "running",
			messages: [],
			pendingToolCalls: [],
			usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
		} as unknown as AgentRuntimeStateSnapshot,
		tool: { name: toolName } as AgentTool,
		toolCall: {
			type: "tool-call",
			toolCallId: "call-1",
			toolName,
			input,
		},
		input,
	};
}

describe("parseImplementationPlan", () => {
	it("parses full Antigravity 2 implementation plan markdown", () => {
		const markdown = `# Implementation Plan: Refactor Auth Subsystem

Brief background about auth changes.

## User Review Required
> [!IMPORTANT]
> This changes the token storage format.
- Migration required for existing sessions.

## Open Questions
- Should we keep backward compatibility with v1 tokens?

## Proposed Changes
Grouped by component:

### Core SDK
#### [MODIFY] [auth.ts](file:///src/auth.ts)
#### [NEW] [token.ts](file:///src/token.ts)

### CLI
#### [DELETE] [legacy-auth.ts](file:///src/cli/legacy-auth.ts)

## Verification Plan
### Automated Tests
- bun test sdk/packages/core/src/auth.test.ts
- bun run typecheck

### Manual Verification
- Start desktop app and confirm login session token is persisted.
`;

		const plan = parseImplementationPlan(markdown);
		expect(plan).not.toBeNull();
		expect(plan?.goal).toBe("Implementation Plan: Refactor Auth Subsystem");
		expect(plan?.status).toBe("pending_approval");
		expect(plan?.userReviewRequired).toHaveLength(2);
		expect(plan?.openQuestions).toHaveLength(1);
		expect(plan?.proposedChanges).toHaveLength(3);
		expect(plan?.proposedChanges[0]).toEqual({
			action: "modify",
			file: "src/auth.ts",
			component: "Core SDK",
		});
		expect(plan?.proposedChanges[1]).toEqual({
			action: "new",
			file: "src/token.ts",
			component: "Core SDK",
		});
		expect(plan?.proposedChanges[2]).toEqual({
			action: "delete",
			file: "src/cli/legacy-auth.ts",
			component: "CLI",
		});
		expect(plan?.verificationPlan.automated).toEqual([
			"bun test sdk/packages/core/src/auth.test.ts",
			"bun run typecheck",
		]);
		expect(plan?.verificationPlan.manual).toEqual([
			"Start desktop app and confirm login session token is persisted.",
		]);
		expect(plan?.metadata?.RequestFeedback).toBe(true);
		expect(plan?.metadata?.UserFacing).toBe(true);
	});

	it("returns null for non-plan markdown", () => {
		expect(parseImplementationPlan("Just some ordinary markdown")).toBeNull();
		expect(
			parseImplementationPlan("# Random Title\n\nSome paragraph text"),
		).toBeNull();
		// Lacking Proposed Changes section
		expect(
			parseImplementationPlan(
				"# Implementation Plan\n\n## User Review Required\n- Check this",
			),
		).toBeNull();
		// Lacking User Review Required section
		expect(
			parseImplementationPlan(
				"# Implementation Plan\n\n## Proposed Changes\n#### [MODIFY] a.ts",
			),
		).toBeNull();
		// Lacking plan heading
		expect(
			parseImplementationPlan(
				"# Normal Conversation\n\n## User Review Required\n- Note\n\n## Proposed Changes\n#### [MODIFY] a.ts",
			),
		).toBeNull();
	});

	it("extracts bare file paths when markdown links are omitted", () => {
		const markdown = `# Implementation Plan: Refactor
## User Review Required
- Note on tokens
## Proposed Changes
### Backend
#### [NEW] [src/server.ts]
#### [MODIFY] src/router.ts
`;
		const plan = parseImplementationPlan(markdown);
		expect(plan).not.toBeNull();
		expect(plan?.proposedChanges).toHaveLength(2);
		expect(plan?.proposedChanges[0].file).toBe("src/server.ts");
		expect(plan?.proposedChanges[1].file).toBe("src/router.ts");
	});

	it("extracts only the matched artifact range for rawMarkdown", () => {
		const markdown = `Here is my recommendation:

# Implementation Plan: Targeted Change

## User Review Required
- Please review API change

## Proposed Changes
### Core
#### [MODIFY] [core.ts](file:///core.ts)

Please let me know if you approve this plan.`;

		const plan = parseImplementationPlan(markdown);
		expect(plan).not.toBeNull();
		expect(plan?.rawMarkdown).not.toContain("Here is my recommendation:");
		expect(plan?.rawMarkdown).not.toContain(
			"Please let me know if you approve this plan.",
		);
		expect(plan?.rawMarkdown).toContain(
			"# Implementation Plan: Targeted Change",
		);
		expect(plan?.rawMarkdown).toContain(
			"#### [MODIFY] [core.ts](file:///core.ts)",
		);
	});
});

describe("parseWalkthrough", () => {
	it("parses full walkthrough artifact markdown", () => {
		const markdown = `# Walkthrough - Refactor Auth Subsystem

## Changes Made
- Updated token signing logic in src/auth.ts
- Removed legacy authentication helpers

## Verification Results
- All unit tests passed (12/12)
- Manual login verified against staging server
`;

		const walkthrough = parseWalkthrough(markdown);
		expect(walkthrough).not.toBeNull();
		expect(walkthrough?.title).toBe("Walkthrough - Refactor Auth Subsystem");
		expect(walkthrough?.changesMade).toHaveLength(2);
		expect(walkthrough?.verificationResults).toHaveLength(2);
	});

	it("returns null for non-walkthrough markdown", () => {
		expect(parseWalkthrough("Random markdown text")).toBeNull();
		expect(parseWalkthrough("# Regular Title\n\nParagraph text")).toBeNull();
	});
});

describe("createPlanGateExtension & isMutatingTool", () => {
	it("registers with hooks capability", () => {
		const extension = createPlanGateExtension({ mode: "plan" });
		expect(extension.name).toBe(PLAN_GATE_EXTENSION_NAME);
		expect(extension.manifest?.capabilities).toContain("hooks");
		expect(extension.hooks?.beforeTool).toBeTypeOf("function");
	});

	it("correctly identifies mutating vs read-only tools", () => {
		expect(isMutatingTool("editor")).toBe(true);
		expect(isMutatingTool("apply_patch")).toBe(true);
		expect(isMutatingTool("write_file")).toBe(true);
		expect(isMutatingTool("mcp_fs_delete_file")).toBe(true);

		expect(isMutatingTool("read_files")).toBe(false);
		expect(isMutatingTool("grep_search")).toBe(false);
		expect(isMutatingTool("mcp_fs_read_file")).toBe(false);
		expect(isMutatingTool("mcp_server_list_tables")).toBe(false);
		expect(isMutatingTool("switch_to_act_mode")).toBe(false);
	});

	it("blocks editor in plan mode", async () => {
		const extension = createPlanGateExtension({ mode: "plan" });
		const result = await extension.hooks?.beforeTool?.(
			makeBeforeToolContext("editor", { path: "test.ts" }),
		);
		expect(result && "skip" in result ? result.skip : false).toBe(true);
		expect(result && "reason" in result ? result.reason : undefined).toBe(
			PLAN_MODE_MUTATION_ERROR,
		);
	});

	it("blocks mutating MCP tools in plan mode", async () => {
		const extension = createPlanGateExtension({ mode: "plan" });
		const result = await extension.hooks?.beforeTool?.(
			makeBeforeToolContext("mcp_server_write_data", { path: "test.ts" }),
		);
		expect(result && "skip" in result ? result.skip : false).toBe(true);
		expect(result && "reason" in result ? result.reason : undefined).toBe(
			PLAN_MODE_MUTATION_ERROR,
		);
	});

	it("allows read_files and read-only MCP tools in plan mode", async () => {
		const extension = createPlanGateExtension({ mode: "plan" });
		const result1 = await extension.hooks?.beforeTool?.(
			makeBeforeToolContext("read_files", { paths: ["test.ts"] }),
		);
		expect(result1).toBeUndefined();

		const result2 = await extension.hooks?.beforeTool?.(
			makeBeforeToolContext("mcp_server_read_data", { path: "test.ts" }),
		);
		expect(result2).toBeUndefined();
	});

	it("allows editor in act mode", async () => {
		const extension = createPlanGateExtension({ mode: "act" });
		const result = await extension.hooks?.beforeTool?.(
			makeBeforeToolContext("editor", { path: "test.ts" }),
		);
		expect(result).toBeUndefined();
	});
});
