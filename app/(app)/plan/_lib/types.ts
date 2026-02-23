export type PlanOccurrence = {
	id: string;
	habit_id: number;
	habit_title: string;
	planned_weight_cu: number;
	habit_weight_cu: number;
	habit_has_micro: boolean;
	habit_micro_weight_cu: number;
};

export type PlanDay = {
	date: string;
	planned_cu: number;
	occurrences: PlanOccurrence[];
};

export type HabitOption = {
	id: number;
	title: string;
	weight_cu: number;
	freq_per_week: number;
	has_micro: boolean;
	micro_weight_cu: number;
};

export type PlanData = {
	week_start_date: string;
	week_end_date: string;
	today_date: string;
	weekly_capacity_cu: number | null;
	planned_cu: number;
	days: PlanDay[];
	habits: HabitOption[];
};

export type RemainingHabit = HabitOption & {
	planned_count: number;
	remaining: number;
};
