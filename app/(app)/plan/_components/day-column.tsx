"use client";

import { formatCu, formatMonthDay, formatWeekday } from "../_lib/plan-utils";
import { PlannedItemCard } from "./planned-item-card";
import type { PlanDay } from "../_lib/types";

type DayColumnProps = {
  day: PlanDay;
  todayDate: string;
  dayOptions: Array<{
    date: string;
    label: string;
  }>;
  onMoveOccurrence: (occurrenceId: string, targetDate: string) => void;
  onConvertToMicro: (occurrenceId: string) => void;
  onUnplanOccurrence: (occurrenceId: string) => void;
};

export function DayColumn({
  day,
  todayDate,
  dayOptions,
  onMoveOccurrence,
  onConvertToMicro,
  onUnplanOccurrence,
}: DayColumnProps) {
  const isToday = day.date === todayDate;
  const moveDayOptions = dayOptions.filter(
    (option) => option.date !== day.date,
  );

  return (
    <article
      data-plan-date={day.date}
      className="flex h-full min-h-[420px] flex-col rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm"
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{formatWeekday(day.date)}</h3>
            <span className="text-xs text-muted-foreground">
              {formatMonthDay(day.date)}
            </span>
            {isToday ? (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                Today
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatCu(day.planned_cu)} CU
          </p>
        </div>
      </header>

      <div className="mt-3 flex flex-1 flex-col gap-2">
        {day.occurrences.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-background/70 px-4 text-center">
            <p className="text-sm text-muted-foreground">Drop habits here</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add from the right panel
            </p>
          </div>
        ) : (
          day.occurrences.map((occurrence) => (
            <PlannedItemCard
              key={occurrence.id}
              occurrence={occurrence}
              moveDayOptions={moveDayOptions}
              onMove={onMoveOccurrence}
              onConvertToMicro={onConvertToMicro}
              onUnplan={onUnplanOccurrence}
            />
          ))
        )}
      </div>
    </article>
  );
}
