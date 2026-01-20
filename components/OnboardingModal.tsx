"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UserSettingsResponse = {
  weekly_capacity_cu_default: string | null;
  error?: string;
};

export default function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadUserSettings = async () => {
      try {
        const response = await fetch("/api/user");
        const data = (await response.json().catch(() => null)) as
          | UserSettingsResponse
          | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Failed to load user settings.");
        }

        const weeklyCapacity = data?.weekly_capacity_cu_default ?? null;
        if (isMounted) {
          if (weeklyCapacity && Number(weeklyCapacity) > 0) {
            setIsComplete(true);
            setOpen(false);
            setValue(weeklyCapacity);
          } else {
            setOpen(true);
          }
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load user settings."
          );
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    loadUserSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isComplete) {
      return;
    }
    setOpen(nextOpen);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!value.trim()) {
      setError("Weekly capacity is required.");
      return;
    }

    if (Number(value) <= 0) {
      setError("Weekly capacity must be greater than 0.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ weekly_capacity_cu_default: value }),
      });

      const data = (await response.json().catch(() => null)) as
        | UserSettingsResponse
        | null;

      if (!response.ok) {
        setError(data?.error ?? "Failed to update weekly capacity.");
        return;
      }

      setIsComplete(true);
      setOpen(false);
    } catch {
      setError("Failed to update weekly capacity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isChecking && !open) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]" showCloseButton={false}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Set your weekly capacity</DialogTitle>
            <DialogDescription>
              Tell us how many capacity units you can handle each week. We will
              use this as your default.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Label htmlFor="weekly-capacity">Weekly capacity</Label>
            <Input
              id="weekly-capacity"
              type="number"
              min="0"
              step="0.1"
              value={value}
              onChange={handleChange}
              placeholder="30"
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
