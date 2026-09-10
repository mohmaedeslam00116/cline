/**
 * Evidence Store — the content-addressed bundle persistence (ADR-0002).
 *
 * Layout under the workspace root:
 *   .lens/sessions/<sessionId>/evidence/<digest>.json   ← one bundle, written once
 *   .lens/sessions/<sessionId>/evidence/index.json      ← per-session manifest
 *
 * Immutability is structural: a new research pass writes a NEW bundle file
 * and supersedes the manifest pointer — existing bundle files are never
 * rewritten. Loads re-verify the digest, so corruption or tampering is
 * detected at read time.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { LensPortError } from "@lens/ports";
import type {
	EvidenceBundle,
	EvidenceBundleMetadata,
} from "@lens/ports";
import { canonicalJson } from "./canonical-json.js";

/** Session ids are path components: restrict to a safe charset. */
const SESSION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
/** Digests are lowercase hex SHA-256. */
const DIGEST_PATTERN = /^[0-9a-f]{64}$/;

export interface EvidenceStoreOptions {
	readonly workspaceRoot: string;
}

export function sha256Hex(data: string): string {
	return createHash("sha256").update(data, "utf8").digest("hex");
}

/**
 * Compute the canonical digest of a bundle's immutable content (claims +
 * topic + creation time). The metadata block then carries this digest, so
 * the address covers exactly the bytes that must never change.
 */
export function bundleDigestOf(input: {
	readonly createdAt: string;
	readonly topic: string;
	readonly claims: readonly unknown[];
}): string {
	return sha256Hex(
		canonicalJson({
			contentIsUntrusted: true,
			createdAt: input.createdAt,
			topic: input.topic,
			claims: input.claims,
		}),
	);
}

export class EvidenceStore {
	private readonly workspaceRoot: string;

	constructor(options: EvidenceStoreOptions) {
		this.workspaceRoot = path.resolve(options.workspaceRoot);
	}

	/**
	 * Persist a bundle atomically (tmp file + rename) and add its metadata to
	 * the session manifest. Writing the same digest twice is a no-op — the
	 * content is already there, which is the point of content addressing.
	 */
	async saveBundle(sessionId: string, bundle: EvidenceBundle): Promise<void> {
		const dir = this.evidenceDir(sessionId);
		const digest = this.validatedDigest(bundle.metadata.digest);
		await mkdir(dir, { recursive: true });
		const filePath = path.join(dir, `${digest}.json`);
		const body = canonicalJson(bundle);
		if (!this.fileExistsCache.has(filePath)) {
			const tmpPath = `${filePath}.tmp`;
			await writeFile(tmpPath, body, "utf8");
			await rename(tmpPath, filePath);
			this.fileExistsCache.add(filePath);
		}
		await this.appendToManifest(sessionId, bundle.metadata);
	}

	/** Load and verify one bundle; rejects with `EVIDENCE_NOT_FOUND` when absent. */
	async loadBundle(sessionId: string, digest: string): Promise<EvidenceBundle> {
		const dir = this.evidenceDir(sessionId);
		const filePath = path.join(dir, `${this.validatedDigest(digest)}.json`);
		let raw: string;
		try {
			raw = await readFile(filePath, "utf8");
		} catch {
			throw new LensPortError(
				"EVIDENCE_NOT_FOUND",
				`No evidence bundle ${digest.slice(0, 12)}… for session ${sessionId}`,
			);
		}
		const bundle = this.parseBundle(raw);
		const recomputed = bundleDigestOf({
			createdAt: bundle.metadata.createdAt,
			topic: bundle.metadata.topic,
			claims: bundle.claims,
		});
		if (recomputed !== bundle.metadata.digest) {
			throw new LensPortError(
				"ADAPTER_FAILURE",
				`Evidence bundle digest mismatch: stored ${bundle.metadata.digest.slice(0, 12)}…, content hashes to ${recomputed.slice(0, 12)}…`,
			);
		}
		return bundle;
	}

	/** The session's manifest (insertion order); empty when no pass has run. */
	async loadIndex(sessionId: string): Promise<readonly EvidenceBundleMetadata[]> {
		try {
			const raw = await readFile(
				path.join(this.evidenceDir(sessionId), "index.json"),
				"utf8",
			);
			const parsed: unknown = JSON.parse(raw);
			return Array.isArray(parsed) ? (parsed as EvidenceBundleMetadata[]) : [];
		} catch {
			return [];
		}
	}

	private fileExistsCache = new Set<string>();

	private evidenceDir(sessionId: string): string {
		if (!SESSION_ID_PATTERN.test(sessionId)) {
			throw new LensPortError(
				"SECURITY_ACCESS_DENIED",
				`Session id rejected by path-safety pattern: ${JSON.stringify(sessionId.slice(0, 24))}`,
			);
		}
		return path.join(
			this.workspaceRoot,
			".lens",
			"sessions",
			sessionId,
			"evidence",
		);
	}

	private validatedDigest(digest: string): string {
		if (!DIGEST_PATTERN.test(digest)) {
			throw new LensPortError(
				"EVIDENCE_NOT_FOUND",
				`Malformed evidence digest: ${JSON.stringify(digest.slice(0, 24))}`,
			);
		}
		return digest;
	}

	private parseBundle(raw: string): EvidenceBundle {
		let parsed: unknown;
		try {
			parsed = JSON.parse(raw);
		} catch (error) {
			throw new LensPortError(
				"ADAPTER_FAILURE",
				"Evidence bundle file is not valid JSON",
				{ cause: error },
			);
		}
		const bundle = parsed as EvidenceBundle;
		if (bundle?.contentIsUntrusted !== true || !bundle.metadata || !bundle.claims) {
			throw new LensPortError(
				"ADAPTER_FAILURE",
				"Evidence bundle failed the untrusted-content contract validation",
			);
		}
		return bundle;
	}

	private async appendToManifest(
		sessionId: string,
		metadata: EvidenceBundleMetadata,
	): Promise<void> {
		const existing = [...(await this.loadIndex(sessionId))];
		if (existing.some((entry) => entry.digest === metadata.digest)) {
			return;
		}
		existing.push(metadata);
		const tmpPath = path.join(this.evidenceDir(sessionId), "index.json.tmp");
		await writeFile(tmpPath, canonicalJson(existing), "utf8");
		await rename(tmpPath, path.join(this.evidenceDir(sessionId), "index.json"));
	}
}
