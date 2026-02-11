"use client";

import type { ComponentType } from "react";
import {
  BookMarked,
  CirclePlus,
  Dumbbell,
  Footprints,
  GraduationCap,
  Repeat,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HabitCreateDialog,
  type HabitCreateInitialValues,
} from "./habit-create-dialog";
import type { HabitListItem } from "./types";

type HabitsEmptyStateProps = {
  onHabitCreated: (habit: HabitListItem) => void;
};

type HabitTemplate = {
  id: string;
  title: string;
  cadence: string;
  cu: string;
  icon: ComponentType<{ className?: string }>;
  prefill: HabitCreateInitialValues;
};

const templates: HabitTemplate[] = [
  {
    id: "study",
    title: "Study 25 min",
    cadence: "5x/week",
    cu: "2",
    icon: GraduationCap,
    prefill: {
      title: "Study 25 min",
      description: "Deep focus session",
      weight_cu: "2",
      freq_type: "weekly",
      freq_per_week: "5",
      hasMicro: true,
      micro_title: "Open notes for 5 min",
      micro_weight_cu: "1",
    },
  },
  {
    id: "workout",
    title: "Workout 20 min",
    cadence: "3x/week",
    cu: "3",
    icon: Dumbbell,
    prefill: {
      title: "Workout 20 min",
      description: "Short strength routine",
      weight_cu: "3",
      freq_type: "weekly",
      freq_per_week: "3",
      hasMicro: true,
      micro_title: "5 push-ups",
      micro_weight_cu: "1",
    },
  },
  {
    id: "walk",
    title: "Walk 20 min",
    cadence: "Daily",
    cu: "1",
    icon: Footprints,
    prefill: {
      title: "Walk 20 min",
      description: "Outdoor reset walk",
      weight_cu: "1",
      freq_type: "daily",
      freq_per_week: "7",
      hasMicro: true,
      micro_title: "Walk for 5 min",
      micro_weight_cu: "0.5",
    },
  },
];

function templateTone(id: string) {
  if (id === "study") {
    return "bg-blue-500/10 text-blue-600 dark:text-blue-300";
  }
  if (id === "workout") {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-300";
  }
  return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
}

export function HabitsEmptyState({ onHabitCreated }: HabitsEmptyStateProps) {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <BookMarked className="size-7 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            No habits yet
          </h2>
          <p className="text-sm text-muted-foreground">
            Start with a template below, or create your own from scratch.
          </p>
          <HabitCreateDialog
            onHabitCreated={onHabitCreated}
            trigger={
              <Button type="button" size="lg" className="mt-1">
                <CirclePlus className="size-5" />
                Create your first habit
              </Button>
            }
          />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Templates
        </h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <article
                key={template.id}
                className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${templateTone(
                      template.id,
                    )}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <HabitCreateDialog
                    onHabitCreated={onHabitCreated}
                    initialValues={template.prefill}
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 px-2"
                      >
                        Add
                      </Button>
                    }
                  />
                </div>
                <h4 className="text-xl font-semibold leading-tight">
                  {template.title}
                </h4>
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Repeat className="size-4" />
                  <span>{template.cadence}</span>
                  <span aria-hidden>•</span>
                  <span>CU {template.cu}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="size-4" />
                  <span>Micro-step included</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
