"use client";

import { useState } from "react";
import { ChevronDown, CornerDownRight, MoreHorizontal } from "lucide-react";
import { CuBadge } from "@/components/shared/cu-badge";
import { Button } from "@/components/ui/button";
import { Collapsible } from "@/components/ui/collapsible";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HabitEditDialog } from "./habit-edit-dialog";
import type { HabitListItem } from "../types";
import { Separator } from "@/components/ui/separator";

type HabitCardProps = {
	habit: HabitListItem;
	isDeleting: boolean;
	onHabitUpdated: (habit: HabitListItem) => void;
	onHabitDelete: (habit: HabitListItem) => void;
};

function formatSchedule(habit: HabitListItem) {
	const freqType = habit.freq_type?.trim() || "weekly";
	const freqCount = habit.freq_per_week ?? "0";

	if (freqType === "daily") {
		return "Daily";
	}

	if (freqType === "weekly") {
		return `${freqCount}x per week`;
	}

	return `${freqType} • ${freqCount}`;
}

export function HabitCard({
	habit,
	isDeleting,
	onHabitUpdated,
	onHabitDelete,
}: HabitCardProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<div
				role="button"
				tabIndex={0}
				aria-expanded={isOpen}
				onClick={() => setIsOpen((prev) => !prev)}
				onKeyDown={(event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						setIsOpen((prev) => !prev);
					}
				}}
				className="rounded-xl border border-border bg-card p-4 text-card-foreground cursor-pointer"
			>
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="flex items-center gap-4">
						<div className="border p-3 rounded-lg bg-muted text-2xl">
							{habit.emoji ? `${habit.emoji} ` : ""}
						</div>
						<div className="flex gap-4">
							<h2 className="truncate text-lg font-semibold">
								{habit.title}
							</h2>

							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<CuBadge value={habit.weight_cu} />
								<Separator orientation="vertical" className="mx-1" />
								<span>{formatSchedule(habit)}</span>
								{habit.has_micro ? (<>
									<Separator orientation="vertical" className="mx-1" />
									<span className="flex gap-1 items-center rounded-full border border-border/70 bg-muted px-2 py-0.5 text-xs">
										<CornerDownRight className="size-3" />
										Micro-step
									</span>
								</>
								) : null}
							</div>
						</div>
					</div>

					<div className="flex self-center items-center gap-2">
						<div
							className="flex items-center gap-2"
							onClick={(event) => event.stopPropagation()}
							onKeyDown={(event) => event.stopPropagation()}
						>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="h-9 w-9 rounded-md border border-border/70 text-muted-foreground hover:bg-muted/60"
										aria-label="More actions"
										disabled={isDeleting}
									>
										<MoreHorizontal className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-36">
									<DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
										Edit
									</DropdownMenuItem>
									<DropdownMenuItem
										variant="destructive"
										disabled={isDeleting}
										onSelect={() => onHabitDelete(habit)}
									>
										{isDeleting ? "Deleting..." : "Delete"}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
							<HabitEditDialog
								habit={habit}
								onHabitUpdated={onHabitUpdated}
								open={isEditDialogOpen}
								onOpenChange={setIsEditDialogOpen}
								trigger={false}
							/>
						</div>
						<span
							className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition-colors hover:bg-muted/60"
						>
							<ChevronDown
								aria-hidden
								className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
							/>
						</span>
					</div>
				</div>

				<div
					className={`grid overflow-hidden transition-all duration-200 ease-out ${isOpen
						? "mt-4 grid-rows-[1fr] border-t border-border/70 pt-4 opacity-100"
						: "mt-0 grid-rows-[0fr] border-t-0 pt-0 opacity-0"
						}`}
				>
					<div className="min-h-0 grid gap-3 text-sm sm:grid-cols-2">
						<div className="space-y-1">
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Description
							</p>
							<p>{habit.description?.trim() || "No description."}</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Frequency
							</p>
							<p>{formatSchedule(habit)}</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Capacity
							</p>
							<p>
								{habit.weight_cu} CU per completion
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Micro-step
							</p>
							<p>
								{habit.has_micro
									? `${habit.micro_title?.trim() || "Untitled"} • ${habit.micro_weight_cu} CU`
									: "Not configured"}
							</p>
						</div>
					</div>
				</div>
			</div>
		</Collapsible>
	);
}
