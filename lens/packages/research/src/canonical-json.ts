/**
 * Deterministic JSON serialization for content addressing (ADR-0002).
 *
 * Object keys are recursively sorted; array order is preserved; `undefined`
 * values are dropped. The SHA-256 of this serialization is the content
 * address of a bundle — two structurally equal bundles always serialize to
 * the same bytes, so digests are reproducible across runs and machines.
 */
export function canonicalJson(value: unknown): string {
	return serialize(value);
}

function serialize(value: unknown): string {
	if (
		value === null ||
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return JSON.stringify(value);
	}
	if (typeof value !== "object") {
		throw new TypeError(
			`canonicalJson: unsupported value of type ${typeof value}`,
		);
	}
	if (Array.isArray(value)) {
		return `[${value.map((item) => serialize(item)).join(",")}]`;
	}
	const entries = Object.entries(value as Record<string, unknown>)
		.filter(([, v]) => v !== undefined)
		.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
	return `{${entries
		.map(([key, v]) => `${JSON.stringify(key)}:${serialize(v)}`)
		.join(",")}}`;
}
