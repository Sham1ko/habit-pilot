"use client";

import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { ONBOARDING_STAGE, type OnboardingStage } from "@/lib/onboarding/stage";

type UserSettingsResponse = {
  weekly_capacity_cu_default: string | null;
  onboarding_stage: OnboardingStage;
  error?: string;
};

export default function OnboardingModal() {
  const router = useRouter();
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
        const data = (await response
          .json()
          .catch(() => null)) as UserSettingsResponse | null;

        if (!response.ok) {
          throw new Error(data?.error ?? "Failed to load user settings.");
        }

        const weeklyCapacity = data?.weekly_capacity_cu_default ?? null;
        const onboardingStage =
          data?.onboarding_stage ?? ONBOARDING_STAGE.COMPLETED;

        if (isMounted) {
          setValue(weeklyCapacity ?? "");

          if (onboardingStage === ONBOARDING_STAGE.SET_CAPACITY) {
            setIsComplete(false);
            setOpen(true);
          } else {
            setIsComplete(true);
            setOpen(false);
          }
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load user settings.",
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

      const data = (await response
        .json()
        .catch(() => null)) as UserSettingsResponse | null;

      if (!response.ok) {
        setError(data?.error ?? "Failed to update weekly capacity.");
        return;
      }

      setIsComplete(true);
      setOpen(false);
      router.replace("/habits");
      router.refresh();
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
            <DialogTitle>Welcome to Habit Pilot</DialogTitle>
            <DialogDescription>
              Set your weekly capacity in CU so your plan stays realistic. You
              can change this later from Plan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Label htmlFor="weekly-capacity">Weekly capacity (CU)</Label>
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
              {isSubmitting ? "Saving..." : "Save and continue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
