/**
 * Post-Edit Validation Types
 *
 * Types for automated compiler/linter syntax checking and self-correction hooks.
 */

import type { BasicLogger, ITelemetryService } from "@cline/shared";

export interface ValidatorDefinition {
	/** Identifier name for the validator (e.g. "biome", "tsc", "eslint", "ruff", "py_compile") */
	name: string;
	/** File extensions this validator applies to, including leading dot (e.g. [".ts", ".tsx"]) */
	fileExtensions: string[];
	/** Executable name or command (e.g. "biome", "tsc", "npx") */
	command: string;
	/** Command-line arguments. May contain "{file}" placeholder which will be replaced with relative/absolute file path */
	args?: string[];
	/** Optional per-validator timeout override in milliseconds */
	timeoutMs?: number;
}

export interface ValidationDiagnostic {
	file: string;
	validator: string;
	output: string;
	exitCode: number | null;
	timedOut?: boolean;
}

export interface ValidationRunnerResult {
	exitCode: number | null;
	stdout: string;
	stderr: string;
	timedOut?: boolean;
	error?: Error;
}

export type PostEditValidationRunner = (
	command: string,
	args: string[],
	options: {
		cwd: string;
		timeoutMs: number;
		env?: NodeJS.ProcessEnv;
	},
) => Promise<ValidationRunnerResult>;

export interface CorePostEditValidationConfig {
	/**
	 * Whether post-edit validation is enabled.
	 */
	enabled?: boolean;
	/**
	 * Custom validators to run. When specified, augments or overrides auto-detected validators.
	 */
	validators?: ValidatorDefinition[];
	/**
	 * Whether to auto-detect workspace linters and compilers (default: true).
	 */
	autoDetect?: boolean;
	/**
	 * Maximum execution timeout in milliseconds per validator run (default: 5000ms).
	 */
	timeoutMs?: number;
	/**
	 * Maximum characters of diagnostic output to include in the hook context (default: 4000).
	 */
	maxOutputChars?: number;
	/**
	 * Pluggable runner function for testing or sandboxed command execution.
	 */
	runner?: PostEditValidationRunner;
}

export interface PostEditValidationOptions
	extends CorePostEditValidationConfig {
	cwd?: string;
	logger?: BasicLogger;
	telemetry?: ITelemetryService;
}
