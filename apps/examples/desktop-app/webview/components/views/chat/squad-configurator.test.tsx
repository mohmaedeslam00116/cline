// @vitest-environment jsdom

import type { CustomPersonaRecord } from "@cline/shared/browser";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SQUAD_CONFIG_STORAGE_KEY } from "@/hooks/use-squad-config";
import { SQUAD_PRESETS_STORAGE_KEY } from "@/lib/squad-presets";
import { SquadConfigurator } from "./squad-configurator";

const { listPersonas } = vi.hoisted(() => ({ listPersonas: vi.fn() }));

vi.mock("@/lib/desktop-client", () => ({
	desktopClient: { listPersonas },
}));

const auditBot: CustomPersonaRecord = {
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
	instructions: "Review release evidence.",
	rawContent: "",
	scope: "workspace",
	filePath: "C:/workspace/.lens/personas/audit-bot.agent.md",
	isBuiltin: false,
};

let container: HTMLDivElement;
let root: Root;

async function click(element: Element) {
	await act(async () => {
		element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		await Promise.resolve();
	});
}

async function input(element: HTMLInputElement, value: string) {
	await act(async () => {
		Object.getOwnPropertyDescriptor(
			HTMLInputElement.prototype,
			"value",
		)?.set?.call(element, value);
		element.dispatchEvent(new Event("input", { bubbles: true }));
		await Promise.resolve();
	});
}

function button(label: string, rootNode: ParentNode = container) {
	const match = [
		...rootNode.querySelectorAll<HTMLButtonElement>("button"),
	].find(
		(candidate) =>
			candidate.getAttribute("aria-label") === label ||
			candidate.textContent?.includes(label),
	);
	expect(match).toBeDefined();
	return match as HTMLButtonElement;
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	window.localStorage.clear();
	listPersonas.mockReset();
	listPersonas.mockResolvedValue([auditBot]);
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.restoreAllMocks();
});

describe("SquadConfigurator", () => {
	it("renders custom identity and locks only Orion", async () => {
		await act(async () =>
			root.render(<SquadConfigurator workspaceRoot="C:/workspace" />),
		);
		await vi.waitFor(() =>
			expect(container.textContent).toContain("Audit Bot"),
		);

		expect(container.textContent).toContain("Workspace");
		expect(container.textContent).toContain("QA");
		expect(button("Toggle Orion").disabled).toBe(true);
		expect(button("Toggle Cipher").disabled).toBe(false);

		await click(button("Toggle Cipher"));
		const stored = JSON.parse(
			window.localStorage.getItem(SQUAD_CONFIG_STORAGE_KEY)!,
		);
		expect(stored.activePersonaIds).not.toContain("cipher");

		await click(button("Toggle Audit Bot"));
		expect(
			JSON.parse(window.localStorage.getItem(SQUAD_CONFIG_STORAGE_KEY)!)
				.activePersonaIds,
		).toContain("audit-bot");
	});

	it("saves, selects, and confirms deletion of a named preset", async () => {
		await act(async () =>
			root.render(<SquadConfigurator workspaceRoot="C:/workspace" />),
		);
		await vi.waitFor(() =>
			expect(container.textContent).toContain("Audit Bot"),
		);
		await click(button("Save preset"));
		const nameInput = container.querySelector<HTMLInputElement>(
			'input[aria-label="Preset name"]',
		);
		expect(nameInput).not.toBeNull();
		await input(nameInput!, "Release Review");
		await click(button("Create preset"));

		const stored = JSON.parse(
			window.localStorage.getItem(SQUAD_PRESETS_STORAGE_KEY)!,
		);
		expect(stored[0]).toMatchObject({
			name: "Release Review",
			personaIds: expect.arrayContaining(["orion"]),
		});
		expect(container.textContent).toContain("Release Review");

		await click(button("Delete Release Review"));
		expect(container.textContent).toContain("Delete this preset?");
		await click(button("Confirm delete"));
		expect(
			JSON.parse(window.localStorage.getItem(SQUAD_PRESETS_STORAGE_KEY)!),
		).toEqual([]);
	});
});
