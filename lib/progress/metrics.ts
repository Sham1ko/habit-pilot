import { toNumber } from "../number.ts";
import {
	enumerateDates,
	getWeekStartIso,
	shiftIsoDate,
	toIsoDate,
} from "./date-range.ts";
import type {
	CapacityByWeekMap,
	HabitEntryStatus,
	HistoryCellStatus,
	LoadBucketKey,
	ProgressDailyPoint,
	ProgressEntryRow,
	ProgressHabitAttention,
	ProgressHabitRow,
	ProgressLoadBucket,
	ProgressPlannedRow,
	ProgressRange,
	ProgressResponse,
} from "./types.ts";

type CompletionBreakdown = {
	done: number;
	micro: number;
	skipped: number;
	total: number;
	note: string;
};

type CapacitySummary = {
	usedCu: number;
	budgetCu: number | null;
	ratio: number | null;
	status: "within" | "over" | "unknown";
	note: string;
};

type LoadBucketsResult = {
	buckets: ProgressLoadBucket[];
	sweetSpotKey: LoadBucketKey | null;
	sweetSpotCu: number | null;
	sweetSpotLabel: string | null;
};

export type BuildProgressMetricsInput = {
	range: ProgressRange;
	habits: ProgressHabitRow[];
	plannedInRange: ProgressPlannedRow[];
	entriesInRange: ProgressEntryRow[];
	plannedInPreviousRange: ProgressPlannedRow[];
	entriesInPreviousRange: ProgressEntryRow[];
	plannedHistory21: ProgressPlannedRow[];
	entriesHistory21: ProgressEntryRow[];
	capacityByWeek: CapacityByWeekMap;
	weeklyCapacityDefault: number | null;
};

const BUCKET_ORDER: LoadBucketKey[] = ["1-3", "4-5", "6-7", "8+"];

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
	weekday: "short",
	timeZone: "UTC",
});

function round(value: number, fractionDigits = 1) {
	const multiplier = 10 ** fractionDigits;
	return Math.round(value * multiplier) / multiplier;
}

function formatCu(value: number) {
	const rounded = round(value, 1);
	return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
}

function clampRate(value: number) {
	return Math.max(0, Math.min(100, round(value, 1)));
}

function dateKey(date: Date | string) {
	return toIsoDate(date);
}

function habitDateKey(habitId: number, isoDate: string) {
	return `${habitId}-${isoDate}`;
}

function getBucketKey(plannedCu: number): LoadBucketKey | null {
	if (plannedCu <= 0) {
		return null;
	}

	if (plannedCu < 4) {
		return "1-3";
	}

	if (plannedCu < 6) {
		return "4-5";
	}

	if (plannedCu < 8) {
		return "6-7";
	}

	return "8+";
}

function bucketMidpoint(key: LoadBucketKey) {
	if (key === "1-3") {
		return 2;
	}
	if (key === "4-5") {
		return 4.5;
	}
	if (key === "6-7") {
		return 6.5;
	}
	return 8;
}

function statusIsDone(status: HabitEntryStatus) {
	return status === "done" || status === "recovered";
}

function getEntryByHabitDate(entries: ProgressEntryRow[]) {
	const map = new Map<string, ProgressEntryRow>();

	for (const entry of entries) {
		const key = habitDateKey(entry.habit_id, dateKey(entry.date));
		map.set(key, entry);
	}

	return map;
}

function getPlannedByHabitDate(planned: ProgressPlannedRow[]) {
	const map = new Map<string, ProgressPlannedRow>();

	for (const item of planned) {
		const key = habitDateKey(item.habit_id, dateKey(item.date));
		map.set(key, item);
	}

	return map;
}

function getNotes(entries: ProgressEntryRow[], limit = 3) {
	return entries
		.filter((entry) => Boolean(entry.note?.trim()))
		.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0))
		.map((entry) => entry.note?.trim() ?? "")
		.filter(Boolean)
		.slice(0, limit);
}

