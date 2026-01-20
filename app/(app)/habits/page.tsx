"use client";

import { useEffect, useState } from "react";
import { HabitCreateDialog } from "./HabitCreateDialog";

type Habit = {
  id: number;
  title: string;
  freq_type: string;
  freq_per_week: string;
};

function formatSchedule(habit: Habit) {
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
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadHabits = async () => {
      try {
        const response = await fetch("/api/habits");
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to load habits.");
        }

        const data = (await response.json()) as { habits?: Habit[] };
        if (isMounted) {
          setHabits(data.habits ?? []);
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
          <HabitCreateDialog />
        </div>
      </header>

      <div className="grid gap-3">
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
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground"
            >
              <div>
                <h2 className="text-lg font-semibold">{habit.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {formatSchedule(habit)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
