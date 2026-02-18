export type HabitListItem = {
	id: number;
	emoji: string | null;
	title: string;
	description: string | null;
	weight_cu: string;
	freq_type: string;
	freq_per_week: string;
	micro_title: string | null;
	micro_weight_cu: string;
	has_micro: boolean;
};
