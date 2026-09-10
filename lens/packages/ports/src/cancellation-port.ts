/**
 * CancellationPort — cooperative cancellation propagation (LENS hexagonal
 * blueprint §3.1). Adapters must thread the signal down to active LLM
 * HTTP streams, file read streams, and background indexing tasks; the
 * abort reason should surface in the resulting `LensPortError("CANCELLED")`.
 */
export interface CancellationPort {
	readonly signal: AbortSignal;
	abort(reason: string): void;
}
