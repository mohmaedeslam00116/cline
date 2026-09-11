import {
	cpSync,
	existsSync,
	mkdirSync,
	readdirSync,
	rmSync,
	statSync,
} from "node:fs";
import path from "node:path";
import { $ } from "bun";

export type DesktopPlatform = "mac" | "windows" | "linux";

export const BOOLEAN_FLAGS = new Set(["--allow-unsigned-mac", "--skip-build"]);
export const VALUE_FLAGS = new Set(["--platform", "--target"]);
export const VALID_FLAGS = [...BOOLEAN_FLAGS, ...VALUE_FLAGS];

export const APP_NAME = "LENS Workstation";
export const APP_ROOT = path.resolve(import.meta.dir, "..");
export const BUNDLE_ROOT = path.join(
	APP_ROOT,
	"src-tauri",
	"target",
	"release",
	"bundle",
);
export const PACKAGE_ROOT = path.join(APP_ROOT, "dist", "desktop");

export const validateArgs = (args: string[] = process.argv.slice(2)): void => {
	for (let index = 0; index < args.length; index++) {
		const arg = args[index];
		if (BOOLEAN_FLAGS.has(arg)) {
			continue;
		}

		if (VALUE_FLAGS.has(arg)) {
			const value = args[index + 1];
			if (!value || value.startsWith("--")) {
				throw new Error(`missing value for ${arg}`);
			}
			index += 1;
			continue;
		}

		if (VALID_FLAGS.some((flag) => arg.startsWith(`${flag}=`))) {
			continue;
		}

		if (arg.startsWith("--")) {
			const suggestion = VALID_FLAGS.find((flag) => flag.startsWith(arg));
			throw new Error(
				suggestion
					? `unknown option ${arg}. Did you mean ${suggestion}?`
					: `unknown option ${arg}`,
			);
		}

		throw new Error(`unexpected argument ${arg}`);
	}
};

export const getArgValue = (
	name: string,
	args: string[] = process.argv,
): string | undefined => {
	const prefix = `${name}=`;
	const inline = args.find((arg) => arg.startsWith(prefix));
	if (inline) {
		return inline.slice(prefix.length);
	}

	const index = args.indexOf(name);
	if (index >= 0) {
		return args[index + 1];
	}

	return undefined;
};

export const hasArg = (name: string, args: string[] = process.argv): boolean =>
	args.includes(name);

export const hostPlatform = (): DesktopPlatform => {
	if (process.platform === "darwin") {
		return "mac";
	}
	if (process.platform === "win32") {
		return "windows";
	}
	if (process.platform === "linux") {
		return "linux";
	}
	throw new Error(`unsupported desktop packaging host: ${process.platform}`);
};

export const resolveRequestedPlatform = (
	args: string[] = process.argv,
): DesktopPlatform => {
	const platform =
		getArgValue("--platform", args) ??
		getArgValue("--target", args) ??
		"current";
	if (platform === "current") {
		return hostPlatform();
	}
	if (platform === "mac" || platform === "windows" || platform === "linux") {
		return platform;
	}
	throw new Error(
		`unsupported platform "${platform}". Use mac, windows, linux, or current.`,
	);
};

export const sanitizeName = (value: string): string =>
	value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "");

export const packageVersion = async (): Promise<string> => {
	const packageJson = await Bun.file(
		path.join(APP_ROOT, "package.json"),
	).json();
	return String(packageJson.version ?? "0.0.0");
};

const macDistributionCredentialsConfigured = (): boolean => {
	const hasCertificate = Boolean(
		process.env.APPLE_CERTIFICATE || process.env.APPLE_SIGNING_IDENTITY,
	);
	const hasAppleIdNotarization = Boolean(
		process.env.APPLE_ID &&
			process.env.APPLE_PASSWORD &&
			process.env.APPLE_TEAM_ID,
	);
	const hasApiKeyNotarization = Boolean(
		(process.env.APPLE_API_KEY || process.env.APPLE_API_KEY_PATH) &&
			process.env.APPLE_API_KEY_ID &&
			process.env.APPLE_API_ISSUER,
	);
	return hasCertificate && (hasAppleIdNotarization || hasApiKeyNotarization);
};

const assertCanBuildPlatform = (platform: DesktopPlatform): void => {
	const host = hostPlatform();
	if (platform !== host) {
		throw new Error(
			[
				`cannot build ${platform} desktop bundles from ${host}.`,
				"Tauri desktop bundles are produced on the target OS because the native bundle tools and sidecar binary are platform-specific.",
				"Run this same package script on macOS, Windows, and Linux runners to produce all three artifact sets.",
			].join("\n"),
		);
	}
};

const assertMacDistributionReady = (allowUnsignedMac: boolean): void => {
	if (hostPlatform() !== "mac") {
		return;
	}
	if (macDistributionCredentialsConfigured() || allowUnsignedMac) {
		return;
	}

	throw new Error(
		[
			"refusing to create a shareable macOS package without Developer ID signing and notarization credentials.",
			"Unsigned quarantined macOS downloads can show as damaged on a teammate's Mac.",
			"Set APPLE_CERTIFICATE or APPLE_SIGNING_IDENTITY plus notarization credentials before running this script.",
			"Supported notarization env sets: APPLE_ID + APPLE_PASSWORD + APPLE_TEAM_ID, or APPLE_API_KEY/APPLE_API_KEY_PATH + APPLE_API_KEY_ID + APPLE_API_ISSUER.",
			"For local-only testing, rerun with --allow-unsigned-mac or ALLOW_UNSIGNED_MAC=1.",
		].join("\n"),
	);
};

