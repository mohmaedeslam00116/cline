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
vi.mock("shiki", () => ({
	codeToHtml: vi.fn(async () => '<pre class="shiki"><code>highlighted</code></pre>'),
}));

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

async function input(
	element: HTMLInputElement | HTMLTextAreaElement,
	value: string,
) {
	await act(async () => {
		const prototype =
			element instanceof HTMLTextAreaElement
				? HTMLTextAreaElement.prototype
				: HTMLInputElement.prototype;
		const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
		setter?.call(element, value);
		element.dispatchEvent(new Event("input", { bubbles: true }));
		await Promise.resolve();
	});
}

async function click(element: Element) {
	await act(async () => {
		element.dispatchEvent(
			new MouseEvent("pointerdown", { bubbles: true, cancelable: true }),
		);
		element.dispatchEvent(
			new MouseEvent("click", { bubbles: true, cancelable: true }),
		);
		await Promise.resolve();
	});
}

async function select(element: HTMLSelectElement, value: string) {
	await act(async () => {
		const setter = Object.getOwnPropertyDescriptor(
			HTMLSelectElement.prototype,
			"value",
		)?.set;
		setter?.call(element, value);
		element.dispatchEvent(new Event("change", { bubbles: true }));
		await Promise.resolve();
	});
}

function buttonWithText(text: string, rootNode: ParentNode = container) {
	const button = [
		...rootNode.querySelectorAll<HTMLButtonElement>("button"),
	].find((candidate) => candidate.textContent?.includes(text));
	expect(button).toBeDefined();
	return button as HTMLButtonElement;
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	clientMocks.listPersonas.mockReset();
	clientMocks.listPersonas.mockResolvedValue([workspacePersona]);
	clientMocks.savePersona.mockReset();
	clientMocks.savePersona.mockResolvedValue({
		success: true,
		filePath: "/home/dev/.lens/personas/audit-bot.agent.md",
	});
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

	it("duplicates immutable built-ins and previews the chosen avatar in every state", async () => {
		await renderStudio();
		await vi.waitFor(() => expect(container.textContent).toContain("Orion"));

		await click(buttonWithText("Orion"));
		expect(container.textContent).toContain("Built-in template");
		expect(buttonWithText("Save persona").disabled).toBe(true);

		await click(buttonWithText("Duplicate to customize"));
		const idInput = container.querySelector<HTMLInputElement>('[aria-label="ID"]');
		const nameInput = container.querySelector<HTMLInputElement>(
			'[aria-label="Name"]',
		);
		expect(idInput?.value).toBe("orion-custom");
		expect(nameInput?.value).toBe("Orion Custom");

		await click(
			container.querySelector('[aria-label="Lyra chassis"]') as Element,
		);
		const accentInput = container.querySelector<HTMLInputElement>(
			'[aria-label="Neon accent"]',
		);
		expect(accentInput).not.toBeNull();
		await input(accentInput as HTMLInputElement, "#ff2bd6");

		const previews = container.querySelectorAll(
			'[data-testid="persona-state-preview"] svg',
		);
		expect(previews).toHaveLength(5);
		for (const preview of previews) {
			expect(preview.innerHTML).toContain("#ff2bd6");
		}
	});

	it("exposes least-privilege capabilities and live Markdown highlighting", async () => {
		await renderStudio();
		await vi.waitFor(() => expect(container.textContent).toContain("Orion"));
		await click(buttonWithText("Duplicate to customize"));

		const editFile = container.querySelector<HTMLButtonElement>(
			'[aria-label="Allow edit_file"]',
		);
		expect(editFile).not.toBeNull();
		await click(editFile as HTMLButtonElement);
		expect(container.textContent).toContain("Human approval required");
		expect(editFile?.getAttribute("data-state")).toBe("checked");

		const prompt = container.querySelector<HTMLTextAreaElement>(
			'textarea[aria-label="System prompt"]',
		);
		expect(prompt).not.toBeNull();
		await input(
			prompt as HTMLTextAreaElement,
			"# Release Auditor\n\n- Verify evidence.",
		);
		await vi.waitFor(() => {
			expect(
				container.querySelector('[data-highlight-ready="true"]'),
			).not.toBeNull();
		});
	});

	it("saves a validated persona to the explicitly selected scope", async () => {
		await renderStudio();
		await vi.waitFor(() => expect(container.textContent).toContain("Audit Bot"));
		await click(buttonWithText("Audit Bot"));

		const name = container.querySelector<HTMLInputElement>('[aria-label="Name"]');
		expect(name).not.toBeNull();
		await input(name as HTMLInputElement, "Audit Bot v2");
		const destination = container.querySelector<HTMLSelectElement>(
			'[aria-label="Save destination"]',
		);
		expect(destination).not.toBeNull();
		await select(destination as HTMLSelectElement, "global");
		await click(buttonWithText("Save persona"));

		await vi.waitFor(() => {
			expect(clientMocks.savePersona).toHaveBeenCalledWith(
				expect.objectContaining({
					id: "audit-bot",
					name: "Audit Bot v2",
					tools: ["read_file"],
					toolPolicy: "auto",
				}),
				"# Audit Bot\n\nReview release evidence.",
				"global",
				"/workspace",
			);
		});
		expect(container.textContent).toContain("Saved to Global");
	});

	it("blocks invalid saves and keeps failed edits in place", async () => {
		await renderStudio();
		await vi.waitFor(() => expect(container.textContent).toContain("New persona"));
		await click(buttonWithText("New persona"));
		await click(buttonWithText("Save persona"));
		expect(clientMocks.savePersona).not.toHaveBeenCalled();
		await vi.waitFor(() => {
			expect(document.activeElement?.getAttribute("aria-label")).toBe("ID");
		});

		await click(buttonWithText("Audit Bot"));
		const name = container.querySelector<HTMLInputElement>('[aria-label="Name"]');
		await input(name as HTMLInputElement, "Unsaved Audit Bot");
		clientMocks.savePersona.mockRejectedValueOnce(new Error("Disk is read-only"));
		await click(buttonWithText("Save persona"));

		await vi.waitFor(() => {
			expect(container.textContent).toContain("Unable to save persona");
		});
		expect(
			container.querySelector<HTMLInputElement>('[aria-label="Name"]')?.value,
		).toBe("Unsaved Audit Bot");
	});
});
