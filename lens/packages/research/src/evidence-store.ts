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
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EvidenceBundle, EvidenceBundleMetadata } from "@lens/ports";
import { LensPortError } from "@lens/ports";
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
	private fileExistsCache = new Set<string>();
	private sessionLocks = new Map<string, Promise<void>>();

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

		const recomputed = bundleDigestOf({
			createdAt: bundle.metadata.createdAt,
			topic: bundle.metadata.topic,
			claims: bundle.claims,
		});
		if (recomputed !== bundle.metadata.digest) {
			throw new LensPortError(
				"ADAPTER_FAILURE",
				`Evidence bundle metadata digest does not match recomputed digest: metadata has ${bundle.metadata.digest.slice(0, 12)}…, recomputed ${recomputed.slice(0, 12)}…`,
			);
		}

		await mkdir(dir, { recursive: true });
		const filePath = path.join(dir, `${digest}.json`);
		const body = canonicalJson(bundle);
		if (!this.fileExistsCache.has(filePath)) {
			const tmpPath = `${filePath}.tmp.${Date.now()}.${randomUUID()}`;
			await writeFile(tmpPath, body, "utf8");
			try {
				await rename(tmpPath, filePath);
			} catch (err: unknown) {
				// Content addressing: if the file already exists (e.g. concurrent write or Windows EEXIST/EPERM), keep existing
				const code = (err as NodeJS.ErrnoException)?.code;
				if (code !== "EEXIST" && code !== "EPERM") {
					throw err;
				}
			}
			this.fileExistsCache.add(filePath);
		}
		await this.appendToManifest(sessionId, bundle.metadata);
	}

	/** Load and verify one bundle; rejects with `EVIDENCE_NOT_FOUND` when absent. */
	async loadBundle(sessionId: string, digest: string): Promise<EvidenceBundle> {
		const validDigest = this.validatedDigest(digest);
		const dir = this.evidenceDir(sessionId);
		const filePath = path.join(dir, `${validDigest}.json`);
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
		if (
			recomputed !== bundle.metadata.digest ||
			bundle.metadata.digest !== validDigest
		) {
			throw new LensPortError(
				"ADAPTER_FAILURE",
				`Evidence bundle digest mismatch: stored ${bundle.metadata.digest.slice(0, 12)}…, requested ${validDigest.slice(0, 12)}…, content hashes to ${recomputed.slice(0, 12)}…`,
			);
		}
		return bundle;
	}

	/** The session's manifest (insertion order); empty when no pass has run. */
	async loadIndex(
		sessionId: string,
	): Promise<readonly EvidenceBundleMetadata[]> {
		try {
			const raw = await readFile(
				path.join(this.evidenceDir(sessionId), "index.json"),
				"utf8",
			);
			const parsed: unknown = JSON.parse(raw);
			if (!Array.isArray(parsed)) {
				throw new LensPortError(
					"ADAPTER_FAILURE",
					`Manifest at index.json is corrupted: expected array`,
				);
			}
			return parsed as EvidenceBundleMetadata[];
		} catch (error: unknown) {
			if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
				return [];
			}
			if (error instanceof LensPortError) {
				throw error;
			}
			throw new LensPortError(
				"ADAPTER_FAILURE",
				`Failed to read evidence index for session ${sessionId}: ${(error as Error)?.message ?? String(error)}`,
				{ cause: error },
			);
		}
	}

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
		if (
			bundle?.contentIsUntrusted !== true ||
			!bundle.metadata ||
			typeof bundle.metadata !== "object" ||
			typeof bundle.metadata.digest !== "string" ||
			!DIGEST_PATTERN.test(bundle.metadata.digest) ||
			typeof bundle.metadata.topic !== "string" ||
			typeof bundle.metadata.createdAt !== "string" ||
			typeof bundle.metadata.claimCount !== "number" ||
			!Array.isArray(bundle.claims) ||
			bundle.claims.length !== bundle.metadata.claimCount
		) {
			throw new LensPortError(
				"ADAPTER_FAILURE",
				"Evidence bundle failed schema validation",
			);
		}

		for (const claim of bundle.claims) {
			if (
				claim?.contentIsUntrusted !== true ||
				typeof claim.claimId !== "string" ||
				claim.claimId.length === 0 ||
				typeof claim.statement !== "string" ||
				!Array.isArray(claim.quotations) ||
				!claim.quotations.every((q: unknown) => typeof q === "string") ||
				!Array.isArray(claim.sourceUrls) ||
				!claim.sourceUrls.every((u: unknown) => typeof u === "string") ||
				typeof claim.confidence !== "number" ||
				!Number.isFinite(claim.confidence) ||
				claim.confidence < 0 ||
				claim.confidence > 1
			) {
				throw new LensPortError(
					"ADAPTER_FAILURE",
					"Evidence bundle claim failed schema validation",
				);
			}
		}

		return bundle;
	}

	private async withSessionLock<T>(
		sessionId: string,
		fn: () => Promise<T>,
	): Promise<T> {
		const prev = this.sessionLocks.get(sessionId) ?? Promise.resolve();
		let resolveLock!: () => void;
		const next = new Promise<void>((res) => {
			resolveLock = res;
		});
		this.sessionLocks.set(sessionId, next);
		try {
			await prev;
			return await fn();
		} finally {
			resolveLock();
			if (this.sessionLocks.get(sessionId) === next) {
				this.sessionLocks.delete(sessionId);
			}
		}
	}

	private async appendToManifest(
		sessionId: string,
		metadata: EvidenceBundleMetadata,
	): Promise<void> {
		return this.withSessionLock(sessionId, async () => {
			const existing = [...(await this.loadIndex(sessionId))];
			if (existing.some((entry) => entry.digest === metadata.digest)) {
				return;
			}
			existing.push(metadata);
			const tmpPath = path.join(
				this.evidenceDir(sessionId),
				`index.json.tmp.${Date.now()}.${randomUUID()}`,
			);
			await writeFile(tmpPath, canonicalJson(existing), "utf8");
			await rename(
				tmpPath,
				path.join(this.evidenceDir(sessionId), "index.json"),
			);
		});
	}
}