export const walkFiles = (root: string): string[] => {
	if (!existsSync(root)) {
		return [];
	}

	const paths: string[] = [];
	for (const entry of readdirSync(root)) {
		const fullPath = path.join(root, entry);
		const stats = statSync(fullPath);
		if (stats.isDirectory()) {
			paths.push(...walkFiles(fullPath));
			continue;
		}
		paths.push(fullPath);
	}
	return paths;
};

export const copyArtifact = (
	source: string,
	outputName: string,
	packageRoot: string = PACKAGE_ROOT,
): string => {
	const destination = path.join(packageRoot, outputName);
	rmSync(destination, { force: true, recursive: true });
	cpSync(source, destination, { recursive: true });
	return destination;
};

const signUnsignedMacApp = async (appPath: string): Promise<void> => {
	await $`codesign --force --deep --sign - ${appPath}`;
	await $`codesign --verify --deep --strict --verbose=2 ${appPath}`;
	await $`xattr -cr ${appPath}`;
};

const verifySignedMacApp = async (appPath: string): Promise<void> => {
	await $`codesign --verify --deep --strict --verbose=2 ${appPath}`;
	await $`spctl --assess --type execute --verbose ${appPath}`;
	await $`xattr -cr ${appPath}`;
};

const collectMacArtifacts = async (
	version: string,
	allowUnsignedMac: boolean,
): Promise<string[]> => {
	const appPath = path.join(BUNDLE_ROOT, "macos", `${APP_NAME}.app`);
	if (!existsSync(appPath)) {
		throw new Error(`macOS app bundle was not created at ${appPath}`);
	}

	if (allowUnsignedMac && !macDistributionCredentialsConfigured()) {
		console.warn(
			"creating a local-only ad-hoc signed macOS package; this is not suitable for quarantined downloads.",
		);
		await signUnsignedMacApp(appPath);
	} else {
		await verifySignedMacApp(appPath);
	}

	const arch = process.arch === "arm64" ? "arm64" : "x64";
	const suffix =
		allowUnsignedMac && !macDistributionCredentialsConfigured()
			? "-local-unsigned"
			: "";
	const zipName = `${sanitizeName(APP_NAME)}-${version}-macos-${arch}${suffix}.zip`;
	const zipPath = path.join(PACKAGE_ROOT, zipName);
	rmSync(zipPath, { force: true });
	await $`ditto -c -k --keepParent ${appPath} ${zipPath}`;

	const artifacts = [zipPath];
	if (!suffix) {
		for (const dmgPath of walkFiles(path.join(BUNDLE_ROOT, "dmg")).filter(
			(file) => file.endsWith(".dmg"),
		)) {
			artifacts.push(copyArtifact(dmgPath, path.basename(dmgPath)));
		}
	}

	return artifacts;
};

export const collectWindowsArtifacts = (
	bundleRoot: string = BUNDLE_ROOT,
	packageRoot: string = PACKAGE_ROOT,
): string[] =>
	walkFiles(bundleRoot)
		.filter((file) => file.endsWith(".msi") || file.endsWith(".exe"))
		.map((file) => copyArtifact(file, path.basename(file), packageRoot));

export const collectLinuxArtifacts = (
	bundleRoot: string = BUNDLE_ROOT,
	packageRoot: string = PACKAGE_ROOT,
): string[] =>
	walkFiles(bundleRoot)
		.filter(
			(file) =>
				file.endsWith(".AppImage") ||
				file.endsWith(".deb") ||
				file.endsWith(".rpm"),
		)
		.map((file) => copyArtifact(file, path.basename(file), packageRoot));

export const collectArtifacts = async (
	platform: DesktopPlatform,
	allowUnsignedMac: boolean,
): Promise<string[]> => {
	const version = await packageVersion();
	rmSync(PACKAGE_ROOT, { force: true, recursive: true });
	mkdirSync(PACKAGE_ROOT, { recursive: true });

	if (platform === "mac") {
		return collectMacArtifacts(version, allowUnsignedMac);
	}
	if (platform === "windows") {
		return collectWindowsArtifacts();
	}
	return collectLinuxArtifacts();
};

export const main = async () => {
	validateArgs();

	const platform = resolveRequestedPlatform();
	const allowUnsignedMac =
		hasArg("--allow-unsigned-mac") || process.env.ALLOW_UNSIGNED_MAC === "1";
	const skipBuild = hasArg("--skip-build");

	assertCanBuildPlatform(platform);
	if (platform === "mac") {
		assertMacDistributionReady(allowUnsignedMac);
	}

	if (!skipBuild) {
		await $`bun run build:binary`;
	}

	const artifacts = await collectArtifacts(platform, allowUnsignedMac);
	if (artifacts.length === 0) {
		throw new Error(
			`no ${platform} desktop artifacts were found under ${BUNDLE_ROOT}`,
		);
	}

	console.log(`Packaged ${platform} desktop artifacts:`);
	for (const artifact of artifacts) {
		console.log(`- ${path.relative(APP_ROOT, artifact)}`);
	}
};

if (import.meta.main) {
	process.chdir(APP_ROOT);
	main().catch((error: unknown) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	});
}
