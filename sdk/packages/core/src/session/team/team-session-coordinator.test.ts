import { TeamMessageType } from "@cline/shared";
import { describe, expect, it, vi } from "vitest";
import {
	dispatchTeamEventToBackend,
	formatModePrompt,
} from "./team-session-coordinator";

describe("formatModePrompt", () => {
	it("wraps prompt with act mode by default or when mode is act", () => {
		expect(formatModePrompt("build feature", "act")).toBe(
			'<user_input mode="act">build feature</user_input>',
		);
		expect(formatModePrompt("build feature", undefined)).toBe(
			'<user_input mode="act">build feature</user_input>',
		);
	});

	it("wraps prompt with plan mode when mode is plan", () => {
		expect(formatModePrompt("plan feature", "plan")).toBe(
			'<user_input mode="plan">plan feature</user_input>',
		);
	});

	it("wraps prompt with yolo mode when mode is yolo", () => {
		expect(formatModePrompt("fast run", "yolo")).toBe(
			'<user_input mode="yolo">fast run</user_input>',
		);
	});

	it("wraps prompt with ultra mode when mode is ultra", () => {
		expect(formatModePrompt("multi-agent SOP", "ultra")).toBe(
			'<user_input mode="ultra">multi-agent SOP</user_input>',
		);
	});
});

describe("dispatchTeamEventToBackend", () => {
	it("persists intentionally aborted teammate tasks as cancelled", async () => {
		const invokeOptional = vi.fn(async () => {});
		const error = new DOMException("This operation was aborted", "AbortError");

		await dispatchTeamEventToBackend(
			"root-session",
			{
				type: TeamMessageType.TaskEnd,
				agentId: "teammate-1",
				status: "cancelled",
				error,
				messages: [],
			},
			invokeOptional,
		);

		expect(invokeOptional).toHaveBeenCalledWith(
			"onTeamTaskEnd",
			"root-session",
			"teammate-1",
			"cancelled",
			"[done] aborted",
			undefined,
			[],
		);
	});
});
