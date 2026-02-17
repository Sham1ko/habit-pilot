import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ProgressResponse } from "@/lib/progress/types";

type WeeklyInsightCardProps = {
	insight: ProgressResponse["insight"];
	onAdjustPlan?: () => void;
	onEnableMicroSteps?: () => void;
};

export function WeeklyInsightCard({
	insight,
	onAdjustPlan,
	onEnableMicroSteps,
}: WeeklyInsightCardProps) {
	return (
		<Card className="border-emerald-500/40 from-emerald-500/10 to-background bg-gradient-to-r">
			<CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between md:gap-6">
				<div className="space-y-2">
					<p className="text-emerald-600 flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase dark:text-emerald-300">
						<Lightbulb className="size-3.5" />
						Weekly Insight
					</p>
					<h2 className="max-w-3xl text-2xl font-semibold leading-tight tracking-tight">
						{insight.headline}
					</h2>
					<p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
						{insight.subline}
					</p>
				</div>
				<div className="flex shrink-0 flex-wrap items-center gap-2 md:flex-col md:items-end">
					<Button type="button" size="sm" onClick={onAdjustPlan}>
						{insight.primaryCta}
					</Button>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={onEnableMicroSteps}
					>
						{insight.secondaryCta}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
