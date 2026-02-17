export type ProgressRangePreset =
	| "this_week"
	| "last_week"
	| "four_weeks"
	| "three_months"
	| "custom";

export type HistoryCellStatus = "done" | "micro_done" | "missed" | "empty";

export type HabitEntryStatus = "done" | "skipped" | "micro_done" | "recovered";

export type ProgressRange = {
	preset: ProgressRangePreset;
	start: string;
	end: string;
	today: string;
	label: string;
	previousStart: string;
	previousEnd: string;
};

export type ProgressDailyPoint = {
	date: string;
	label: string;
	plannedCu: number;
	doneCu: number;
	microCu: number;
	doneCount: number;
	microCount: number;
	skippedCount: number;
	successRate: number | null;
	hasMissingData: boolean;
	plannedCount: number;
};

export type LoadBucketKey = "1-3" | "4-5" | "6-7" | "8+";

export type ProgressLoadBucket = {
	key: LoadBucketKey;
	successRate: number | null;
	days: number;
};

export type ProgressHabitAttention = {
	habitId: number;
	title: string;
	contextTag: string | null;
	plannedCu: number;
	done: number;
	micro: number;
	missed: number;
	successRate: number | null;
	tip: string;
	microTitle: string | null;
	microUsageCount: number;
	history21: HistoryCellStatus[];
	recentNotes: string[];
	suggestion: {
		text: string;
		ctaLabel: string;
	};
};

export type ProgressResponse = {
	range: {
		preset: ProgressRangePreset;
		start: string;
		end: string;
		today: string;
		label: string;
	};
	summary: {
		capacity: {
			usedCu: number;
			budgetCu: number | null;
			ratio: number | null;
			status: "within" | "over" | "unknown";
			note: string;
		};
		completion: {
			done: number;
			micro: number;
			skipped: number;
			total: number;
			note: string;
		};
		momentum: {
			successRate: number;
			deltaVsPrevious: number | null;
			trend: "steady" | "up" | "down" | "new";
			note: string;
		};
		slipRecovery: {
			recovered: number;
			missed: number;
			rate: number | null;
			note: string;
		};
	};
	insight: {
		headline: string;
		subline: string;
		primaryCta: "Adjust plan";
		secondaryCta: "Enable micro-steps";
		fallback: boolean;
		sweetSpotCu: number | null;
	};
	charts: {
		daily: ProgressDailyPoint[];
		loadBuckets: ProgressLoadBucket[];
		sweetSpotLabel: string | null;
	};
	habits: {
		topAttention: ProgressHabitAttention[];
	};
	states: {
		hasHabits: boolean;
		hasEntriesInRange: boolean;
		hasPartialMissing: boolean;
	};
};

export type ProgressHabitRow = {
	id: number;
	title: string;
	weight_cu: unknown;
	micro_title: string | null;
	micro_weight_cu: unknown;
	context_tags: string[];
	has_micro: boolean;
	is_active: boolean;
};

export type ProgressPlannedRow = {
	id: string;
	habit_id: number;
	date: string;
	planned_weight_cu: unknown;
	context_tag: string | null;
};

export type ProgressEntryRow = {
	id: string;
	habit_id: number;
	date: string;
	actual_weight_cu: unknown;
	status: HabitEntryStatus;
	note: string | null;
};

export type CapacityByWeekMap = Map<string, number | null>;