function buildDailyPoints(input: {
	range: ProgressRange;
	planned: ProgressPlannedRow[];
	entries: ProgressEntryRow[];
}) {
	const { range, planned, entries } = input;
	const entryByHabitDate = getEntryByHabitDate(entries);
	const plannedByDay = new Map<string, ProgressPlannedRow[]>();
	const entryByDay = new Map<string, ProgressEntryRow[]>();

	for (const item of planned) {
		const key = dateKey(item.date);
		const rows = plannedByDay.get(key) ?? [];
		rows.push(item);
		plannedByDay.set(key, rows);
	}

	for (const entry of entries) {
		const key = dateKey(entry.date);
		const rows = entryByDay.get(key) ?? [];
		rows.push(entry);
		entryByDay.set(key, rows);
	}

	const points: ProgressDailyPoint[] = [];
	const allDates = enumerateDates(range.start, range.end);

	for (const day of allDates) {
		const dayPlanned = plannedByDay.get(day) ?? [];
		const dayEntries = entryByDay.get(day) ?? [];
		const plannedCu = dayPlanned.reduce(
			(sum, item) => sum + toNumber(item.planned_weight_cu),
			0,
		);

		let doneCu = 0;
		let microCu = 0;
		let doneCount = 0;
		let microCount = 0;
		let skippedCount = 0;
		let hasMissingData = false;

		for (const plannedItem of dayPlanned) {
			const key = habitDateKey(plannedItem.habit_id, day);
			const entry = entryByHabitDate.get(key);

			if (!entry) {
				if (day <= range.today) {
					skippedCount += 1;
					hasMissingData = true;
				}
				continue;
			}

			if (entry.status === "skipped") {
				skippedCount += 1;
				continue;
			}

			if (entry.status === "micro_done") {
				microCount += 1;
				microCu += toNumber(entry.actual_weight_cu);
				continue;
			}

			doneCount += 1;
			doneCu += toNumber(entry.actual_weight_cu);
		}

		for (const entry of dayEntries) {
			const key = habitDateKey(entry.habit_id, day);
			if (
				entryByHabitDate.has(key) &&
				dayPlanned.some((item) => item.habit_id === entry.habit_id)
			) {
				continue;
			}

			if (entry.status === "skipped") {
				continue;
			}

			if (entry.status === "micro_done") {
				microCount += 1;
				microCu += toNumber(entry.actual_weight_cu);
				continue;
			}

			doneCount += 1;
			doneCu += toNumber(entry.actual_weight_cu);
		}

		const completedCount = doneCount + microCount;
		const successRate =
			dayPlanned.length > 0
				? clampRate((completedCount / dayPlanned.length) * 100)
				: null;

		points.push({
			date: day,
			label: WEEKDAY_FORMATTER.format(new Date(`${day}T00:00:00Z`)),
			plannedCu: round(plannedCu, 2),
			doneCu: round(doneCu, 2),
			microCu: round(microCu, 2),
			doneCount,
			microCount,
			skippedCount,
			successRate,
			hasMissingData,
			plannedCount: dayPlanned.length,
		});
	}

	return points;
}

function getUnresolvedPlannedCount(input: {
	planned: ProgressPlannedRow[];
	entries: ProgressEntryRow[];
	today: string;
}) {
	const entryByHabitDate = getEntryByHabitDate(input.entries);
	let unresolved = 0;

	for (const plannedItem of input.planned) {
		const day = dateKey(plannedItem.date);
		if (day > input.today) {
			continue;
		}

		const key = habitDateKey(plannedItem.habit_id, day);
		if (!entryByHabitDate.has(key)) {
			unresolved += 1;
		}
	}

	return unresolved;
}

