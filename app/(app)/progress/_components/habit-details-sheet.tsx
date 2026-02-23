"use client";

import { BookOpenCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ProgressHabitAttention } from "@/lib/progress/types";
import { cn } from "@/lib/utils";

type HabitDetailsSheetProps = {
	open: boolean;
	onOpenChange: (nextOpen: boolean) => void;
	habit: ProgressHabitAttention | null;
};

function getHistoryCellClass(
	status: ProgressHabitAttention["history21"][number],
) {
	if (status === "done") {
		return "bg-emerald-500/90";
	}
	if (status === "micro_done") {
		return "bg-amber-500/90";
	}
	if (status === "missed") {
		return "bg-slate-400/80";
	}
	return "bg-muted";
}

export function HabitDetailsSheet({
	open,
	onOpenChange,
	habit,
}: HabitDetailsSheetProps) {
	const isMobile = useIsMobile();
	const completedCount = (habit?.done ?? 0) + (habit?.micro ?? 0);
	const microUsageRatio =
		habit && completedCount > 0
			? (habit.microUsageCount / completedCount) * 100
			: 0;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side={isMobile ? "bottom" : "right"}
				className={cn(
					"w-full gap-0 p-0",
					isMobile ? "h-[84vh] max-h-[84vh] border-t" : "sm:max-w-md",
				)}
			>
				<SheetHeader className="border-b px-5 pt-5 pb-4">
					<SheetTitle className="text-2xl">Habit Details</SheetTitle>
					<SheetDescription>
						Supportive detail for one habit at a time.
					</SheetDescription>
				</SheetHeader>

				{habit ? (
					<div className="min-h-0 space-y-5 overflow-y-auto px-5 py-4">
						<section className="space-y-2">
							<div className="flex items-center gap-3">
								<div className="bg-primary/10 text-primary inline-flex size-11 items-center justify-center rounded-xl">
									<BookOpenCheck className="size-5" />
								</div>
								<div>
									<h3 className="text-xl font-semibold">{habit.title}</h3>
								</div>
							</div>
						</section>

						<section className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
							<p className="text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-2 text-sm font-semibold">
								<Sparkles className="size-4" />
								Smart Suggestion
							</p>
							<p className="text-sm">{habit.suggestion.text}</p>
							<Button type="button" size="sm" className="mt-3">
								{habit.suggestion.ctaLabel}
							</Button>
						</section>

						<section className="space-y-2">
							<div className="flex items-center justify-between">
								<h4 className="text-sm font-semibold uppercase tracking-[0.12em]">
									21-Day History
								</h4>
								<p className="text-muted-foreground text-xs">Last 3 weeks</p>
							</div>
							<div className="grid grid-cols-7 gap-1.5">
								{habit.history21.map((status, index) => (
									<div
										key={`history-${habit.habitId}-${index}`}
										className={cn(
											"h-7 rounded-sm border border-black/5",
											getHistoryCellClass(status),
										)}
										title={`Day ${index + 1}: ${status}`}
									/>
								))}
							</div>
							<div className="text-muted-foreground flex items-center gap-2 text-xs">
								<span className="inline-flex items-center gap-1">
									<span className="size-2 rounded-full bg-emerald-500" />
									Done
								</span>
								<span className="inline-flex items-center gap-1">
									<span className="size-2 rounded-full bg-amber-500" />
									Micro
								</span>
								<span className="inline-flex items-center gap-1">
									<span className="size-2 rounded-full bg-slate-400" />
									Missed
								</span>
							</div>
						</section>

						<section className="space-y-2">
							<div className="flex items-center justify-between">
								<h4 className="text-sm font-semibold uppercase tracking-[0.12em]">
									Micro-step Usage
								</h4>
								<Badge variant="outline">
									Used {habit.microUsageCount} times
								</Badge>
							</div>
							<Progress
								value={microUsageRatio}
								indicatorClassName="bg-amber-500"
							/>
							<p className="text-muted-foreground text-sm">
								{habit.microTitle
									? `"${habit.microTitle}" helped maintain momentum.`
									: "Micro-step data becomes clearer as you keep logging."}
							</p>
						</section>

						{habit.recentNotes.length > 0 ? (
							<section className="space-y-2">
								<h4 className="text-sm font-semibold uppercase tracking-[0.12em]">
									Recent Notes
								</h4>
								<div className="space-y-2">
									{habit.recentNotes.map((note) => (
										<p
											key={note}
											className="bg-muted/40 rounded-md border px-3 py-2 text-sm"
										>
											{note}
										</p>
									))}
								</div>
							</section>
						) : null}
					</div>
				) : (
					<div className="text-muted-foreground px-5 py-6 text-sm">
						Select a habit to view details.
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
