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
		const markdown = `# Refactor Auth Subsystem

Brief background about auth changes.

## User Review Required
> [!IMPORTANT]
> This changes the token storage format.
- Migration required for existing sessions.

## Open Questions
- Should we keep backward compatibility with v1 tokens?

## Proposed Changes
Grouped by component:

### Core Auth
#### [MODIFY] [auth-service.ts](file:///d:/src/auth-service.ts)
#### [NEW] [token-store.ts](file:///d:/src/token-store.ts)
#### [DELETE] [legacy-auth.ts](file:///d:/src/legacy-auth.ts)

## Verification Plan
### Automated Tests
- bun vitest run auth.test.ts
- bun run typecheck

### Manual Verification
- Log in with test user credentials
`;

		const plan = parseImplementationPlan(markdown);
		expect(plan).not.toBeNull();
		expect(plan?.goal).toBe("Refactor Auth Subsystem");
		expect(plan?.status).toBe("pending_approval");

		// User Review Required
		expect(plan?.userReviewRequired.length).toBeGreaterThan(0);
		expect(
			plan?.userReviewRequired.some((line) =>
				line.includes("changes the token storage format"),
			),
		).toBe(true);

		// Open Questions
		expect(plan?.openQuestions.length).toBe(1);
		expect(plan?.openQuestions[0]).toContain("backward compatibility");

		// Proposed Changes
		expect(plan?.proposedChanges).toEqual([
			{
				action: "modify",
				file: "d:/src/auth-service.ts",
				component: "Core Auth",
			},
			{
				action: "new",
				file: "d:/src/token-store.ts",
				component: "Core Auth",
			},
			{
				action: "delete",
				file: "d:/src/legacy-auth.ts",
				component: "Core Auth",
			},
		]);

		// Verification Plan
		expect(plan?.verificationPlan.automated).toEqual([
			"bun vitest run auth.test.ts",
			"bun run typecheck",
		]);
		expect(plan?.verificationPlan.manual).toEqual([
			"Log in with test user credentials",
		]);
	});

	it("returns null for non-plan markdown", () => {
		expect(parseImplementationPlan("Just a casual chat message.")).toBeNull();
		expect(parseImplementationPlan("")).toBeNull();
		expect(parseImplementationPlan("# Random Title\nSome text")).toBeNull();
	});

	it("extracts bare file paths when markdown links are omitted", () => {
		const markdown = `# Implementation Plan
## Proposed Changes
#### [NEW] src/new-file.ts
#### [MODIFY] src/old-file.ts
`;
		const plan = parseImplementationPlan(markdown);
		expect(plan).not.toBeNull();
		expect(plan?.proposedChanges).toHaveLength(2);
		expect(plan?.proposedChanges[0]).toEqual({
			action: "new",
			file: "src/new-file.ts",
			component: undefined,
		});
		expect(plan?.proposedChanges[1]).toEqual({
			action: "modify",
			file: "src/old-file.ts",
			component: undefined,
		});
	});
});

describe("parseWalkthrough", () => {
	it("parses full walkthrough artifact markdown", () => {
		const markdown = `# Walkthrough - Auth Refactor

## Changes Made
- Migrated token storage to encrypted SQLite
- Added token rotation middleware

## Verification Results
- 15 unit tests passed
- Manual token refresh verified
`;

		const walkthrough = parseWalkthrough(markdown);
		expect(walkthrough).not.toBeNull();
		expect(walkthrough?.title).toBe("Walkthrough - Auth Refactor");
		expect(walkthrough?.changesMade.length).toBe(2);
		expect(walkthrough?.changesMade[0]).toContain("Migrated token storage");
		expect(walkthrough?.verificationResults.length).toBe(2);
		expect(walkthrough?.verificationResults[0]).toContain(
			"15 unit tests passed",
		);
	});

	it("returns null for non-walkthrough markdown", () => {
		expect(parseWalkthrough("Just some notes")).toBeNull();
		expect(parseWalkthrough("# Notes on project\nDetail here")).toBeNull();
	});
});

describe("createPlanGateExtension", () => {
	it("registers with hooks capability", () => {
		const extension = createPlanGateExtension({ mode: "plan" });
		expect(extension.name).toBe(PLAN_GATE_EXTENSION_NAME);
		expect(extension.manifest?.capabilities).toContain("hooks");
		expect(extension.hooks?.beforeTool).toBeTypeOf("function");
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

	it("blocks apply_patch in plan mode", async () => {
		const extension = createPlanGateExtension({ mode: "plan" });
		const result = await extension.hooks?.beforeTool?.(
			makeBeforeToolContext("apply_patch", { input: "patch" }),
		);
		expect(result && "skip" in result ? result.skip : false).toBe(true);
		expect(result && "reason" in result ? result.reason : undefined).toBe(
			PLAN_MODE_MUTATION_ERROR,
		);
	});

	it("allows read_files in plan mode", async () => {
		const extension = createPlanGateExtension({ mode: "plan" });
		const result = await extension.hooks?.beforeTool?.(
			makeBeforeToolContext("read_files", { paths: ["test.ts"] }),
		);
		expect(result).toBeUndefined();
	});

	it("allows editor in act mode", async () => {
		const extension = createPlanGateExtension({ mode: "act" });
		const result = await extension.hooks?.beforeTool?.(
			makeBeforeToolContext("editor", { path: "test.ts" }),
		);
		expect(result).toBeUndefined();
	});
});
