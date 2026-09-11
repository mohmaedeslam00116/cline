/**
 * Post-Edit Validation Extension & Hooks
 *
 * Automatically checks modified files with workspace linters/compilers after
 * edits (`editor` and `apply_patch`), feeding any syntax or type diagnostics
 * back into the agent loop for autonomous self-correction.
 */

import { existsSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import type {
	AgentAfterToolContext,
	AgentAfterToolResult,
	AgentExtension,
	AgentRuntimeHooks,
} from "@cline/shared";
import { PATCH_MARKERS } from "../extensions/tools/executors/apply-patch-parser";
import { detectWorkspaceValidators, findValidatorsForFile } from "./detector";
import {
	DEFAULT_MAX_OUTPUT_CHARS,
	DEFAULT_VALIDATION_TIMEOUT_MS,
	defaultValidationRunner,
} from "./runner";
import type {
	PostEditValidationOptions,
	ValidationDiagnostic,
	ValidatorDefinition,
} from "./types";

export const POST_EDIT_VALIDATION_EXTENSION_NAME = "core.post-edit-validation";

/** Maximum number of files to validate per hook invocation. */
const MAX_FILES_PER_INVOCATION = 10;

/** Default aggregate time budget for the entire validation loop (60 seconds). */
const DEFAULT_AGGREGATE_TIMEOUT_MS = 60_000;

/**
 * Extract modified file paths from an `editor` tool call input.
 */
export function extractModifiedFilesFromEditor(input: unknown): string[] {
	if (
		input &&
		typeof input === "object" &&
		"path" in input &&
		typeof (input as { path: unknown }).path === "string"
	) {
		const rawPath = (input as { path: string }).path.trim();
		return rawPath ? [rawPath] : [];
	}
	return [];
}

/**
 * Extract modified file paths (added or updated) from an `apply_patch` tool call input.
 */
export function extractModifiedFilesFromPatch(input: unknown): string[] {
	let patchText = "";
	if (typeof input === "string") {
		patchText = input;
	} else if (
		input &&
		typeof input === "object" &&
		"input" in input &&
		typeof (input as { input: unknown }).input === "string"
	) {
		patchText = (input as { input: string }).input;
	}

	if (!patchText) return [];

	const files: string[] = [];
	const lines = patchText.split("\n");
	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.startsWith(PATCH_MARKERS.UPDATE)) {
			const filePath = trimmed.slice(PATCH_MARKERS.UPDATE.length).trim();
			if (filePath && !files.includes(filePath)) {
				files.push(filePath);
			}
		} else if (trimmed.startsWith(PATCH_MARKERS.ADD)) {
			const filePath = trimmed.slice(PATCH_MARKERS.ADD.length).trim();
			if (filePath && !files.includes(filePath)) {
				files.push(filePath);
			}
		}
	}
	return files;
}

/**
 * Format collected validation diagnostics into bilingual Markdown hook context.
 */
export function formatValidationDiagnostics(
	diagnostics: readonly ValidationDiagnostic[],
	maxChars: number = DEFAULT_MAX_OUTPUT_CHARS,
): string {
	const header =
		"[Post-Edit Validation / فحص ما بعد التعديل]\n" +
		"The following compiler/linter diagnostics were detected after editing:";

	const footer =
		"Please analyze and fix these syntax, type, or lint errors before concluding your work.";

	const blocks: string[] = [];
	for (const diag of diagnostics) {
		const label = diag.timedOut
			? `### ${diag.file} (${diag.validator} - timed out)`
			: `### ${diag.file} (${diag.validator})`;
		blocks.push(`${label}\n\`\`\`\n${diag.output.trim()}\n\`\`\``);
	}

	let body = `${header}\n\n${blocks.join("\n\n")}\n\n${footer}`;
	if (body.length > maxChars) {
		const truncatedNotice = "\n...[truncated output / تم اقتطاع المخرجات]";
		body = body.slice(0, maxChars - truncatedNotice.length) + truncatedNotice;
	}
	return body;
}

/**
 * Verify that a file path is contained within the workspace (cwd).
 * Returns the normalized relative path or null if the path escapes the workspace.
 */
function validatePathWithinWorkspace(
	rawFile: string,
	cwd: string,
): { fullPath: string; relPath: string } | null {
	const fullPath = isAbsolute(rawFile) ? rawFile : resolve(cwd, rawFile);
	const relPath = relative(cwd, fullPath).replace(/\\/g, "/");

	// Reject paths that escape the workspace
	if (relPath.startsWith("..") || isAbsolute(relPath)) {
		return null;
	}

	return { fullPath, relPath };
}

/**
 * Create runtime hooks for post-edit validation.
 */
