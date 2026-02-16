"use client";

export function PlanPageSkeleton() {
    return (
        <section className="flex flex-1 flex-col min-h-0 gap-4">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div className="h-5 w-56 animate-pulse rounded bg-muted" />
                <div className="h-5 w-56 animate-pulse rounded bg-muted" />
            </header>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr_auto]">
                    <div className="h-24 animate-pulse rounded-lg bg-muted" />
                    <div className="h-24 animate-pulse rounded-lg bg-muted" />
                    <div className="h-24 animate-pulse rounded-lg bg-muted" />
                </div>
            </div>

            <div className="h-full grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="overflow-x-auto">
                    <div className="grid min-w-[1120px] grid-cols-7 gap-3 h-full">
                        {Array.from({ length: 7 }).map((_, index) => (
                            <div
                                key={`plan-skeleton-${index}`}
                                className="flex h-full min-h-[420px] animate-pulse rounded-xl border border-border bg-muted"
                            />
                        ))}
                    </div>
                </div>
                <div className="h-full animate-pulse rounded-xl border border-border bg-card" />
            </div>
        </section>
    );
}
