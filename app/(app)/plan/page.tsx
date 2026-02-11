"use client";

import Link from "next/link";
import { Info, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CapacityMeter } from "./capacity-meter";
import { DayColumn } from "./day-column";
import {
  buildWeekPlanIcs,
  formatCu,
  formatDayLabel,
  getWeekStartDate,
  shiftIsoDate,
} from "./plan-utils";
import {
  type OverloadMicroSuggestion,
  type OverloadMoveSuggestion,
  RemainingHabitsPanel,
} from "./remaining-habits-panel";
import { SetCapacityModal } from "./set-capacity-modal";
import type {
  PlanData,
  PlanDay,
  PlanOccurrence,
  RemainingHabit,
} from "./types";
import { WeekSwitcher } from "./week-switcher";

const SAVE_DEBOUNCE_MS = 450;
const SAVE_STATE_TIMEOUT_MS = 1400;

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
    freq_per_week: string;
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

type CapacityResponse = {
  week_start_date: string;
  week_end_date: string;
  capacity_cu: string;
  planned_cu: string;
  error?: string;
};

type SaveStatus = "idle" | "saving" | "saved";

type ToastState = {
  id: number;
  message: string;
};

type PlanMutation =
  | {
      kind: "add";
      clientOccurrenceId: string;
      date: string;
      habitId: number;
      contextTag: string | null;
    }
  | {
      kind: "move";
      occurrenceId: string;
      date: string;
    }
  | {
      kind: "unplan";
      occurrenceId: string;
    }
  | {
      kind: "convert_micro";
      occurrenceId: string;
      plannedWeightCu: number;
    }
  | {
      kind: "set_capacity";
      weekStartDate: string;
      capacityCu: number;
    };

const starterTemplates = [
  {
    title: "Study 25 min",
    details: "5x/week, 2 CU, with micro-step",
  },
  {
    title: "Workout 20 min",
    details: "3x/week, 3 CU, with micro-step",
  },
  {
    title: "Walk 20 min",
    details: "Daily, 1 CU, low-friction",
  },
];

function normalizePlanResponse(data: PlanResponse): PlanData {
  return {
    week_start_date: data.week_start_date,
    week_end_date: data.week_end_date,
    today_date: data.today_date,
    weekly_capacity_cu: data.weekly_capacity_cu ? Number(data.weekly_capacity_cu) : null,
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
      freq_per_week: Number(habit.freq_per_week),
      micro_weight_cu: Number(habit.micro_weight_cu),
      context_tags: habit.context_tags ?? [],
    })),
  };
}

function recalcPlan(days: PlanDay[]) {
  const recalculatedDays = days.map((day) => ({
    ...day,
    planned_cu: day.occurrences.reduce(
      (sum, occurrence) => sum + occurrence.planned_weight_cu,
      0,
    ),
  }));

  return {
    days: recalculatedDays,
    planned_cu: recalculatedDays.reduce((sum, day) => sum + day.planned_cu, 0),
  };
}

