/**
 * Post-Edit Validation Subsystem Tests
 */

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
	AgentAfterToolContext,
	AgentRuntimeStateSnapshot,
	AgentTool,
} from "@cline/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DefaultRuntimeBuilder } from "../runtime/orchestration/runtime-builder";
import type { CoreSessionConfig } from "../types/config";
import { detectWorkspaceValidators, findValidatorsForFile } from "./detector";
import {
	createPostEditValidationExtension,
	createPostEditValidationHooks,
	extractModifiedFilesFromEditor,
	extractModifiedFilesFromPatch,
	formatValidationDiagnostics,
	POST_EDIT_VALIDATION_EXTENSION_NAME,
} from "./post-edit-validation";
import type {
	PostEditValidationRunner,
	ValidationDiagnostic,
	ValidatorDefinition,
} from "./types";

function makeSnapshot(): AgentRuntimeStateSnapshot {
	return {
		agentId: "agent-test",
		conversationId: "conv-test",
		runId: "run-test",
		status: "running",
		iteration: 1,
		messages: [],
		pendingToolCalls: [],
		usage: {
			inputTokens: 0,
			outputTokens: 0,
			totalTokens: 0,
		},
	} as unknown as AgentRuntimeStateSnapshot;
}

function makeAfterToolContext(options: {
	toolName: string;
	input: unknown;
	isError?: boolean;
	output?: unknown;
}): AgentAfterToolContext {
	return {
		snapshot: makeSnapshot(),
		tool: { name: options.toolName } as AgentTool,
		toolCall: {
			type: "tool-call",
			toolCallId: "tool-123",
			toolName: options.toolName,
			input: options.input,
		},
		input: options.input,
		result: {
			output: options.output ?? "success",
			isError: options.isError ?? false,
		},
		startedAt: new Date(),
		endedAt: new Date(),
		durationMs: 10,
	};
}

describe("extractModifiedFilesFromEditor", () => {
	it("extracts path from valid editor input", () => {
		const files = extractModifiedFilesFromEditor({
			path: "src/index.ts",
			new_text: "const x = 1;",
		});
		expect(files).toEqual(["src/index.ts"]);
	});

	it("returns empty array for invalid or missing path", () => {
		expect(extractModifiedFilesFromEditor({})).toEqual([]);
		expect(extractModifiedFilesFromEditor(null)).toEqual([]);
		expect(extractModifiedFilesFromEditor("not-an-object")).toEqual([]);
		expect(extractModifiedFilesFromEditor({ path: "" })).toEqual([]);
		expect(extractModifiedFilesFromEditor({ path: "   " })).toEqual([]);
	});
});

describe("extractModifiedFilesFromPatch", () => {
	it("extracts paths from Update and Add file markers in patch string", () => {
		const patch = `*** Begin Patch
*** Update File: src/components/Button.tsx
@@ -1,3 +1,3 @@
-const a = 1;
+const a = 2;
*** Add File: src/components/Badge.tsx
+export const Badge = () => null;
*** End Patch`;

		const files = extractModifiedFilesFromPatch(patch);
		expect(files).toEqual([
			"src/components/Button.tsx",
			"src/components/Badge.tsx",
		]);
	});

	it("extracts paths from object with input property", () => {
		const files = extractModifiedFilesFromPatch({
			input: "*** Update File: main.go\n@@ ...\n",
		});
		expect(files).toEqual(["main.go"]);
	});

	it("handles empty or unrelated content gracefully", () => {
		expect(extractModifiedFilesFromPatch("")).toEqual([]);
		expect(extractModifiedFilesFromPatch(null)).toEqual([]);
		expect(extractModifiedFilesFromPatch({ other: 123 })).toEqual([]);
	});
});

