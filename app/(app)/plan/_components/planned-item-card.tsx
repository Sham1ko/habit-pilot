"use client";

import {
	ArrowRightLeft,
	CornerDownRight,
	MoreHorizontal,
	Trash2,
} from "lucide-react";
import { CuBadge } from "@/components/shared/cu-badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCu } from "../_lib/plan-utils";
import type { PlanOccurrence } from "../_lib/types";

type PlannedItemCardProps = {
	occurrence: PlanOccurrence;
	moveDayOptions: Array<{
		date: string;
		label: string;
	}>;
	onMove: (occurrenceId: string, targetDate: string) => void;
	onConvertToMicro: (occurrenceId: string) => void;
	onUnplan: (occurrenceId: string) => void;
};

export function PlannedItemCard({
	occurrence,
	moveDayOptions,
	onMove,
	onConvertToMicro,
	onUnplan,
}: PlannedItemCardProps) {
	const canConvertToMicro =
		occurrence.habit_has_micro &&
		occurrence.habit_micro_weight_cu > 0 &&
		occurrence.planned_weight_cu > occurrence.habit_micro_weight_cu;

	const isMicro =
		occurrence.habit_has_micro &&
		occurrence.habit_micro_weight_cu > 0 &&
		Math.abs(occurrence.planned_weight_cu - occurrence.habit_micro_weight_cu) <
			0.001;

	return (
		<article className="rounded-lg border border-border bg-card p-3 text-card-foreground">
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0 space-y-2">
					<p className="truncate text-sm font-medium">
						{occurrence.habit_title}
					</p>
					<div className="flex flex-wrap items-center gap-1.5 text-xs">
						<CuBadge
							value={formatCu(occurrence.planned_weight_cu)}
							className="border-blue-400/45 bg-blue-50/45 text-blue-500/85"
						/>
						{isMicro ? (
							<span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-sky-600 dark:text-sky-300">
								Micro-step
							</span>
						) : null}
					</div>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							aria-label="Item actions"
						>
							<MoreHorizontal className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-52">
						{canConvertToMicro ? (
							<DropdownMenuItem
								onSelect={() => onConvertToMicro(occurrence.id)}
							>
								<CornerDownRight className="size-4" />
								Convert to micro-step
							</DropdownMenuItem>
						) : null}
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>
								<ArrowRightLeft className="size-4" />
								Move to...
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent className="w-44">
								{moveDayOptions.map((option) => (
									<DropdownMenuItem
										key={option.date}
										onSelect={() => onMove(occurrence.id, option.date)}
									>
										{option.label}
									</DropdownMenuItem>
								))}
							</DropdownMenuSubContent>
						</DropdownMenuSub>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							variant="destructive"
							onSelect={() => onUnplan(occurrence.id)}
						>
							<Trash2 className="size-4" />
							Unplan
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</article>
	);
}
