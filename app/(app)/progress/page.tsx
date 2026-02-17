"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildProgressCsv, getProgressCsvFilename } from "@/lib/progress/csv";
import type {
	ProgressHabitAttention,
	ProgressRangePreset,
	ProgressResponse,
} from "@/lib/progress/types";
import { cn } from "@/lib/utils";
import { ChartsRow } from "./_components/charts-row";
import { HabitDetailsSheet } from "./_components/habit-details-sheet";
import { HabitsNeedingAttentionTable } from "./_components/habits-needing-attention-table";
import { ProgressHeader } from "./_components/progress-header";
import { ProgressPageSkeleton } from "./_components/progress-page-skeleton";
import { SlipRecoveryCard } from "./_components/slip-recovery-card";
import { SummaryRow } from "./_components/summary-row";
import { WeeklyInsightCard } from "./_components/weekly-insight-card";

type ProgressFetchParams = {
	preset: ProgressRangePreset;
	start?: string;
	end?: string;
};

const SHARE_STORAGE_KEY = "habit_pilot_progress_share_state_v1";

function getPayloadError(payload: unknown) {
	if (
		payload &&
		typeof payload === "object" &&
		"error" in payload &&
		typeof payload.error === "string"
	) {
		return payload.error;
	}
	return null;
}

function isProgressResponse(payload: unknown): payload is ProgressResponse {
	return (
		payload !== null &&
		typeof payload === "object" &&
		"range" in payload &&
		"summary" in payload &&
		"charts" in payload &&
		"habits" in payload
	);
}