export function computeCapacityUsed(input: {
	planned: ProgressPlannedRow[];
	entries: ProgressEntryRow[];
	rangeStart: string;
	rangeEnd: string;
	capacityByWeek: CapacityByWeekMap;
	weeklyCapacityDefault: number | null;
}) {
	const entryByHabitDate = getEntryByHabitDate(input.entries);
	const plannedByHabitDate = getPlannedByHabitDate(input.planned);

	let usedCu = 0;
	for (const plannedItem of input.planned) {
		const day = dateKey(plannedItem.date);
		const key = habitDateKey(plannedItem.habit_id, day);
		const entry = entryByHabitDate.get(key);
		if (!entry) {
			usedCu += toNumber(plannedItem.planned_weight_cu);
			continue;
		}

		if (entry.status === "skipped") {
			continue;
		}

		usedCu += toNumber(entry.actual_weight_cu);
	}

	for (const entry of input.entries) {
		const day = dateKey(entry.date);
		const key = habitDateKey(entry.habit_id, day);
		if (plannedByHabitDate.has(key) || entry.status === "skipped") {
			continue;
		}
		usedCu += toNumber(entry.actual_weight_cu);
	}

	let budgetCu = 0;
	let hasUnknownCapacity = false;
	for (const day of enumerateDates(input.rangeStart, input.rangeEnd)) {
		const weekStart = getWeekStartIso(day);
		const weeklyCapacity =
			input.capacityByWeek.get(weekStart) ?? input.weeklyCapacityDefault;

		if (weeklyCapacity === null || weeklyCapacity === undefined) {
			hasUnknownCapacity = true;
			continue;
		}

		budgetCu += weeklyCapacity / 7;
	}

	const normalizedUsed = round(usedCu, 1);
	const normalizedBudget =
		hasUnknownCapacity || budgetCu <= 0 ? null : round(budgetCu, 1);
	const ratio =
		normalizedBudget && normalizedBudget > 0
			? round(normalizedUsed / normalizedBudget, 3)
			: null;

	const status =
		normalizedBudget === null
			? "unknown"
			: normalizedUsed > normalizedBudget
				? "over"
				: "within";

	return {
		usedCu: normalizedUsed,
		budgetCu: normalizedBudget,
		ratio,
		status,
	} as const;
}

export function computeCompletionBreakdown(input: {
	planned: ProgressPlannedRow[];
	entries: ProgressEntryRow[];
	today: string;
}): CompletionBreakdown {
	let done = 0;
	let micro = 0;
	let explicitSkipped = 0;

	for (const entry of input.entries) {
		if (statusIsDone(entry.status)) {
			done += 1;
			continue;
		}

		if (entry.status === "micro_done") {
			micro += 1;
			continue;
		}

		if (entry.status === "skipped") {
			explicitSkipped += 1;
		}
	}

	const unresolved = getUnresolvedPlannedCount({
		planned: input.planned,
		entries: input.entries,
		today: input.today,
	});
	const skipped = explicitSkipped + unresolved;
	const total = done + micro + skipped;

	let note = "Keep logging to see steadier patterns.";
	if (total > 0) {
		if (skipped === 0) {
			note = "You stayed consistent through this range.";
		} else if (done + micro >= skipped) {
			note = "Small recoveries are keeping momentum alive.";
		} else {
			note = "Try reducing heavy days and leaning on micro-steps.";
		}
	}

	return {
		done,
		micro,
		skipped,
		total,
		note,
	};
}

