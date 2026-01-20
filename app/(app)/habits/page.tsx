"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { HabitCreateDialog } from "./HabitCreateDialog";
import { HabitEditDialog } from "./HabitEditDialog";
import type { HabitListItem } from "./types";

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

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadHabits = async () => {
      try {
        const response = await fetch("/api/habits");
        const data = (await response.json().catch(() => null)) as
          | { habits?: HabitListItem[]; error?: string }
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Failed to load habits.");
        }

        if (isMounted) {
          setHabits(data?.habits ?? []);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load habits."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadHabits();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleHabitCreated = (habit: HabitListItem) => {
    setHabits((prev) => {
      if (prev.some((item) => item.id === habit.id)) {
        return prev;
      }
      return [habit, ...prev];
    });
    setError(null);
    setIsLoading(false);
  };

  const handleHabitUpdated = (updatedHabit: HabitListItem) => {
    setHabits((prev) =>
      prev.map((habit) => (habit.id === updatedHabit.id ? updatedHabit : habit))
    );
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Habits</h1>
          <p className="text-sm text-muted-foreground">
            Track your routines and keep your streaks alive.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HabitCreateDialog onHabitCreated={handleHabitCreated} />
        </div>
      </header>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Loading habits...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : habits.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            No habits yet. Create your first one.
          </div>
        ) : (
          habits.map((habit) => (
            <div
              key={habit.id}
              className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">{habit.title}</h2>
                  {habit.description ? (
                    <p className="text-sm text-muted-foreground">
                      {habit.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <HabitEditDialog
                    habit={habit}
                    onHabitUpdated={handleHabitUpdated}
                  />
                  <Button type="button" variant="outline" size="sm" disabled>
                    Archive
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border/70 bg-background px-2 py-1">
                  {formatSchedule(habit)}
                </span>
                <span className="rounded-full border border-border/70 bg-background px-2 py-1">
                  Capacity: {habit.weight_cu}
                </span>
                {habit.has_micro ? (
                  <span className="rounded-full border border-border/70 bg-background px-2 py-1">
                    Micro: {habit.micro_weight_cu}
                  </span>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
