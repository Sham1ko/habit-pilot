import { computeWeekUsage } from "./usage.ts";

function plannedRow(habit_id: number, date: string, planned_weight_cu: unknown) {
	return { habit_id, date, planned_weight_cu };
}

function entryRow(
	habit_id: number,
	date: string,
	actual_weight_cu: string,
	status: string,
) {
	return {
		habit_id,
		date,
		actual_weight_cu: { toString: () => actual_weight_cu },
		status,
	};
}

describe("today week usage", () => {
	test("uses planned weight for missing entries", () => {
		const result = computeWeekUsage(
			[plannedRow(1, "2026-02-09", "3"), plannedRow(2, "2026-02-10", "4")],
			[],
		);

		expect(result.plannedTotal).toBe(7);
		expect(result.used).toBe(7);
	});

	test("uses actual weight for completed planned entries", () => {
		const result = computeWeekUsage(
			[plannedRow(1, "2026-02-09", "3")],
			[entryRow(1, "2026-02-09", "1.5", "micro_done")],
		);

		expect(result.plannedTotal).toBe(3);
		expect(result.used).toBe(1.5);
	});

	test("excludes skipped entries from usage", () => {
		const result = computeWeekUsage(
			[plannedRow(1, "2026-02-09", "5")],
			[entryRow(1, "2026-02-09", "5", "skipped")],
		);

		expect(result.used).toBe(0);
	});

	test("includes non-planned completed entries", () => {
		const result = computeWeekUsage(
			[plannedRow(1, "2026-02-09", "2")],
			[entryRow(3, "2026-02-09", "4", "recovered")],
		);

		expect(result.plannedTotal).toBe(2);
		expect(result.used).toBe(6);
	});

	test("keeps latest duplicate entry by key", () => {
		const result = computeWeekUsage(
			[plannedRow(1, "2026-02-09", "2")],
			[
				entryRow(1, "2026-02-09", "1", "done"),
				entryRow(1, "2026-02-09", "0.5", "micro_done"),
			],
		);

		expect(result.used).toBe(0.5);
		expect(result.entryByKey.get("1-2026-02-09")?.status).toBe("micro_done");
	});
});