export function computeLoadSuccessBuckets(
	dailyPoints: Array<{
		plannedCu: number;
		successRate: number | null;
		plannedCount?: number;
	}>,
): LoadBucketsResult {
	const sums = new Map<
		LoadBucketKey,
		{ weightedRate: number; weight: number; days: number }
	>();
	for (const key of BUCKET_ORDER) {
		sums.set(key, { weightedRate: 0, weight: 0, days: 0 });
	}

	for (const day of dailyPoints) {
		const bucket = getBucketKey(day.plannedCu);
		if (!bucket || day.successRate === null) {
			continue;
		}

		const state = sums.get(bucket);
		if (!state) {
			continue;
		}

		const weight = Math.max(1, day.plannedCount ?? 1);
		state.weightedRate += day.successRate * weight;
		state.weight += weight;
		state.days += 1;
	}

	let sweetSpotKey: LoadBucketKey | null = null;
	let bestRate = -1;

	const buckets: ProgressLoadBucket[] = BUCKET_ORDER.map((key) => {
		const state = sums.get(key) ?? { weightedRate: 0, weight: 0, days: 0 };
		const successRate =
			state.weight > 0 ? clampRate(state.weightedRate / state.weight) : null;

		if (successRate !== null && state.days >= 2 && successRate > bestRate) {
			bestRate = successRate;
			sweetSpotKey = key;
		}

		return {
			key,
			successRate,
			days: state.days,
		};
	});

	const sweetSpotCu = sweetSpotKey ? bucketMidpoint(sweetSpotKey) : null;
	const sweetSpotLabel = sweetSpotCu
		? `sweet spot ≈ ${formatCu(sweetSpotCu)} CU/day`
		: null;

	return {
		buckets,
		sweetSpotKey,
		sweetSpotCu,
		sweetSpotLabel,
	};
}

function getCapacityNote(summary: Pick<CapacitySummary, "status">) {
	if (summary.status === "unknown") {
		return "Set a weekly capacity to compare load.";
	}
	if (summary.status === "over") {
		return "Load is above budget. Try lighter days or micro-steps.";
	}
	return "You are within budget for this range.";
}

function computeSlipRecovery(input: {
	planned: ProgressPlannedRow[];
	entries: ProgressEntryRow[];
	today: string;
}) {
	const entryByHabitDate = getEntryByHabitDate(input.entries);
	const entriesByHabit = new Map<number, ProgressEntryRow[]>();

	for (const entry of input.entries) {
		const list = entriesByHabit.get(entry.habit_id) ?? [];
		list.push(entry);
		entriesByHabit.set(entry.habit_id, list);
	}

	for (const [, list] of entriesByHabit) {
		list.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));
	}

	const missedEvents = input.planned.filter((plannedItem) => {
		const day = dateKey(plannedItem.date);
		if (day > input.today) {
			return false;
		}
		const entry = entryByHabitDate.get(habitDateKey(plannedItem.habit_id, day));
		return !entry || entry.status === "skipped";
	});

	const explicitRecovered = input.entries.filter(
		(entry) => entry.status === "recovered",
	).length;

	let heuristicRecovered = 0;
	for (const missed of missedEvents) {
		const list = entriesByHabit.get(missed.habit_id) ?? [];
		const missDateStr = dateKey(missed.date);
		const recoveryWindowEnd = new Date(`${missDateStr}T00:00:00Z`);
		recoveryWindowEnd.setUTCDate(recoveryWindowEnd.getUTCDate() + 3);
		const recoveryEndStr = recoveryWindowEnd.toISOString().slice(0, 10);

		const recovered = list.some((entry) => {
			const entryDateStr = dateKey(entry.date);
			if (entryDateStr <= missDateStr || entryDateStr > recoveryEndStr) {
				return false;
			}

			return (
				entry.status === "micro_done" ||
				entry.status === "done" ||
				entry.status === "recovered"
			);
		});

		if (recovered) {
			heuristicRecovered += 1;
		}
	}

	const recovered = explicitRecovered + heuristicRecovered;
	const missed = missedEvents.length;
	const rate = missed > 0 ? clampRate((recovered / missed) * 100) : null;

	let note = "No missed check-ins in this range.";
	if (missed > 0 && rate !== null) {
		if (rate >= 60) {
			note = "You are returning quickly after misses. Keep this pattern.";
		} else if (rate >= 35) {
			note = "Recovery is building. Keep one easy fallback step ready.";
		} else {
			note = "A tiny fallback step can make returns easier after a miss.";
		}
	}

	return { recovered, missed, rate, note };
}

