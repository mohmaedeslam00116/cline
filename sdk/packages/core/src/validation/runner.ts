/**
 * Post-Edit Validation Runner
 *
 * Executes linter and compiler processes safely with timeouts and output capture.
 */

import { type ChildProcess, execFileSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";
import { join } from "node:path";
import type { PostEditValidationRunner, ValidationRunnerResult } from "./types";

export const DEFAULT_VALIDATION_TIMEOUT_MS = 5000;
export const DEFAULT_MAX_OUTPUT_CHARS = 4000;

/** Maximum buffer size per stream during capture (2× output cap). */
const MAX_BUFFER_CHARS = DEFAULT_MAX_OUTPUT_CHARS * 2;

/** Characters that can cause command injection in cmd.exe. */
const DANGEROUS_CMD_CHARS = /[\r\n\0&|<>^]/;

/**
 * Resolve a command name to its executable on Windows.
 * Returns the resolved path and whether it is a .cmd/.bat shim.
 */
function resolveWindowsCommand(
	command: string,
	cwd?: string,
): {
	resolved: string;
	isBatchShim: boolean;
} {
	// If command is already a path or directly exists
	if (command.includes("/") || command.includes("\\")) {
		const lower = command.toLowerCase();
		return {
			resolved: command,
			isBatchShim: lower.endsWith(".cmd") || lower.endsWith(".bat"),
		};
	}

	const extensions = [".cmd", ".bat", ".exe"];
	const pathDirs: string[] = [];
	if (cwd) {
		pathDirs.push(join(cwd, "node_modules", ".bin"));
	}
	if (process.env.PATH) {
		pathDirs.push(...process.env.PATH.split(";"));
	}

	for (const dir of pathDirs) {
		for (const ext of extensions) {
			const candidate = join(dir, `${command}${ext}`);
			if (existsSync(candidate)) {
				return {
					resolved: candidate,
					isBatchShim: ext === ".cmd" || ext === ".bat",
				};
			}
		}
	}

	// Fallback: let spawn handle resolution (will ENOENT if not found)
	return { resolved: command, isBatchShim: false };
}

/**
 * Kill an entire process tree. On Windows uses taskkill /T /F.
 * On Unix sends signal to the process group (negative PID).
 */
function killProcessTree(
	child: ChildProcess,
	signal: NodeJS.Signals,
	isWindows: boolean,
): void {
	const pid = child.pid;
	if (!pid) {
		child.kill(signal);
		return;
	}

	if (isWindows) {
		try {
			execFileSync("taskkill.exe", ["/PID", String(pid), "/T", "/F"], {
				stdio: "ignore",
			});
		} catch {
			// Process may have already exited
			child.kill(signal);
		}
	} else {
		// Send to process group (negative PID)
		try {
			process.kill(-pid, signal);
		} catch {
			// Process group may have already exited
			child.kill(signal);
		}
	}
}

export const defaultValidationRunner: PostEditValidationRunner = async (
	command,
	args,
	options,
): Promise<ValidationRunnerResult> => {
	const isWindows = platform() === "win32";

	let executable: string;
	let spawnArgs: string[];

	if (isWindows) {
		const { resolved, isBatchShim } = resolveWindowsCommand(
			command,
			options.cwd,
		);
		if (isBatchShim) {
			// Validate arguments for batch shims on Windows to prevent CWE-78 command injection
			for (const arg of args) {
				if (DANGEROUS_CMD_CHARS.test(arg)) {
					return {
						exitCode: null,
						stdout: "",
						stderr: "",
						error: new Error(
							`Disallowed character in validator argument for batch shim: ${arg}`,
						),
					};
				}
			}

			// .cmd/.bat shims must be run through cmd.exe
			executable = process.env.COMSPEC || "cmd.exe";
			spawnArgs = ["/d", "/s", "/c", resolved, ...args];
		} else {
			// Native .exe — run directly without shell
			executable = resolved;
			spawnArgs = args;
		}
	} else {
		executable = command;
		spawnArgs = args;
	}

	return new Promise<ValidationRunnerResult>((resolve) => {
		let settled = false;
		let timedOut = false;
		let timeoutId: NodeJS.Timeout | undefined;
		let escalationId: NodeJS.Timeout | undefined;

		const child = spawn(executable, spawnArgs, {
			cwd: options.cwd,
			env: options.env ?? process.env,
			shell: false,
			stdio: ["ignore", "pipe", "pipe"],
			windowsHide: true,
			// On Unix, start in a new process group for tree termination
			...(isWindows ? {} : { detached: true }),
		});

		let stdout = "";
		let stderr = "";
		let stdoutCapped = false;
		let stderrCapped = false;

		child.stdout?.on("data", (chunk: Buffer | string) => {
			if (stdoutCapped) return;
			const text = chunk.toString();
			stdout += text;
			if (stdout.length >= MAX_BUFFER_CHARS) {
				stdout = stdout.slice(0, MAX_BUFFER_CHARS);
				stdoutCapped = true;
			}
		});

		child.stderr?.on("data", (chunk: Buffer | string) => {
			if (stderrCapped) return;
			const text = chunk.toString();
			stderr += text;
			if (stderr.length >= MAX_BUFFER_CHARS) {
				stderr = stderr.slice(0, MAX_BUFFER_CHARS);
				stderrCapped = true;
			}
		});

		child.once("error", (error) => {
			if (settled) return;
			settled = true;
			if (timeoutId) clearTimeout(timeoutId);
			if (escalationId) clearTimeout(escalationId);
			resolve({
				exitCode: null,
				stdout,
				stderr,
				error: error instanceof Error ? error : new Error(String(error)),
			});
		});

		child.once("close", (exitCode) => {
			if (settled) return;
			settled = true;
			if (timeoutId) clearTimeout(timeoutId);
			if (escalationId) clearTimeout(escalationId);
			resolve({
				exitCode,
				stdout,
				stderr,
				timedOut,
			});
		});

		if (options.timeoutMs > 0) {
			timeoutId = setTimeout(() => {
				timedOut = true;
				killProcessTree(child, "SIGTERM", isWindows);
				// Escalation: force-kill if not settled after 1 second
				escalationId = setTimeout(() => {
					if (!settled) {
						killProcessTree(child, "SIGKILL", isWindows);
					}
				}, 1000);
			}, options.timeoutMs);
		}
	});
};
