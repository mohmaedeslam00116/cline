"use client";

import {
	getDefaultSquadConfig,
	type SquadConfig,
} from "@cline/shared/browser";
import { useCallback, useEffect, useState } from "react";

export const SQUAD_CONFIG_STORAGE_KEY = "lens.ultra.squad-config.v1";
export const SQUAD_CONFIG_EVENT = "lens:ultra-squad-config-changed";

export function readStoredSquadConfig(): SquadConfig {
	if (typeof window === "undefined") {
		return getDefaultSquadConfig();
	}
	try {
		const saved = window.localStorage.getItem(SQUAD_CONFIG_STORAGE_KEY);
		if (saved) {
			const parsed = JSON.parse(saved);
			if (
				Array.isArray(parsed.activePersonaIds) &&
				parsed.activePersonaIds.length > 0
			) {
				return parsed;
			}
		}
	} catch {
		// Fallback to default
	}
	return getDefaultSquadConfig();
}

export function writeStoredSquadConfig(config: SquadConfig): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(
			SQUAD_CONFIG_STORAGE_KEY,
			JSON.stringify(config),
		);
		window.dispatchEvent(
			new CustomEvent(SQUAD_CONFIG_EVENT, { detail: config }),
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
		setConfig(nextConfig);
		writeStoredSquadConfig(nextConfig);
	}, []);

	return [config, updateConfig];
}
