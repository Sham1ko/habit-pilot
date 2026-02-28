import { toNumber } from "../number.ts";

export type PlannedUsageRow = {
	habit_id: number;
	date: string;
	planned_weight_cu: unknown;
};

export type EntryUsageRow = {
	habit_id: number;
	date: string;
	actual_weight_cu: { toString(): string };
	status: string;
	id?: string | number;
};

export function computeWeekUsage(
	plannedOccurrences: PlannedUsageRow[],
	entries: EntryUsageRow[],
) {
	const plannedByKey = new Map<string, number>();
	let plannedTotal = 0;

	plannedOccurrences.forEach((occurrence) => {
		const key = `${occurrence.habit_id}-${occurrence.date}`;
		const plannedWeight = toNumber(occurrence.planned_weight_cu);
		plannedByKey.set(key, plannedWeight);
		plannedTotal += plannedWeight;
	});

	const entryByKey = new Map<string, EntryUsageRow>();
	entries.forEach((entry) => {
		const key = `${entry.habit_id}-${entry.date}`;
		entryByKey.set(key, entry);
	});

	let used = 0;

	plannedByKey.forEach((plannedWeight, key) => {
		const entry = entryByKey.get(key);
		if (!entry) {
			used += plannedWeight;
			return;
		}

		if (entry.status === "skipped") {
			return;
		}

		used += toNumber(entry.actual_weight_cu);
	});

	entryByKey.forEach((entry, key) => {
		if (plannedByKey.has(key) || entry.status === "skipped") {
			return;
		}
		used += toNumber(entry.actual_weight_cu);
	});

	return { used, plannedTotal, entryByKey };
}
