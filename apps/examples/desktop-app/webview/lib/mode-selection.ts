export const MODE_SELECTION_STORAGE_KEY = "cline.code.mode-selection.v1";

export type DesktopMode = "act" | "plan" | "yolo";

export function parseModeSelection(raw: string | null): DesktopMode {
	if (raw === "plan" || raw === "yolo" || raw === "act") {
		return raw;
	}
	return "act";
}

export function readModeSelectionFromWindow(): DesktopMode {
	if (typeof window === "undefined") {
		return "act";
	}
	try {
		return parseModeSelection(
			window.localStorage?.getItem(MODE_SELECTION_STORAGE_KEY),
		);
	} catch {
		return "act";
	}
}

export function writeModeSelectionToWindow(mode: DesktopMode): void {
	if (typeof window === "undefined") {
		return;
	}
	try {
		window.localStorage?.setItem(MODE_SELECTION_STORAGE_KEY, mode);
	} catch {
		// Ignore storage write failures (e.g. quota, private browsing)
	}
}