function computeMomentum(input: {
	current: CompletionBreakdown;
	previous: CompletionBreakdown;
}) {
	const currentSuccess =
		input.current.total > 0
			? clampRate(
					((input.current.done + input.current.micro) / input.current.total) *
						100,
				)
			: 0;
	const previousSuccess =
		input.previous.total > 0
			? clampRate(
					((input.previous.done + input.previous.micro) /
						input.previous.total) *
						100,
				)
			: null;

	const delta =
		previousSuccess === null
			? null
			: round(currentSuccess - previousSuccess, 1);

	let trend: "steady" | "up" | "down" | "new" = "new";
	if (delta !== null) {
		if (Math.abs(delta) < 1.5) {
			trend = "steady";
		} else if (delta > 0) {
			trend = "up";
		} else {
			trend = "down";
		}
	}

	let note = "Keep logging to unlock trend insights.";
	if (trend === "steady") {
		note = "Your momentum is steady versus the previous range.";
	} else if (trend === "up") {
		note = "Momentum is improving from the previous range.";
	} else if (trend === "down") {
		note = "Momentum dipped slightly; a lighter plan may help.";
	}

	return {
		successRate: currentSuccess,
		deltaVsPrevious: delta,
		trend,
		note,
	};
}

function pickTip(input: {
	missed: number;
	successRate: number | null;
	plannedCu: number;
	microUsage: number;
}) {
	if (input.missed >= 3) {
		return "Try reducing load on your busiest day.";
	}
	if (input.successRate !== null && input.successRate < 45) {
		return "A smaller first step may make this easier to resume.";
	}
	if (input.plannedCu >= 8) {
		return "Split this into lighter sessions across the week.";
	}
	if (input.microUsage > 0) {
		return "Micro-steps are helping; keep them available.";
	}
	return "Keep a steady context and protect your start cue.";
}

function pickSuggestion(input: {
	missed: number;
	successRate: number | null;
	microUsageCount: number;
}) {
	if (input.missed >= 3) {
		return {
			text: "This habit is often missed on heavy days. Consider moving one session to a lighter day.",
			ctaLabel: "Move to Sunday",
		};
	}
	if (input.successRate !== null && input.successRate < 50) {
		return {
			text: "Try lowering the planned load once this week to rebuild consistency.",
			ctaLabel: "Lighten one day",
		};
	}
	if (input.microUsageCount >= 2) {
		return {
			text: "Micro-steps are helping keep momentum. Keep one ready for busy days.",
			ctaLabel: "Keep micro-step",
		};
	}
	return {
		text: "Your cadence looks stable. Keep the same context cue next week.",
		ctaLabel: "Keep schedule",
	};
}

function buildHistory21(input: {
	habitId: number;
	rangeEnd: string;
	today: string;
	plannedHistory: ProgressPlannedRow[];
	entriesHistory: ProgressEntryRow[];
}) {
	const start = shiftIsoDate(input.rangeEnd, -20);
	const dates = enumerateDates(start, input.rangeEnd);
	const plannedSet = new Set(
		input.plannedHistory
			.filter((row) => row.habit_id === input.habitId)
			.map((row) => dateKey(row.date)),
	);
	const entryMap = new Map<string, ProgressEntryRow>();
	for (const entry of input.entriesHistory) {
		if (entry.habit_id !== input.habitId) {
			continue;
		}
		entryMap.set(dateKey(entry.date), entry);
	}

	return dates.map<HistoryCellStatus>((day) => {
		const entry = entryMap.get(day);
		if (entry) {
			if (statusIsDone(entry.status)) {
				return "done";
			}
			if (entry.status === "micro_done") {
				return "micro_done";
			}
			return "missed";
		}

		if (plannedSet.has(day) && day <= input.today) {
			return "missed";
		}

		return "empty";
	});
}

