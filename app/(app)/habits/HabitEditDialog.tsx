"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { HabitListItem } from "./types";

type HabitFormState = {
  title: string;
  description: string;
  weight_cu: string;
  freq_type: "daily" | "weekly";
  freq_per_week: string;
  micro_title: string;
  micro_weight_cu: string;
};

type HabitEditDialogProps = {
  habit: HabitListItem;
  onHabitUpdated?: (habit: HabitListItem) => void;
};

function toStringValue(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return value.toString();
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

function getInitialState(habit: HabitListItem): HabitFormState {
  return {
    title: habit.title ?? "",
    description: habit.description ?? "",
    weight_cu: toStringValue(habit.weight_cu),
    freq_type: habit.freq_type === "daily" ? "daily" : "weekly",
    freq_per_week: toStringValue(habit.freq_per_week || "3"),
    micro_title: habit.micro_title ?? "",
    micro_weight_cu: toStringValue(habit.micro_weight_cu),
  };
}

export function HabitEditDialog({
  habit,
  onHabitUpdated,
}: HabitEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [hasMicro, setHasMicro] = useState(
    habit.has_micro ||
      Boolean(habit.micro_title) ||
      Number.parseFloat(toStringValue(habit.micro_weight_cu)) > 0
  );
  const [formState, setFormState] = useState(() => getInitialState(habit));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setFormState(getInitialState(habit));
      setHasMicro(
        habit.has_micro ||
          Boolean(habit.micro_title) ||
          Number.parseFloat(toStringValue(habit.micro_weight_cu)) > 0
      );
      setError(null);
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!formState.title.trim()) {
      setError("Name is required.");
      return;
    }

    if (!formState.weight_cu.trim()) {
      setError("Capacity is required.");
      return;
    }

    if (formState.freq_type === "weekly" && !formState.freq_per_week.trim()) {
      setError("Weekly frequency is required.");
      return;
    }

    if (hasMicro && !formState.micro_weight_cu.trim()) {
      setError("Micro capacity is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const freqPerWeek =
        formState.freq_type === "daily" ? "7" : formState.freq_per_week;

      const response = await fetch("/api/habits", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: habit.id,
          title: formState.title,
          description: formState.description || null,
          weight_cu: formState.weight_cu,
          freq_type: formState.freq_type,
          freq_per_week: freqPerWeek,
          micro_title: hasMicro ? formState.micro_title || null : null,
          micro_weight_cu: hasMicro ? formState.micro_weight_cu : "0",
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { habit?: HabitListItem; error?: string }
        | null;

      if (!response.ok) {
        setError(data?.error ?? "Failed to update habit.");
        return;
      }

      if (data?.habit) {
        onHabitUpdated?.(data.habit);
      }

      setOpen(false);
    } catch {
      setError("Failed to update habit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit habit</DialogTitle>
            <DialogDescription>Update the details for this habit.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor={`habit-name-${habit.id}`}>Name</Label>
              <Input
                id={`habit-name-${habit.id}`}
                name="title"
                placeholder="Morning run"
                value={formState.title}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor={`habit-description-${habit.id}`}>
                Context / Description
              </Label>
              <Input
                id={`habit-description-${habit.id}`}
                name="description"
                placeholder="Park, 20 minutes, easy pace"
                value={formState.description}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor={`habit-capacity-${habit.id}`}>Capacity</Label>
              <Input
                id={`habit-capacity-${habit.id}`}
                name="weight_cu"
                placeholder="10"
                type="number"
                min="0"
                step="0.1"
                value={formState.weight_cu}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label>Frequency</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={
                    formState.freq_type === "daily" ? "default" : "outline"
                  }
                  onClick={() =>
                    setFormState((prev) => ({
                      ...prev,
                      freq_type: "daily",
                    }))
                  }
                >
                  Daily
                </Button>
                <Button
                  type="button"
                  variant={
                    formState.freq_type === "weekly" ? "default" : "outline"
                  }
                  onClick={() =>
                    setFormState((prev) => ({
                      ...prev,
                      freq_type: "weekly",
                    }))
                  }
                >
                  Weekly
                </Button>
              </div>
              {formState.freq_type === "weekly" ? (
                <div className="flex items-center gap-2">
                  <Input
                    id={`habit-frequency-${habit.id}`}
                    name="freq_per_week"
                    placeholder="3"
                    type="number"
                    min="1"
                    max="7"
                    step="1"
                    value={formState.freq_per_week}
                    onChange={handleChange}
                    required
                  />
                  <span className="text-xs text-muted-foreground">
                    times per week
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Every day (7x per week)
                </p>
              )}
            </div>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div>
                <Label
                  className="text-sm font-medium"
                  htmlFor={`habit-micro-toggle-${habit.id}`}
                >
                  Microstep
                </Label>
                <p className="text-xs text-muted-foreground">
                  Add a smaller version of the habit
                </p>
              </div>
              <Switch
                id={`habit-micro-toggle-${habit.id}`}
                checked={hasMicro}
                onCheckedChange={(next) => {
                  setHasMicro(next);
                  if (!next) {
                    setFormState((prev) => ({
                      ...prev,
                      micro_title: "",
                      micro_weight_cu: "",
                    }));
                    setError(null);
                  }
                }}
              />
            </div>
            {hasMicro ? (
              <>
                <div className="grid gap-3">
                  <Label htmlFor={`habit-microstep-${habit.id}`}>
                    Microstep
                  </Label>
                  <Input
                    id={`habit-microstep-${habit.id}`}
                    name="micro_title"
                    placeholder="Put on running shoes"
                    value={formState.micro_title}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor={`habit-micro-weight-${habit.id}`}>
                    Micro capacity
                  </Label>
                  <Input
                    id={`habit-micro-weight-${habit.id}`}
                    name="micro_weight_cu"
                    placeholder="1"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formState.micro_weight_cu}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            ) : null}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
