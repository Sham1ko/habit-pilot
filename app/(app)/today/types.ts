export type HabitStatus = "planned" | "done" | "micro_done" | "skipped" | "recovered";

export type TodayAction = "done" | "micro_done" | "skipped";

export type TodayItem = {
	occurrence_id: string;
	habit_id: number;
	habit_emoji: string | null;
	habit_title: string;
	habit_weight_cu: number;
	habit_has_micro: boolean;
	habit_micro_title: string | null;
	habit_micro_weight_cu: number;
	planned_weight_cu: number;
	context_tag: string | null;
	status: HabitStatus;
	actual_weight_cu: number | null;
	entry_id: string | null;
};
