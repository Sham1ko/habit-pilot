import { Skeleton } from "@/components/ui/skeleton";

type WeeklyCapacityCardProps = {
	weeklyCapacity: number | null;
	usedCu: number;
	formatCu: (value: number) => string;
};

export function WeeklyCapacityCard({
	weeklyCapacity,
	usedCu,
	formatCu,
}: WeeklyCapacityCardProps) {
	const capacityRatio =
		weeklyCapacity && weeklyCapacity > 0 ? usedCu / weeklyCapacity : 0;
	const capacityState =
		capacityRatio > 1 ? "over" : capacityRatio > 0.9 ? "high" : "ok";

	const capacityBarClass =
		capacityState === "over"
			? "h-2 rounded-full bg-rose-500 transition-all"
			: capacityState === "high"
				? "h-2 rounded-full bg-amber-500 transition-all"
				: "h-2 rounded-full bg-emerald-500 transition-all";

	return (
		<div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
			<div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
				<span>Weekly capacity</span>
				{weeklyCapacity ? (
					<span>{`${formatCu(usedCu)} / ${formatCu(weeklyCapacity)} CU`}</span>
				) : (
					<Skeleton className="h-4 w-16" />
				)}
			</div>
			<div className="mt-2 h-2 rounded-full bg-muted">
				<div
					className={capacityBarClass}
					style={{
						width: `${Math.min(capacityRatio * 100, 100)}%`,
					}}
				/>
			</div>
			{capacityState === "over" ? (
				<p className="mt-2 text-xs text-rose-600">
					You’re over capacity. Consider micro-steps today.
				</p>
			) : null}
		</div>
	);
}
