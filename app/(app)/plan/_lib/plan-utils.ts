import type { PlanData } from "./types";

function toUtcDate(dateString: string) {
	return new Date(`${dateString}T00:00:00Z`);
}

export function toIsoDate(date: Date) {
	return date.toISOString().slice(0, 10);
}

export function shiftIsoDate(dateString: string, dayOffset: number) {
	const nextDate = toUtcDate(dateString);
	nextDate.setUTCDate(nextDate.getUTCDate() + dayOffset);
	return toIsoDate(nextDate);
}

export function getWeekStartDate(dateString: string) {
	const date = toUtcDate(dateString);
	const weekday = date.getUTCDay();
	const shift = weekday === 0 ? 6 : weekday - 1;
	date.setUTCDate(date.getUTCDate() - shift);
	return toIsoDate(date);
}

export function formatWeekRange(
	startDateString: string,
	endDateString: string,
) {
	const formatter = new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
	});
	return `${formatter.format(toUtcDate(startDateString))} - ${formatter.format(
		toUtcDate(endDateString),
	)}`;
}

export function formatWeekday(dateString: string) {
	return new Intl.DateTimeFormat("en-US", {
		weekday: "short",
	}).format(toUtcDate(dateString));
}

export function formatMonthDay(dateString: string) {
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
	}).format(toUtcDate(dateString));
}

export function formatDayLabel(dateString: string) {
	return `${formatWeekday(dateString)} ${formatMonthDay(dateString)}`;
}

export function formatCu(value: number) {
	if (!Number.isFinite(value)) {
		return "0";
	}
	const rounded = Math.round(value * 10) / 10;
	return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
}

function escapeIcsText(value: string) {
	return value
		.replace(/\\/g, "\\\\")
		.replace(/\n/g, "\\n")
		.replace(/,/g, "\\,")
		.replace(/;/g, "\\;");
}

function toIcsDate(dateString: string) {
	return dateString.replaceAll("-", "");
}

function toIcsTimestamp(date: Date) {
	return date
		.toISOString()
		.replace(/[-:]/g, "")
		.replace(/\.\d{3}Z$/, "Z");
}

export function buildWeekPlanIcs(plan: PlanData) {
	const stamp = toIcsTimestamp(new Date());
	const events = plan.days.flatMap((day) =>
		day.occurrences.map((occurrence) => {
			const nextDate = shiftIsoDate(day.date, 1);
			const summary = escapeIcsText(occurrence.habit_title);
			const descriptionParts = [
				`${formatCu(occurrence.planned_weight_cu)} CU`,
				occurrence.context_tag ? `Context: ${occurrence.context_tag}` : null,
			].filter(Boolean);
			const description = escapeIcsText(descriptionParts.join(" | "));

			return [
				"BEGIN:VEVENT",
				`UID:${occurrence.id}@habit-pilot`,
				`DTSTAMP:${stamp}`,
				`DTSTART;VALUE=DATE:${toIcsDate(day.date)}`,
				`DTEND;VALUE=DATE:${toIcsDate(nextDate)}`,
				`SUMMARY:${summary}`,
				`DESCRIPTION:${description}`,
				"END:VEVENT",
			].join("\r\n");
		}),
	);

	return [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Habit Pilot//Weekly Plan//EN",
		"CALSCALE:GREGORIAN",
		...events,
		"END:VCALENDAR",
		"",
	].join("\r\n");
}
