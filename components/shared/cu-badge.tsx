import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

type CuBadgeProps = {
	value: string | number;
	showIcon?: boolean;
	className?: string;
};

export function CuBadge({ value, showIcon = true, className }: CuBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full border border-blue-500 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-500",
				className,
			)}
		>
			{showIcon ? <Dumbbell strokeWidth={2} className="size-4" /> : null}
			{value} CU
		</span>
	);
}
