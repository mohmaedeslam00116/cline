/**
 * Antigravity 2 Plan Gate Extension
 *
 * Enforces the plan review gate in Plan mode and manages the transition
 * to implementation upon user approval.
 */

import type {
	AgentBeforeToolContext,
	AgentBeforeToolResult,
	AgentExtension,
} from "@cline/shared";
import type { PlanGateOptions } from "./types";

export const PLAN_GATE_EXTENSION_NAME = "core.plan-gate";

export const PLAN_MODE_MUTATION_ERROR =
	"File modification is blocked in Plan mode. Please formulate an implementation_plan.md and wait for user approval (Proceed button) before executing changes.";

export function createPlanGateExtension(
	options: PlanGateOptions = {},
): AgentExtension {
	const beforeTool = (
		context: AgentBeforeToolContext,
	): AgentBeforeToolResult | undefined => {
		const toolName = context.tool.name;

		// In plan mode, hard-block mutating editor and apply_patch tools
		if (options.mode === "plan") {
			if (toolName === "editor" || toolName === "apply_patch") {
				return {
					skip: true,
					reason: PLAN_MODE_MUTATION_ERROR,
				};
			}
		}

		return undefined;
	};

	return {
		name: PLAN_GATE_EXTENSION_NAME,
		manifest: {
			capabilities: ["hooks"],
		},
		hooks: {
			beforeTool,
		},
	};
}
