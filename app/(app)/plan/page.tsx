"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PlanOccurrence = {
  id: string;
  habit_id: number;
  habit_title: string;
  planned_weight_cu: number;
  context_tag: string | null;
  habit_weight_cu: number;
  habit_has_micro: boolean;
  habit_micro_weight_cu: number;
};

type PlanDay = {
  date: string;
  planned_cu: number;
  occurrences: PlanOccurrence[];
};

type HabitOption = {
  id: number;
  title: string;
  weight_cu: number;
  has_micro: boolean;
  micro_weight_cu: number;
  context_tags: string[];
};

type PlanData = {
  week_start_date: string;
  week_end_date: string;
  today_date: string;
  weekly_capacity_cu: number | null;
  planned_cu: number;
  days: PlanDay[];
  habits: HabitOption[];
};

type PlanResponse = {
  week_start_date: string;
  week_end_date: string;
  today_date: string;
  weekly_capacity_cu: string | null;
  planned_cu: string;
  days: Array<{
    date: string;
    planned_cu: string;
    occurrences: Array<{
      id: string;
      habit_id: number;
      habit_title: string;
      planned_weight_cu: string;
      context_tag: string | null;
      habit_weight_cu: string;
      habit_has_micro: boolean;
      habit_micro_weight_cu: string;
    }>;
  }>;
  habits: Array<{
    id: number;
    title: string;
    weight_cu: string;
    has_micro: boolean;
    micro_weight_cu: string;
    context_tags: string[];
  }>;
  error?: string;
};

type OccurrenceResponse = {
  occurrence: {
    id: string;
    habit_id: number;
    date: string;
    planned_weight_cu: string;
    context_tag: string | null;
    habit_title: string;
    habit_weight_cu: string;
    habit_has_micro: boolean;
    habit_micro_weight_cu: string;
  };
  planned_cu: string;
  error?: string;
};

type DeleteResponse = {
  planned_cu: string;
  error?: string;
};

type DaySelection = {
  habitId?: number;
  contextTag?: string;
};

function normalizePlanResponse(data: PlanResponse): PlanData {
  return {
    week_start_date: data.week_start_date,
    week_end_date: data.week_end_date,
    today_date: data.today_date,
    weekly_capacity_cu: data.weekly_capacity_cu
      ? Number(data.weekly_capacity_cu)
      : null,
    planned_cu: Number(data.planned_cu),
    days: data.days.map((day) => ({
      date: day.date,
      planned_cu: Number(day.planned_cu),
      occurrences: day.occurrences.map((occurrence) => ({
        ...occurrence,
        planned_weight_cu: Number(occurrence.planned_weight_cu),
        habit_weight_cu: Number(occurrence.habit_weight_cu),
        habit_micro_weight_cu: Number(occurrence.habit_micro_weight_cu),
      })),
    })),
    habits: data.habits.map((habit) => ({
      ...habit,
      weight_cu: Number(habit.weight_cu),
      micro_weight_cu: Number(habit.micro_weight_cu),
      context_tags: habit.context_tags ?? [],
    })),
  };
}

function formatCu(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
}

