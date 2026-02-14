import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl px-4">
        <div className="rounded-2xl border border-border/70 bg-muted/40 p-8 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Start planning realistically.
              </h2>
              <p className="text-sm text-muted-foreground">
                No setup. Works in browser.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/app">Open app</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