function buildTopAttention(input: {
	habits: ProgressHabitRow[];
	range: ProgressRange;
	plannedInRange: ProgressPlannedRow[];
	entriesInRange: ProgressEntryRow[];
	plannedHistory21: ProgressPlannedRow[];
	entriesHistory21: ProgressEntryRow[];
}) {
	const entryByHabitDate = getEntryByHabitDate(input.entriesInRange);
	const activeHabits = input.habits.filter((habit) => habit.is_active);
	const items: Array<ProgressHabitAttention & { attentionScore: number }> = [];

	for (const habit of activeHabits) {
		const planned = input.plannedInRange.filter(
			(item) => item.habit_id === habit.id,
		);
		const entries = input.entriesInRange.filter(
			(item) => item.habit_id === habit.id,
		);

		let done = 0;
		let micro = 0;
		let explicitSkipped = 0;

		for (const entry of entries) {
			if (statusIsDone(entry.status)) {
				done += 1;
			} else if (entry.status === "micro_done") {
				micro += 1;
			} else if (entry.status === "skipped") {
				explicitSkipped += 1;
			}
		}

		let unresolved = 0;
		for (const occurrence of planned) {
			const day = dateKey(occurrence.date);
			if (day > input.range.today) {
				continue;
			}
			const key = habitDateKey(habit.id, day);
			if (!entryByHabitDate.has(key)) {
				unresolved += 1;
			}
		}

		const missed = explicitSkipped + unresolved;
		const plannedCount = planned.length;
		const plannedCu = planned.reduce(
			(sum, item) => sum + toNumber(item.planned_weight_cu),
			0,
		);
		const successRate =
			plannedCount > 0
				? clampRate(((done + micro) / plannedCount) * 100)
				: null;

		const contextTag =
			planned.find((item) => Boolean(item.context_tag))?.context_tag ??
			habit.context_tags?.[0] ??
			null;
		const microUsageCount = entries.filter(
			(entry) => entry.status === "micro_done",
		).length;

		const tip = pickTip({
			missed,
			successRate,
			plannedCu,
			microUsage: microUsageCount,
		});
		const suggestion = pickSuggestion({
			missed,
			successRate,
			microUsageCount,
		});
		const history21 = buildHistory21({
			habitId: habit.id,
			rangeEnd: input.range.end,
			today: input.range.today,
			plannedHistory: input.plannedHistory21,
			entriesHistory: input.entriesHistory21,
		});
		const recentNotes = getNotes(
			input.entriesHistory21.filter((entry) => entry.habit_id === habit.id),
		);

		const attentionScore =
			missed * 3 +
			plannedCu * 0.25 +
			(successRate === null ? 1 : (100 - successRate) / 25);

		items.push({
			habitId: habit.id,
			title: habit.title,
			contextTag,
			plannedCu: round(plannedCu, 1),
			done,
			micro,
			missed,
			successRate,
			tip,
			microTitle: habit.micro_title,
			microUsageCount,
			history21,
			recentNotes,
			suggestion,
			attentionScore,
		});
	}

	const withData = items.filter(
		(item) =>
			item.plannedCu > 0 || item.done > 0 || item.micro > 0 || item.missed > 0,
	);
	const source = withData.length > 0 ? withData : items;

	return source
		.sort((a, b) => {
			if (b.attentionScore !== a.attentionScore) {
				return b.attentionScore - a.attentionScore;
			}
			return a.title.localeCompare(b.title);
		})
		.slice(0, 5)
		.map(({ attentionScore: _attentionScore, ...item }) => item);
}

