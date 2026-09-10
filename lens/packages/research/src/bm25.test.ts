import { describe, expect, it } from "bun:test";
import { Bm25Index, tokenize } from "./bm25.js";

describe("tokenize", () => {
	it("lowercases and keeps alphanumeric tokens of length >= 2", () => {
		expect(tokenize("Hello WORLD, a b c3 rust!")).toEqual([
			"hello",
			"world",
			"c3",
			"rust",
		]);
	});

	it("handles Arabic words properly for Arabic/English parity", () => {
		expect(tokenize("نظرة أعمق. فهم أوضح.")).toEqual([
			"نظرة",
			"أعمق",
			"فهم",
			"أوضح",
		]);
	});

	it("returns no tokens for punctuation-only input", () => {
		expect(tokenize("!? ... ---")).toEqual([]);
	});
});

describe("Bm25Index", () => {
	it("ranks documents containing query terms above unrelated ones", () => {
		const index = new Bm25Index();
		index.add(
			{ id: "d1", text: "Rust borrow checker prevents data races" },
			{ id: "d2", text: "Python list comprehensions are concise" },
			{ id: "d3", text: "The borrow checker in Rust also prevents use after free" },
		);
		const hits = index.search("rust borrow checker", 3);
		expect(hits.length).toBeGreaterThan(0);
		expect(hits[0]?.id).toMatch(/^d[13]$/);
		expect(hits.map((h) => h.id)).not.toContain("d2");
	});

	it("respects the limit and orders by descending score", () => {
		const index = new Bm25Index();
		for (let i = 1; i <= 5; i++) {
			index.add({ id: `d${i}`, text: `rust topic doc number ${i}` });
		}
		const hits = index.search("rust topic", 2);
		expect(hits).toHaveLength(2);
		for (let i = 1; i < hits.length; i++) {
			expect(hits[i - 1]?.score).toBeGreaterThanOrEqual(hits[i]?.score ?? 0);
		}
	});

	it("returns empty results for an empty index or empty query", () => {
		const index = new Bm25Index();
		expect(index.search("anything", 10)).toEqual([]);
		index.add({ id: "d1", text: "some text" });
		expect(index.search("", 10)).toEqual([]);
	});

	it("is deterministic: identical inputs give identical rankings", () => {
		const build = () => {
			const index = new Bm25Index();
			index.add(
				{ id: "b", text: "grading rubrics for essays" },
				{ id: "a", text: "grading rubrics for essays" },
			);
			return index.search("grading rubrics", 10).map((h) => h.id);
		};
		// Ties break by id, so both runs agree.
		expect(build()).toEqual(build());
	});

	it("ignores duplicate document ids", () => {
		const index = new Bm25Index();
		index.add({ id: "d1", text: "hello world" });
		index.add({ id: "d1", text: "hello world hello world" });
		expect(index.size).toBe(1);
	});

	it("indexes and ranks Arabic documents correctly", () => {
		const index = new Bm25Index();
		index.add(
			{ id: "ar1", text: "نظرة أعمق في هيكلية الأمان والتحقق من الصلاحيات" },
			{ id: "ar2", text: "تصميم واجهة المستخدم وتجربة الاستخدام العامة" },
			{ id: "ar3", text: "نظرة عامة على محرك البحث والأدلة البرمجية" },
		);
		const hits = index.search("نظرة أعمق", 3);
		expect(hits.length).toBeGreaterThan(0);
		expect(hits[0]?.id).toBe("ar1");
		expect(hits.map((h) => h.id)).not.toContain("ar2");
	});
});
