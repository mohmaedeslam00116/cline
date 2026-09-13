// @vitest-environment jsdom

import type { CustomPersonaRecord } from "@cline/shared/browser";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PersonaStudioView } from "./persona-studio-view";

const clientMocks = vi.hoisted(() => ({
	deletePersona: vi.fn(),
	listPersonas: vi.fn(),
	savePersona: vi.fn(),
}));

vi.mock("@/lib/desktop-client", () => ({ desktopClient: clientMocks }));

const workspacePersona: CustomPersonaRecord = {
	frontmatter: {
		id: "audit-bot",
		name: "Audit Bot",
		version: "1.0.0",
		description: "Reviews release risk",
		role: "Release Auditor",
		stage: "qa",
		avatar: { chassis: "sentinel", accentColor: "#10b981" },
		tools: ["read_file"],
		toolPolicy: "auto",
	},
	instructions: "# Audit Bot\n\nReview release evidence.",
	rawContent: "",
	scope: "workspace",
	filePath: "/workspace/.lens/personas/audit-bot.agent.md",
	isBuiltin: false,
};

let container: HTMLDivElement;
let root: Root;

async function renderStudio() {
	await act(async () => {
		root.render(<PersonaStudioView workspaceRoot="/workspace" />);
		await Promise.resolve();
	});
}

async function input(element: HTMLInputElement, value: string) {
	await act(async () => {
		const setter = Object.getOwnPropertyDescriptor(
			HTMLInputElement.prototype,
			"value",
		)?.set;
		setter?.call(element, value);
		element.dispatchEvent(new Event("input", { bubbles: true }));
		await Promise.resolve();
	});
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	clientMocks.listPersonas.mockReset();
	clientMocks.listPersonas.mockResolvedValue([workspacePersona]);
	clientMocks.savePersona.mockReset();
	clientMocks.deletePersona.mockReset();
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.restoreAllMocks();
});

describe("PersonaStudioView", () => {
	it("loads built-in and scoped custom personas into a filterable library", async () => {
		await renderStudio();

		await vi.waitFor(() => {
			expect(clientMocks.listPersonas).toHaveBeenCalledWith("/workspace");
			expect(container.textContent).toContain("Orion");
			expect(container.textContent).toContain("Audit Bot");
			expect(container.textContent).toContain("Workspace");
		});

		const search = container.querySelector<HTMLInputElement>(
			'input[aria-label="Search personas"]',
		);
		expect(search).not.toBeNull();
		await input(search as HTMLInputElement, "audit");

		expect(container.textContent).not.toContain("Orion");
		expect(container.textContent).toContain("Audit Bot");
	});
});
