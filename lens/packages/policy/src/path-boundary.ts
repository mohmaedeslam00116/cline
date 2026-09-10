/**
 * Path boundary — the containment wall for every workspace-relative path
 * crossing a LENS port. Pure string logic (no filesystem, no Node APIs):
 * the filesystem adapter layers real-checks (symlinks, case-insensitive
 * volumes) on top of this canonical gate.
 *
 * Windows-aware: accepts POSIX-style relative input, resolves against a
 * canonical root, and rejects traversal, null bytes, drive-absolute and
 * UNC shapes regardless of separator style.
 */
import { LensPortError } from "@lens/ports";

export interface ResolvedWorkspacePath {
	/** Canonical root the path was resolved against. */
	workspaceRoot: string;
	/** Normalized relative path: POSIX separators, no leading "./". */
	relativePath: string;
	/** Platform-joined absolute path (native separators). */
	absolutePath: string;
}

function isDriveAbsolute(p: string): boolean {
	return /^[a-zA-Z]:/.test(p) || p.startsWith("\\\\");
}

function hasEscapedRoot(rel: string[]): boolean {
	let depth = 0;
	for (const part of rel) {
		if (part === "..") {
			depth -= 1;
			if (depth < 0) return true;
		} else if (part !== ".") {
			depth += 1;
		}
	}
	return false;
}

/**
 * Resolve and validate `relativePath` against `workspaceRoot`.
 * Throws `LensPortError("SECURITY_ACCESS_DENIED")` on any boundary escape.
 */
export function resolveSafePath(workspaceRoot: string, relativePath: string): ResolvedWorkspacePath {
	if (workspaceRoot.length === 0) {
		throw new LensPortError("SECURITY_ACCESS_DENIED", "workspace root is empty");
	}
	if (relativePath.includes("\0")) {
		throw new LensPortError("SECURITY_ACCESS_DENIED", "null byte in path");
	}
	if (relativePath.length === 0) {
		// The root itself is a valid read target. Preserve the root separator:
		// POSIX "/" must stay "/", and "C:\" must not degrade to the
		// drive-relative "C:".
		const stripped = workspaceRoot.replace(/[\\/]+$/, "");
		const root = stripped.length === 0 || /^[a-zA-Z]:$/.test(stripped)
			? workspaceRoot
			: stripped;
		return { workspaceRoot: root, relativePath: "", absolutePath: root };
	}
	if (relativePath.startsWith("/") || relativePath.startsWith("\\") || isDriveAbsolute(relativePath)) {
		throw new LensPortError("SECURITY_ACCESS_DENIED", `absolute path rejected: ${JSON.stringify(relativePath.slice(0, 64))}`);
	}

	const parts = relativePath.split(/[\\/]/).filter((p) => p.length > 0);
	if (hasEscapedRoot(parts)) {
		throw new LensPortError("SECURITY_ACCESS_DENIED", "path traversal above workspace root rejected");
	}

	// Escape-check passed: resolve `.` / `..` canonically.
	const resolved: string[] = [];
	for (const part of parts) {
		if (part === ".") continue;
		if (part === "..") resolved.pop();
		else resolved.push(part);
	}

	const root = workspaceRoot.replace(/[\\/]+$/, "");
	const normalized = resolved.join("/");
	const sep = root.includes("\\") ? "\\" : "/";
	const absolutePath = resolved.length > 0 ? root + sep + resolved.join(sep) : root;

	return { workspaceRoot: root, relativePath: normalized, absolutePath };
}

/** Check a grant's scope covers the resolved path (prefix semantics, component-aligned). */
export function scopeCoversPath(
	grant: { scope: { workspaceRoot: string; pathPrefixes?: string[] } },
	resolved: ResolvedWorkspacePath,
): boolean {
	const grantRoot = grant.scope.workspaceRoot.replace(/[\\/]+$/, "");
	if (grantRoot !== resolved.workspaceRoot) return false;
	const prefixes = grant.scope.pathPrefixes;
	if (!prefixes || prefixes.length === 0) return true;
	const segments = resolved.relativePath.length === 0 ? [] : resolved.relativePath.split("/");
	return prefixes.some((prefix) => {
		const clean = prefix.replace(/^[\\/]+|[\\/]+$/g, "");
		if (clean.length === 0) return true;
		const prefixSegments = clean.split(/[\\/]+/);
		return prefixSegments.every((seg, i) => segments[i] === seg);
	});
}
