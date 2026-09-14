// @vitest-environment jsdom

import type { CustomPersonaRecord } from "@cline/shared/browser";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	buildPersonaCatalog,
	type PersonaCatalogState,
	usePersonaCatalog,
} from "./use-persona-catalog";

const { listPersonas } = vi.hoisted(() => ({ listPersonas: vi.fn() }));

vi.mock("@/lib/desktop-client", () => ({
	desktopClient: { listPersonas },
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
	instructions: "Review release evidence.",
	rawContent: "",
	scope: "workspace",
	filePath: "C:/workspace/.lens/personas/audit-bot.agent.md",
	isBuiltin: false,
};

let container: HTMLDivElement;
let root: Root;
let current: PersonaCatalogState;

function Harness() {
	current = usePersonaCatalog("C:/workspace");
	return null;
}

beforeEach(() => {
	Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
	listPersonas.mockReset();
	container = document.createElement("div");
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.restoreAllMocks();
});

describe("persona catalog", () => {
	it("maps built-in and custom definitions into one runtime catalog", () => {
		const globalPersona: CustomPersonaRecord = {
			...workspacePersona,
			frontmatter: {
				...workspacePersona.frontmatter,
				name: "Global Audit Bot",
			},
			scope: "global",
			filePath: "C:/global/.lens/personas/audit-bot.agent.md",
		};
		const catalog = buildPersonaCatalog([workspacePersona, globalPersona]);
		expect(catalog).toHaveLength(9);
		expect(catalog[0]).toMatchObject({ id: "orion", scope: "builtin" });
		expect(catalog.at(-1)).toMatchObject({
			id: "audit-bot",
			scope: "workspace",
			stage: "qa",
			avatar: { chassis: "sentinel", accentColor: "#10b981" },
		});
		expect(catalog.at(-1)?.name).toBe("Audit Bot");
	});

	it("keeps built-ins usable while custom personas load", async () => {
		let resolveList!: (personas: CustomPersonaRecord[]) => void;
		listPersonas.mockReturnValue(
			new Promise<CustomPersonaRecord[]>((resolve) => {
				resolveList = resolve;
			}),
		);

		await act(async () => root.render(<Harness />));
		expect(current.status).toBe("loading");
		expect(current.byId.has("orion")).toBe(true);

		await act(async () => resolveList([workspacePersona]));
		expect(current.status).toBe("ready");
		expect(current.byId.get("audit-bot")).toMatchObject({
			name: "Audit Bot",
			scope: "workspace",
		});
		expect(listPersonas).toHaveBeenCalledWith("C:/workspace");
	});

	it("retains built-ins and can retry after a catalog error", async () => {
		listPersonas
			.mockRejectedValueOnce(new Error("catalog unavailable"))
			.mockResolvedValueOnce([workspacePersona]);
		await act(async () => root.render(<Harness />));
		await act(async () => Promise.resolve());

		expect(current.status).toBe("error");
		expect(current.byId.has("orion")).toBe(true);
		expect(current.error).toBe("catalog unavailable");

		await act(async () => current.reload());
		expect(current.status).toBe("ready");
		expect(current.byId.has("audit-bot")).toBe(true);
	});
});
