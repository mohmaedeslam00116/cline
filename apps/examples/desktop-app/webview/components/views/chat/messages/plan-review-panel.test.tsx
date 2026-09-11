// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type ImplementationPlanData,
	PlanReviewPanel,
} from "./plan-review-panel";

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

const mockPlan: ImplementationPlanData = {
	goal: "Refactor Database Client",
	userReviewRequired: ["Breaking change in DB connection string"],
	openQuestions: ["Should we support legacy SQLite?"],
	proposedChanges: [
		{ action: "modify", file: "src/db/client.ts" },
		{ action: "new", file: "src/db/pool.ts" },
		{ action: "delete", file: "src/db/legacy.ts" },
	],
	verificationPlan: {
		automated: ["bun test db.test.ts"],
		manual: ["Verify connection pooling under load"],
	},
	status: "pending_approval",
};

describe("PlanReviewPanel component", () => {
	it("renders plan title, goal, and sections", async () => {
		await act(async () => {
			root.render(<PlanReviewPanel plan={mockPlan} />);
		});

		expect(container.textContent).toContain("Architect Plan");
		expect(container.textContent).toContain("Refactor Database Client");
		expect(container.textContent).toContain("Review Required");
		expect(container.textContent).toContain(
			"Breaking change in DB connection string",
		);
		expect(container.textContent).toContain("Should we support legacy SQLite?");
		expect(container.textContent).toContain("src/db/client.ts");
		expect(container.textContent).toContain("src/db/pool.ts");
		expect(container.textContent).toContain("bun test db.test.ts");
	});

	it("triggers onApprove callback when clicking Approve & Proceed", async () => {
		const onApprove = vi.fn();

		await act(async () => {
			root.render(<PlanReviewPanel plan={mockPlan} onApprove={onApprove} />);
		});

		const approveButton = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.includes("Approve & Proceed"),
		);

		expect(approveButton).toBeDefined();

		await act(async () => {
			approveButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		});

		expect(onApprove).toHaveBeenCalledTimes(1);
	});

	it("shows Approved state when isApproved is true", async () => {
		await act(async () => {
			root.render(<PlanReviewPanel plan={mockPlan} isApproved={true} />);
		});

		expect(container.textContent).toContain("Approved");
		expect(container.textContent).toContain(
			"Plan approved. Workstation is executing in Code mode.",
		);

		// Approve button should not be present when already approved
		const approveButton = Array.from(container.querySelectorAll("button")).find(
			(b) => b.textContent?.includes("Approve & Proceed"),
		);
		expect(approveButton).toBeUndefined();
	});
});