export function createPostEditValidationHooks(
	options: PostEditValidationOptions = {},
): AgentRuntimeHooks {
	const runner = options.runner ?? defaultValidationRunner;
	const timeoutMs = options.timeoutMs ?? DEFAULT_VALIDATION_TIMEOUT_MS;
	const maxOutputChars = options.maxOutputChars ?? DEFAULT_MAX_OUTPUT_CHARS;
	const logger = options.logger;

	return {
		afterTool: async (
			context: AgentAfterToolContext,
		): Promise<AgentAfterToolResult | undefined> => {
			const toolName = context.tool?.name ?? context.toolCall?.toolName;
			if (toolName !== "editor" && toolName !== "apply_patch") {
				return undefined;
			}

			// If the tool failed execution, do not attempt to validate
			if (context.result?.isError) {
				return undefined;
			}
			if (
				context.result?.output &&
				typeof context.result.output === "object" &&
				(context.result.output as { success?: boolean }).success === false
			) {
				return undefined;
			}

			const cwd = options.cwd ?? process.cwd();

			// Extract target files based on tool
			const rawFiles =
				toolName === "editor"
					? extractModifiedFilesFromEditor(context.input)
					: extractModifiedFilesFromPatch(context.input);

			if (rawFiles.length === 0) {
				return undefined;
			}

			// Resolve available validators
			let availableValidators: ValidatorDefinition[] = [];
			if (options.validators && options.validators.length > 0) {
				availableValidators.push(...options.validators);
				if (options.autoDetect !== false) {
					const detected = detectWorkspaceValidators(cwd);
					for (const d of detected) {
						if (!availableValidators.some((v) => v.name === d.name)) {
							availableValidators.push(d);
						}
					}
				}
			} else if (options.autoDetect !== false) {
				availableValidators = detectWorkspaceValidators(cwd);
			}

			if (availableValidators.length === 0) {
				return undefined;
			}

			const diagnostics: ValidationDiagnostic[] = [];
			const aggregateDeadline =
				Date.now() +
				(options.aggregateTimeoutMs ?? DEFAULT_AGGREGATE_TIMEOUT_MS);

			// Track which project-wide validators have already been run (once per invocation)
			const projectWideRan = new Set<string>();

			// Enforce max files cap
			const filesToValidate = rawFiles.slice(0, MAX_FILES_PER_INVOCATION);

			for (const rawFile of filesToValidate) {
				// Aggregate time budget check
				if (Date.now() >= aggregateDeadline) {
					logger?.log?.(
						"[post-edit-validation] Aggregate time budget exceeded; stopping further validation.",
					);
					break;
				}

				// Path traversal protection
				const validated = validatePathWithinWorkspace(rawFile, cwd);
				if (!validated) {
					logger?.log?.(
						`[post-edit-validation] Skipping file outside workspace: ${rawFile}`,
					);
					continue;
				}

				const { fullPath, relPath } = validated;

				// Only validate files that exist on disk
				if (!existsSync(fullPath)) {
					continue;
				}

				const matchingValidators = findValidatorsForFile(
					fullPath,
					availableValidators,
				);

				for (const validator of matchingValidators) {
					// Aggregate time budget check before each validator
					if (Date.now() >= aggregateDeadline) {
						logger?.log?.(
							"[post-edit-validation] Aggregate time budget exceeded; stopping further validation.",
						);
						break;
					}

					// Project-wide validators run only once per invocation, not per file
					if (validator.wholeProject) {
						if (projectWideRan.has(validator.name)) {
							continue;
						}
						projectWideRan.add(validator.name);
					}

					// Prepare args: replace {file} with relPath, or append relPath if placeholder not present
					let finalArgs: string[] = [];
					if (validator.args && validator.args.length > 0) {
						let hasPlaceholder = false;
						finalArgs = validator.args.map((arg) => {
							if (arg.includes("{file}")) {
								hasPlaceholder = true;
								return arg.replace(/\{file\}/g, relPath);
							}
							return arg;
						});
						// If command is file-targeted and no placeholder was present, append file
						if (!hasPlaceholder && !validator.wholeProject) {
							finalArgs.push(relPath);
						}
					} else if (!validator.wholeProject) {
						finalArgs = [relPath];
					}

					try {
						const result = await runner(validator.command, finalArgs, {
							cwd,
							timeoutMs: validator.timeoutMs ?? timeoutMs,
						});

						if (result.timedOut) {
							diagnostics.push({
								file: validator.wholeProject ? "(project)" : relPath,
								validator: validator.name,
								output: `Validation timed out after ${validator.timeoutMs ?? timeoutMs}ms`,
								exitCode: null,
								timedOut: true,
							});
							continue;
						}

						if (result.error) {
							// Command execution error (e.g. executable not found)
							const errCode = (result.error as { code?: string }).code;
							if (errCode === "ENOENT") {
								// Binary not installed in environment, log and continue safely
								logger?.log?.(
									`[post-edit-validation] Validator "${validator.name}" (${validator.command}) not found in PATH; skipping.`,
								);
								continue;
							}
							diagnostics.push({
								file: validator.wholeProject ? "(project)" : relPath,
								validator: validator.name,
								output: result.error.message,
								exitCode: null,
							});
							continue;
						}

						// If exit code is non-zero, errors or warnings were reported
						if (result.exitCode !== 0 && result.exitCode !== null) {
							const rawOutput = (
								result.stderr.trim()
									? `${result.stderr}\n${result.stdout}`
									: result.stdout
							).trim();

							if (rawOutput) {
								diagnostics.push({
									file: validator.wholeProject ? "(project)" : relPath,
									validator: validator.name,
									output: rawOutput,
									exitCode: result.exitCode,
								});
							}
						}
					} catch (err) {
						logger?.log?.(
							`[post-edit-validation] Error running validator "${validator.name}": ${String(err)}`,
						);
					}
				}
			}

			if (diagnostics.length === 0) {
				return undefined;
			}

			const appendContext = formatValidationDiagnostics(
				diagnostics,
				maxOutputChars,
			);
			return { appendContext };
		},
	};
}

/**
 * Create an AgentExtension that provides post-edit validation via afterTool hook.
 */
export function createPostEditValidationExtension(
	options: PostEditValidationOptions = {},
): AgentExtension {
	return {
		name: POST_EDIT_VALIDATION_EXTENSION_NAME,
		manifest: {
			capabilities: ["hooks"],
		},
		hooks: createPostEditValidationHooks(options),
	};
}
