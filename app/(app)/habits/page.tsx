"use client";

import { useEffect, useState } from "react";
import { HabitCard } from "./_components/habit-card";
import { HabitCreateDialog } from "./_components/habit-create-dialog";
import { HabitsEmptyState } from "./_components/habit-empty-state";
import { HabitsPageSkeleton } from "./_components/habits-page-skeleton";
import { OnboardingPlanHint } from "./_components/onboarding-plan-hint";
import { ONBOARDING_STAGE, type OnboardingStage } from "@/lib/onboarding/stage";
import type { HabitListItem } from "./types";

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<number | null>(null);
  const [togglingHabitId, setTogglingHabitId] = useState<number | null>(null);
  const [onboardingStage, setOnboardingStage] = useState<OnboardingStage>(
    ONBOARDING_STAGE.COMPLETED,
  );

  useEffect(() => {
    let isMounted = true;

    const loadHabits = async () => {
      try {
        const response = await fetch("/api/habits");
        const data = (await response.json().catch(() => null)) as {
          habits?: HabitListItem[];
          onboarding_stage?: OnboardingStage;
          error?: string;
        } | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Failed to load habits.");
        }

        if (isMounted) {
          setHabits(data?.habits ?? []);
          setOnboardingStage(
            data?.onboarding_stage ?? ONBOARDING_STAGE.COMPLETED,
          );
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
    const wasEmptyBeforeCreate = habits.length === 0;
    setHabits((prev) => {
      if (prev.some((item) => item.id === habit.id)) {
        return prev;
      }
      return [habit, ...prev];
    });
    if (
      wasEmptyBeforeCreate &&
      onboardingStage === ONBOARDING_STAGE.ADD_FIRST_HABIT
    ) {
      setOnboardingStage(ONBOARDING_STAGE.GO_PLAN);
    }
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

  const handleHabitToggleActive = async (habit: HabitListItem) => {
    if (togglingHabitId !== null || deletingHabitId !== null) {
      return;
    }

    setTogglingHabitId(habit.id);
    setError(null);

    try {
      const response = await fetch("/api/habits", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: habit.id,
          is_active: !habit.is_active,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        habit?: HabitListItem;
        error?: string;
      } | null;

      if (!response.ok || !data?.habit) {
        throw new Error(data?.error ?? "Failed to update habit status.");
      }
      const updatedHabit = data.habit;

      setHabits((prev) =>
        prev.map((item) =>
          item.id === updatedHabit.id ? updatedHabit : item,
        ),
      );
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Failed to update habit status.",
      );
    } finally {
      setTogglingHabitId(null);
    }
  };

  const hasItems = habits.length > 0;

  if (isLoading) {
    return <HabitsPageSkeleton />;
  }

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
        {onboardingStage === ONBOARDING_STAGE.GO_PLAN ? (
          <OnboardingPlanHint />
        ) : null}
        {error ? (
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
              isToggling={togglingHabitId === habit.id}
              onHabitUpdated={handleHabitUpdated}
              onHabitDelete={handleHabitDelete}
              onHabitToggleActive={handleHabitToggleActive}
            />
          ))
        )}
      </div>
    </section>
  );
}
