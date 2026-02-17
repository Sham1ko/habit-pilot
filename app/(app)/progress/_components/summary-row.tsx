import { Activity, BarChart3, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProgressResponse } from "@/lib/progress/types";

type SummaryRowProps = {
	summary: ProgressResponse["summary"];
};

function formatCu(value: number | null) {
	if (value === null) {
		return "—";
	}
	const rounded = Math.round(value * 10) / 10;
	return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatPercent(value: number | null) {
	if (value === null) {
		return "—";
	}
	return `${Math.round(value)}%`;
}

export function SummaryRow({ summary }: SummaryRowProps) {
	const completionTotal = Math.max(
		1,
		summary.completion.done +
			summary.completion.micro +
			summary.completion.skipped,
	);
	const doneSegment = (summary.completion.done / completionTotal) * 100;
	const microSegment = (summary.completion.micro / completionTotal) * 100;
	const skippedSegment = (summary.completion.skipped / completionTotal) * 100;

	return (
		<section className="grid gap-4 md:grid-cols-3">
			<Card className="gap-0">
				<CardHeader>
					<CardDescription className="flex items-center gap-2 text-xs uppercase tracking-[0.12em]">
						<Gauge className="size-3.5" />
						Capacity (CU/wk)
					</CardDescription>
					<CardTitle className="text-3xl">
						{formatCu(summary.capacity.usedCu)}
						<span className="text-muted-foreground text-xl">
							{" "}
							/ {formatCu(summary.capacity.budgetCu)}
						</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<Progress
						value={
							summary.capacity.ratio
								? Math.min(summary.capacity.ratio * 100, 100)
								: 0
						}
						indicatorClassName={
							summary.capacity.status === "over"
								? "bg-amber-500"
								: summary.capacity.status === "within"
									? "bg-emerald-500"
									: "bg-muted-foreground"
						}
					/>
					<div className="flex items-center justify-between gap-2">
						<p className="text-muted-foreground text-xs">
							{summary.capacity.note}
						</p>
						<Badge
							variant={
								summary.capacity.status === "over"
									? "warning"
									: summary.capacity.status === "within"
										? "success"
										: "muted"
							}
						>
							{summary.capacity.status === "over"
								? "Over budget"
								: summary.capacity.status === "within"
									? "Within budget"
									: "No budget"}
						</Badge>
					</div>
				</CardContent>
			</Card>

			<Card className="gap-0">
				<CardHeader>
					<CardDescription className="flex items-center gap-2 text-xs uppercase tracking-[0.12em]">
						<Activity className="size-3.5" />
						Completion
					</CardDescription>
					<CardTitle className="text-3xl">
						{summary.completion.done} Done{" "}
						<span className="text-amber-500 text-xl">
							{summary.completion.micro} Micro
						</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-muted-foreground text-xs">
						Skipped: {summary.completion.skipped}
					</p>
					<div className="bg-muted flex h-2 overflow-hidden rounded-full">
						<div
							className="bg-emerald-500 h-full"
							style={{ width: `${doneSegment}%` }}
						/>
						<div
							className="bg-amber-500 h-full"
							style={{ width: `${microSegment}%` }}
						/>
						<div
							className="bg-slate-400 h-full"
							style={{ width: `${skippedSegment}%` }}
						/>
					</div>
					<p className="text-muted-foreground text-xs">
						{summary.completion.note}
					</p>
				</CardContent>
			</Card>

			<Card className="gap-0">
				<CardHeader>
					<CardDescription className="flex items-center gap-2 text-xs uppercase tracking-[0.12em]">
						<BarChart3 className="size-3.5" />
						Momentum
					</CardDescription>
					<CardTitle className="text-3xl">
						{formatPercent(summary.momentum.successRate)}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<div className="flex items-center gap-2 text-xs">
						<Badge
							variant={
								summary.momentum.trend === "up"
									? "success"
									: summary.momentum.trend === "down"
										? "warning"
										: "muted"
							}
						>
							{summary.momentum.trend === "up"
								? "Improving"
								: summary.momentum.trend === "down"
									? "Adjusting"
									: summary.momentum.trend === "steady"
										? "Steady"
										: "New range"}
						</Badge>
						<span className="text-muted-foreground">
							{summary.momentum.deltaVsPrevious === null
								? "No previous baseline"
								: `${summary.momentum.deltaVsPrevious > 0 ? "+" : ""}${summary.momentum.deltaVsPrevious}% vs previous`}
						</span>
					</div>
					<p className="text-muted-foreground text-xs">
						{summary.momentum.note}
					</p>
				</CardContent>
			</Card>
		</section>
	);
}
