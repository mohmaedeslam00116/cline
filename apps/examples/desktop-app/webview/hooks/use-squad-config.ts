"use client";

import {
	getDefaultSquadConfig,
	normalizeSquadConfig,
	type SquadConfig,
	type SquadPreset,
} from "@cline/shared/browser";
import { useCallback, useEffect, useState } from "react";
import {
	readStoredSquadPresets,
	SQUAD_PRESETS_EVENT,
	writeStoredSquadPresets,
} from "@/lib/squad-presets";

export const SQUAD_CONFIG_STORAGE_KEY = "lens.ultra.squad-config.v1";
export const SQUAD_CONFIG_EVENT = "lens:ultra-squad-config-changed";

export function readStoredSquadConfig(): SquadConfig {
	if (typeof window === "undefined") {
		return getDefaultSquadConfig();
	}
	try {
		const saved = window.localStorage.getItem(SQUAD_CONFIG_STORAGE_KEY);
		if (saved) return normalizeSquadConfig(JSON.parse(saved));
	} catch {
		// Fallback to default
	}
	return getDefaultSquadConfig();
}

export function writeStoredSquadConfig(config: SquadConfig): void {
	if (typeof window === "undefined") return;
	const normalized = normalizeSquadConfig(config);
	try {
		window.localStorage.setItem(
			SQUAD_CONFIG_STORAGE_KEY,
			JSON.stringify(normalized),
		);
		window.dispatchEvent(
			new CustomEvent(SQUAD_CONFIG_EVENT, { detail: normalized }),
		);
	} catch {
		// Ignore storage errors
	}
}

export function useSquadConfig(): [SquadConfig, (config: SquadConfig) => void] {
	const [config, setConfig] = useState<SquadConfig>(readStoredSquadConfig);

	useEffect(() => {
		const handleEvent = (e: Event) => {
			const custom = e as CustomEvent<SquadConfig>;
			if (custom.detail) {
				setConfig(custom.detail);
			} else {
				setConfig(readStoredSquadConfig());
			}
		};
		window.addEventListener(SQUAD_CONFIG_EVENT, handleEvent);
		return () => {
			window.removeEventListener(SQUAD_CONFIG_EVENT, handleEvent);
		};
	}, []);

	const updateConfig = useCallback((nextConfig: SquadConfig) => {
		const normalized = normalizeSquadConfig(nextConfig);
		setConfig(normalized);
		writeStoredSquadConfig(normalized);
	}, []);

	return [config, updateConfig];
}

export function useSquadPresets(): [
	SquadPreset[],
	(presets: SquadPreset[]) => void,
] {
	const [presets, setPresets] = useState<SquadPreset[]>(readStoredSquadPresets);

	useEffect(() => {
		const handleEvent = (event: Event) => {
			const detail = (event as CustomEvent<SquadPreset[]>).detail;
			setPresets(detail ?? readStoredSquadPresets());
		};
		window.addEventListener(SQUAD_PRESETS_EVENT, handleEvent);
		return () => window.removeEventListener(SQUAD_PRESETS_EVENT, handleEvent);
	}, []);

	const updatePresets = useCallback((nextPresets: SquadPreset[]) => {
		setPresets(nextPresets);
		writeStoredSquadPresets(nextPresets);
	}, []);

	return [presets, updatePresets];
}
