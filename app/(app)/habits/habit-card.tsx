"use client";

import { CornerDownRight, Info, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HabitEditDialog } from "./habit-edit-dialog";
import type { HabitListItem } from "./types";

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

function formatCuPerWeek(habit: HabitListItem) {
  const weightCu = Number(habit.weight_cu);
  const freqType = habit.freq_type?.trim().toLowerCase() ?? "weekly";
  const freqPerWeek = Number(habit.freq_per_week);

  const safeWeight = Number.isFinite(weightCu) ? weightCu : 0;
  const safeFreq =
    freqType === "daily"
      ? 7
      : Number.isFinite(freqPerWeek)
        ? Math.max(0, freqPerWeek)
        : 0;

  const weeklyCu = safeWeight * safeFreq;
  const rounded = Math.round(weeklyCu * 10) / 10;

  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

export function HabitCard({
  habit,
  isDeleting,
  onHabitUpdated,
  onHabitDelete,
}: HabitCardProps) {
  const cuPerWeek = formatCuPerWeek(habit);

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 text-card-foreground shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className="truncate text-lg font-semibold">{habit.title}</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {habit.description ? (
              <span className="truncate">{habit.description}</span>
            ) : null}
            {habit.description ? <span aria-hidden>•</span> : null}
            <span>{formatSchedule(habit)}</span>
            {habit.has_micro ? (
              <span className="flex gap-1 items-center rounded-full border border-border/70 bg-background px-2 py-0.5 text-xs">
                <CornerDownRight className="size-3" />
                Micro-step
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-3 py-1 text-sm font-medium">
            {cuPerWeek} CU/wk
            <Info className="size-3.5 text-muted-foreground" />
          </span>
          <HabitEditDialog habit={habit} onHabitUpdated={onHabitUpdated} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md"
                aria-label="More actions"
                disabled={isDeleting}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                variant="destructive"
                disabled={isDeleting}
                onSelect={() => onHabitDelete(habit)}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