describe("formatValidationDiagnostics", () => {
	it("formats diagnostics with bilingual header and markdown blocks", () => {
		const diags: ValidationDiagnostic[] = [
			{
				file: "src/utils.ts",
				validator: "tsc",
				output: "src/utils.ts:5:2 - error TS2304: Cannot find name 'x'.",
				exitCode: 1,
			},
		];

		const formatted = formatValidationDiagnostics(diags);
		expect(formatted).toContain("[Post-Edit Validation / فحص ما بعد التعديل]");
		expect(formatted).toContain("### src/utils.ts (tsc)");
		expect(formatted).toContain("error TS2304: Cannot find name 'x'.");
		expect(formatted).toContain("Please analyze and fix these syntax");
	});

	it("formats timeout diagnostics", () => {
		const diags: ValidationDiagnostic[] = [
			{
				file: "src/large.ts",
				validator: "tsc",
				output: "Validation timed out after 5000ms",
				exitCode: null,
				timedOut: true,
			},
		];

		const formatted = formatValidationDiagnostics(diags);
		expect(formatted).toContain("### src/large.ts (tsc - timed out)");
	});

	it("truncates long output when exceeding maxChars", () => {
		const diags: ValidationDiagnostic[] = [
			{
				file: "src/huge.ts",
				validator: "eslint",
				output: "A".repeat(1000),
				exitCode: 1,
			},
		];

		const formatted = formatValidationDiagnostics(diags, 200);
		expect(formatted.length).toBeLessThanOrEqual(200);
		expect(formatted).toContain("truncated output / تم اقتطاع المخرجات");
	});
});

