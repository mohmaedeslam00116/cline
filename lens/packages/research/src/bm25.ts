/**
 * BM25 ranking over in-memory documents — the Phase-1 local retrieval
 * primitive (credential-free per ADR-0004). Pure TypeScript: no I/O, no
 * dependencies, fully deterministic.
 */

export interface IndexedDocument {
	readonly id: string;
	readonly text: string;
}

export interface ScoredDocument {
	readonly id: string;
	readonly score: number;
}

const K1 = 1.5;
const B = 0.75;

export class Bm25Index {
	private readonly termFrequencies = new Map<string, Map<string, number>>();
	private readonly docLengths = new Map<string, number>();
	private readonly documentFrequency = new Map<string, number>();
	private totalLength = 0;

	add(...documents: readonly IndexedDocument[]): void {
		for (const doc of documents) {
			if (this.termFrequencies.has(doc.id)) {
				continue;
			}
			const terms = tokenize(doc.text);
			const tf = new Map<string, number>();
			for (const term of terms) {
				tf.set(term, (tf.get(term) ?? 0) + 1);
			}
			this.termFrequencies.set(doc.id, tf);
			this.docLengths.set(doc.id, terms.length);
			this.totalLength += terms.length;
			for (const term of tf.keys()) {
				this.documentFrequency.set(
					term,
					(this.documentFrequency.get(term) ?? 0) + 1,
				);
			}
		}
	}

	get size(): number {
		return this.termFrequencies.size;
	}

	/** Rank documents against `query`; returns at most `limit` hits, best first. */
	search(query: string, limit = 10): ScoredDocument[] {
		const queryTerms = [...new Set(tokenize(query))];
		const n = this.termFrequencies.size;
		if (n === 0 || queryTerms.length === 0) {
			return [];
		}
		const avgLength = this.totalLength > 0 ? this.totalLength / n : 1;
		const scored: ScoredDocument[] = [];
		for (const [id, tf] of this.termFrequencies) {
			const docLength = this.docLengths.get(id) ?? 0;
			let score = 0;
			for (const term of queryTerms) {
				const df = this.documentFrequency.get(term);
				if (!df) {
					continue;
				}
				const idf = Math.log((n - df + 0.5) / (df + 0.5) + 1);
				const f = tf.get(term) ?? 0;
				if (f === 0) {
					continue;
				}
				score +=
					(idf * (f * (K1 + 1))) /
					(f + K1 * (1 - B + B * (docLength / avgLength)));
			}
			if (score > 0) {
				scored.push({ id, score });
			}
		}
		return scored
			.sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : 1))
			.slice(0, Math.max(0, limit));
	}
}

/** Lowercase alphanumeric word tokens (length >= 2, Unicode-aware for Arabic/English parity). */
export function tokenize(text: string): string[] {
	return text.toLowerCase().match(/[\p{Letter}\p{Number}]{2,}/gu) ?? [];
}
