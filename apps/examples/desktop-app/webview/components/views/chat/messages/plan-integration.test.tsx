// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatMessage } from "@/lib/chat-schema";
import { MessageBubble } from "./message-bubble";

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

describe("MessageBubble plan and walkthrough integration", () => {
	it("renders PlanReviewPanel when assistant message contains an implementation plan", async () => {
		const planMarkdown = [
			"# Implementation Plan: Refactor Auth Subsystem",
			"",
			"## User Review Required",
			"> JWT secret rotation policy change",
			"",
			"## Open Questions",
			"- Do we support OAuth2 refresh tokens?",
			"",
			"## Proposed Changes",
			"### Auth",
			"#### [MODIFY] [auth.ts](file:///src/auth.ts)",
			"#### [NEW] [token.ts](file:///src/token.ts)",
			"",
			"## Verification Plan",
			"### Automated Tests",
			"- bun test auth.test.ts",
		].join("\n");

		const message: ChatMessage = {
			id: "msg-plan-1",
			role: "assistant",
			content: planMarkdown,
			createdAt: new Date().toISOString(),
		};

		const handleApprove = vi.fn();

		await act(async () => {
			root.render(
				<MessageBubble
					agentRole="assistant"
					isLastAssistantMessage={true}
					message={message}
					onApprovePlan={handleApprove}
					reasoningContent=""
					reasoningRedacted={false}
				/>,
			);
		});

		expect(container.textContent).toContain("Architect Plan");
		expect(container.textContent).toContain("Refactor Auth Subsystem");
		expect(container.textContent).toContain("Review Required");
		expect(container.textContent).toContain(
			"JWT secret rotation policy change",
		);
		expect(container.textContent).toContain(
			"Do we support OAuth2 refresh tokens?",
		);
		expect(container.textContent).toContain("src/auth.ts");
		expect(container.textContent).toContain("src/token.ts");
		expect(container.textContent).toContain("bun test auth.test.ts");

		const approveButton = container.querySelector(
			"button:has(.lucide-arrow-right)",
		);
		expect(approveButton).not.toBeNull();

		await act(async () => {
			approveButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		expect(handleApprove).toHaveBeenCalledTimes(1);
	});

	it("renders WalkthroughPanel when assistant message contains a walkthrough artifact", async () => {
		const walkthroughMarkdown = [
			"# Walkthrough - Feature Complete",
			"",
			"## Changes Made",
			"- Implemented token validation in src/auth.ts",
			"- Added unit tests in src/token.test.ts",
			"",
			"## Verification Results",
			"- 10/10 tests passed successfully",
		].join("\n");

		const message: ChatMessage = {
			id: "msg-walkthrough-1",
			role: "assistant",
			content: walkthroughMarkdown,
			createdAt: new Date().toISOString(),
		};

		await act(async () => {
			root.render(
				<MessageBubble
					agentRole="assistant"
					isLastAssistantMessage={true}
					isVerified={true}
					message={message}
					reasoningContent=""
					reasoningRedacted={false}
				/>,
			);
		});

		expect(container.textContent).toContain("Task Walkthrough");
		expect(container.textContent).toContain("Verification Complete");
		expect(container.textContent).toContain("Walkthrough - Feature Complete");
		expect(container.textContent).toContain("Changes Made");
		expect(container.textContent).toContain(
			"Implemented token validation in src/auth.ts",
		);
		expect(container.textContent).toContain("10/10 tests passed successfully");
	});
});
