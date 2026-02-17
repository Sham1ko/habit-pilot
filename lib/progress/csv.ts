import type { ProgressResponse } from "./types.ts";

function escapeCsvCell(value: string | number | null) {
	const stringValue =
		value === null || typeof value === "undefined" ? "" : String(value);
	const escaped = stringValue.replaceAll('"', '""');
	return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

function makeCsvRow(columns: Array<string | number | null>) {
	return columns.map((column) => escapeCsvCell(column)).join(",");
}

export function getProgressCsvFilename(range: { start: string; end: string }) {
	return `progress_${range.start}_to_${range.end}.csv`;
}

export function buildProgressCsv(data: ProgressResponse) {
	const rows: string[] = [];
	rows.push(
		makeCsvRow([
			"row_type",
			"date",
			"planned_cu",
			"done_cu",
			"micro_cu",
			"done_count",
			"micro_count",
			"skipped_count",
			"success_rate",
			"habit",
			"habit_planned_cu",
			"habit_done",
			"habit_micro",
			"habit_missed",
			"habit_tip",
		]),
	);

	for (const day of data.charts.daily) {
		rows.push(
			makeCsvRow([
				"daily",
				day.date,
				day.plannedCu,
				day.doneCu,
				day.microCu,
				day.doneCount,
				day.microCount,
				day.skippedCount,
				day.successRate,
				null,
				null,
				null,
				null,
				null,
				null,
			]),
		);
	}

	for (const habit of data.habits.topAttention) {
		rows.push(
			makeCsvRow([
				"habit_summary",
				null,
				null,
				null,
				null,
				null,
				null,
				null,
				habit.successRate,
				habit.title,
				habit.plannedCu,
				habit.done,
				habit.micro,
				habit.missed,
				habit.tip,
			]),
		);
	}

	return rows.join("\n");
}
