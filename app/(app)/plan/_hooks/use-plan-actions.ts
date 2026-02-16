"use client";

import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { PlanDay, PlanData, PlanOccurrence } from "../_lib/types";

const SAVE_DEBOUNCE_MS = 450;
const SAVE_STATE_TIMEOUT_MS = 1400;

export type SaveStatus = "idle" | "saving" | "saved";

export type PlanMutation =
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

type UsePlanActionsArgs = {
  setData: Dispatch<SetStateAction<PlanData | null>>;
  executeMutation: (mutation: PlanMutation) => Promise<void>;
  loadPlan: (
    weekStart?: string,
    options?: { showLoading?: boolean },
  ) => Promise<void>;
  activeWeekStartRef: MutableRefObject<string | null>;
};

export function recalcPlan(days: PlanDay[]) {
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

export function usePlanActions({
  setData,
  executeMutation,
  loadPlan,
  activeWeekStartRef,
}: UsePlanActionsArgs) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const queueRef = useRef<PlanMutation[]>([]);
  const flushTimerRef = useRef<number | null>(null);
  const saveStateTimerRef = useRef<number | null>(null);
  const isFlushingRef = useRef(false);

  const showErrorToast = useCallback((message: string) => {
    toast.error(message);
  }, []);

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
      void loadPlan(activeWeekStartRef.current ?? undefined, {
        showLoading: false,
      });
      return;
    }

    setSaveStatus("saved");

    if (saveStateTimerRef.current) {
      window.clearTimeout(saveStateTimerRef.current);
    }

    saveStateTimerRef.current = window.setTimeout(() => {
      setSaveStatus("idle");
    }, SAVE_STATE_TIMEOUT_MS);
  }, [activeWeekStartRef, executeMutation, loadPlan, showErrorToast]);

  const enqueueMutation = useCallback(
    (mutation: PlanMutation) => {
      if (mutation.kind === "set_capacity") {
        queueRef.current = queueRef.current.filter((item) => {
          return !(
            item.kind === "set_capacity" &&
            item.weekStartDate === mutation.weekStartDate
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
    [enqueueMutation, setData, showErrorToast],
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
          if (
            targetDay.occurrences.some(
              (item) => item.habit_id === sourceOccurrence?.habit_id,
            )
          ) {
            validationError =
              "That habit is already planned on the selected day.";
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
    [enqueueMutation, setData, showErrorToast],
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
    [enqueueMutation, setData],
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

            if (
              !occurrence.habit_has_micro ||
              occurrence.habit_micro_weight_cu <= 0
            ) {
              validationError = "This occurrence does not support micro-step.";
              return occurrence;
            }

            if (
              occurrence.planned_weight_cu <= occurrence.habit_micro_weight_cu
            ) {
              validationError =
                "This occurrence is already at micro-step weight.";
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
    [enqueueMutation, setData, showErrorToast],
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
    [activeWeekStartRef, enqueueMutation, setData],
  );

  return {
    addOccurrence,
    moveOccurrence,
    unplanOccurrence,
    convertToMicro,
    setWeeklyCapacity,
    flushMutations,
    saveStatus,
  };
}
