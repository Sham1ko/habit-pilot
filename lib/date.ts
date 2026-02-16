type DateParts = {
	year: number;
	month: number;
	day: number;
	weekday: string;
};

const weekdayIndex: Record<string, number> = {
	Mon: 0,
	Tue: 1,
	Wed: 2,
	Thu: 3,
	Fri: 4,
	Sat: 5,
	Sun: 6,
};

function pad2(value: number) {
	return value.toString().padStart(2, "0");
}

function formatDateParts({ year, month, day }: DateParts) {
	return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function formatDateUTC(date: Date) {
	return date.toISOString().slice(0, 10);
}

function getDateParts(date: Date, timeZone?: string): DateParts {
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		weekday: "short",
	});

	const parts = formatter.formatToParts(date);
	const partMap = new Map<string, string>();
	parts.forEach((part) => {
		if (part.type !== "literal") {
			partMap.set(part.type, part.value);
		}
	});

	return {
		year: Number(partMap.get("year") ?? date.getUTCFullYear()),
		month: Number(partMap.get("month") ?? date.getUTCMonth() + 1),
		day: Number(partMap.get("day") ?? date.getUTCDate()),
		weekday: partMap.get("weekday") ?? "Mon",
	};
}

export function getDateContext(timeZone?: string) {
	const now = new Date();
	let parts: DateParts;
	try {
		parts = getDateParts(now, timeZone);
	} catch {
		parts = getDateParts(now);
	}

	const todayDateString = formatDateParts(parts);
	const weekday = weekdayIndex[parts.weekday] ?? 0;

	const todayUtc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
	const weekStartDate = new Date(todayUtc);
	weekStartDate.setUTCDate(weekStartDate.getUTCDate() - weekday);
	const weekEndDate = new Date(weekStartDate);
	weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);

	return {
		todayDateString,
		weekStartDate,
		weekEndDate,
		weekStartDateString: formatDateUTC(weekStartDate),
		weekEndDateString: formatDateUTC(weekEndDate),
	};
}
