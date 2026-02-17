import type { ProgressRange, ProgressRangePreset } from "./types.ts";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function utcDate(dateString: string) {
	return new Date(`${dateString}T00:00:00Z`);
}

function isValidIsoDate(value: string) {
	if (!ISO_DATE_REGEX.test(value)) {
		return false;
	}

	return !Number.isNaN(utcDate(value).getTime());
}

export function toIsoDate(date: Date) {
	return date.toISOString().slice(0, 10);
}

export function shiftIsoDate(dateString: string, dayOffset: number) {
	const next = utcDate(dateString);
	next.setUTCDate(next.getUTCDate() + dayOffset);
	return toIsoDate(next);
}

export function getWeekStartIso(dateString: string) {
	const date = utcDate(dateString);
	const weekday = date.getUTCDay();
	const shift = weekday === 0 ? 6 : weekday - 1;
	date.setUTCDate(date.getUTCDate() - shift);
	return toIsoDate(date);
}

export function getWeekEndIso(dateString: string) {
	return shiftIsoDate(getWeekStartIso(dateString), 6);
}

export function enumerateDates(start: string, end: string) {
	const result: string[] = [];
	let cursor = start;

	while (cursor <= end) {
		result.push(cursor);
		cursor = shiftIsoDate(cursor, 1);
	}

	return result;
}

export function enumerateWeekStarts(start: string, end: string) {
	const firstWeek = getWeekStartIso(start);
	const weeks: string[] = [];
	let cursor = firstWeek;

	while (cursor <= end) {
		weeks.push(cursor);
		cursor = shiftIsoDate(cursor, 7);
	}

	return weeks;
}

export function getRangeDayCount(start: string, end: string) {
	return enumerateDates(start, end).length;
}

function getPresetRange(
	preset: Exclude<ProgressRangePreset, "custom">,
	today: string,
) {
	if (preset === "this_week") {
		const start = getWeekStartIso(today);
		return { start, end: shiftIsoDate(start, 6), label: "This week" };
	}

	if (preset === "last_week") {
		const thisWeekStart = getWeekStartIso(today);
		const start = shiftIsoDate(thisWeekStart, -7);
		return { start, end: shiftIsoDate(start, 6), label: "Last week" };
	}

	if (preset === "four_weeks") {
		const end = today;
		return {
			start: shiftIsoDate(end, -27),
			end,
			label: "Last 4 weeks",
		};
	}

	const end = today;
	return {
		start: shiftIsoDate(end, -89),
		end,
		label: "Last 3 months",
	};
}

export function resolveProgressRange(input: {
	preset: ProgressRangePreset;
	today: string;
	start?: string | null;
	end?: string | null;
}): ProgressRange {
	const { preset, today, start, end } = input;

	let resolvedStart = "";
	let resolvedEnd = "";
	let label = "";

	if (preset === "custom") {
		if (
			!start ||
			!end ||
			!isValidIsoDate(start) ||
			!isValidIsoDate(end) ||
			start > end
		) {
			throw new Error("Custom range requires valid start and end dates.");
		}

		resolvedStart = start;
		resolvedEnd = end;
		label = "Custom range";
	} else {
		const resolved = getPresetRange(preset, today);
		resolvedStart = resolved.start;
		resolvedEnd = resolved.end;
		label = resolved.label;
	}

	const dayCount = getRangeDayCount(resolvedStart, resolvedEnd);
	const previousEnd = shiftIsoDate(resolvedStart, -1);
	const previousStart = shiftIsoDate(previousEnd, -(dayCount - 1));

	return {
		preset,
		start: resolvedStart,
		end: resolvedEnd,
		today,
		label,
		previousStart,
		previousEnd,
	};
}
