"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TodayAction, TodayItem } from "../types";

type TodayHabitItemProps = {
	item: TodayItem;
	isPending: boolean;
	onAction: (occurrenceId: string, action: TodayAction) => void;
	formatCu: (value: number) => string;
};

const statusLabel = {
	planned: "Planned",
	done: "Done",
	micro_done: "Micro-done",
	skipped: "Skipped",
	recovered: "Recovered",
} as const;

export function TodayHabitItem({
	item,
	isPending,
	onAction,
	formatCu,
}: TodayHabitItemProps) {
	const isCompleted = item.status !== "planned";

	return (
		<div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
			<div className="flex flex-wrap items-center justify-between">
				<div className="flex items-center gap-4">
					<div className="border p-4 rounded-lg bg-muted text-xl">
						{item.habit_emoji ? `${item.habit_emoji} ` : ""}
					</div>
					<div className="space-y-2">
						<div className="flex flex-wrap items-center gap-2">
							<h2 className="text-lg font-semibold">
								{item.habit_title}
							</h2>
							<span
								className={cn(
									"rounded-full border px-2 py-0.5 text-xs font-medium",
									item.status === "done" &&
									"border-emerald-200 bg-emerald-50 text-emerald-700",
									item.status === "micro_done" &&
									"border-sky-200 bg-sky-50 text-sky-700",
									item.status === "skipped" &&
									"border-rose-200 bg-rose-50 text-rose-700",
									item.status === "planned" &&
									"border-zinc-200 bg-zinc-50 text-zinc-600",
								)}
							>
								{statusLabel[item.status]}
							</span>
						</div>
						<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
							<span className="rounded-full border border-border/70 bg-background px-2 py-1">
								{formatCu(item.planned_weight_cu)} CU
							</span>
							{item.context_tag ? (
								<span className="rounded-full border border-border/70 bg-background px-2 py-1">
									{item.context_tag}
								</span>
							) : null}
							{item.habit_has_micro ? (
								<span className="rounded-full border border-border/70 bg-background px-2 py-1">
									Micro: {formatCu(item.habit_micro_weight_cu)} CU
								</span>
							) : null}
						</div>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						size="sm"
						disabled={isPending || isCompleted}
						onClick={() => onAction(item.occurrence_id, "done")}
					>
						Done
					</Button>
					<Button
						type="button"
						size="sm"
						variant="secondary"
						disabled={isPending || isCompleted}
						title="Mark micro-done"
						onClick={() => onAction(item.occurrence_id, "micro_done")}
					>
						Micro-done
					</Button>
					<Button
						type="button"
						size="sm"
						variant="outline"
						disabled={isPending || isCompleted}
						onClick={() => onAction(item.occurrence_id, "skipped")}
					>
						Skip
					</Button>
				</div>
			</div>
		</div>
	);
}

export function TodayHabitItemSkeleton() {
	return (
		<div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-4">
					<Skeleton className="h-15 w-15 rounded-lg" />
					<div className="space-y-2">
						<div className="flex flex-wrap items-center gap-2">
							<Skeleton className="h-7 w-52" />
							<Skeleton className="h-5 w-20 rounded-full" />
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Skeleton className="h-6 w-16 rounded-full" />
							<Skeleton className="h-6 w-24 rounded-full" />
						</div>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Skeleton className="h-9 w-14 rounded-md" />
					<Skeleton className="h-9 w-24 rounded-md" />
					<Skeleton className="h-9 w-14 rounded-md" />
				</div>
			</div>
		</div>
	);
}
