"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgressResponse } from "@/lib/progress/types";

type DailyLoadOutcomesChartProps = {
	data: ProgressResponse["charts"]["daily"];
	selectedDay: string | null;
	onSelectDay: (day: string | null) => void;
};

type ChartTooltipProps = {
	active?: boolean;
	payload?: Array<{
		payload: ProgressResponse["charts"]["daily"][number];
	}>;
};

function ChartTooltip({ active, payload }: ChartTooltipProps) {
	if (!active || !payload?.length) {
		return null;
	}
	const point = payload[0].payload;

	return (
		<div className="bg-popover text-popover-foreground min-w-[170px] rounded-md border p-3 text-xs shadow-md">
			<p className="mb-2 font-semibold">{point.date}</p>
			<div className="space-y-1">
				<p>Planned CU: {point.plannedCu}</p>
				<p>Done: {point.doneCount}</p>
				<p>Micro: {point.microCount}</p>
				<p>Skipped: {point.skippedCount}</p>
			</div>
		</div>
	);
}

export function DailyLoadOutcomesChart({
	data,
	selectedDay,
	onSelectDay,
}: DailyLoadOutcomesChartProps) {
	return (
		<Card className="gap-0">
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between gap-2">
					<CardTitle className="text-xl">Daily Load & Outcomes</CardTitle>
					{selectedDay ? (
						<button
							type="button"
							onClick={() => onSelectDay(null)}
							className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
						>
							Clear day filter
						</button>
					) : null}
				</div>
			</CardHeader>
			<CardContent className="h-[300px] pl-1">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={data} barGap={2}>
						<CartesianGrid
							strokeDasharray="3 3"
							vertical={false}
							opacity={0.2}
						/>
						<XAxis
							dataKey="label"
							tickLine={false}
							axisLine={false}
							fontSize={12}
						/>
						<YAxis
							tickLine={false}
							axisLine={false}
							fontSize={12}
							width={32}
							allowDecimals={false}
						/>
						<Tooltip
							cursor={{
								fill: "hsl(var(--muted))",
								fillOpacity: 0.18,
							}}
							content={<ChartTooltip />}
						/>
						<Legend
							verticalAlign="top"
							align="right"
							iconType="circle"
							wrapperStyle={{ fontSize: 12 }}
						/>
						<Bar
							dataKey="plannedCu"
							name="Planned"
							fill="hsl(220 16% 62%)"
							radius={[6, 6, 0, 0]}
						/>
						<Bar
							dataKey="doneCu"
							name="Done CU"
							fill="hsl(145 70% 42%)"
							radius={[6, 6, 0, 0]}
						>
							{data.map((point) => (
								<Cell
									key={`done-${point.date}`}
									cursor="pointer"
									stroke={
										selectedDay === point.date
											? "hsl(var(--foreground))"
											: "transparent"
									}
									strokeWidth={selectedDay === point.date ? 1.5 : 0}
									onClick={() =>
										onSelectDay(selectedDay === point.date ? null : point.date)
									}
								/>
							))}
						</Bar>
						<Bar
							dataKey="microCu"
							name="Micro CU"
							fill="hsl(42 90% 52%)"
							radius={[6, 6, 0, 0]}
						>
							{data.map((point) => (
								<Cell
									key={`micro-${point.date}`}
									cursor="pointer"
									stroke={
										selectedDay === point.date
											? "hsl(var(--foreground))"
											: "transparent"
									}
									strokeWidth={selectedDay === point.date ? 1.5 : 0}
									onClick={() =>
										onSelectDay(selectedDay === point.date ? null : point.date)
									}
								/>
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
