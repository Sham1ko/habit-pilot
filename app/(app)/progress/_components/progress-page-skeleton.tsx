import { Skeleton } from "@/components/ui/skeleton";

export function ProgressPageSkeleton() {
	return (
		<section className="w-full space-y-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="space-y-2">
					<Skeleton className="h-8 w-36" />
					<Skeleton className="h-4 w-44" />
				</div>
				<div className="flex gap-2">
					<Skeleton className="h-9 w-28" />
					<Skeleton className="h-9 w-28" />
					<Skeleton className="h-9 w-32" />
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				{["summary-a", "summary-b", "summary-c"].map((key) => (
					<Skeleton key={key} className="h-36 rounded-xl" />
				))}
			</div>

			<Skeleton className="h-28 rounded-xl" />
			<Skeleton className="h-40 rounded-xl" />

			<div className="grid gap-4 xl:grid-cols-2">
				<Skeleton className="h-72 rounded-xl" />
				<Skeleton className="h-72 rounded-xl" />
			</div>

			<Skeleton className="h-72 rounded-xl" />
		</section>
	);
}
