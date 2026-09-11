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
	"File modification and state-changing actions are blocked in Plan mode. Please formulate an implementation_plan.md and wait for user approval (Proceed button) before executing changes.";

/**
 * Trusted read-only tool names permitted in plan mode.
 */
export const PLAN_MODE_READ_ONLY_TOOLS = new Set([
	"read_files",
	"directory_list",
	"file_search",
	"list_dir",
	"view_file",
	"grep_search",
	"find_by_name",
	"search_web",
	"read_url_content",
	"read_browser_page",
	"ask_question",
	"read_resource",
	"list_resources",
	"switch_to_act_mode",
]);

/**
 * Determine whether a tool is mutating based on allowlists and read-only prefixes.
 */
export function isMutatingTool(toolName: string): boolean {
	if (PLAN_MODE_READ_ONLY_TOOLS.has(toolName)) {
		return false;
	}

	const lower = toolName.toLowerCase();
	const readOnlyPrefixes = [
		"read_",
		"list_",
		"get_",
		"view_",
		"search_",
		"find_",
		"check_",
		"inspect_",
	];

	if (readOnlyPrefixes.some((prefix) => lower.startsWith(prefix))) {
		return false;
	}

	// For double-underscore scoped tools (e.g. server__read_file)
	if (lower.includes("__")) {
		const parts = lower.split("__");
		const afterDouble = parts[parts.length - 1];
		if (
			afterDouble &&
			readOnlyPrefixes.some((prefix) => afterDouble.startsWith(prefix))
		) {
			return false;
		}
	}

	// For underscore-delimited scoped tools (e.g. mcp_fs_read_file)
	if (lower.includes("_")) {
		const parts = lower.split("_");
		for (let i = 1; i < parts.length; i++) {
			const sub = parts.slice(i).join("_");
			if (readOnlyPrefixes.some((prefix) => sub.startsWith(prefix))) {
				return false;
			}
		}
	}

	return true;
}

export function createPlanGateExtension(
	options: PlanGateOptions = {},
): AgentExtension {
	const beforeTool = (
		context: AgentBeforeToolContext,
	): AgentBeforeToolResult | undefined => {
		const toolName = context.tool.name;

		// In plan mode, enforce strict read-only containment
		if (options.mode === "plan" && isMutatingTool(toolName)) {
			return {
				skip: true,
				reason: PLAN_MODE_MUTATION_ERROR,
			};
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
