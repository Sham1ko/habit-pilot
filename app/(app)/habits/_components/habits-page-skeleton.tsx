import { Skeleton } from "@/components/ui/skeleton";

function HabitCardSkeleton() {
	return (
		<div className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="min-w-0 flex-1 space-y-2">
					<Skeleton className="h-7 w-48" />
					<div className="flex flex-wrap items-center gap-2">
						<Skeleton className="h-4 w-36" />
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-6 w-24 rounded-full" />
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Skeleton className="h-8 w-24 rounded-full" />
					<Skeleton className="h-9 w-14" />
					<Skeleton className="h-9 w-9" />
				</div>
			</div>
		</div>
	);
}

export function HabitsPageSkeleton() {
	return (
		<section className="w-full space-y-6">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<Skeleton className="h-4 w-72" />
				<Skeleton className="h-10 w-28" />
			</header>

			<div className="grid gap-4">
				<HabitCardSkeleton />
				<HabitCardSkeleton />
				<HabitCardSkeleton />
			</div>
		</section>
	);
}
