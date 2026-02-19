import type { TodayItem } from "../types";

type TodayHeaderInfoProps = {
	date?: string;
	items?: TodayItem[];
};

type DayTone = "empty" | "complete" | "recovery" | "focus";

const DAY_TONE_CONTENT: Record<DayTone, { subtitle: string; emoji: string }> = {
	empty: {
		subtitle: "Nothing planned today. Enjoy the space or plan ahead.",
		emoji: "🌿",
	},
	complete: {
		subtitle: "Nice work. Everything planned for today is complete.",
		emoji: "✨",
	},
	recovery: {
		subtitle: "A slip doesn’t end the day. Small steps still count.",
		emoji: "💪",
	},
	focus: {
		subtitle: "Focus on what matters today. Keep it simple and doable.",
		emoji: "👋",
	},
};

function formatWeekday(dateString: string) {
	const date = new Date(`${dateString}T00:00:00`);
	return new Intl.DateTimeFormat("en-US", {
		weekday: "long",
	}).format(date);
}

function formatDateLabel(dateString: string) {
	const date = new Date(`${dateString}T00:00:00`);
	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		day: "numeric",
	}).format(date);
}

function getDayTone(items: TodayItem[]): DayTone {
	if (items.length === 0) {
		return "empty";
	}

	let allComplete = true;
	let hasSkipped = false;

	for (const item of items) {
		const isComplete = item.status === "done" || item.status === "micro_done";
		if (!isComplete) {
			allComplete = false;
		}

		if (item.status === "skipped") {
			hasSkipped = true;
		}
	}

	if (allComplete) {
		return "complete";
	}
	if (hasSkipped) {
		return "recovery";
	}

	return "focus";
}

export function TodayHeaderInfo({ date, items = [] }: TodayHeaderInfoProps) {
	const todayLabel = date ? `Happy ${formatWeekday(date)}` : "Happy Today";
	const dateLabel = date ? formatDateLabel(date) : "";
	const tone = getDayTone(items);
	const { subtitle, emoji } = DAY_TONE_CONTENT[tone];

	return (
		<div className="max-w-xl space-y-1">
			<p className="text-2xl font-semibold leading-tight tracking-[-0.01em] text-foreground sm:text-3xl">
				{todayLabel} <span aria-hidden>{emoji}</span>
			</p>
			{dateLabel ? (
				<p className="text-sm font-medium text-muted-foreground">{dateLabel}</p>
			) : null}
			{subtitle ? (
				<p className="text-sm leading-relaxed text-muted-foreground/90">{subtitle}</p>
			) : null}
		</div>
	);
}
