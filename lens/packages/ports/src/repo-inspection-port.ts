/**
 * RepoInspectionPort — read-only repository inspection across the
 * workspace boundary (LENS hexagonal blueprint, `docs/research/cline-core-adaptation.md` §3.1).
 *
 * Contract:
 * - All paths are workspace-relative, POSIX-style; adapters resolve them
 *   against the canonical workspace root and MUST reject any escape
 *   (null bytes, `../` traversal, drive-letter escapes, symlink
 *   dereference outside the boundary) with `LensPortError("SECURITY_ACCESS_DENIED")`.
 * - Adapters respect `.gitignore`, skip `node_modules/`, `.git/`, binary
 *   files, and files above the adapter's size cap.
 * - Every method honours the optional `signal` (CancellationPort).
 */

export interface FileInfo {
	/** Workspace-relative POSIX path. */
	relativePath: string;
	sizeBytes: number;
	/** Lowercase extension without the dot ("" when none). */
	extension: string;
}

export interface SearchOptions {
	/** Literal substring or adapter-native pattern (e.g. ripgrep glob). */
	query: string;
	/** Restrict the search to these workspace-relative directories. */
	include?: string[];
	/** Case-insensitive matching (default: true). */
	caseInsensitive?: boolean;
}

export interface SearchResult {
	/** Workspace-relative POSIX path of the matching file. */
	relativePath: string;
	/** 1-based line numbers of the matches. */
	lineNumbers: number[];
	/** First matching line's trimmed content (bounded by the adapter). */
	preview: string;
}

export interface RepoInspectionPort {
	listFiles(relativeDir: string, signal?: AbortSignal): Promise<FileInfo[]>;
	readFile(relativePath: string, signal?: AbortSignal): Promise<string>;
	searchFiles(query: string, options?: SearchOptions, signal?: AbortSignal): Promise<SearchResult[]>;
	/**
	 * Cryptographic digest of the workspace's clean state, used to detect
	 * out-of-band developer edits (LENS `RepoSnapshotHash`). Two calls with
	 * no intervening workspace mutation return the same value.
	 */
	getRepoSnapshotHash(): Promise<string>;
}