function formatWeekRange(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

function getIsoWeekNumber(dateString: string) {
  const date = new Date(`${dateString}T00:00:00Z`);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return weekNo;
}

function formatDayLabel(dateString: string) {
  const date = new Date(`${dateString}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

function recalcPlan(days: PlanDay[]) {
  const recalculatedDays = days.map((day) => ({
    ...day,
    planned_cu: day.occurrences.reduce(
      (sum, occurrence) => sum + occurrence.planned_weight_cu,
      0,
    ),
  }));
  const plannedTotal = recalculatedDays.reduce(
    (sum, day) => sum + day.planned_cu,
    0,
  );

  return { days: recalculatedDays, planned_cu: plannedTotal };
}

export default function PlanPage() {
  const [data, setData] = useState<PlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDays, setPendingDays] = useState<string[]>([]);
  const [pendingOccurrences, setPendingOccurrences] = useState<string[]>([]);
  const [daySelections, setDaySelections] = useState<
    Record<string, DaySelection>
  >({});
  const [quickAssign, setQuickAssign] = useState<DaySelection>({});
  const [contextEdits, setContextEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    const loadPlan = async () => {
      try {
        const response = await fetch("/api/plan");
        const responseData = (await response.json().catch(() => null)) as
          | PlanResponse
          | null;

        if (!response.ok || !responseData) {
          throw new Error(responseData?.error ?? "Failed to load plan.");
        }

        if (isMounted) {
          setData(normalizePlanResponse(responseData));
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load plan.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPlan();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalOccurrences = useMemo(() => {
    if (!data) {
      return 0;
    }
    return data.days.reduce(
      (sum, day) => sum + day.occurrences.length,
      0,
    );
  }, [data]);

  const weekNumber = data ? getIsoWeekNumber(data.week_start_date) : null;
  const weekRange = data
    ? formatWeekRange(data.week_start_date, data.week_end_date)
    : "";

  const weeklyCapacity = data?.weekly_capacity_cu ?? null;
  const plannedCu = data?.planned_cu ?? 0;
  const capacityRatio =
    weeklyCapacity && weeklyCapacity > 0 ? plannedCu / weeklyCapacity : 0;
  const capacityState =
    capacityRatio > 1 ? "over" : capacityRatio > 0.9 ? "high" : "ok";

  const lightestDay = useMemo(() => {
    if (!data) {
      return null;
    }
    const today = data.today_date;
    const availableDays = data.days.filter((day) => day.date >= today);
    const daysToCheck = availableDays.length > 0 ? availableDays : data.days;
    return daysToCheck.reduce((lowest, day) =>
      day.planned_cu < lowest.planned_cu ? day : lowest,
    );
  }, [data]);

  const largestOccurrence = useMemo(() => {
    if (!data) {
      return null;
    }
    const occurrences = data.days.flatMap((day) =>
      day.occurrences.map((occurrence) => ({
        ...occurrence,
        day: day.date,
      })),
    );
    if (occurrences.length === 0) {
      return null;
    }
    return occurrences.reduce((largest, current) =>
      current.planned_weight_cu > largest.planned_weight_cu ? current : largest,
    );
  }, [data]);

  const suggestedMicro = useMemo(() => {
    if (!data) {
      return null;
    }
    const candidates = data.days.flatMap((day) =>
      day.occurrences
        .filter(
          (occurrence) =>
            occurrence.habit_has_micro &&
            occurrence.habit_micro_weight_cu > 0 &&
            occurrence.planned_weight_cu >
              occurrence.habit_micro_weight_cu,
        )
        .map((occurrence) => ({
          ...occurrence,
          day: day.date,
          savings:
            occurrence.planned_weight_cu - occurrence.habit_micro_weight_cu,
        })),
    );
    if (candidates.length === 0) {
      return null;
    }
    return candidates.reduce((best, current) =>
      current.savings > best.savings ? current : best,
    );
  }, [data]);

  const isOverCapacity =
    weeklyCapacity !== null && weeklyCapacity > 0 && plannedCu > weeklyCapacity;
  const overBy =
    weeklyCapacity !== null ? Math.max(plannedCu - weeklyCapacity, 0) : 0;

  const capacityBarClass = cn(
    "h-2 rounded-full transition-all",
    capacityState === "over" && "bg-rose-500",
    capacityState === "high" && "bg-amber-500",
    capacityState === "ok" && "bg-emerald-500",
  );

  const handleDaySelection = useCallback(
    (date: string, habitId: string) => {
      const idValue = habitId ? Number(habitId) : undefined;
      setDaySelections((prev) => {
        const habit = data?.habits.find((item) => item.id === idValue);
        const nextContext =
          habit?.context_tags?.[0] ?? prev[date]?.contextTag ?? "";
        return {
          ...prev,
          [date]: { habitId: idValue, contextTag: nextContext },
        };
      });
    },
    [data],
  );

  const handleDayContextChange = useCallback(
    (date: string, contextTag: string) => {
      setDaySelections((prev) => ({
        ...prev,
        [date]: { ...prev[date], contextTag },
      }));
    },
    [],
  );

  const handleQuickAssign = useCallback(
    (habitId: string) => {
      const idValue = habitId ? Number(habitId) : undefined;
      setQuickAssign((prev) => {
        const habit = data?.habits.find((item) => item.id === idValue);
        const nextContext =
          habit?.context_tags?.[0] ?? prev.contextTag ?? "";
        return { habitId: idValue, contextTag: nextContext };
      });
    },
    [data],
  );

  const handleQuickContextChange = useCallback((contextTag: string) => {
    setQuickAssign((prev) => ({ ...prev, contextTag }));
  }, []);

  const applyOccurrenceResponse = useCallback(
    (response: OccurrenceResponse) => {
      setData((prev) => {
        if (!prev) {
          return prev;
        }

        const occurrence = response.occurrence;
        const updatedOccurrence: PlanOccurrence = {
          id: occurrence.id,
          habit_id: occurrence.habit_id,
          habit_title: occurrence.habit_title,
          planned_weight_cu: Number(occurrence.planned_weight_cu),
          context_tag: occurrence.context_tag,
          habit_weight_cu: Number(occurrence.habit_weight_cu),
          habit_has_micro: occurrence.habit_has_micro,
          habit_micro_weight_cu: Number(occurrence.habit_micro_weight_cu),
        };

        const days = prev.days.map((day) => {
          if (day.date !== occurrence.date) {
            const filtered = day.occurrences.filter(
              (item) => item.id !== occurrence.id,
            );
            return filtered.length === day.occurrences.length
              ? day
              : { ...day, occurrences: filtered };
          }

          const existingIndex = day.occurrences.findIndex(
            (item) => item.id === occurrence.id,
          );

          if (existingIndex >= 0) {
            const nextOccurrences = [...day.occurrences];
            nextOccurrences[existingIndex] = updatedOccurrence;
            return { ...day, occurrences: nextOccurrences };
          }

          return {
            ...day,
            occurrences: [...day.occurrences, updatedOccurrence],
          };
        });

        const recalculated = recalcPlan(days);
        return {
          ...prev,
          days: recalculated.days,
          planned_cu: Number(response.planned_cu),
        };
      });
    },
    [],
  );

  const addOccurrence = useCallback(
    async (date: string, habitId: number, contextTag?: string) => {
      if (!data) {
        return;
      }

      const day = data.days.find((item) => item.date === date);
      if (!day) {
        return;
      }

      if (day.occurrences.some((item) => item.habit_id === habitId)) {
        setActionError("That habit is already planned for this day.");
        return;
      }

      const habit = data.habits.find((item) => item.id === habitId);
      if (!habit) {
        return;
      }

      setActionError(null);
      const snapshot = data;
      const tempId = `temp-${Date.now()}`;
      const nextOccurrence: PlanOccurrence = {
        id: tempId,
        habit_id: habit.id,
        habit_title: habit.title,
        planned_weight_cu: habit.weight_cu,
        context_tag: contextTag?.trim() || null,
        habit_weight_cu: habit.weight_cu,
        habit_has_micro: habit.has_micro,
        habit_micro_weight_cu: habit.micro_weight_cu,
      };

      setPendingDays((prev) => [...prev, date]);
      setData((prev) => {
        if (!prev) {
          return prev;
        }
        const days = prev.days.map((item) =>
          item.date === date
            ? { ...item, occurrences: [...item.occurrences, nextOccurrence] }
            : item,
        );
        const recalculated = recalcPlan(days);
        return {
          ...prev,
          days: recalculated.days,
          planned_cu: recalculated.planned_cu,
        };
      });

      try {
        const response = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            habit_id: habit.id,
            context_tag: contextTag?.trim() || null,
          }),
        });

        const responseData = (await response.json().catch(() => null)) as
          | OccurrenceResponse
          | null;

        if (!response.ok || !responseData) {
          throw new Error(responseData?.error ?? "Failed to add habit.");
        }

        setData((prev) => {
          if (!prev) {
            return prev;
          }
          const days = prev.days.map((item) => ({
            ...item,
            occurrences: item.occurrences.map((occurrence) =>
              occurrence.id === tempId
                ? {
                    ...occurrence,
                    id: responseData.occurrence.id,
                    planned_weight_cu: Number(
                      responseData.occurrence.planned_weight_cu,
                    ),
                    context_tag: responseData.occurrence.context_tag,
                  }
                : occurrence,
            ),
          }));
          const recalculated = recalcPlan(days);
          return {
            ...prev,
            days: recalculated.days,
            planned_cu: Number(responseData.planned_cu),
          };
        });
        setDaySelections((prev) => ({
          ...prev,
          [date]: { habitId: undefined, contextTag: "" },
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to add habit.";
        setActionError(message);
        setData(snapshot);
      } finally {
        setPendingDays((prev) => prev.filter((item) => item !== date));
      }
    },
    [data],
  );

  const handleAddOccurrence = useCallback(
    async (date: string) => {
      const selection = daySelections[date];
      if (!selection?.habitId) {
        return;
      }
      await addOccurrence(date, selection.habitId, selection.contextTag);
    },
    [addOccurrence, daySelections],
  );

  const handleQuickSuggest = useCallback(async () => {
    if (!data || !lightestDay || !quickAssign.habitId) {
      return;
    }

    const targetDate = lightestDay.date;
    setDaySelections((prev) => ({
      ...prev,
      [targetDate]: {
        habitId: quickAssign.habitId,
        contextTag: quickAssign.contextTag,
      },
    }));
    await addOccurrence(targetDate, quickAssign.habitId, quickAssign.contextTag);
  }, [addOccurrence, data, lightestDay, quickAssign]);

  const handleMoveOccurrence = useCallback(
    async (occurrenceId: string, targetDate: string) => {
      if (!data) {
        return;
      }

      setActionError(null);
      const snapshot = data;
      setPendingOccurrences((prev) => [...prev, occurrenceId]);

      setData((prev) => {
        if (!prev) {
          return prev;
        }

        let movedOccurrence: PlanOccurrence | null = null;
        const daysWithout = prev.days.map((day) => {
          const filtered = day.occurrences.filter((item) => {
            if (item.id === occurrenceId) {
              movedOccurrence = item;
              return false;
            }
            return true;
          });
          return filtered.length === day.occurrences.length
            ? day
            : { ...day, occurrences: filtered };
        });

        if (!movedOccurrence) {
          return prev;
        }

        const days = daysWithout.map((day) =>
          day.date === targetDate
            ? { ...day, occurrences: [...day.occurrences, movedOccurrence!] }
            : day,
        );

        const recalculated = recalcPlan(days);
        return { ...prev, days: recalculated.days, planned_cu: recalculated.planned_cu };
      });

      try {
        const response = await fetch("/api/plan", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            occurrence_id: occurrenceId,
            date: targetDate,
          }),
        });

        const responseData = (await response.json().catch(() => null)) as
          | OccurrenceResponse
          | null;

        if (!response.ok || !responseData) {
          throw new Error(responseData?.error ?? "Failed to move habit.");
        }

        applyOccurrenceResponse(responseData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to move habit.";
        setActionError(message);
        setData(snapshot);
      } finally {
        setPendingOccurrences((prev) =>
          prev.filter((item) => item !== occurrenceId),
        );
      }
    },
    [applyOccurrenceResponse, data],
  );

  const handleRemoveOccurrence = useCallback(
    async (occurrenceId: string) => {
      if (!data) {
        return;
      }

      setActionError(null);
      const snapshot = data;
      setPendingOccurrences((prev) => [...prev, occurrenceId]);

      setData((prev) => {
        if (!prev) {
          return prev;
        }

        const days = prev.days.map((day) => ({
          ...day,
          occurrences: day.occurrences.filter(
            (item) => item.id !== occurrenceId,
          ),
        }));
        const recalculated = recalcPlan(days);
        return { ...prev, days: recalculated.days, planned_cu: recalculated.planned_cu };
      });

      try {
        const response = await fetch("/api/plan", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ occurrence_id: occurrenceId }),
        });

        const responseData = (await response.json().catch(() => null)) as
          | DeleteResponse
          | null;

        if (!response.ok || !responseData) {
          throw new Error(responseData?.error ?? "Failed to remove habit.");
        }

        setData((prev) =>
          prev ? { ...prev, planned_cu: Number(responseData.planned_cu) } : prev,
        );
        setContextEdits((prev) => {
          if (!(occurrenceId in prev)) {
            return prev;
          }
          const next = { ...prev };
          delete next[occurrenceId];
          return next;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to remove habit.";
        setActionError(message);
        setData(snapshot);
      } finally {
        setPendingOccurrences((prev) =>
          prev.filter((item) => item !== occurrenceId),
        );
      }
    },
    [data],
  );

  const handleUpdateContext = useCallback(
    async (occurrenceId: string, contextTag: string) => {
      if (!data) {
        return;
      }

      setActionError(null);
      const snapshot = data;
      setPendingOccurrences((prev) => [...prev, occurrenceId]);

      setData((prev) => {
        if (!prev) {
          return prev;
        }

        const days = prev.days.map((day) => ({
          ...day,
          occurrences: day.occurrences.map((item) =>
            item.id === occurrenceId
              ? { ...item, context_tag: contextTag.trim() || null }
              : item,
          ),
        }));

        return { ...prev, days };
      });

      try {
        const response = await fetch("/api/plan", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            occurrence_id: occurrenceId,
            context_tag: contextTag.trim() || null,
          }),
        });

        const responseData = (await response.json().catch(() => null)) as
          | OccurrenceResponse
          | null;

        if (!response.ok || !responseData) {
          throw new Error(responseData?.error ?? "Failed to update context.");
        }

        applyOccurrenceResponse(responseData);
        setContextEdits((prev) => ({
          ...prev,
          [occurrenceId]: responseData.occurrence.context_tag ?? "",
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update context.";
        setActionError(message);
        setData(snapshot);
      } finally {
        setPendingOccurrences((prev) =>
          prev.filter((item) => item !== occurrenceId),
        );
      }
    },
    [applyOccurrenceResponse, data],
  );

  const handleUseMicro = useCallback(
    async (occurrence: PlanOccurrence) => {
      if (!data) {
        return;
      }

      if (!occurrence.habit_has_micro || occurrence.habit_micro_weight_cu <= 0) {
        return;
      }

      setActionError(null);
      const snapshot = data;
      setPendingOccurrences((prev) => [...prev, occurrence.id]);

      setData((prev) => {
        if (!prev) {
          return prev;
        }

        const days = prev.days.map((day) => ({
          ...day,
          occurrences: day.occurrences.map((item) =>
            item.id === occurrence.id
              ? { ...item, planned_weight_cu: occurrence.habit_micro_weight_cu }
              : item,
          ),
        }));
        const recalculated = recalcPlan(days);
        return { ...prev, days: recalculated.days, planned_cu: recalculated.planned_cu };
      });

      try {
        const response = await fetch("/api/plan", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            occurrence_id: occurrence.id,
            planned_weight_cu: occurrence.habit_micro_weight_cu,
          }),
        });

        const responseData = (await response.json().catch(() => null)) as
          | OccurrenceResponse
          | null;

        if (!response.ok || !responseData) {
          throw new Error(responseData?.error ?? "Failed to update habit.");
        }

        applyOccurrenceResponse(responseData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update habit.";
        setActionError(message);
        setData(snapshot);
      } finally {
        setPendingOccurrences((prev) =>
          prev.filter((item) => item !== occurrence.id),
        );
      }
    },
    [applyOccurrenceResponse, data],
  );

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          Loading weekly plan...
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="space-y-6">
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error ?? "Failed to load plan."}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Plan — Week {weekNumber} ({weekRange})
          </h1>
          <p className="text-sm text-muted-foreground">
            Your weekly capacity defines how much you can realistically commit.
          </p>
        </div>

        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Weekly Capacity</span>
              <span>{weeklyCapacity ? `${formatCu(weeklyCapacity)} CU` : "Set in settings"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Planned Load</span>
              <span>{formatCu(plannedCu)} CU</span>
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-muted">
            <div
              className={capacityBarClass}
              style={{
                width: `${Math.min(capacityRatio * 100, 100)}%`,
              }}
            />
          </div>
          {capacityState === "over" ? (
            <p className="mt-2 text-xs text-rose-600">
              You are over capacity by +{formatCu(overBy)} CU.
            </p>
          ) : capacityState === "high" ? (
            <p className="mt-2 text-xs text-amber-600">
              You are close to your weekly limit.
            </p>
          ) : null}
        </div>
      </header>

      {actionError ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
          {actionError}
        </div>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Quick assign</p>
            <p className="text-xs text-muted-foreground">
              Pick a habit and we’ll suggest the lightest day.
            </p>
          </div>
          {lightestDay ? (
            <span className="text-xs text-muted-foreground">
              Lightest day: {formatDayLabel(lightestDay.date)}
            </span>
          ) : null}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={quickAssign.habitId ?? ""}
            onChange={(event) => handleQuickAssign(event.target.value)}
          >
            <option value="">Select habit</option>
            {data.habits.map((habit) => (
              <option key={habit.id} value={habit.id}>
                {habit.title} ({formatCu(habit.weight_cu)} CU)
              </option>
            ))}
          </select>
          <Input
            placeholder="Context (optional)"
            value={quickAssign.contextTag ?? ""}
            onChange={(event) => handleQuickContextChange(event.target.value)}
          />
          <Button
            type="button"
            disabled={!quickAssign.habitId || !lightestDay}
            onClick={handleQuickSuggest}
          >
            Suggest day
          </Button>
        </div>
      </section>

      {isOverCapacity && (largestOccurrence || suggestedMicro) ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          <h2 className="text-sm font-semibold">Overload resolution</h2>
          <p className="mt-1 text-xs text-rose-600">
            You are over capacity by +{formatCu(overBy)} CU. Try one of these
            adjustments.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {largestOccurrence && lightestDay ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  handleMoveOccurrence(largestOccurrence.id, lightestDay.date)
                }
              >
                Move {largestOccurrence.habit_title} to{" "}
                {formatDayLabel(lightestDay.date)}
              </Button>
            ) : null}
            {suggestedMicro ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => handleUseMicro(suggestedMicro)}
              >
                Use micro for {suggestedMicro.habit_title}
              </Button>
            ) : null}
            {largestOccurrence ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleRemoveOccurrence(largestOccurrence.id)}
              >
                Remove {largestOccurrence.habit_title}
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {totalOccurrences === 0 ? (
        <section className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          <p>Your week is not planned yet.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/habits" className={cn(buttonVariants({ size: "sm" }))}>
              Add habits
            </Link>
            <Link
              href="/habits"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Create first habit
            </Link>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.days.map((day) => {
          const isPast = day.date < data.today_date;
          const dailyCapacity =
            weeklyCapacity && weeklyCapacity > 0 ? weeklyCapacity / 7 : null;
          const dayRatio =
            dailyCapacity && dailyCapacity > 0
              ? day.planned_cu / dailyCapacity
              : 0;
          const dayState =
            dayRatio > 1 ? "over" : dayRatio > 0.9 ? "high" : "ok";
          const dayBarClass = cn(
            "h-1.5 rounded-full",
            dayState === "over" && "bg-rose-400",
            dayState === "high" && "bg-amber-400",
            dayState === "ok" && "bg-emerald-400",
          );

          const pendingDay = pendingDays.includes(day.date);
          const selection = daySelections[day.date];

          return (
            <div
              key={day.date}
              className={cn(
                "rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm",
                isPast && "opacity-70",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {formatDayLabel(day.date)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCu(day.planned_cu)} CU planned
                  </p>
                </div>
                {isPast ? (
                  <span className="rounded-full border border-border/70 bg-background px-2 py-1 text-xs text-muted-foreground">
                    Past day
                  </span>
                ) : null}
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted">
                <div
                  className={dayBarClass}
                  style={{
                    width: `${Math.min(dayRatio * 100, 100)}%`,
                  }}
                />
              </div>

              <div className="mt-3 space-y-3">
                {day.occurrences.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No habits planned.
                  </p>
                ) : (
                  day.occurrences.map((occurrence) => {
                    const isPending = pendingOccurrences.includes(
                      occurrence.id,
                    );
                    const contextValue =
                      contextEdits[occurrence.id] ??
                      occurrence.context_tag ??
                      "";
                    const canUseMicro =
                      occurrence.habit_has_micro &&
                      occurrence.habit_micro_weight_cu > 0 &&
                      occurrence.planned_weight_cu >
                        occurrence.habit_micro_weight_cu;

                    return (
                      <div
                        key={occurrence.id}
                        className="rounded-lg border border-border/70 bg-background p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">
                              {occurrence.habit_title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatCu(occurrence.planned_weight_cu)} CU
                              {occurrence.context_tag
                                ? ` • ${occurrence.context_tag}`
                                : ""}
                            </p>
                          </div>
                          {!isPast ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={isPending}
                              onClick={() =>
                                handleRemoveOccurrence(occurrence.id)
                              }
                            >
                              Remove
                            </Button>
                          ) : null}
                        </div>

                        {!isPast ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <label className="text-xs text-muted-foreground">
                              Move to
                            </label>
                            <select
                              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                              value={day.date}
                              disabled={isPending}
                              onChange={(event) =>
                                handleMoveOccurrence(
                                  occurrence.id,
                                  event.target.value,
                                )
                              }
                            >
                              {data.days
                                .filter((option) => option.date >= data.today_date)
                                .map((option) => (
                                  <option key={option.date} value={option.date}>
                                    {formatDayLabel(option.date)}
                                  </option>
                                ))}
                            </select>
                            {canUseMicro ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={isPending}
                                onClick={() => handleUseMicro(occurrence)}
                              >
                                Use micro
                              </Button>
                            ) : null}
                          </div>
                        ) : null}

                        {!isPast ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Input
                              className="h-8"
                              placeholder="Context (optional)"
                              value={contextValue}
                              onChange={(event) =>
                                setContextEdits((prev) => ({
                                  ...prev,
                                  [occurrence.id]: event.target.value,
                                }))
                              }
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() =>
                                handleUpdateContext(
                                  occurrence.id,
                                  contextValue,
                                )
                              }
                            >
                              Update
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 border-t border-border/70 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Add habit
                </p>
                <div className="mt-2 space-y-2">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={selection?.habitId ?? ""}
                    disabled={isPast}
                    onChange={(event) =>
                      handleDaySelection(day.date, event.target.value)
                    }
                  >
                    <option value="">
                      {isPast ? "Past day locked" : "Select habit"}
                    </option>
                    {data.habits.map((habit) => (
                      <option key={habit.id} value={habit.id}>
                        {habit.title} ({formatCu(habit.weight_cu)} CU)
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Context (optional)"
                    value={selection?.contextTag ?? ""}
                    disabled={isPast}
                    onChange={(event) =>
                      handleDayContextChange(day.date, event.target.value)
                    }
                  />
                  <Button
                    type="button"
                    className="w-full"
                    size="sm"
                    disabled={
                      isPast ||
                      pendingDay ||
                      !selection?.habitId
                    }
                    onClick={() => handleAddOccurrence(day.date)}
                  >
                    {pendingDay ? "Adding..." : "Add to day"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