function buildInsight(input: {
	daily: ProgressDailyPoint[];
	buckets: LoadBucketsResult;
}) {
	const observedDays = input.daily.filter((day) => day.plannedCount > 0).length;
	if (observedDays < 4 || !input.buckets.sweetSpotCu) {
		return {
			headline: "Not enough data yet — keep logging for a few days.",
			subline:
				"Once more check-ins are logged, we can suggest a steadier daily load.",
			primaryCta: "Adjust plan" as const,
			secondaryCta: "Enable micro-steps" as const,
			fallback: true,
			sweetSpotCu: null,
		};
	}

	const sweetSpot = input.buckets.sweetSpotCu;
	const higherLoadDays = input.daily.filter(
		(day) => day.plannedCu >= sweetSpot + 1,
	);
	const lighterDays = input.daily.filter(
		(day) => day.plannedCu > 0 && day.plannedCu <= sweetSpot,
	);

	const highRate =
		higherLoadDays.length > 0
			? round(
					higherLoadDays.reduce((sum, day) => sum + (day.successRate ?? 0), 0) /
						higherLoadDays.length,
					1,
				)
			: null;
	const lightRate =
		lighterDays.length > 0
			? round(
					lighterDays.reduce((sum, day) => sum + (day.successRate ?? 0), 0) /
						lighterDays.length,
					1,
				)
			: null;

	if (highRate !== null && lightRate !== null && lightRate - highRate >= 8) {
		return {
			headline: `When planned load goes above ~${formatCu(
				sweetSpot + 1,
			)} CU/day, completion tends to drop.`,
			subline:
				"Try shifting one heavier session to a lighter day and keep a micro-step available.",
			primaryCta: "Adjust plan" as const,
			secondaryCta: "Enable micro-steps" as const,
			fallback: false,
			sweetSpotCu: sweetSpot,
		};
	}

	return {
		headline: `Your completion stays steadier around ~${formatCu(
			sweetSpot,
		)} CU/day.`,
		subline:
			"Keep heavier tasks spread across the week to maintain a smoother rhythm.",
		primaryCta: "Adjust plan" as const,
		secondaryCta: "Enable micro-steps" as const,
		fallback: false,
		sweetSpotCu: sweetSpot,
	};
}

export function buildProgressResponse(
	input: BuildProgressMetricsInput,
): ProgressResponse {
	const capacity = computeCapacityUsed({
		planned: input.plannedInRange,
		entries: input.entriesInRange,
		rangeStart: input.range.start,
		rangeEnd: input.range.end,
		capacityByWeek: input.capacityByWeek,
		weeklyCapacityDefault: input.weeklyCapacityDefault,
	});
	const capacitySummary: CapacitySummary = {
		...capacity,
		note: getCapacityNote(capacity),
	};

	const completion = computeCompletionBreakdown({
		planned: input.plannedInRange,
		entries: input.entriesInRange,
		today: input.range.today,
	});
	const previousCompletion = computeCompletionBreakdown({
		planned: input.plannedInPreviousRange,
		entries: input.entriesInPreviousRange,
		today: input.range.previousEnd,
	});
	const momentum = computeMomentum({
		current: completion,
		previous: previousCompletion,
	});
	const slipRecovery = computeSlipRecovery({
		planned: input.plannedInRange,
		entries: input.entriesInRange,
		today: input.range.today,
	});

	const daily = buildDailyPoints({
		range: input.range,
		planned: input.plannedInRange,
		entries: input.entriesInRange,
	});
	const loadBuckets = computeLoadSuccessBuckets(daily);
	const insight = buildInsight({
		daily,
		buckets: loadBuckets,
	});
	const topAttention = buildTopAttention({
		habits: input.habits,
		range: input.range,
		plannedInRange: input.plannedInRange,
		entriesInRange: input.entriesInRange,
		plannedHistory21: input.plannedHistory21,
		entriesHistory21: input.entriesHistory21,
	});

	const hasHabits = input.habits.some((habit) => habit.is_active);
	const hasEntriesInRange = input.entriesInRange.length > 0;
	const hasPartialMissing = daily.some((point) => point.hasMissingData);

	return {
		range: {
			preset: input.range.preset,
			start: input.range.start,
			end: input.range.end,
			today: input.range.today,
			label: input.range.label,
		},
		summary: {
			capacity: capacitySummary,
			completion,
			momentum,
			slipRecovery,
		},
		insight,
		charts: {
			daily,
			loadBuckets: loadBuckets.buckets,
			sweetSpotLabel: loadBuckets.sweetSpotLabel,
		},
		habits: {
			topAttention,
		},
		states: {
			hasHabits,
			hasEntriesInRange,
			hasPartialMissing,
		},
	};
}
