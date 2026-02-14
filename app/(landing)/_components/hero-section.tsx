import Link from "next/link";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="py-16">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Calm planning
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Plan habits without overload.
            </h1>
            <p className="text-base text-muted-foreground md:text-lg">
              Weekly Capacity (CU) keeps your week realistic. Micro-steps help
              you recover without starting from zero.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg">
              <Link href="/app">Open app</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Works in browser • Private by default
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 shadow-sm">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {["Weekly Plan", "Capacity Meter", "Today marks"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-border/70 bg-background/80 px-3 py-1"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border border-border/70 bg-background/80 p-4">
              <div className="text-xs font-semibold text-muted-foreground">
                Capacity Meter
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted">
                <div className="h-2 w-2/3 rounded-full bg-foreground/80" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <div className="text-xs font-semibold text-muted-foreground">
                  Weekly Plan
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-2 w-4/5 rounded-full bg-muted" />
                  <div className="h-2 w-2/3 rounded-full bg-muted" />
                  <div className="h-2 w-3/4 rounded-full bg-muted" />
                </div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <div className="text-xs font-semibold text-muted-foreground">
                  Today marks
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-border/60 px-2 py-1">
                    Done
                  </span>
                  <span className="rounded-full border border-border/60 px-2 py-1">
                    Skip
                  </span>
                  <span className="rounded-full border border-border/60 px-2 py-1">
                    Micro
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
