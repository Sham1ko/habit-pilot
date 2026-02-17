"use client";

import { CircleHelp, Download, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ProgressRangePreset } from "@/lib/progress/types";

type ProgressHeaderProps = {
	rangeLabel: string;
	preset: ProgressRangePreset;
	customStart: string;
	customEnd: string;
	onPresetChange: (preset: ProgressRangePreset) => void;
	onCustomStartChange: (value: string) => void;
	onCustomEndChange: (value: string) => void;
	onApplyCustomRange: () => void;
	onExportCsv: () => void;
	shareEnabled: boolean;
	shareUrl: string;
	onShareEnabledChange: (enabled: boolean) => void;
	onCopyShareLink: () => void;
};

function getPresetLabel(preset: ProgressRangePreset) {
	if (preset === "last_week") {
		return "Last week";
	}
	if (preset === "four_weeks") {
		return "4 weeks";
	}
	if (preset === "three_months") {
		return "3 months";
	}
	if (preset === "custom") {
		return "Custom";
	}
	return "This week";
}

export function ProgressHeader({
	rangeLabel,
	preset,
	customStart,
	customEnd,
	onPresetChange,
	onCustomStartChange,
	onCustomEndChange,
	onApplyCustomRange,
	onExportCsv,
	shareEnabled,
	shareUrl,
	onShareEnabledChange,
	onCopyShareLink,
}: ProgressHeaderProps) {
	const [shareDialogOpen, setShareDialogOpen] = useState(false);
	const [copied, setCopied] = useState(false);

	const rangeButtonLabel = useMemo(() => {
		if (preset === "custom" && customStart && customEnd) {
			return `${customStart} → ${customEnd}`;
		}
		return rangeLabel || getPresetLabel(preset);
	}, [preset, customStart, customEnd, rangeLabel]);

	return (
		<header className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-4xl font-semibold tracking-tight">Progress</h1>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								className="text-muted-foreground mt-2 inline-flex items-center gap-1 text-sm"
								aria-label="What is CU"
							>
								<CircleHelp className="size-4" />
								What is CU?
							</button>
						</TooltipTrigger>
						<TooltipContent side="bottom" className="max-w-xs">
							CU is your effort budget unit. Each habit completion spends CU,
							micro-steps spend less.
						</TooltipContent>
					</Tooltip>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button type="button" variant="outline" onClick={onExportCsv}>
						<Download className="size-4" />
						Export CSV
					</Button>

					<Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
						<DialogTrigger asChild>
							<Button type="button" variant="outline">
								<Share2 className="size-4" />
								Share
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Share read-only progress</DialogTitle>
								<DialogDescription>
									Anyone with the link can view.
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-4">
								<div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
									<div>
										<p className="text-sm font-medium">Enable share link</p>
										<p className="text-muted-foreground text-xs">
											Anyone with the link can view
										</p>
									</div>
									<Switch
										checked={shareEnabled}
										onCheckedChange={(next) =>
											onShareEnabledChange(Boolean(next))
										}
									/>
								</div>
								<div className="flex items-center gap-2">
									<Input
										readOnly
										value={shareEnabled ? shareUrl : ""}
										placeholder="Enable share link to generate URL"
										aria-label="Share URL"
									/>
									<Button
										type="button"
										variant="secondary"
										disabled={!shareEnabled || !shareUrl}
										onClick={async () => {
											onCopyShareLink();
											setCopied(true);
											setTimeout(() => setCopied(false), 1400);
										}}
									>
										{copied ? "Copied" : "Copy"}
									</Button>
								</div>
								<p className="text-muted-foreground text-xs">
									Share link state is local in this version.
								</p>
							</div>
						</DialogContent>
					</Dialog>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button type="button" variant="outline" className="min-w-[150px]">
								{rangeButtonLabel}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onSelect={() => onPresetChange("this_week")}>
								This week
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => onPresetChange("last_week")}>
								Last week
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => onPresetChange("four_weeks")}>
								4 weeks
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => onPresetChange("three_months")}>
								3 months
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => onPresetChange("custom")}>
								Custom
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{preset === "custom" ? (
				<div className="flex flex-wrap items-end gap-2 rounded-xl border border-border/70 bg-card p-3">
					<Label
						htmlFor="progress-custom-start"
						className="text-muted-foreground text-xs"
					>
						Start
						<Input
							id="progress-custom-start"
							type="date"
							value={customStart}
							onChange={(event) => onCustomStartChange(event.target.value)}
							className="mt-1 w-[170px]"
						/>
					</Label>
					<Label
						htmlFor="progress-custom-end"
						className="text-muted-foreground text-xs"
					>
						End
						<Input
							id="progress-custom-end"
							type="date"
							value={customEnd}
							onChange={(event) => onCustomEndChange(event.target.value)}
							className="mt-1 w-[170px]"
						/>
					</Label>
					<Button
						type="button"
						size="sm"
						onClick={onApplyCustomRange}
						disabled={!customStart || !customEnd}
					>
						Apply
					</Button>
				</div>
			) : null}
		</header>
	);
}
