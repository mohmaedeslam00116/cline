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
});
