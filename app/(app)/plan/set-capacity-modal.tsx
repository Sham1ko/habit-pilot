"use client";

import { useMemo, useState } from "react";
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
import { formatCu } from "./plan-utils";

type SetCapacityModalProps = {
  open: boolean;
  initialCapacityCu: number | null;
  plannedCu: number;
  onOpenChange: (open: boolean) => void;
  onSave: (capacityCu: number) => void;
};

export function SetCapacityModal({
  open,
  initialCapacityCu,
  plannedCu,
  onOpenChange,
  onSave,
}: SetCapacityModalProps) {
  const [draftValue, setDraftValue] = useState<string | null>(null);

  const defaultValue = useMemo(() => {
    const base = initialCapacityCu ?? Math.max(10, Math.ceil(plannedCu));
    return formatCu(base);
  }, [initialCapacityCu, plannedCu]);

  const value = draftValue ?? defaultValue;

  const parsed = Number(value);
  const isValid = Number.isFinite(parsed) && parsed > 0;
  const sliderMax = useMemo(() => {
    const base = Math.max(
      initialCapacityCu ?? 0,
      plannedCu,
      isValid ? parsed : 0,
      20,
    );
    return Math.ceil(base / 5) * 5 + 20;
  }, [initialCapacityCu, isValid, parsed, plannedCu]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setDraftValue(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set weekly capacity</DialogTitle>
          <DialogDescription>
            Define your CU budget for this week. Planning stays marked as overloaded when total
            planned CU exceeds this value.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weekly-capacity-input">Capacity (CU)</Label>
            <Input
              id="weekly-capacity-input"
              type="number"
              min={1}
              step={0.5}
              value={value}
              onChange={(event) => setDraftValue(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weekly-capacity-slider">Quick adjust</Label>
            <input
              id="weekly-capacity-slider"
              type="range"
              min={1}
              max={sliderMax}
              step={0.5}
              value={isValid ? parsed : 1}
              onChange={(event) => setDraftValue(event.target.value)}
              className="h-2 w-full cursor-pointer accent-primary"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>1 CU</span>
              <span>{sliderMax} CU</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!isValid}
            onClick={() => {
              if (!isValid) {
                return;
              }
              onSave(Math.round(parsed * 10) / 10);
              handleOpenChange(false);
            }}
          >
            Save capacity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
