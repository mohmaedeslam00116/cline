/**
 * Post-Edit Validation Runner
 *
 * Executes linter and compiler processes safely with timeouts and output capture.
 */

import { spawn } from "node:child_process";
import { platform } from "node:os";
import type { PostEditValidationRunner, ValidationRunnerResult } from "./types";

export const DEFAULT_VALIDATION_TIMEOUT_MS = 5000;
export const DEFAULT_MAX_OUTPUT_CHARS = 4000;

export const defaultValidationRunner: PostEditValidationRunner = async (
	command,
	args,
	options,
): Promise<ValidationRunnerResult> => {
	const isWindows = platform() === "win32";
	const executable = isWindows ? process.env.COMSPEC || "cmd.exe" : command;
	const spawnArgs = isWindows ? ["/d", "/s", "/c", command, ...args] : args;

	return new Promise<ValidationRunnerResult>((resolve) => {
		let settled = false;
		let timedOut = false;
		let timeoutId: NodeJS.Timeout | undefined;

		const child = spawn(executable, spawnArgs, {
			cwd: options.cwd,
			env: options.env ?? process.env,
			shell: false,
			stdio: ["ignore", "pipe", "pipe"],
			windowsHide: true,
		});

		let stdout = "";
		let stderr = "";

		child.stdout?.on("data", (chunk: Buffer | string) => {
			stdout += chunk.toString();
		});

		child.stderr?.on("data", (chunk: Buffer | string) => {
			stderr += chunk.toString();
		});

		child.once("error", (error) => {
			if (settled) return;
			settled = true;
			if (timeoutId) clearTimeout(timeoutId);
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
				child.kill("SIGTERM");
				setTimeout(() => {
					if (!settled) {
						child.kill("SIGKILL");
					}
				}, 1000);
			}, options.timeoutMs);
		}
	});
};
