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
	qa: {
		testExecutionSummary: "4 tests passed in 0.25s",
		retries: 0,
		maxRetries: 3,
		status: "passed",
	},
	rawMarkdown: "Mock MetaGPT deliverable markdown",
};

describe("UltraPipelinePanel component", () => {
	it("renders pipeline header, badge, and tabs", async () => {
		await act(async () => {
			root.render(<UltraPipelinePanel pipeline={mockPipeline} />);
		});

		expect(container.textContent).toContain("MetaGPT Assembly Line");
		expect(container.textContent).toContain("Verified");
		expect(container.textContent).toContain("PRD (PM)");
		expect(container.textContent).toContain("Design (Architect)");
		expect(container.textContent).toContain("Tasks (PM)");
		expect(container.textContent).toContain("Code (Engineer)");
		expect(container.textContent).toContain("QA & Verification");
	});

	it("renders PRD goals and requirement pool by default", async () => {
		await act(async () => {
			root.render(<UltraPipelinePanel pipeline={mockPipeline} />);
		});

		expect(container.textContent).toContain("Build Color Meter GUI");
		expect(container.textContent).toContain("P0");
		expect(container.textContent).toContain("Design GUI");
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

	it("collapses and expands on header button click", async () => {
		await act(async () => {
			root.render(<UltraPipelinePanel pipeline={mockPipeline} />);
		});

		expect(container.textContent).toContain("Build Color Meter GUI");

		const toggleButton = container.querySelector<HTMLButtonElement>(
			'button[aria-label="Collapse"]',
		);
		expect(toggleButton).not.toBeNull();

		await act(async () => {
			toggleButton?.click();
		});

		expect(container.textContent).not.toContain("Build Color Meter GUI");

		const expandButton = container.querySelector<HTMLButtonElement>(
			'button[aria-label="Expand"]',
		);
		await act(async () => {
			expandButton?.click();
		});

		expect(container.textContent).toContain("Build Color Meter GUI");
	});

	it("renders self-correcting retry status when retries occurred", async () => {
		const retryingPipeline: UltraPipeline = {
			...mockPipeline,
			qa: {
				retries: 2,
				maxRetries: 3,
				status: "self_correcting",
				testExecutionSummary: "Retrying after assertion failure",
			},
		};

		await act(async () => {
			root.render(<UltraPipelinePanel pipeline={retryingPipeline} />);
		});

		expect(container.textContent).toContain("Self-Correcting (2/3)");
	});

	it("has complete ARIA tab and tabpanel associations", async () => {
		await act(async () => {
			root.render(<UltraPipelinePanel pipeline={mockPipeline} />);
		});

		const prdTab = container.querySelector<HTMLButtonElement>("#ultra-tab-prd");
		const prdPanel = container.querySelector<HTMLDivElement>(
			"#ultra-tabpanel-prd",
		);

		expect(prdTab).not.toBeNull();
		expect(prdPanel).not.toBeNull();
		expect(prdTab?.getAttribute("role")).toBe("tab");
		expect(prdTab?.getAttribute("aria-selected")).toBe("true");
		expect(prdTab?.getAttribute("aria-controls")).toBe("ultra-tabpanel-prd");
		expect(prdPanel?.getAttribute("role")).toBe("tabpanel");
		expect(prdPanel?.getAttribute("aria-labelledby")).toBe("ultra-tab-prd");
	});

	it("navigates tabs using ArrowRight and ArrowLeft keyboard keys", async () => {
		await act(async () => {
			root.render(<UltraPipelinePanel pipeline={mockPipeline} />);
		});

		const tablist = container.querySelector<HTMLDivElement>('[role="tablist"]');
		expect(tablist).not.toBeNull();

		// Press ArrowRight to move from prd to architect
		await act(async () => {
			tablist?.dispatchEvent(
				new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
			);
		});

		const architectTab = container.querySelector<HTMLButtonElement>(
			"#ultra-tab-architect",
		);
		expect(architectTab?.getAttribute("aria-selected")).toBe("true");
		expect(container.querySelector("#ultra-tabpanel-architect")).not.toBeNull();

		// Press ArrowLeft to move back to prd
		await act(async () => {
			tablist?.dispatchEvent(
				new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
			);
		});

		const prdTabAgain =
			container.querySelector<HTMLButtonElement>("#ultra-tab-prd");
		expect(prdTabAgain?.getAttribute("aria-selected")).toBe("true");
		expect(container.querySelector("#ultra-tabpanel-prd")).not.toBeNull();
	});

	it("renders engineer deliverables in the code tab", async () => {
		const pipelineWithEngineer: UltraPipeline = {
			...mockPipeline,
			engineer: {
				filesImplemented: ["picker.py", "main.py"],
				summary: "Implemented color picker module with Pillow bindings.",
			},
		};

		await act(async () => {
			root.render(<UltraPipelinePanel pipeline={pipelineWithEngineer} />);
		});

		const codeTab =
			container.querySelector<HTMLButtonElement>("#ultra-tab-code");
		await act(async () => {
			codeTab?.click();
		});

		expect(container.textContent).toContain("Engineer Implementation");
		expect(container.textContent).toContain("picker.py");
		expect(container.textContent).toContain("main.py");
		expect(container.textContent).toContain(
			"Implemented color picker module with Pillow bindings.",
		);
	});
});
