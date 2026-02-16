"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export function NoHabitsPanel() {
  return (
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
            <p className="mt-1 text-xs text-muted-foreground">
              {template.details}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
