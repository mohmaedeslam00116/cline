import { describe, expect, it } from "bun:test";
import { canonicalJson } from "./canonical-json.js";

describe("canonicalJson", () => {
	it("sorts object keys recursively", () => {
		const value = { b: 1, a: { d: 2, c: 3 } };
		expect(canonicalJson(value)).toBe('{"a":{"c":3,"d":2},"b":1}');
	});

	it("preserves array order", () => {
		expect(canonicalJson([3, 1, 2])).toBe("[3,1,2]");
		expect(canonicalJson([{ b: 1, a: 2 }])).toBe('[{"a":2,"b":1}]');
	});

	it("drops undefined values", () => {
		expect(canonicalJson({ a: 1, b: undefined, c: { d: undefined, e: null } })).toBe(
			'{"a":1,"c":{"e":null}}',
		);
	});

	it("is byte-reproducible across key insertion orders", () => {
		const a = canonicalJson({ topic: "t", claims: [{ id: "c1", z: 1, a: 2 }] });
		const b = canonicalJson({ claims: [{ a: 2, z: 1, id: "c1" }], topic: "t" });
		expect(a).toBe(b);
	});

	it("handles primitives, null, and empty structures", () => {
		expect(canonicalJson(null)).toBe("null");
		expect(canonicalJson("x")).toBe('"x"');
		expect(canonicalJson(1.5)).toBe("1.5");
		expect(canonicalJson(true)).toBe("true");
		expect(canonicalJson({})).toBe("{}");
		expect(canonicalJson([])).toBe("[]");
	});

	it("rejects non-JSON values like functions", () => {
		expect(() => canonicalJson(() => 1)).toThrow(TypeError);
	});
});
