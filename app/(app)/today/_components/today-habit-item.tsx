"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CuBadge } from "@/components/shared/cu-badge";
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

const MICRO_TOGGLE_WIDTH_PX = 200;

export function TodayHabitItem({
	item,
	isPending,
	onAction,
	formatCu,
}: TodayHabitItemProps) {
	const [isMicroExpanded, setIsMicroExpanded] = useState(false);
	const [canToggleMicro, setCanToggleMicro] = useState(false);
	const isCompleted = item.status !== "planned";
	const microTitle = item.habit_micro_title?.trim();
	const hasMicroDescription = item.habit_has_micro && Boolean(microTitle);
	const microDescriptionId = `micro-step-${item.occurrence_id}`;
	const microMeasureRef = useRef<HTMLSpanElement | null>(null);

	useEffect(() => {
		const measureTextWidth = () => {
			if (!hasMicroDescription) {
				setCanToggleMicro(false);
				setIsMicroExpanded(false);
				return;
			}

			const measuredWidth = microMeasureRef.current?.scrollWidth ?? 0;
			const shouldToggle = measuredWidth > MICRO_TOGGLE_WIDTH_PX;
			setCanToggleMicro(shouldToggle);
			if (!shouldToggle) {
				setIsMicroExpanded(false);
			}
		};

		measureTextWidth();
		window.addEventListener("resize", measureTextWidth);

		return () => {
			window.removeEventListener("resize", measureTextWidth);
		};
	}, [hasMicroDescription, microTitle]);

	return (
		<div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
			<div className="flex flex-wrap items-center justify-between gap-4">
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
							<CuBadge value={formatCu(item.planned_weight_cu)} />
							{item.habit_has_micro ? (
								<span className="rounded-full border border-border/70 bg-background px-2 py-1">
									Micro: {formatCu(item.habit_micro_weight_cu)} CU
								</span>
							) : null}
						</div>
						{hasMicroDescription ? (
							<div className="relative">
								<span
									ref={microMeasureRef}
									className="pointer-events-none absolute invisible whitespace-nowrap text-xs"
									aria-hidden
								>
									{microTitle}
								</span>
								{canToggleMicro ? (
									<button
										type="button"
										className="group flex w-full items-center gap-1 text-left text-xs"
										aria-expanded={isMicroExpanded}
										aria-controls={microDescriptionId}
										onClick={() => setIsMicroExpanded((prev) => !prev)}
									>
										<span className="font-medium text-foreground/90">
											Micro step:
										</span>
										<span
											id={microDescriptionId}
											className={cn(
												"flex-1 text-muted-foreground transition-colors group-hover:text-foreground/90",
												isMicroExpanded
													? "whitespace-normal"
													: "truncate whitespace-nowrap",
											)}
										>
											{microTitle}
										</span>
										<span className="text-[11px] text-primary">
											{isMicroExpanded ? "Hide" : "Show"}
										</span>
									</button>
								) : (
									<p className="flex w-full items-center gap-1 text-xs">
										<span className="font-medium text-foreground/90">
											Micro step:
										</span>
										<span
											id={microDescriptionId}
											className="text-muted-foreground"
										>
											{microTitle}
										</span>
									</p>
								)}
							</div>
						) : null}
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
					<Skeleton className="border h-15 w-15 rounded-lg" />
					<div className="space-y-2">
						<div className="flex flex-wrap items-center gap-2">
							<Skeleton className="h-7 w-52" />
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
