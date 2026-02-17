"use client";

import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { shiftIsoDate } from "@/lib/progress/date-range";
import type { ProgressHabitAttention } from "@/lib/progress/types";
import { cn } from "@/lib/utils";

type SortOption = "most_missed" | "highest_load" | "lowest_success";

type HabitsNeedingAttentionTableProps = {
	habits: ProgressHabitAttention[];
	rangeEnd: string;
	selectedDay: string | null;
	onHabitSelect: (habit: ProgressHabitAttention) => void;
};

function getSortLabel(sortBy: SortOption) {
	if (sortBy === "highest_load") {
		return "Highest load";
	}
	if (sortBy === "lowest_success") {
		return "Lowest success";
	}
	return "Most missed";
}

function getHistoryIndex(rangeEnd: string, day: string) {
	const start = shiftIsoDate(rangeEnd, -20);
	const startDate = new Date(`${start}T00:00:00Z`).getTime();
	const targetDate = new Date(`${day}T00:00:00Z`).getTime();
	const diff = Math.round((targetDate - startDate) / (1000 * 60 * 60 * 24));
	return diff >= 0 && diff <= 20 ? diff : null;
}

function formatPercent(value: number | null) {
	if (value === null) {
		return "—";
	}
	return `${Math.round(value)}%`;
}

export function HabitsNeedingAttentionTable({
	habits,
	rangeEnd,
	selectedDay,
	onHabitSelect,
}: HabitsNeedingAttentionTableProps) {
	const [sortBy, setSortBy] = useState<SortOption>("most_missed");

	const visibleHabits = useMemo(() => {
		let list = habits;
		const index = selectedDay ? getHistoryIndex(rangeEnd, selectedDay) : null;
		if (index !== null) {
			list = list.filter((habit) => habit.history21[index] !== "empty");
		}

		const sorted = [...list].sort((a, b) => {
			if (sortBy === "highest_load") {
				if (b.plannedCu !== a.plannedCu) {
					return b.plannedCu - a.plannedCu;
				}
				return b.missed - a.missed;
			}

			if (sortBy === "lowest_success") {
				const aRate = a.successRate ?? 0;
				const bRate = b.successRate ?? 0;
				if (aRate !== bRate) {
					return aRate - bRate;
				}
				return b.missed - a.missed;
			}

			if (b.missed !== a.missed) {
				return b.missed - a.missed;
			}
			return b.plannedCu - a.plannedCu;
		});

		return sorted.slice(0, 5);
	}, [habits, selectedDay, rangeEnd, sortBy]);

	return (
		<Card className="gap-0">
			<CardHeader>
				<div className="flex flex-wrap items-center justify-between gap-2">
					<CardTitle className="text-2xl">
						Top 5 habits needing attention
					</CardTitle>
					<div className="flex items-center gap-2">
						{selectedDay ? (
							<p className="text-muted-foreground text-xs">
								Filtered by {selectedDay}
							</p>
						) : null}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button type="button" size="sm" variant="outline">
									<SlidersHorizontal className="size-4" />
									{getSortLabel(sortBy)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onSelect={() => setSortBy("most_missed")}>
									Most missed
								</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => setSortBy("highest_load")}>
									Highest load
								</DropdownMenuItem>
								<DropdownMenuItem onSelect={() => setSortBy("lowest_success")}>
									Lowest success
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="hidden md:block">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Habit</TableHead>
								<TableHead>Planned CU</TableHead>
								<TableHead>Done</TableHead>
								<TableHead>Micro</TableHead>
								<TableHead>Missed</TableHead>
								<TableHead>Tips</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{visibleHabits.length > 0 ? (
								visibleHabits.map((habit) => (
									<TableRow
										key={habit.habitId}
										role="button"
										tabIndex={0}
										onClick={() => onHabitSelect(habit)}
										onKeyDown={(event) => {
											if (event.key === "Enter" || event.key === " ") {
												event.preventDefault();
												onHabitSelect(habit);
											}
										}}
										className="cursor-pointer"
										aria-label={`Open details for ${habit.title}`}
									>
										<TableCell>
											<div>
												<p className="font-medium">{habit.title}</p>
												{habit.contextTag ? (
													<p className="text-muted-foreground text-xs">
														{habit.contextTag}
													</p>
												) : null}
											</div>
										</TableCell>
										<TableCell>{habit.plannedCu}</TableCell>
										<TableCell>
											<Badge variant="success">{habit.done}</Badge>
										</TableCell>
										<TableCell>
											<Badge variant="warning">{habit.micro}</Badge>
										</TableCell>
										<TableCell>
											<Badge variant={habit.missed > 0 ? "muted" : "outline"}>
												{habit.missed}
											</Badge>
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{habit.tip}
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-muted-foreground text-center"
									>
										No habits match the current filter.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>

				<div className="grid gap-3 md:hidden">
					{visibleHabits.length > 0 ? (
						visibleHabits.map((habit) => (
							<button
								key={habit.habitId}
								type="button"
								onClick={() => onHabitSelect(habit)}
								className={cn(
									"rounded-xl border border-border bg-background p-4 text-left",
									"focus-visible:ring-ring focus-visible:ring-2",
								)}
							>
								<div className="mb-2 flex items-start justify-between gap-2">
									<div>
										<p className="font-semibold">{habit.title}</p>
										{habit.contextTag ? (
											<p className="text-muted-foreground text-xs">
												{habit.contextTag}
											</p>
										) : null}
									</div>
									<Badge variant="outline">
										{formatPercent(habit.successRate)}
									</Badge>
								</div>
								<div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
									<Badge variant="outline">Planned {habit.plannedCu} CU</Badge>
									<Badge variant="success">Done {habit.done}</Badge>
									<Badge variant="warning">Micro {habit.micro}</Badge>
									<Badge variant="muted">Missed {habit.missed}</Badge>
								</div>
								<p className="text-muted-foreground text-sm">{habit.tip}</p>
							</button>
						))
					) : (
						<p className="text-muted-foreground rounded-lg border border-border p-4 text-sm">
							No habits match the current filter.
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
