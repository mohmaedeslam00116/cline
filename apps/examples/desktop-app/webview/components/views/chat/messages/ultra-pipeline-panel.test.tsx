// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UltraPipelinePanel } from "./ultra-pipeline-panel";
import type { UltraPipeline } from "./ultra-pipeline-parser";

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

const mockPipeline: UltraPipeline = {
	prd: {
		goals: ["Build Color Meter GUI", "Real-time RGB update"],
		userStories: ["As a user, I want to sample colors."],
		competitiveAnalysis: ["ColorCop: Simple but dated."],
		requirementPool: [
			{ requirement: "Design GUI", priority: "P0" },
			{ requirement: "Unit tests", priority: "P1" },
		],
		uiDesignDraft: "Floating color magnifier widget.",
	},
	architect: {
		implementationApproach: "Python Tkinter + Pillow",
		packageName: "color_meter",
		fileList: ["main.py", "picker.py", "tests.py"],
		classDiagram: "class ColorPicker",
		sequenceDiagram: "User->>ColorPicker: pick",
	},
	tasks: {
		packages: ["Pillow>=9.0.0"],
		taskList: ["picker.py", "main.py", "tests.py"],
		logicAnalysis: [{ file: "main.py", description: "Entry point" }],
	},
	engineer: {
		filesImplemented: ["picker.py", "main.py"],
		summary: "All modules implemented adhering to Atlas interfaces.",
	},
	qa: {
		testExecutionSummary: "4 tests passed in 0.25s",
		retries: 0,
		maxRetries: 3,
		status: "passed",
	},
	collaborationFeed: [
		{
			from: "Orion",
			to: "Athena",
			message: "Ingested user prompt. Draft PRD focusing on P0 items.",
		},
		{
			from: "Atlas",
			to: "Athena",
			message: "Architecture verified against requirements.",
		},
	],
	checkpointStatus: {
		gate: 1,
		title: "Strategy & Blueprint Gate",
		isAwaitingApproval: true,
		summary: "Athena's PRD and Atlas's Architecture are aligned.",
	},
	rawMarkdown: "Mock MetaGPT deliverable markdown",
};

describe("UltraPipelinePanel component", () => {
	it("renders Agency badge, squad lineup bar, and specialist persona tabs", async () => {
		await act(async () => {
			root.render(<UltraPipelinePanel pipeline={mockPipeline} />);
		});

		expect(container.textContent).toContain("Ultra Mode Agency");
		expect(container.textContent).toContain("Verified");
		expect(container.textContent).toContain("Active Squad Lineup");
		expect(container.textContent).toContain("Orion");
		expect(container.textContent).toContain("Athena");
		expect(container.textContent).toContain("Atlas");
		expect(container.textContent).toContain("Cipher");
		expect(container.textContent).toContain("Sentinel");
		expect(container.textContent).toContain("Athena (PRD)");
		expect(container.textContent).toContain("Atlas (Architecture)");
		expect(container.textContent).toContain("Orion (Task DAG)");
		expect(container.textContent).toContain("Cipher (Code)");
		expect(container.textContent).toContain("Sentinel (QA Report)");
	});

	it("renders inter-agent collaboration feed entries", async () => {
		await act(async () => {
			root.render(<UltraPipelinePanel pipeline={mockPipeline} />);
		});

		expect(container.textContent).toContain("Team Collaboration & Handoffs");
		expect(container.textContent).toContain("Orion");
		expect(container.textContent).toContain("→");
		expect(container.textContent).toContain("Athena");
		expect(container.textContent).toContain("Ingested user prompt");
	});

	it("renders Checkpoint 1 review gate with action buttons and handles approve", async () => {
		const onProceed = vi.fn();
		await act(async () => {
			root.render(
				<UltraPipelinePanel
					pipeline={mockPipeline}
					onProceedCheckpoint={onProceed}
				/>,
			);
		});

		expect(container.textContent).toContain(
			"Checkpoint 1: Strategy & Blueprint Gate",
		);
		expect(container.textContent).toContain("Approve & Proceed");

		const approveBtn = Array.from(
			container.querySelectorAll("button"),
		).find((b) => b.textContent?.includes("Approve & Proceed"));
		expect(approveBtn).toBeDefined();

		await act(async () => {
			approveBtn?.click();
		});

		expect(onProceed).toHaveBeenCalledTimes(1);
	});

	it("switches tabs when clicked", async () => {
		await act(async () => {
			root.render(<UltraPipelinePanel pipeline={mockPipeline} />);
		});

		const architectTab = container.querySelector<HTMLButtonElement>(
			'button[role="tab"]:nth-child(2)',
		);
		expect(architectTab).not.toBeNull();

		await act(async () => {
			architectTab?.click();
		});

		expect(container.textContent).toContain("Python Tkinter + Pillow");
		expect(container.textContent).toContain("main.py");
		expect(container.textContent).toContain("picker.py");
	});

	it("supports roving tabIndex for ARIA tablist navigation with arrow keys", async () => {
		await act(async () => {
			root.render(<UltraPipelinePanel pipeline={mockPipeline} />);
		});

		const tablist = container.querySelector<HTMLDivElement>(
			'div[role="tablist"]',
		);
		expect(tablist).not.toBeNull();

		const firstTab = container.querySelector<HTMLButtonElement>(
			'button[role="tab"]:nth-child(1)',
		);
		const secondTab = container.querySelector<HTMLButtonElement>(
			'button[role="tab"]:nth-child(2)',
		);

		expect(firstTab?.getAttribute("tabindex")).toBe("0");
		expect(secondTab?.getAttribute("tabindex")).toBe("-1");

		await act(async () => {
			tablist?.dispatchEvent(
				new KeyboardEvent("keydown", {
					key: "ArrowRight",
					bubbles: true,
					cancelable: true,
				}),
			);
		});

		expect(firstTab?.getAttribute("tabindex")).toBe("-1");
		expect(secondTab?.getAttribute("tabindex")).toBe("0");
	});

	it("renders Engineer code implementation tab when selected", async () => {
		await act(async () => {
			root.render(<UltraPipelinePanel pipeline={mockPipeline} />);
		});

		const codeTab = Array.from(
			container.querySelectorAll<HTMLButtonElement>('button[role="tab"]'),
		).find((tab) => tab.textContent?.includes("Cipher (Code)"));
		expect(codeTab).toBeDefined();

		await act(async () => {
			codeTab?.click();
		});

		expect(container.textContent).toContain("Engineer Implementation");
		expect(container.textContent).toContain("picker.py");
		expect(container.textContent).toContain("main.py");
		expect(container.textContent).toContain(
			"All modules implemented adhering to Atlas interfaces.",
		);
	});
});
