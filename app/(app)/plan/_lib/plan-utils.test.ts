import { formatCu, getWeekStartDate, shiftIsoDate, toIsoDate } from "./plan-utils.ts";

describe("plan utils", () => {
	test("toIsoDate formats date to YYYY-MM-DD", () => {
		expect(toIsoDate(new Date("2026-02-27T20:10:00Z"))).toBe("2026-02-27");
	});

	test("shiftIsoDate handles positive and negative offsets", () => {
		expect(shiftIsoDate("2026-02-27", 2)).toBe("2026-03-01");
		expect(shiftIsoDate("2026-03-01", -2)).toBe("2026-02-27");
	});

	test("getWeekStartDate returns Monday for any weekday", () => {
		expect(getWeekStartDate("2026-02-09")).toBe("2026-02-09");
		expect(getWeekStartDate("2026-02-11")).toBe("2026-02-09");
		expect(getWeekStartDate("2026-02-15")).toBe("2026-02-09");
	});

	test("formatCu rounds to one decimal and normalizes non-finite values", () => {
		expect(formatCu(3)).toBe("3");
		expect(formatCu(3.04)).toBe("3");
		expect(formatCu(3.05)).toBe("3.1");
		expect(formatCu(Number.NaN)).toBe("0");
		expect(formatCu(Number.POSITIVE_INFINITY)).toBe("0");
	});
});
