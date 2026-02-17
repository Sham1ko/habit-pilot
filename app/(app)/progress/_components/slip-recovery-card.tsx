import { RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgressResponse } from "@/lib/progress/types";

type SlipRecoveryCardProps = {
	summary: ProgressResponse["summary"]["slipRecovery"];
};

function formatRate(value: number | null) {
	if (value === null) {
		return "—";
	}
	return `${Math.round(value)}%`;
}

export function SlipRecoveryCard({ summary }: SlipRecoveryCardProps) {
	return (
		<Card className="bg-card/90 gap-0 border-border/80">
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-xl">
					<span className="bg-amber-500/10 inline-flex size-9 items-center justify-center rounded-full">
						<RotateCcw className="text-amber-600 size-4" />
					</span>
					Slip Recovery
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-1">
				<p className="text-sm">
					Recovered {summary.recovered} of {summary.missed} missed check-ins (
					{formatRate(summary.rate)}).
				</p>
				<p className="text-muted-foreground text-sm">{summary.note}</p>
			</CardContent>
		</Card>
	);
}
