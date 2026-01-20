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

type HabitFormState = {
  title: string;
  description: string;
  weight_cu: string;
  micro_title: string;
  micro_weight_cu: string;
};

const initialState: HabitFormState = {
  title: "",
  description: "",
  weight_cu: "",
  micro_title: "",
  micro_weight_cu: "",
};

export function HabitCreateDialog() {
  const [open, setOpen] = useState(false);
  const [hasMicro, setHasMicro] = useState(false);
  const [formState, setFormState] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setFormState(initialState);
      setHasMicro(false);
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

    if (hasMicro && !formState.micro_weight_cu.trim()) {
      setError("Micro capacity is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/habits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formState.title,
          description: formState.description || null,
          weight_cu: formState.weight_cu,
          micro_title: hasMicro ? formState.micro_title || null : null,
          micro_weight_cu: hasMicro ? formState.micro_weight_cu : "0",
          freq_type: "weekly",
          freq_per_week: "3",
          context_tags: [],
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Failed to create habit.");
        return;
      }

      setOpen(false);
    } catch {
      setError("Failed to create habit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button">Add habit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create habit</DialogTitle>
            <DialogDescription>
              Define the basics for a new habit. You can refine it later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="habit-name">Name</Label>
              <Input
                id="habit-name"
                name="title"
                placeholder="Morning run"
                value={formState.title}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="habit-description">Context / Description</Label>
              <Input
                id="habit-description"
                name="description"
                placeholder="Park, 20 minutes, easy pace"
                value={formState.description}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="habit-capacity">Capacity</Label>
              <Input
                id="habit-capacity"
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
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div>
                <Label
                  className="text-sm font-medium"
                  htmlFor="habit-micro-toggle"
                >
                  Microstep
                </Label>
                <p className="text-xs text-muted-foreground">
                  Add a smaller version of the habit
                </p>
              </div>
              <Switch
                id="habit-micro-toggle"
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
                  <Label htmlFor="habit-microstep">Microstep</Label>
                  <Input
                    id="habit-microstep"
                    name="micro_title"
                    placeholder="Put on running shoes"
                    value={formState.micro_title}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="habit-micro-weight">Micro capacity</Label>
                  <Input
                    id="habit-micro-weight"
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
              {isSubmitting ? "Adding..." : "Add habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
