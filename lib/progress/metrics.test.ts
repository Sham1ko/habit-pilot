import {
	computeCapacityUsed,
	computeCompletionBreakdown,
	computeLoadSuccessBuckets,
} from "./metrics.ts";
import type { ProgressEntryRow, ProgressPlannedRow } from "./types.ts";

function plannedRow(
	id: string,
	habitId: number,
	date: string,
	plannedWeight: number,
): ProgressPlannedRow {
	return {
		id,
		habit_id: habitId,
		date,
		planned_weight_cu: plannedWeight.toString(),
	};
}

function entryRow(
	id: string,
	habitId: number,
	date: string,
	status: ProgressEntryRow["status"],
	actualWeight: number,
): ProgressEntryRow {
	return {
		id,
		habit_id: habitId,
		date,
		status,
		actual_weight_cu: actualWeight.toString(),
		note: null,
	};
}

describe("progress metrics", () => {
	test("computeCapacityUsed returns within status when usage is under budget", () => {
		const planned = [
			plannedRow("p1", 1, "2026-01-05", 20),
			plannedRow("p2", 2, "2026-01-06", 20),
		];
		const entries = [entryRow("e1", 1, "2026-01-05", "done", 14)];
		const capacityByWeek = new Map<string, number | null>([["2026-01-05", 40]]);

		const result = computeCapacityUsed({
			planned,
			entries,
			rangeStart: "2026-01-05",
			rangeEnd: "2026-01-11",
			capacityByWeek,
			weeklyCapacityDefault: null,
		});

		expect(result.usedCu).toBe(34);
		expect(result.budgetCu).toBe(40);
		expect(result.status).toBe("within");
	});

	test("computeCapacityUsed returns over status when usage exceeds budget", () => {
		const planned = [
			plannedRow("p1", 1, "2026-01-05", 20),
			plannedRow("p2", 2, "2026-01-06", 20),
		];
		const entries = [entryRow("e1", 1, "2026-01-05", "done", 24)];
		const capacityByWeek = new Map<string, number | null>([["2026-01-05", 40]]);

		const result = computeCapacityUsed({
			planned,
			entries,
			rangeStart: "2026-01-05",
			rangeEnd: "2026-01-11",
			capacityByWeek,
			weeklyCapacityDefault: null,
		});

		expect(result.usedCu).toBe(44);
		expect(result.budgetCu).toBe(40);
		expect(result.status).toBe("over");
	});

	test("computeCompletionBreakdown counts done, micro, explicit skips and unresolved planned", () => {
		const planned = [
			plannedRow("p1", 1, "2026-01-05", 2),
			plannedRow("p2", 2, "2026-01-06", 2),
			plannedRow("p3", 3, "2026-01-07", 2),
			plannedRow("p4", 4, "2026-01-08", 2),
		];
		const entries = [
			entryRow("e1", 1, "2026-01-05", "done", 2),
			entryRow("e2", 2, "2026-01-06", "micro_done", 1),
			entryRow("e3", 7, "2026-01-05", "skipped", 0),
			entryRow("e4", 8, "2026-01-06", "recovered", 2),
		];

		const result = computeCompletionBreakdown({
			planned,
			entries,
			today: "2026-01-07",
		});

		expect(result.done).toBe(2);
		expect(result.micro).toBe(1);
		expect(result.skipped).toBe(2);
		expect(result.total).toBe(5);
	});

	test("computeLoadSuccessBuckets calculates weighted success and sweet spot", () => {
		const result = computeLoadSuccessBuckets([
			{ plannedCu: 2, successRate: 100, plannedCount: 1 },
			{ plannedCu: 3, successRate: 50, plannedCount: 1 },
			{ plannedCu: 4, successRate: 90, plannedCount: 2 },
			{ plannedCu: 5, successRate: 80, plannedCount: 1 },
			{ plannedCu: 6, successRate: 70, plannedCount: 1 },
			{ plannedCu: 8, successRate: 60, plannedCount: 1 },
		]);

		const bucket45 = result.buckets.find((bucket) => bucket.key === "4-5");
		expect(bucket45).toBeDefined();
		expect(bucket45?.successRate).toBe(86.7);
		expect(bucket45?.days).toBe(2);
		expect(result.sweetSpotKey).toBe("4-5");
		expect(result.sweetSpotCu).toBe(4.5);
		expect(result.sweetSpotLabel).toBe("sweet spot ≈ 4.5 CU/day");
	});

	test("computeLoadSuccessBuckets has no sweet spot when no bucket has at least 2 days", () => {
		const result = computeLoadSuccessBuckets([
			{ plannedCu: 2, successRate: 100, plannedCount: 1 },
			{ plannedCu: 5, successRate: 80, plannedCount: 1 },
			{ plannedCu: 6, successRate: 70, plannedCount: 1 },
		]);

		expect(result.sweetSpotKey).toBeNull();
		expect(result.sweetSpotCu).toBeNull();
		expect(result.sweetSpotLabel).toBeNull();
	});
});