describe("detectWorkspaceValidators and findValidatorsForFile", () => {
	let testDir: string;

	beforeEach(() => {
		testDir = join(
			tmpdir(),
			`cline-test-val-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		);
		mkdirSync(testDir, { recursive: true });
	});

	afterEach(() => {
		rmSync(testDir, { recursive: true, force: true });
	});

	it("detects Biome when biome.json exists", () => {
		writeFileSync(join(testDir, "biome.json"), "{}");
		const validators = detectWorkspaceValidators(testDir);
		expect(validators.some((v) => v.name === "biome")).toBe(true);

		const matching = findValidatorsForFile(join(testDir, "app.ts"), validators);
		expect(matching.some((v) => v.name === "biome")).toBe(true);
	});

	it("detects tsc when tsconfig.json exists", () => {
		writeFileSync(join(testDir, "tsconfig.json"), "{}");
		const validators = detectWorkspaceValidators(testDir);
		expect(validators.some((v) => v.name === "tsc")).toBe(true);

		const matching = findValidatorsForFile(
			join(testDir, "app.tsx"),
			validators,
		);
		expect(matching.some((v) => v.name === "tsc")).toBe(true);
	});

	it("detects Python checkers when pyproject.toml exists", () => {
		writeFileSync(join(testDir, "pyproject.toml"), "");
		const validators = detectWorkspaceValidators(testDir);
		expect(
			validators.some((v) => v.name === "py_compile" || v.name === "ruff"),
		).toBe(true);

		const matching = findValidatorsForFile(
			join(testDir, "script.py"),
			validators,
		);
		expect(matching.length).toBeGreaterThan(0);
	});

	it("detects Cargo when Cargo.toml exists", () => {
		writeFileSync(join(testDir, "Cargo.toml"), "");
		const validators = detectWorkspaceValidators(testDir);
		expect(validators.some((v) => v.name === "cargo")).toBe(true);
	});

	it("returns empty array for files with unknown extensions", () => {
		const validators: ValidatorDefinition[] = [
			{ name: "tsc", fileExtensions: [".ts"], command: "tsc" },
		];
		expect(findValidatorsForFile("image.png", validators)).toEqual([]);
	});
});

describe("createPostEditValidationHooks", () => {
	let testDir: string;

	beforeEach(() => {
		testDir = join(
			tmpdir(),
			`cline-val-hook-${Date.now()}-${Math.random().toString(36).slice(2)}`,
		);
		mkdirSync(testDir, { recursive: true });
	});

	afterEach(() => {
		rmSync(testDir, { recursive: true, force: true });
	});

	it("skips non-editing tools", async () => {
		const mockRunner = vi.fn();
		const hooks = createPostEditValidationHooks({
			cwd: testDir,
			runner: mockRunner,
		});

		const result = await hooks.afterTool?.(
			makeAfterToolContext({
				toolName: "read_files",
				input: { paths: ["index.ts"] },
			}),
		);

		expect(result).toBeUndefined();
		expect(mockRunner).not.toHaveBeenCalled();
	});

	it("skips failed tool operations", async () => {
		const mockRunner = vi.fn();
		const hooks = createPostEditValidationHooks({
			cwd: testDir,
			runner: mockRunner,
		});

		const result = await hooks.afterTool?.(
			makeAfterToolContext({
				toolName: "editor",
				input: { path: "test.ts" },
				isError: true,
			}),
		);

		expect(result).toBeUndefined();
		expect(mockRunner).not.toHaveBeenCalled();
	});

	it("skips tools reporting output.success = false", async () => {
		const mockRunner = vi.fn();
		const hooks = createPostEditValidationHooks({
			cwd: testDir,
			runner: mockRunner,
		});

		const result = await hooks.afterTool?.(
			makeAfterToolContext({
				toolName: "editor",
				input: { path: "test.ts" },
				output: { success: false, error: "File not found" },
			}),
		);

		expect(result).toBeUndefined();
		expect(mockRunner).not.toHaveBeenCalled();
	});

	it("returns undefined when validator passes with zero exit code", async () => {
		const testFile = join(testDir, "clean.ts");
		writeFileSync(testFile, "export const x = 1;");

		const mockRunner: PostEditValidationRunner = vi.fn(async () => ({
			exitCode: 0,
			stdout: "All checks passed!",
			stderr: "",
		}));

		const hooks = createPostEditValidationHooks({
			cwd: testDir,
			validators: [
				{
					name: "test-linter",
					fileExtensions: [".ts"],
					command: "test-linter",
					args: ["{file}"],
				},
			],
			autoDetect: false,
			runner: mockRunner,
		});

		const result = await hooks.afterTool?.(
			makeAfterToolContext({
				toolName: "editor",
				input: { path: "clean.ts" },
			}),
		);

		expect(mockRunner).toHaveBeenCalledTimes(1);
		expect(mockRunner).toHaveBeenCalledWith(
			"test-linter",
			["clean.ts"],
			expect.objectContaining({ cwd: testDir }),
		);
		expect(result).toBeUndefined();
	});

	it("injects appendContext when validator reports syntax/lint errors", async () => {
		const testFile = join(testDir, "error.ts");
		writeFileSync(testFile, "const broken = ;");

		const mockRunner: PostEditValidationRunner = vi.fn(async () => ({
			exitCode: 1,
			stdout: "",
			stderr: "error.ts:1:16: Expected expression but found ';'",
		}));

		const hooks = createPostEditValidationHooks({
			cwd: testDir,
			validators: [
				{
					name: "biome",
					fileExtensions: [".ts"],
					command: "biome",
					args: ["check", "{file}"],
				},
			],
			autoDetect: false,
			runner: mockRunner,
		});

		const result = await hooks.afterTool?.(
			makeAfterToolContext({
				toolName: "editor",
				input: { path: "error.ts" },
			}),
		);

		expect(mockRunner).toHaveBeenCalledTimes(1);
		expect(result).toBeDefined();
		expect(result?.appendContext).toContain(
			"[Post-Edit Validation / فحص ما بعد التعديل]",
		);
		expect(result?.appendContext).toContain("### error.ts (biome)");
		expect(result?.appendContext).toContain(
			"Expected expression but found ';'",
		);
	});

	it("handles apply_patch tool calls with multiple files", async () => {
		const fileA = join(testDir, "fileA.ts");
		const fileB = join(testDir, "fileB.ts");
		writeFileSync(fileA, "export const a = 1;");
		writeFileSync(fileB, "export const b = 2;");

		const mockRunner: PostEditValidationRunner = vi.fn(
			async (_command, args) => {
				const target = args[0];
				if (target === "fileB.ts") {
					return {
						exitCode: 1,
						stdout: "fileB.ts has syntax error",
						stderr: "",
					};
				}
				return { exitCode: 0, stdout: "", stderr: "" };
			},
		);

		const hooks = createPostEditValidationHooks({
			cwd: testDir,
			validators: [
				{
					name: "custom-validator",
					fileExtensions: [".ts"],
					command: "custom-validator",
					args: ["{file}"],
				},
			],
			autoDetect: false,
			runner: mockRunner,
		});

		const patch = `*** Begin Patch
*** Update File: fileA.ts
@@ -1 +1 @@
-export const a = 1;
+export const a = 2;
*** Update File: fileB.ts
@@ -1 +1 @@
-export const b = 2;
+export const b = broken;
*** End Patch`;

		const result = await hooks.afterTool?.(
			makeAfterToolContext({
				toolName: "apply_patch",
				input: patch,
			}),
		);

		expect(mockRunner).toHaveBeenCalledTimes(2);
		expect(result).toBeDefined();
		expect(result?.appendContext).toContain("### fileB.ts (custom-validator)");
		expect(result?.appendContext).toContain("fileB.ts has syntax error");
		expect(result?.appendContext).not.toContain("fileA.ts");
	});

	it("ignores missing executable (ENOENT) gracefully without breaking turn", async () => {
		const testFile = join(testDir, "test.ts");
		writeFileSync(testFile, "const x = 1;");

		const noentError = new Error("spawn biome ENOENT");
		Object.assign(noentError, { code: "ENOENT" });

		const mockRunner: PostEditValidationRunner = vi.fn(async () => ({
			exitCode: null,
			stdout: "",
			stderr: "",
			error: noentError,
		}));

		const hooks = createPostEditValidationHooks({
			cwd: testDir,
			validators: [
				{
					name: "biome",
					fileExtensions: [".ts"],
					command: "biome",
				},
			],
			autoDetect: false,
			runner: mockRunner,
		});

		const result = await hooks.afterTool?.(
			makeAfterToolContext({
				toolName: "editor",
				input: { path: "test.ts" },
			}),
		);

		expect(result).toBeUndefined();
	});

	it("creates AgentExtension with manifest and afterTool hook", () => {
		const extension = createPostEditValidationExtension({
			cwd: testDir,
		});

		expect(extension.name).toBe(POST_EDIT_VALIDATION_EXTENSION_NAME);
		expect(extension.manifest?.capabilities).toContain("hooks");
		expect(extension.hooks?.afterTool).toBeTypeOf("function");
	});
});

function makeBaseConfig(
	overrides: Partial<CoreSessionConfig> = {},
): CoreSessionConfig {
	return {
		providerId: "anthropic",
		modelId: "claude-3-5-sonnet-20241022",
		apiKey: "test-key",
		systemPrompt: "You are an assistant",
		cwd: process.cwd(),
		enableTools: true,
		enableSpawnAgent: false,
		enableAgentTeams: false,
		...overrides,
	};
}

describe("DefaultRuntimeBuilder integration with postEditValidation", () => {
	it("registers post-edit validation extension when enabled in config", async () => {
		const builder = new DefaultRuntimeBuilder();
		const runtime = await builder.build({
			config: makeBaseConfig({
				postEditValidation: {
					enabled: true,
					autoDetect: false,
					validators: [
						{
							name: "test-check",
							fileExtensions: [".ts"],
							command: "test-check",
						},
					],
				},
			}),
		});

		expect(
			runtime.extensions?.some(
				(ext) => ext.name === POST_EDIT_VALIDATION_EXTENSION_NAME,
			),
		).toBe(true);
	});

	it("does not register post-edit validation extension when not enabled", async () => {
		const builder = new DefaultRuntimeBuilder();
		const runtime = await builder.build({
			config: makeBaseConfig(),
		});

		expect(
			runtime.extensions?.some(
				(ext) => ext.name === POST_EDIT_VALIDATION_EXTENSION_NAME,
			),
		).toBe(false);
	});
});
