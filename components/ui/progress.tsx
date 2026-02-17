import type * as React from "react";
import { cn } from "@/lib/utils";

function Progress({
	className,
	value = 0,
	indicatorClassName,
	...props
}: React.ComponentProps<"div"> & {
	value?: number;
	indicatorClassName?: string;
}) {
	const safeValue = Number.isFinite(value ?? 0)
		? Math.max(0, Math.min(100, value ?? 0))
		: 0;

	return (
		<div
			data-slot="progress"
			className={cn(
				"relative h-2 w-full overflow-hidden rounded-full bg-muted",
				className,
			)}
			{...props}
		>
			<div
				data-slot="progress-indicator"
				className={cn(
					"h-full w-full flex-1 bg-primary transition-transform",
					indicatorClassName,
				)}
				style={{ transform: `translateX(-${100 - safeValue}%)` }}
			/>
		</div>
	);
}

export { Progress };
