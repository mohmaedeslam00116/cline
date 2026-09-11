// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	MODE_SELECTION_STORAGE_KEY,
	parseModeSelection,
	readModeSelectionFromWindow,
	writeModeSelectionToWindow,
} from "./mode-selection";

describe("mode-selection", () => {
	beforeEach(() => {
		window.localStorage?.clear();
	});

	afterEach(() => {
		window.localStorage?.clear();
	});

	it("parses valid mode strings including ultra", () => {
		expect(parseModeSelection("act")).toBe("act");
		expect(parseModeSelection("plan")).toBe("plan");
		expect(parseModeSelection("yolo")).toBe("yolo");
		expect(parseModeSelection("ultra")).toBe("ultra");
	});

	it("falls back to act for invalid or null modes", () => {
		expect(parseModeSelection(null)).toBe("act");
		expect(parseModeSelection("")).toBe("act");
		expect(parseModeSelection("unknown")).toBe("act");
	});

	it("reads and writes ultra mode to window localStorage", () => {
		expect(readModeSelectionFromWindow()).toBe("act");
		writeModeSelectionToWindow("ultra");
		expect(window.localStorage?.getItem(MODE_SELECTION_STORAGE_KEY)).toBe(
			"ultra",
		);
		expect(readModeSelectionFromWindow()).toBe("ultra");
	});
});
