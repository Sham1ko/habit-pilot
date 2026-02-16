"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatWeekRange } from "../_lib/plan-utils";

type WeekSwitcherProps = {
	weekStartDate: string;
	weekEndDate: string;
	isCurrentWeek: boolean;
	onPreviousWeek: () => void;
	onNextWeek: () => void;
	onCurrentWeek: () => void;
	onToday: () => void;
};

export function WeekSwitcher({
	weekStartDate,
	weekEndDate,
	isCurrentWeek,
	onPreviousWeek,
	onNextWeek,
	onCurrentWeek,
	onToday,
}: WeekSwitcherProps) {
	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onPreviousWeek}
					aria-label="Previous week"
				>
					<ChevronLeft className="size-4" />
					Prev
				</Button>
				<Button
					type="button"
					size="sm"
					variant={isCurrentWeek ? "secondary" : "outline"}
					onClick={onCurrentWeek}
				>
					This week
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onNextWeek}
					aria-label="Next week"
				>
					Next
					<ChevronRight className="size-4" />
				</Button>
				<Button type="button" variant="ghost" size="sm" onClick={onToday}>
					Today
				</Button>
			</div>
			<p
				className={cn(
					"text-sm font-medium text-foreground",
					!isCurrentWeek && "text-muted-foreground",
				)}
			>
				{formatWeekRange(weekStartDate, weekEndDate)}
			</p>
		</div>
	);
}