function createTempOccurrenceId() {
  return `temp-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

export default function PlanPage() {
  const [data, setData] = useState<PlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);

  const queueRef = useRef<PlanMutation[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveStateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFlushingRef = useRef(false);
  const idMapRef = useRef<Map<string, string>>(new Map());
  const activeWeekStartRef = useRef<string | null>(null);
  const toastCounterRef = useRef(0);

  const showErrorToast = useCallback((message: string) => {
    toastCounterRef.current += 1;
    setToast({ id: toastCounterRef.current, message });
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadPlan = useCallback(
    async (weekStart?: string, options?: { showLoading?: boolean }) => {
      const showLoading = options?.showLoading ?? true;

      if (showLoading) {
        setIsLoading(true);
      }

      setError(null);

      try {
        const query = weekStart ? `?week_start=${encodeURIComponent(weekStart)}` : "";
        const response = await fetch(`/api/plan${query}`);
        const responseData = (await response.json().catch(() => null)) as PlanResponse | null;

        if (!response.ok || !responseData) {
          throw new Error(responseData?.error ?? "Failed to load weekly plan.");
        }

        const normalized = normalizePlanResponse(responseData);
        activeWeekStartRef.current = normalized.week_start_date;
        idMapRef.current.clear();
        setData(normalized);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load weekly plan.",
        );
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    activeWeekStartRef.current = data?.week_start_date ?? null;
  }, [data]);

  const resolveOccurrenceId = useCallback((occurrenceId: string) => {
    return idMapRef.current.get(occurrenceId) ?? occurrenceId;
  }, []);

  const executeMutation = useCallback(
    async (mutation: PlanMutation) => {
      if (mutation.kind === "add") {
        const response = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: mutation.date,
            habit_id: mutation.habitId,
            context_tag: mutation.contextTag,
          }),
        });

        const responseData = (await response.json().catch(() => null)) as
          | OccurrenceResponse
          | null;

        if (!response.ok || !responseData) {
          throw new Error(responseData?.error ?? "Failed to save added occurrence.");
        }

        idMapRef.current.set(mutation.clientOccurrenceId, responseData.occurrence.id);

        setData((prev) => {
          if (!prev) {
            return prev;
          }

          const nextOccurrence: PlanOccurrence = {
            id: responseData.occurrence.id,
            habit_id: responseData.occurrence.habit_id,
            habit_title: responseData.occurrence.habit_title,
            planned_weight_cu: Number(responseData.occurrence.planned_weight_cu),
            context_tag: responseData.occurrence.context_tag,
            habit_weight_cu: Number(responseData.occurrence.habit_weight_cu),
            habit_has_micro: responseData.occurrence.habit_has_micro,
            habit_micro_weight_cu: Number(responseData.occurrence.habit_micro_weight_cu),
          };

          const days = prev.days.map((day) => ({
            ...day,
            occurrences: day.occurrences.map((occurrence) =>
              occurrence.id === mutation.clientOccurrenceId ? nextOccurrence : occurrence,
            ),
          }));

          const recalculated = recalcPlan(days);

          return {
            ...prev,
            days: recalculated.days,
            planned_cu: recalculated.planned_cu,
          };
        });

        return;
      }

      if (mutation.kind === "move") {
        const occurrenceId = resolveOccurrenceId(mutation.occurrenceId);

        const response = await fetch("/api/plan", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            occurrence_id: occurrenceId,
            date: mutation.date,
          }),
        });

        const responseData = (await response.json().catch(() => null)) as
          | OccurrenceResponse
          | null;

        if (!response.ok || !responseData) {
          throw new Error(responseData?.error ?? "Failed to move planned occurrence.");
        }

        return;
      }

      if (mutation.kind === "unplan") {
        const occurrenceId = resolveOccurrenceId(mutation.occurrenceId);

        const response = await fetch("/api/plan", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            occurrence_id: occurrenceId,
          }),
        });

        const responseData = (await response.json().catch(() => null)) as DeleteResponse | null;

        if (!response.ok || !responseData) {
          throw new Error(responseData?.error ?? "Failed to unplan occurrence.");
        }

        return;
      }

      if (mutation.kind === "convert_micro") {
        const occurrenceId = resolveOccurrenceId(mutation.occurrenceId);

        const response = await fetch("/api/plan", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            occurrence_id: occurrenceId,
            planned_weight_cu: mutation.plannedWeightCu,
          }),
        });

        const responseData = (await response.json().catch(() => null)) as
          | OccurrenceResponse
          | null;

        if (!response.ok || !responseData) {
          throw new Error(responseData?.error ?? "Failed to convert to micro-step.");
        }

        return;
      }

      const response = await fetch("/api/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_start_date: mutation.weekStartDate,
          capacity_cu: mutation.capacityCu,
        }),
      });

      const responseData = (await response.json().catch(() => null)) as CapacityResponse | null;

      if (!response.ok || !responseData) {
        throw new Error(responseData?.error ?? "Failed to update weekly capacity.");
      }
    },
    [resolveOccurrenceId],
  );

  const flushMutations = useCallback(async () => {
    if (isFlushingRef.current || queueRef.current.length === 0) {
      return;
    }

    isFlushingRef.current = true;
    setSaveStatus("saving");

    let failureMessage: string | null = null;

    while (queueRef.current.length > 0) {
      const mutation = queueRef.current.shift();
      if (!mutation) {
        break;
      }

      try {
        await executeMutation(mutation);
      } catch (mutationError) {
        failureMessage =
          mutationError instanceof Error
            ? mutationError.message
            : "Failed to save plan changes.";
        queueRef.current = [];
        break;
      }
    }

    isFlushingRef.current = false;

    if (failureMessage) {
      setSaveStatus("idle");
      showErrorToast(failureMessage);
      void loadPlan(activeWeekStartRef.current ?? undefined, { showLoading: false });
      return;
    }

    setSaveStatus("saved");

    if (saveStateTimerRef.current) {
      window.clearTimeout(saveStateTimerRef.current);
    }

    saveStateTimerRef.current = window.setTimeout(() => {
      setSaveStatus("idle");
    }, SAVE_STATE_TIMEOUT_MS);
  }, [executeMutation, loadPlan, showErrorToast]);

  const enqueueMutation = useCallback(
    (mutation: PlanMutation) => {
      if (mutation.kind === "set_capacity") {
        queueRef.current = queueRef.current.filter((item) => {
          return !(
            item.kind === "set_capacity" && item.weekStartDate === mutation.weekStartDate
          );
        });
      }

      queueRef.current.push(mutation);
      setSaveStatus("saving");

      if (saveStateTimerRef.current) {
        window.clearTimeout(saveStateTimerRef.current);
        saveStateTimerRef.current = null;
      }

      if (flushTimerRef.current) {
        window.clearTimeout(flushTimerRef.current);
      }

      flushTimerRef.current = window.setTimeout(() => {
        void flushMutations();
      }, SAVE_DEBOUNCE_MS);
    },
    [flushMutations],
  );

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) {
        window.clearTimeout(flushTimerRef.current);
      }
      if (saveStateTimerRef.current) {
        window.clearTimeout(saveStateTimerRef.current);
      }
    };
  }, []);

  const addOccurrence = useCallback(
    (habitId: number, date: string) => {
      let pendingMutation: PlanMutation | null = null;
      let validationError: string | null = null;

      setData((prev) => {
        if (!prev) {
          return prev;
        }

        const habit = prev.habits.find((item) => item.id === habitId);
        const targetDay = prev.days.find((day) => day.date === date);

        if (!habit || !targetDay) {
          validationError = "Cannot add habit to this day.";
          return prev;
        }

        if (targetDay.occurrences.some((item) => item.habit_id === habitId)) {
          validationError = "That habit is already planned for this day.";
          return prev;
        }

        const tempId = createTempOccurrenceId();
        const optimisticOccurrence: PlanOccurrence = {
          id: tempId,
          habit_id: habit.id,
          habit_title: habit.title,
          planned_weight_cu: habit.weight_cu,
          context_tag: habit.context_tags[0] ?? null,
          habit_weight_cu: habit.weight_cu,
          habit_has_micro: habit.has_micro,
          habit_micro_weight_cu: habit.micro_weight_cu,
        };

        const days = prev.days.map((day) =>
          day.date === date
            ? {
                ...day,
                occurrences: [...day.occurrences, optimisticOccurrence],
              }
            : day,
        );

        const recalculated = recalcPlan(days);

        pendingMutation = {
          kind: "add",
          clientOccurrenceId: tempId,
          date,
          habitId,
          contextTag: optimisticOccurrence.context_tag,
        };

        return {
          ...prev,
          days: recalculated.days,
          planned_cu: recalculated.planned_cu,
        };
      });

      if (validationError) {
        showErrorToast(validationError);
        return;
      }

      if (pendingMutation) {
        enqueueMutation(pendingMutation);
      }
    },
    [enqueueMutation, showErrorToast],
  );

  const moveOccurrence = useCallback(
    (occurrenceId: string, targetDate: string) => {
      let pendingMutation: PlanMutation | null = null;
      let validationError: string | null = null;

      setData((prev) => {
        if (!prev) {
          return prev;
        }

        let sourceOccurrence: PlanOccurrence | null = null;
        let sourceDate: string | null = null;

        const withoutSource = prev.days.map((day) => {
          const remaining = day.occurrences.filter((occurrence) => {
            if (occurrence.id === occurrenceId) {
              sourceOccurrence = occurrence;
              sourceDate = day.date;
              return false;
            }
            return true;
          });

          return remaining.length === day.occurrences.length
            ? day
            : { ...day, occurrences: remaining };
        });

        if (!sourceOccurrence || !sourceDate) {
          return prev;
        }

        if (sourceDate === targetDate) {
          return prev;
        }

        const targetDay = withoutSource.find((day) => day.date === targetDate);

        if (targetDay) {
          if (targetDay.occurrences.some((item) => item.habit_id === sourceOccurrence?.habit_id)) {
            validationError = "That habit is already planned on the selected day.";
            return prev;
          }

          const days = withoutSource.map((day) =>
            day.date === targetDate
              ? {
                  ...day,
                  occurrences: [...day.occurrences, sourceOccurrence!],
                }
              : day,
          );

          const recalculated = recalcPlan(days);
          pendingMutation = {
            kind: "move",
            occurrenceId,
            date: targetDate,
          };

          return {
            ...prev,
            days: recalculated.days,
            planned_cu: recalculated.planned_cu,
          };
        }

        const recalculated = recalcPlan(withoutSource);
        pendingMutation = {
          kind: "move",
          occurrenceId,
          date: targetDate,
        };

        return {
          ...prev,
          days: recalculated.days,
          planned_cu: recalculated.planned_cu,
        };
      });

      if (validationError) {
        showErrorToast(validationError);
        return;
      }

      if (pendingMutation) {
        enqueueMutation(pendingMutation);
      }
    },
    [enqueueMutation, showErrorToast],
  );

  const unplanOccurrence = useCallback(
    (occurrenceId: string) => {
      let pendingMutation: PlanMutation | null = null;

      setData((prev) => {
        if (!prev) {
          return prev;
        }

        let removed = false;

        const days = prev.days.map((day) => {
          const remaining = day.occurrences.filter((occurrence) => {
            if (occurrence.id === occurrenceId) {
              removed = true;
              return false;
            }
            return true;
          });
          return remaining.length === day.occurrences.length
            ? day
            : { ...day, occurrences: remaining };
        });

        if (!removed) {
          return prev;
        }

        const recalculated = recalcPlan(days);
        pendingMutation = {
          kind: "unplan",
          occurrenceId,
        };

        return {
          ...prev,
          days: recalculated.days,
          planned_cu: recalculated.planned_cu,
        };
      });

      if (pendingMutation) {
        enqueueMutation(pendingMutation);
      }
    },
    [enqueueMutation],
  );

  const convertToMicro = useCallback(
    (occurrenceId: string) => {
      let pendingMutation: PlanMutation | null = null;
      let validationError: string | null = null;

      setData((prev) => {
        if (!prev) {
          return prev;
        }

        let didUpdate = false;

        const days = prev.days.map((day) => ({
          ...day,
          occurrences: day.occurrences.map((occurrence) => {
            if (occurrence.id !== occurrenceId) {
              return occurrence;
            }

            if (!occurrence.habit_has_micro || occurrence.habit_micro_weight_cu <= 0) {
              validationError = "This occurrence does not support micro-step.";
              return occurrence;
            }

            if (occurrence.planned_weight_cu <= occurrence.habit_micro_weight_cu) {
              validationError = "This occurrence is already at micro-step weight.";
              return occurrence;
            }

            didUpdate = true;

            pendingMutation = {
              kind: "convert_micro",
              occurrenceId,
              plannedWeightCu: occurrence.habit_micro_weight_cu,
            };

            return {
              ...occurrence,
              planned_weight_cu: occurrence.habit_micro_weight_cu,
            };
          }),
        }));

        if (!didUpdate) {
          return prev;
        }

        const recalculated = recalcPlan(days);

        return {
          ...prev,
          days: recalculated.days,
          planned_cu: recalculated.planned_cu,
        };
      });

      if (validationError) {
        showErrorToast(validationError);
      }

      if (pendingMutation) {
        enqueueMutation(pendingMutation);
      }
    },
    [enqueueMutation, showErrorToast],
  );

  const setWeeklyCapacity = useCallback(
    (capacityCu: number) => {
      const normalized = Math.round(capacityCu * 10) / 10;

      setData((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          ...prev,
          weekly_capacity_cu: normalized,
        };
      });

      const weekStartDate = activeWeekStartRef.current;
      if (!weekStartDate) {
        return;
      }

      enqueueMutation({
        kind: "set_capacity",
        weekStartDate,
        capacityCu: normalized,
      });
    },
    [enqueueMutation],
  );

  const dayOptions = useMemo(() => {
    if (!data) {
      return [] as Array<{ date: string; label: string }>;
    }

    return data.days.map((day) => ({
      date: day.date,
      label: formatDayLabel(day.date),
    }));
  }, [data]);

  const remainingHabits = useMemo<RemainingHabit[]>(() => {
    if (!data) {
      return [];
    }

    const plannedCountByHabit = new Map<number, number>();

    data.days.forEach((day) => {
      day.occurrences.forEach((occurrence) => {
        const currentCount = plannedCountByHabit.get(occurrence.habit_id) ?? 0;
        plannedCountByHabit.set(occurrence.habit_id, currentCount + 1);
      });
    });

    return data.habits
      .map((habit) => {
        const plannedCount = plannedCountByHabit.get(habit.id) ?? 0;
        const targetFrequency = Math.max(0, Math.round(habit.freq_per_week));
        const remaining = Math.max(targetFrequency - plannedCount, 0);

        return {
          ...habit,
          planned_count: plannedCount,
          remaining,
        };
      })
      .filter((habit) => habit.remaining > 0)
      .sort((a, b) => {
        if (b.remaining !== a.remaining) {
          return b.remaining - a.remaining;
        }
        return a.title.localeCompare(b.title);
      });
  }, [data]);

  const plannedCu = data?.planned_cu ?? 0;
  const weeklyCapacity = data?.weekly_capacity_cu ?? null;
  const isOverloaded =
    weeklyCapacity !== null && weeklyCapacity > 0 && plannedCu > weeklyCapacity;
  const overloadBy =
    weeklyCapacity !== null && weeklyCapacity > 0 ? Math.max(plannedCu - weeklyCapacity, 0) : 0;

  const overloadMicroSuggestion = useMemo<OverloadMicroSuggestion | null>(() => {
    if (!data || !isOverloaded) {
      return null;
    }

    let best: OverloadMicroSuggestion | null = null;

    data.days.forEach((day) => {
      day.occurrences.forEach((occurrence) => {
        if (!occurrence.habit_has_micro || occurrence.habit_micro_weight_cu <= 0) {
          return;
        }

        const savings = occurrence.planned_weight_cu - occurrence.habit_micro_weight_cu;
        if (savings <= 0) {
          return;
        }

        if (!best || savings > best.savingsCu) {
          best = {
            occurrenceId: occurrence.id,
            habitTitle: occurrence.habit_title,
            savingsCu: savings,
          };
        }
      });
    });

    return best;
  }, [data, isOverloaded]);

  const overloadMoveSuggestion = useMemo<OverloadMoveSuggestion | null>(() => {
    if (!data || !isOverloaded) {
      return null;
    }

    let biggestOccurrence: PlanOccurrence | null = null;

    data.days.forEach((day) => {
      day.occurrences.forEach((occurrence) => {
        if (!biggestOccurrence) {
          biggestOccurrence = occurrence;
          return;
        }
        if (occurrence.planned_weight_cu > biggestOccurrence.planned_weight_cu) {
          biggestOccurrence = occurrence;
        }
      });
    });

    if (!biggestOccurrence) {
      return null;
    }

    return {
      occurrenceId: biggestOccurrence.id,
      habitTitle: biggestOccurrence.habit_title,
      targetDate: shiftIsoDate(data.week_start_date, 7),
    };
  }, [data, isOverloaded]);

  const handleAutoDistribute = useCallback(() => {
    if (!data || remainingHabits.length === 0) {
      return;
    }

    const virtualDays = data.days.map((day) => ({
      date: day.date,
      load: day.planned_cu,
      habitIds: new Set(day.occurrences.map((occurrence) => occurrence.habit_id)),
    }));

    const placements: Array<{ habitId: number; date: string }> = [];

    remainingHabits.forEach((habit) => {
      let leftToPlace = habit.remaining;

      while (leftToPlace > 0) {
        const candidate = [...virtualDays]
          .filter((day) => !day.habitIds.has(habit.id))
          .sort((a, b) => {
            if (a.load !== b.load) {
              return a.load - b.load;
            }
            return a.date.localeCompare(b.date);
          })[0];

        if (!candidate) {
          break;
        }

        placements.push({
          habitId: habit.id,
          date: candidate.date,
        });

        candidate.habitIds.add(habit.id);
        candidate.load += habit.weight_cu;
        leftToPlace -= 1;
      }
    });

    placements.forEach((placement) => {
      addOccurrence(placement.habitId, placement.date);
    });
  }, [addOccurrence, data, remainingHabits]);

  const handleExportIcs = useCallback(() => {
    if (!data) {
      return;
    }

    const icsContent = buildWeekPlanIcs(data);
    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });

    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `habit-pilot-plan-${data.week_start_date}.ics`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }, [data]);

  const changeWeek = useCallback(
    async (weekStartDate: string) => {
      if (!data || weekStartDate === data.week_start_date) {
        return;
      }

      if (flushTimerRef.current) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }

      await flushMutations();
      await loadPlan(weekStartDate);
    },
    [data, flushMutations, loadPlan],
  );

  const currentWeekStart = data ? getWeekStartDate(data.today_date) : null;
  const isCurrentWeek = data && currentWeekStart ? data.week_start_date === currentWeekStart : false;

  const scrollToDay = useCallback((date: string) => {
    const target = document.querySelector(`[data-plan-date=\"${date}\"]`);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, []);

  const handlePreviousWeek = useCallback(() => {
    if (!data) {
      return;
    }
    void changeWeek(shiftIsoDate(data.week_start_date, -7));
  }, [changeWeek, data]);

  const handleNextWeek = useCallback(() => {
    if (!data) {
      return;
    }
    void changeWeek(shiftIsoDate(data.week_start_date, 7));
  }, [changeWeek, data]);

  const handleCurrentWeek = useCallback(() => {
    if (!currentWeekStart) {
      return;
    }
    void changeWeek(currentWeekStart);
  }, [changeWeek, currentWeekStart]);

  const handleToday = useCallback(() => {
    if (!data || !currentWeekStart) {
      return;
    }

    if (data.week_start_date === currentWeekStart) {
      scrollToDay(data.today_date);
      return;
    }

    void (async () => {
      await changeWeek(currentWeekStart);
      window.setTimeout(() => {
        scrollToDay(data.today_date);
      }, 150);
    })();
  }, [changeWeek, currentWeekStart, data, scrollToDay]);

  if (isLoading && !data) {
    return (
      <section className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Plan</h1>
          </div>
          <div className="h-6 w-64 animate-pulse rounded bg-muted" />
        </header>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr_auto]">
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="overflow-x-auto">
            <div className="grid min-w-[1120px] grid-cols-7 gap-3">
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={`plan-skeleton-${index}`}
                  className="h-[360px] animate-pulse rounded-xl border border-border bg-card"
                />
              ))}
            </div>
          </div>
          <div className="h-[460px] animate-pulse rounded-xl border border-border bg-card" />
        </div>
      </section>
    );
  }

  if (error && !data) {
    return (
      <section className="space-y-6">
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <>
      <section className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Plan</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <p>Plan your week within capacity.</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="link" size="sm" className="h-auto p-0">
                  Learn more
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>How weekly planning works</DialogTitle>
                  <DialogDescription>
                    Add habit occurrences across Mon-Sun, keep planned CU under weekly capacity,
                    and use micro-steps or re-scheduling when overloaded.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            {saveStatus === "saving" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-2 py-1 text-xs">
                <Loader2 className="size-3 animate-spin" />
                Saving...
              </span>
            ) : saveStatus === "saved" ? (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-500">
                Saved
              </span>
            ) : null}
          </div>
        </header>

        <section className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr_auto]">
            <WeekSwitcher
              weekStartDate={data.week_start_date}
              weekEndDate={data.week_end_date}
              isCurrentWeek={Boolean(isCurrentWeek)}
              onPreviousWeek={handlePreviousWeek}
              onNextWeek={handleNextWeek}
              onCurrentWeek={handleCurrentWeek}
              onToday={handleToday}
            />

            <CapacityMeter plannedCu={plannedCu} capacityCu={weeklyCapacity} />

            <div className="flex flex-col gap-2 xl:w-[170px]">
              <Button type="button" onClick={() => setIsCapacityModalOpen(true)}>
                Set capacity
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAutoDistribute}
                disabled={remainingHabits.length === 0}
              >
                Auto-distribute
              </Button>
              <Button type="button" variant="ghost" onClick={handleExportIcs}>
                Export .ics
              </Button>
            </div>
          </div>
        </section>

        {data.habits.length === 0 ? (
          <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
            <h2 className="text-lg font-semibold">No habits yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first habit to start distributing weekly occurrences.
            </p>
            <div className="mt-4">
              <Link href="/habits" className={cn(buttonVariants({ size: "sm" }))}>
                Create your first habit
              </Link>
            </div>
            <div className="mt-6 grid gap-2 md:grid-cols-3">
              {starterTemplates.map((template) => (
                <div
                  key={template.title}
                  className="rounded-lg border border-border/70 bg-background/50 p-3"
                >
                  <p className="text-sm font-medium">{template.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{template.details}</p>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="grid items-stretch gap-4 xl:min-h-[calc(100svh-22rem)] xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="overflow-x-auto pb-1 xl:h-full">
              <div className="grid min-w-[1120px] grid-cols-7 items-stretch gap-3 xl:h-full">
                {data.days.map((day) => (
                  <DayColumn
                    key={day.date}
                    day={day}
                    todayDate={data.today_date}
                    dayOptions={dayOptions}
                    onMoveOccurrence={moveOccurrence}
                    onConvertToMicro={convertToMicro}
                    onUnplanOccurrence={unplanOccurrence}
                  />
                ))}
              </div>
            </div>

            <RemainingHabitsPanel
              remainingHabits={remainingHabits}
              days={data.days}
              isOverloaded={isOverloaded}
              overloadMicroSuggestion={overloadMicroSuggestion}
              overloadMoveSuggestion={overloadMoveSuggestion}
              onAddOccurrence={addOccurrence}
              onApplyMicroSuggestion={convertToMicro}
              onApplyMoveSuggestion={moveOccurrence}
              onOpenSetCapacity={() => setIsCapacityModalOpen(true)}
            />
          </div>
        )}

        {isOverloaded ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-500">
            Overloaded by {formatCu(overloadBy)} CU for this week.
          </div>
        ) : null}
      </section>

      <SetCapacityModal
        open={isCapacityModalOpen}
        initialCapacityCu={data.weekly_capacity_cu}
        plannedCu={data.planned_cu}
        onOpenChange={setIsCapacityModalOpen}
        onSave={setWeeklyCapacity}
      />

      {toast ? (
        <div className="fixed right-6 top-6 z-50 max-w-sm rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-lg">
          <div className="flex items-center gap-2">
            <Info className="size-4" />
            <p>{toast.message}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
