"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProgressResponse } from "@/lib/progress/types";

const DailyLoadOutcomesChart = dynamic(
	() =>
		import("./daily-load-outcomes-chart").then(
			(module) => module.DailyLoadOutcomesChart,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[360px] rounded-xl" />,
	},
);

const LoadSuccessChart = dynamic(
	() =>
		import("./load-success-chart").then((module) => module.LoadSuccessChart),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[360px] rounded-xl" />,
	},
);

type ChartsRowProps = {
	daily: ProgressResponse["charts"]["daily"];
	loadBuckets: ProgressResponse["charts"]["loadBuckets"];
	sweetSpotLabel: string | null;
	selectedDay: string | null;
	onSelectDay: (day: string | null) => void;
};

export function ChartsRow({
	daily,
	loadBuckets,
	sweetSpotLabel,
	selectedDay,
	onSelectDay,
}: ChartsRowProps) {
	return (
		<section className="grid gap-4 xl:grid-cols-2">
			<DailyLoadOutcomesChart
				data={daily}
				selectedDay={selectedDay}
				onSelectDay={onSelectDay}
			/>
			<LoadSuccessChart buckets={loadBuckets} sweetSpotLabel={sweetSpotLabel} />
		</section>
	);
}
