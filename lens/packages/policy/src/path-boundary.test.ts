import { describe, expect, it } from "bun:test";
import { resolveSafePath, scopeCoversPath } from "./path-boundary.js";
import { LensPortError } from "@lens/ports";

describe("resolveSafePath", () => {
	it("resolves a normal relative path (POSIX and Windows separators)", () => {
		const posix = resolveSafePath("/workspace", "src/index.ts");
		expect(posix.relativePath).toBe("src/index.ts");
		expect(posix.absolutePath).toBe("/workspace/src/index.ts");

		const win = resolveSafePath("C:\\ws", "src\\index.ts");
		expect(win.relativePath).toBe("src/index.ts");
		expect(win.absolutePath).toBe("C:\\ws\\src\\index.ts");
	});

	it("accepts the root itself", () => {
		const r = resolveSafePath("/workspace", "");
		expect(r.relativePath).toBe("");
		expect(r.absolutePath).toBe("/workspace");
	});

	it("normalizes inner . and .. that stay inside the root", () => {
		const r = resolveSafePath("/workspace", "src/./a/../b.ts");
		expect(r.relativePath).toBe("src/b.ts");
	});

	it("rejects traversal above the root", () => {
		expect(() => resolveSafePath("/workspace", "../secret")).toThrow(LensPortError);
		try {
			resolveSafePath("/workspace", "a/../../b");
		} catch (e) {
			expect((e as LensPortError).code).toBe("SECURITY_ACCESS_DENIED");
		}
	});

	it("rejects absolute and drive/UNC shapes", () => {
		expect(() => resolveSafePath("/workspace", "/etc/passwd")).toThrow(LensPortError);
		expect(() => resolveSafePath("C:\\ws", "C:\\Windows\\system32")).toThrow(LensPortError);
		expect(() => resolveSafePath("C:\\ws", "\\\\server\\share")).toThrow(LensPortError);
	});

	it("rejects null bytes and empty roots", () => {
		expect(() => resolveSafePath("/workspace", "a\0b")).toThrow(LensPortError);
		expect(() => resolveSafePath("", "a")).toThrow(LensPortError);
	});
});

describe("scopeCoversPath", () => {
	const grant = (workspaceRoot: string, pathPrefixes?: string[]) => ({ scope: { workspaceRoot, pathPrefixes } });

	it("covers everything when no prefixes are set", () => {
		const resolved = resolveSafePath("/workspace", "src/index.ts");
		expect(scopeCoversPath(grant("/workspace"), resolved)).toBe(true);
	});

	it("enforces component-aligned prefixes (no ../ tricks)", () => {
		const resolved = resolveSafePath("/workspace", "src/index.ts");
		expect(scopeCoversPath(grant("/workspace", ["src"]), resolved)).toBe(true);
		expect(scopeCoversPath(grant("/workspace", ["srcs"]), resolved)).toBe(false);
		expect(scopeCoversPath(grant("/workspace", ["src/other"]), resolved)).toBe(false);
	});

	it("requires the same workspace root", () => {
		const resolved = resolveSafePath("/workspace", "src/index.ts");
		expect(scopeCoversPath(grant("/other"), resolved)).toBe(false);
	});
});
