"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgressResponse } from "@/lib/progress/types";

type LoadSuccessChartProps = {
	buckets: ProgressResponse["charts"]["loadBuckets"];
	sweetSpotLabel: string | null;
};

type TooltipPayload = {
	payload?: Array<{
		payload: {
			key: string;
			successRate: number | null;
			days: number;
			displayRate: number;
		};
	}>;
};

function ChartTooltip({ payload }: TooltipPayload) {
	const point = payload?.[0]?.payload;
	if (!point) {
		return null;
	}

	return (
		<div className="bg-popover text-popover-foreground min-w-[150px] rounded-md border p-3 text-xs shadow-md">
			<p className="font-semibold">{point.key} CU/day</p>
			<p className="mt-1">
				Success:{" "}
				{point.successRate === null
					? "Not enough data"
					: `${Math.round(point.successRate)}%`}
			</p>
			<p>Days: {point.days}</p>
		</div>
	);
}

export function LoadSuccessChart({
	buckets,
	sweetSpotLabel,
}: LoadSuccessChartProps) {
	const data = buckets.map((bucket) => ({
		...bucket,
		displayRate: bucket.successRate ?? 0,
	}));

	return (
		<Card className="gap-0">
			<CardHeader className="pb-2">
				<CardTitle className="text-xl">Load vs Success Rate</CardTitle>
			</CardHeader>
			<CardContent className="h-[300px] pl-1">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={data}>
						<CartesianGrid
							strokeDasharray="3 3"
							vertical={false}
							opacity={0.2}
						/>
						<XAxis
							dataKey="key"
							tickFormatter={(value) => `${value} CU`}
							tickLine={false}
							axisLine={false}
							fontSize={12}
						/>
						<YAxis
							domain={[0, 100]}
							tickFormatter={(value) => `${value}%`}
							tickLine={false}
							axisLine={false}
							fontSize={12}
							width={38}
						/>
						<Tooltip
							cursor={{
								fill: "hsl(var(--muted))",
								fillOpacity: 0.18,
							}}
							content={<ChartTooltip />}
						/>
						<Bar
							dataKey="displayRate"
							fill="hsl(145 70% 42%)"
							radius={[8, 8, 0, 0]}
						/>
					</BarChart>
				</ResponsiveContainer>
				{sweetSpotLabel ? (
					<p className="text-muted-foreground mt-2 text-xs">{sweetSpotLabel}</p>
				) : (
					<p className="text-muted-foreground mt-2 text-xs">
						Keep logging to identify your load sweet spot.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
