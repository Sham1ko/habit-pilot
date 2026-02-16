"use client";

import { CornerDownRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCu, formatDayLabel } from "../_lib/plan-utils";
import type { PlanDay, RemainingHabit } from "../_lib/types";

export type OverloadMicroSuggestion = {
	occurrenceId: string;
	habitTitle: string;
	savingsCu: number;
};

export type OverloadMoveSuggestion = {
	occurrenceId: string;
	habitTitle: string;
	targetDate: string;
};

type RemainingHabitsPanelProps = {
	remainingHabits: RemainingHabit[];
	days: PlanDay[];
	isOverloaded: boolean;
	overloadMicroSuggestion: OverloadMicroSuggestion | null;
	overloadMoveSuggestion: OverloadMoveSuggestion | null;
	onAddOccurrence: (habitId: number, date: string) => void;
	onApplyMicroSuggestion: (occurrenceId: string) => void;
	onApplyMoveSuggestion: (occurrenceId: string, targetDate: string) => void;
	onOpenSetCapacity: () => void;
};

export function RemainingHabitsPanel({
	remainingHabits,
	days,
	isOverloaded,
	overloadMicroSuggestion,
	overloadMoveSuggestion,
	onAddOccurrence,
	onApplyMicroSuggestion,
	onApplyMoveSuggestion,
	onOpenSetCapacity,
}: RemainingHabitsPanelProps) {
	return (
		<aside className="space-y-4">
			<section className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
				<div className="mb-3 flex items-start justify-between gap-3">
					<div>
						<h2 className="text-sm font-semibold">Remaining habits</h2>
						<p className="text-xs text-muted-foreground">
							Add unplanned occurrences for this week.
						</p>
					</div>
					<span className="rounded-full border border-border bg-background px-2 py-1 text-xs text-muted-foreground">
						{remainingHabits.reduce((sum, habit) => sum + habit.remaining, 0)}{" "}
						left
					</span>
				</div>

				<div className="space-y-2">
					{remainingHabits.length === 0 ? (
						<div className="rounded-lg border border-dashed border-border/80 bg-background/80 p-4 text-center text-xs text-muted-foreground">
							All weekly frequencies are distributed.
						</div>
					) : (
						remainingHabits.map((habit) => {
							const availableDays = days.filter(
								(day) =>
									!day.occurrences.some((item) => item.habit_id === habit.id),
							);

							return (
								<article
									key={habit.id}
									className="rounded-lg border border-border bg-card p-3"
								>
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0">
											<p className="truncate text-sm font-medium">
												{habit.title}
											</p>
											<p className="text-xs text-muted-foreground">
												Remaining {habit.remaining}
											</p>
										</div>
										<span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
											{formatCu(habit.weight_cu)} CU
										</span>
									</div>

									<div className="mt-2 flex items-center justify-between gap-2">
										{habit.has_micro ? (
											<span className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-300">
												<CornerDownRight className="size-3.5" />
												Micro-step available
											</span>
										) : (
											<span className="text-xs text-muted-foreground">
												Standard only
											</span>
										)}

										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													type="button"
													size="sm"
													variant="outline"
													disabled={availableDays.length === 0}
												>
													<Plus className="size-4" />
													Add
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-40">
												{availableDays.length > 0 ? (
													availableDays.map((day) => (
														<DropdownMenuItem
															key={`${habit.id}-${day.date}`}
															onSelect={() =>
																onAddOccurrence(habit.id, day.date)
															}
														>
															{formatDayLabel(day.date)}
														</DropdownMenuItem>
													))
												) : (
													<DropdownMenuItem disabled>
														All days used
													</DropdownMenuItem>
												)}
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								</article>
							);
						})
					)}
				</div>
			</section>

			{isOverloaded ? (
				<section className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-600 dark:text-rose-300 shadow-sm">
					<h3 className="text-sm font-semibold">Overload helper</h3>
					<p className="mt-1 text-xs text-rose-600/90 dark:text-rose-300/90">
						Capacity is exceeded. Try one of these actions:
					</p>
					<div className="mt-3 space-y-2">
						{overloadMicroSuggestion ? (
							<Button
								type="button"
								size="sm"
								variant="secondary"
								className="w-full justify-start"
								onClick={() =>
									onApplyMicroSuggestion(overloadMicroSuggestion.occurrenceId)
								}
							>
								Convert {overloadMicroSuggestion.habitTitle} to micro-step (-
								{formatCu(overloadMicroSuggestion.savingsCu)} CU)
							</Button>
						) : null}
						{overloadMoveSuggestion ? (
							<Button
								type="button"
								size="sm"
								variant="outline"
								className="w-full justify-start border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
								onClick={() =>
									onApplyMoveSuggestion(
										overloadMoveSuggestion.occurrenceId,
										overloadMoveSuggestion.targetDate,
									)
								}
							>
								Move {overloadMoveSuggestion.habitTitle} to next week
							</Button>
						) : null}
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="w-full justify-start border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
							onClick={onOpenSetCapacity}
						>
							Adjust weekly capacity
						</Button>
					</div>
				</section>
			) : null}
		</aside>
	);
}