function createShareToken() {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function fetchProgress(params: ProgressFetchParams, signal: AbortSignal) {
	const query = new URLSearchParams({ preset: params.preset });
	if (params.preset === "custom") {
		if (params.start) {
			query.set("start", params.start);
		}
		if (params.end) {
			query.set("end", params.end);
		}
	}

	const response = await fetch(`/api/progress?${query.toString()}`, {
		signal,
		cache: "no-store",
	});

	const payload = (await response.json().catch(() => null)) as unknown;

	if (!response.ok) {
		throw new Error(getPayloadError(payload) ?? "Couldn’t load progress.");
	}

	if (!isProgressResponse(payload)) {
		throw new Error("Couldn’t load progress.");
	}

	return payload;
}

export default function ProgressPage() {
	const router = useRouter();

	const [data, setData] = useState<ProgressResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedPreset, setSelectedPreset] =
		useState<ProgressRangePreset>("this_week");
	const [fetchParams, setFetchParams] = useState<ProgressFetchParams>({
		preset: "this_week",
	});
	const [customStart, setCustomStart] = useState("");
	const [customEnd, setCustomEnd] = useState("");
	const [customRangeError, setCustomRangeError] = useState<string | null>(null);
	const [selectedDay, setSelectedDay] = useState<string | null>(null);
	const [selectedHabit, setSelectedHabit] =
		useState<ProgressHabitAttention | null>(null);
	const [detailsOpen, setDetailsOpen] = useState(false);

	const [shareEnabled, setShareEnabled] = useState(false);
	const [shareToken, setShareToken] = useState("");

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		try {
			const raw = window.localStorage.getItem(SHARE_STORAGE_KEY);
			if (!raw) {
				return;
			}

			const parsed = JSON.parse(raw) as {
				enabled?: boolean;
				token?: string;
			} | null;
			if (!parsed) {
				return;
			}

			setShareEnabled(Boolean(parsed.enabled));
			setShareToken(parsed.token ?? "");
		} catch {
			// Ignore malformed local state and continue with defaults.
		}
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const payload = JSON.stringify({
			enabled: shareEnabled,
			token: shareToken,
		});
		window.localStorage.setItem(SHARE_STORAGE_KEY, payload);
	}, [shareEnabled, shareToken]);

	const loadProgress = useCallback(() => {
		const controller = new AbortController();
		setIsLoading(true);
		setError(null);

		void fetchProgress(fetchParams, controller.signal)
			.then((response) => {
				setData(response);
				setSelectedHabit((previous) => {
					if (!previous) {
						return previous;
					}
					return (
						response.habits.topAttention.find(
							(item) => item.habitId === previous.habitId,
						) ?? null
					);
				});
			})
			.catch((fetchError) => {
				if (controller.signal.aborted) {
					return;
				}
				setError(
					fetchError instanceof Error
						? fetchError.message
						: "Couldn’t load progress.",
				);
			})
			.finally(() => {
				if (!controller.signal.aborted) {
					setIsLoading(false);
				}
			});

		return () => controller.abort();
	}, [fetchParams]);

	useEffect(() => {
		const cancel = loadProgress();
		return cancel;
	}, [loadProgress]);

	const shareUrl = useMemo(() => {
		if (
			!shareEnabled ||
			!shareToken ||
			!data ||
			typeof window === "undefined"
		) {
			return "";
		}

		const url = new URL("/progress", window.location.origin);
		url.searchParams.set("share", shareToken);
		url.searchParams.set("start", data.range.start);
		url.searchParams.set("end", data.range.end);
		return url.toString();
	}, [shareEnabled, shareToken, data]);

	const handlePresetChange = (preset: ProgressRangePreset) => {
		setSelectedPreset(preset);
		setCustomRangeError(null);
		setSelectedDay(null);

		if (preset === "custom") {
			return;
		}

		setFetchParams({ preset });
	};

	const handleApplyCustomRange = () => {
		if (!customStart || !customEnd) {
			setCustomRangeError("Choose both start and end dates.");
			return;
		}

		if (customStart > customEnd) {
			setCustomRangeError("Start date should be before end date.");
			return;
		}

		setCustomRangeError(null);
		setSelectedDay(null);
		setFetchParams({
			preset: "custom",
			start: customStart,
			end: customEnd,
		});
	};

	const handleExportCsv = () => {
		if (!data || typeof window === "undefined") {
			return;
		}

		const csv = buildProgressCsv(data);
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const objectUrl = window.URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = objectUrl;
		link.download = getProgressCsvFilename(data.range);
		document.body.append(link);
		link.click();
		link.remove();
		window.URL.revokeObjectURL(objectUrl);
	};

	const handleCopyShareLink = async () => {
		if (!shareUrl || typeof window === "undefined") {
			return;
		}

		try {
			await navigator.clipboard.writeText(shareUrl);
		} catch {
			const textarea = document.createElement("textarea");
			textarea.value = shareUrl;
			document.body.append(textarea);
			textarea.select();
			document.execCommand("copy");
			textarea.remove();
		}
	};

	const handleShareEnabledChange = (enabled: boolean) => {
		setShareEnabled(enabled);
		if (enabled && !shareToken) {
			setShareToken(createShareToken());
		}
	};

	const openHabitDetails = (habit: ProgressHabitAttention) => {
		setSelectedHabit(habit);
		setDetailsOpen(true);
	};

	if (isLoading && !data) {
		return <ProgressPageSkeleton />;
	}

	return (
		<section className="w-full space-y-5">
			<ProgressHeader
				rangeLabel={data?.range.label ?? "This week"}
				preset={selectedPreset}
				customStart={customStart}
				customEnd={customEnd}
				onPresetChange={handlePresetChange}
				onCustomStartChange={setCustomStart}
				onCustomEndChange={setCustomEnd}
				onApplyCustomRange={handleApplyCustomRange}
				onExportCsv={handleExportCsv}
				shareEnabled={shareEnabled}
				shareUrl={shareUrl}
				onShareEnabledChange={handleShareEnabledChange}
				onCopyShareLink={handleCopyShareLink}
			/>

			{customRangeError ? (
				<Card className="border-amber-500/40 bg-amber-500/10">
					<CardContent className="p-4 text-sm">{customRangeError}</CardContent>
				</Card>
			) : null}

			{error ? (
				<Card className="border-destructive/40 bg-destructive/10">
					<CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
						<p className="text-sm">Couldn’t load progress. {error}</p>
						<Button type="button" size="sm" onClick={loadProgress}>
							Retry
						</Button>
					</CardContent>
				</Card>
			) : null}

			{data ? (
				!data.states.hasHabits ? (
					<Card>
						<CardContent className="space-y-3 p-6">
							<h2 className="text-xl font-semibold">No habits yet</h2>
							<p className="text-muted-foreground text-sm">
								Create your first habit to start seeing progress insights.
							</p>
							<Link
								href="/habits"
								className={cn(buttonVariants({ size: "sm" }))}
							>
								Create your first habit
							</Link>
						</CardContent>
					</Card>
				) : !data.states.hasEntriesInRange ? (
					<Card>
						<CardContent className="space-y-2 p-6">
							<h2 className="text-xl font-semibold">
								No check-ins yet for this range.
							</h2>
							<p className="text-muted-foreground text-sm">
								Keep logging for a few days to unlock insight quality.
							</p>
						</CardContent>
					</Card>
				) : (
					<>
						{data.states.hasPartialMissing ? (
							<Card className="border-border/70 bg-muted/40">
								<CardContent className="p-3 text-sm">
									Some days are missing data — keep logging.
								</CardContent>
							</Card>
						) : null}

						<SummaryRow summary={data.summary} />
						<SlipRecoveryCard summary={data.summary.slipRecovery} />
						<WeeklyInsightCard
							insight={data.insight}
							onAdjustPlan={() => router.push("/plan")}
							onEnableMicroSteps={() => router.push("/habits")}
						/>
						<ChartsRow
							daily={data.charts.daily}
							loadBuckets={data.charts.loadBuckets}
							sweetSpotLabel={data.charts.sweetSpotLabel}
							selectedDay={selectedDay}
							onSelectDay={setSelectedDay}
						/>
						<HabitsNeedingAttentionTable
							habits={data.habits.topAttention}
							rangeEnd={data.range.end}
							selectedDay={selectedDay}
							onHabitSelect={openHabitDetails}
						/>
					</>
				)
			) : null}

			<HabitDetailsSheet
				open={detailsOpen}
				onOpenChange={setDetailsOpen}
				habit={selectedHabit}
			/>
		</section>
	);
}
