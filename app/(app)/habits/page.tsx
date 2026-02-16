"use client";

import { useEffect, useState } from "react";
import { HabitCard } from "./habit-card";
import { HabitCreateDialog } from "./habit-create-dialog";
import { HabitsEmptyState } from "./habit-empty-state";
import type { HabitListItem } from "./types";

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadHabits = async () => {
      try {
        const response = await fetch("/api/habits");
        const data = (await response.json().catch(() => null)) as {
          habits?: HabitListItem[];
          error?: string;
        } | null;

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
              : "Failed to load habits.",
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
      prev.map((habit) =>
        habit.id === updatedHabit.id ? updatedHabit : habit,
      ),
    );
  };

  const handleHabitDelete = async (habit: HabitListItem) => {
    if (deletingHabitId !== null) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete habit "${habit.title}"? This action cannot be undone.`,
    );
    if (!shouldDelete) {
      return;
    }

    setDeletingHabitId(habit.id);
    setError(null);

    try {
      const response = await fetch("/api/habits", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: habit.id }),
      });

      const data = (await response.json().catch(() => null)) as {
        message?: string;
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to delete habit.");
      }

      setHabits((prev) => prev.filter((item) => item.id !== habit.id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete habit.",
      );
    } finally {
      setDeletingHabitId(null);
    }
  };

  const hasItems = habits.length > 0;

  return (
    <section className="space-y-6 w-full">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="max-w-xl">
          <p className="text-sm text-muted-foreground">
            Track your routines and keep your streaks alive.
          </p>
        </div>
        {hasItems ? (
          <div className="flex items-center gap-2">
            <HabitCreateDialog onHabitCreated={handleHabitCreated} />
          </div>
        ) : null}
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
          <HabitsEmptyState onHabitCreated={handleHabitCreated} />
        ) : (
          habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              isDeleting={deletingHabitId === habit.id}
              onHabitUpdated={handleHabitUpdated}
              onHabitDelete={handleHabitDelete}
            />
          ))
        )}
      </div>
    </section>
  );
}
