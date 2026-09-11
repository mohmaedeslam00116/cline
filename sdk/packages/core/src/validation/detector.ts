/**
 * Post-Edit Validation Detector
 *
 * Discovers available linters and compilers based on workspace configuration.
 */

import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import type { ValidatorDefinition } from "./types";

/** Longer timeout for project-wide validators (tsc, cargo) — 30 seconds. */
const PROJECT_WIDE_TIMEOUT_MS = 30_000;

export function detectWorkspaceValidators(
	workspaceRoot: string,
): ValidatorDefinition[] {
	const validators: ValidatorDefinition[] = [];

	// 1. Biome detection
	const hasBiome =
		existsSync(join(workspaceRoot, "biome.json")) ||
		existsSync(join(workspaceRoot, "biome.jsonc"));

	if (hasBiome) {
		validators.push({
			name: "biome",
			fileExtensions: [
				".ts",
				".tsx",
				".js",
				".jsx",
				".mjs",
				".cjs",
				".json",
				".jsonc",
			],
			command: "biome",
			args: ["check", "--files-ignore-unknown=true", "{file}"],
		});
	}

	// 2. TypeScript compiler detection (project-wide)
	const hasTsConfig = existsSync(join(workspaceRoot, "tsconfig.json"));
	if (hasTsConfig) {
		validators.push({
			name: "tsc",
			fileExtensions: [".ts", ".tsx"],
			command: "tsc",
			args: ["--noEmit", "--pretty", "false"],
			wholeProject: true,
			timeoutMs: PROJECT_WIDE_TIMEOUT_MS,
		});
	}

	// 3. ESLint detection
	const hasEslint =
		existsSync(join(workspaceRoot, "eslint.config.js")) ||
		existsSync(join(workspaceRoot, "eslint.config.mjs")) ||
		existsSync(join(workspaceRoot, "eslint.config.cjs")) ||
		existsSync(join(workspaceRoot, ".eslintrc.js")) ||
		existsSync(join(workspaceRoot, ".eslintrc.cjs")) ||
		existsSync(join(workspaceRoot, ".eslintrc.json")) ||
		existsSync(join(workspaceRoot, ".eslintrc.yml")) ||
		existsSync(join(workspaceRoot, ".eslintrc.yaml")) ||
		existsSync(join(workspaceRoot, ".eslintrc"));

	if (hasEslint && !hasBiome) {
		validators.push({
			name: "eslint",
			fileExtensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
			command: "eslint",
			args: ["{file}"],
		});
	}

	// 4. Python detection
	const hasRuff =
		existsSync(join(workspaceRoot, "ruff.toml")) ||
		existsSync(join(workspaceRoot, ".ruff.toml"));

	if (hasRuff) {
		validators.push({
			name: "ruff",
			fileExtensions: [".py"],
			command: "ruff",
			args: ["check", "{file}"],
		});
	} else {
		const hasPythonProject =
			existsSync(join(workspaceRoot, "pyproject.toml")) ||
			existsSync(join(workspaceRoot, "setup.py")) ||
			existsSync(join(workspaceRoot, "requirements.txt"));

		if (hasPythonProject) {
			const pyCmd = process.platform === "win32" ? "python" : "python3";
			validators.push({
				name: "py_compile",
				fileExtensions: [".py"],
				command: pyCmd,
				args: ["-m", "py_compile", "{file}"],
			});
		}
	}

	// 5. Rust detection (project-wide)
	const hasCargo = existsSync(join(workspaceRoot, "Cargo.toml"));
	if (hasCargo) {
		validators.push({
			name: "cargo",
			fileExtensions: [".rs"],
			command: "cargo",
			args: ["check"],
			wholeProject: true,
			timeoutMs: PROJECT_WIDE_TIMEOUT_MS,
		});
	}

	// 6. Go detection (project-wide via ./...)
	const hasGoMod = existsSync(join(workspaceRoot, "go.mod"));
	if (hasGoMod) {
		validators.push({
			name: "go",
			fileExtensions: [".go"],
			command: "go",
			args: ["vet", "./..."],
			wholeProject: true,
			timeoutMs: PROJECT_WIDE_TIMEOUT_MS,
		});
	}

	return validators;
}

export function findValidatorsForFile(
	filePath: string,
	validators: readonly ValidatorDefinition[],
): ValidatorDefinition[] {
	const ext = extname(filePath).toLowerCase();
	if (!ext) return [];

	return validators.filter((v) =>
		v.fileExtensions.some((e) => e.toLowerCase() === ext),
	);
}
