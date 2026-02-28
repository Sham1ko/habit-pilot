import {
	enumerateDates,
	enumerateWeekStarts,
	getRangeDayCount,
	getWeekEndIso,
	getWeekStartIso,
	resolveProgressRange,
	shiftIsoDate,
} from "./date-range.ts";

describe("progress date-range helpers", () => {
	test("getWeekStartIso returns Monday and getWeekEndIso returns Sunday", () => {
		expect(getWeekStartIso("2026-02-11")).toBe("2026-02-09");
		expect(getWeekStartIso("2026-02-15")).toBe("2026-02-09");
		expect(getWeekEndIso("2026-02-11")).toBe("2026-02-15");
	});

	test("shiftIsoDate handles month/year transitions", () => {
		expect(shiftIsoDate("2025-12-31", 1)).toBe("2026-01-01");
		expect(shiftIsoDate("2026-01-01", -1)).toBe("2025-12-31");
	});

	test("enumerateDates returns inclusive list", () => {
		expect(enumerateDates("2026-02-09", "2026-02-12")).toEqual([
			"2026-02-09",
			"2026-02-10",
			"2026-02-11",
			"2026-02-12",
		]);
		expect(getRangeDayCount("2026-02-09", "2026-02-12")).toBe(4);
	});

	test("enumerateWeekStarts starts from week start and increments by 7 days", () => {
		expect(enumerateWeekStarts("2026-02-11", "2026-03-01")).toEqual([
			"2026-02-09",
			"2026-02-16",
			"2026-02-23",
		]);
	});

	test("resolveProgressRange resolves preset with previous period", () => {
		const result = resolveProgressRange({
			preset: "this_week",
			today: "2026-02-11",
		});

		expect(result.start).toBe("2026-02-09");
		expect(result.end).toBe("2026-02-15");
		expect(result.previousStart).toBe("2026-02-02");
		expect(result.previousEnd).toBe("2026-02-08");
		expect(result.label).toBe("This week");
	});

	test("resolveProgressRange resolves custom range and previous period", () => {
		const result = resolveProgressRange({
			preset: "custom",
			today: "2026-02-11",
			start: "2026-01-10",
			end: "2026-01-20",
		});

		expect(result.start).toBe("2026-01-10");
		expect(result.end).toBe("2026-01-20");
		expect(result.previousStart).toBe("2025-12-30");
		expect(result.previousEnd).toBe("2026-01-09");
		expect(result.label).toBe("Custom range");
	});

	test("resolveProgressRange throws on invalid custom ranges", () => {
		expect(() =>
			resolveProgressRange({
				preset: "custom",
				today: "2026-02-11",
				start: "2026-02-12",
				end: "2026-02-11",
			}),
		).toThrow("Custom range requires valid start and end dates.");

		expect(() =>
			resolveProgressRange({
				preset: "custom",
				today: "2026-02-11",
				start: "invalid-date",
				end: "2026-02-11",
			}),
		).toThrow("Custom range requires valid start and end dates.");
	});
});
