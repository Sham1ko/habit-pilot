"use client";

import { cn } from "@/lib/utils";
import { formatCu } from "./plan-utils";

type CapacityMeterProps = {
  plannedCu: number;
  capacityCu: number | null;
};

function getMeterState(plannedCu: number, capacityCu: number | null) {
  if (!capacityCu || capacityCu <= 0) {
    return "within";
  }
  const ratio = plannedCu / capacityCu;
  if (ratio > 1) {
    return "overloaded";
  }
  if (ratio >= 0.9) {
    return "near_limit";
  }
  return "within";
}

export function CapacityMeter({ plannedCu, capacityCu }: CapacityMeterProps) {
  const state = getMeterState(plannedCu, capacityCu);
  const ratio = capacityCu && capacityCu > 0 ? plannedCu / capacityCu : 0;
  const progress = Math.max(0, Math.min(ratio * 100, 100));
  const overload = capacityCu && capacityCu > 0 ? Math.max(plannedCu - capacityCu, 0) : 0;

  return (
    <div className="rounded-xl border border-border/70 bg-background/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Weekly Capacity Meter
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            Planned {formatCu(plannedCu)} /{" "}
            {capacityCu && capacityCu > 0 ? `${formatCu(capacityCu)} CU` : "Set capacity"}
          </p>
        </div>
        {state === "overloaded" ? (
          <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-500">
            Overload
          </span>
        ) : state === "near_limit" ? (
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-500">
            Near limit
          </span>
        ) : (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500">
            Within capacity
          </span>
        )}
      </div>

      <div className="mt-3 h-2 rounded-full bg-muted">
        <div
          className={cn(
            "h-2 rounded-full transition-all",
            state === "within" && "bg-emerald-500",
            state === "near_limit" && "bg-amber-500",
            state === "overloaded" && "bg-rose-500",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {capacityCu && capacityCu > 0 ? (
          state === "overloaded" ? (
            <>Overloaded by {formatCu(overload)} CU</>
          ) : state === "near_limit" ? (
            <>You are close to your weekly limit.</>
          ) : (
            <>You are within your weekly capacity.</>
          )
        ) : (
          <>Set a weekly capacity to track load health.</>
        )}
      </p>
    </div>
  );
}
