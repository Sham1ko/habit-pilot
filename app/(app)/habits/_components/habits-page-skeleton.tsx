import { Skeleton } from "@/components/ui/skeleton";

function HabitCardSkeleton() {
	return (
		<div className="rounded-xl border border-border bg-card p-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex min-w-0 items-start gap-3 sm:gap-4">
					<Skeleton className="h-[54px] w-[54px] shrink-0 rounded-lg" />
					<div className="min-w-0 space-y-2">
						<div className="flex flex-wrap items-center gap-2">
							<Skeleton className="h-7 w-40" />
							<Skeleton className="h-6 w-16 rounded-full" />
						</div>
						<div className="flex flex-wrap items-center gap-1.5">
							<Skeleton className="h-6 w-16 rounded-full" />
							<Skeleton className="h-6 w-24 rounded-full" />
							<Skeleton className="h-6 w-24 rounded-full" />
						</div>
					</div>
				</div>

				<div className="ml-auto flex items-center gap-2 sm:ml-0 sm:self-center">
					<Skeleton className="h-9 w-9 rounded-md" />
					<Skeleton className="h-9 w-9 rounded-md" />
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
