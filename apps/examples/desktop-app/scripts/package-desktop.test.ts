import { describe, expect, test } from "bun:test";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
	APP_NAME,
	collectLinuxArtifacts,
	collectWindowsArtifacts,
	getArgValue,
	hasArg,
	resolveRequestedPlatform,
	sanitizeName,
	validateArgs,
} from "./package-desktop";

describe("package-desktop branding & configuration", () => {
	test("identifies as LENS Workstation", () => {
		expect(APP_NAME).toBe("LENS Workstation");
	});

	test("sanitizes product name for artifact filenames", () => {
		expect(sanitizeName(APP_NAME)).toBe("LENS-Workstation");
		expect(sanitizeName("LENS Workstation Beta")).toBe("LENS-Workstation-Beta");
		expect(sanitizeName("!Invalid @Name#")).toBe("Invalid-Name");
	});
});

describe("package-desktop argument validation", () => {
	test("accepts valid packaging arguments", () => {
		expect(() => validateArgs([])).not.toThrow();
		expect(() => validateArgs(["--skip-build"])).not.toThrow();
		expect(() => validateArgs(["--allow-unsigned-mac"])).not.toThrow();
		expect(() => validateArgs(["--platform", "windows"])).not.toThrow();
		expect(() => validateArgs(["--platform=mac"])).not.toThrow();
		expect(() => validateArgs(["--target", "linux"])).not.toThrow();
		expect(() => validateArgs(["--target=current"])).not.toThrow();
		expect(() =>
			validateArgs(["--skip-build", "--platform", "windows"]),
		).not.toThrow();
	});

	test("rejects unknown options with helpful suggestions when prefix matches", () => {
		expect(() => validateArgs(["--plat", "windows"])).toThrow(
			/unknown option --plat\. Did you mean --platform\?/,
		);
		expect(() => validateArgs(["--unknown-flag"])).toThrow(
			/unknown option --unknown-flag/,
		);
	});

	test("rejects missing value for value flags", () => {
		expect(() => validateArgs(["--platform"])).toThrow(
			/missing value for --platform/,
		);
		expect(() => validateArgs(["--platform", "--skip-build"])).toThrow(
			/missing value for --platform/,
		);
		expect(() => validateArgs(["--target"])).toThrow(
			/missing value for --target/,
		);
	});

	test("rejects positional arguments", () => {
		expect(() => validateArgs(["build"])).toThrow(/unexpected argument build/);
	});
});

describe("package-desktop argument helpers & platform resolution", () => {
	test("extracts argument values whether separated by space or equals", () => {
		const argsSpace = ["node", "package-desktop.ts", "--platform", "windows"];
		const argsEquals = ["node", "package-desktop.ts", "--platform=mac"];

		expect(getArgValue("--platform", argsSpace)).toBe("windows");
		expect(getArgValue("--platform", argsEquals)).toBe("mac");
		expect(getArgValue("--missing", argsSpace)).toBeUndefined();
	});

	test("detects presence of flags", () => {
		const args = ["node", "package-desktop.ts", "--skip-build"];
		expect(hasArg("--skip-build", args)).toBe(true);
		expect(hasArg("--allow-unsigned-mac", args)).toBe(false);
	});

	test("resolves requested platform from arguments", () => {
		expect(
			resolveRequestedPlatform([
				"node",
				"package-desktop.ts",
				"--platform",
				"windows",
			]),
		).toBe("windows");

		expect(
			resolveRequestedPlatform([
				"node",
				"package-desktop.ts",
				"--platform=mac",
			]),
		).toBe("mac");

		expect(
			resolveRequestedPlatform([
				"node",
				"package-desktop.ts",
				"--target=linux",
			]),
		).toBe("linux");

		expect(() =>
			resolveRequestedPlatform([
				"node",
				"package-desktop.ts",
				"--platform=invalid-os",
			]),
		).toThrow(/unsupported platform "invalid-os"/);
	});
});

describe("package-desktop artifact collection", () => {
	test("collects Windows MSI and EXE installers into output package root", () => {
		const tempBase = mkdtempSync(path.join(tmpdir(), "lens-pkg-test-"));
		const mockBundleRoot = path.join(tempBase, "bundle");
		const mockPackageRoot = path.join(tempBase, "dist", "desktop");

		mkdirSync(path.join(mockBundleRoot, "msi"), { recursive: true });
		mkdirSync(path.join(mockBundleRoot, "nsis"), { recursive: true });

		const msiFile = path.join(
			mockBundleRoot,
			"msi",
			"LENS-Workstation_0.0.25_x64_en-US.msi",
		);
		const exeFile = path.join(
			mockBundleRoot,
			"nsis",
			"LENS-Workstation_0.0.25_x64-setup.exe",
		);
		const txtFile = path.join(mockBundleRoot, "notes.txt");

		writeFileSync(msiFile, "mock msi");
		writeFileSync(exeFile, "mock exe");
		writeFileSync(txtFile, "ignore me");

		try {
			mkdirSync(mockPackageRoot, { recursive: true });
			const artifacts = collectWindowsArtifacts(
				mockBundleRoot,
				mockPackageRoot,
			);

			expect(artifacts).toHaveLength(2);
			expect(
				artifacts.some((a) =>
					a.endsWith("LENS-Workstation_0.0.25_x64_en-US.msi"),
				),
			).toBe(true);
			expect(
				artifacts.some((a) =>
					a.endsWith("LENS-Workstation_0.0.25_x64-setup.exe"),
				),
			).toBe(true);

			for (const artifact of artifacts) {
				expect(existsSync(artifact)).toBe(true);
			}
		} finally {
			rmSync(tempBase, { force: true, recursive: true });
		}
	});

	test("collects Linux AppImage, DEB, and RPM packages", () => {
		const tempBase = mkdtempSync(path.join(tmpdir(), "lens-pkg-linux-"));
		const mockBundleRoot = path.join(tempBase, "bundle");
		const mockPackageRoot = path.join(tempBase, "dist", "desktop");

		mkdirSync(path.join(mockBundleRoot, "appimage"), { recursive: true });
		mkdirSync(path.join(mockBundleRoot, "deb"), { recursive: true });
		mkdirSync(path.join(mockBundleRoot, "rpm"), { recursive: true });

		const appImage = path.join(
			mockBundleRoot,
			"appimage",
			"lens-workstation_0.0.25_amd64.AppImage",
		);
		const deb = path.join(
			mockBundleRoot,
			"deb",
			"lens-workstation_0.0.25_amd64.deb",
		);
		const rpm = path.join(
			mockBundleRoot,
			"rpm",
			"lens-workstation-0.0.25-1.x86_64.rpm",
		);

		writeFileSync(appImage, "mock appimage");
		writeFileSync(deb, "mock deb");
		writeFileSync(rpm, "mock rpm");

		try {
			mkdirSync(mockPackageRoot, { recursive: true });
			const artifacts = collectLinuxArtifacts(mockBundleRoot, mockPackageRoot);

			expect(artifacts).toHaveLength(3);
			for (const artifact of artifacts) {
				expect(existsSync(artifact)).toBe(true);
			}
		} finally {
			rmSync(tempBase, { force: true, recursive: true });
		}
	});
});
