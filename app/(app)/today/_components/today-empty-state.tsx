import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TodayEmptyState() {
	return (
		<div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
			<p>No habits planned for today.</p>
			<Link href="/plan" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
				Plan your week
			</Link>
		</div>
	);
}
