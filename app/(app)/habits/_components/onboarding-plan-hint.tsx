"use client";

import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function OnboardingPlanHint() {
  return (
    <section className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-4 text-emerald-900 shadow-sm dark:text-emerald-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="size-4" />
            Nice start. Your first habit is ready.
          </p>
          <p className="text-sm text-emerald-900/80 dark:text-emerald-100/85">
            Open Plan and distribute this habit across the week.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/plan">
            Go to Plan
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
