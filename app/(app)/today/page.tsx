"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TodayHabitItem } from "./_components/today-habit-item";
import type { HabitStatus, TodayAction, TodayItem } from "./types";

type TodayData = {
	date: string;
	week_start_date: string;
	weekly_capacity_cu: number | null;
	used_cu: number;
	planned_cu: number;
	items: TodayItem[];
};

type TodayResponse = {
	date: string;
	week_start_date: string;
	weekly_capacity_cu: string | null;
	used_cu: string;
	planned_cu: string;
	items: Array<{
		occurrence_id: string;
		habit_id: number;
		habit_emoji: string | null;
		habit_title: string;
		habit_weight_cu: string;
		habit_has_micro: boolean;
		habit_micro_title: string | null;
		habit_micro_weight_cu: string;
		planned_weight_cu: string;
		context_tag: string | null;
		status: HabitStatus;
		actual_weight_cu: string | null;
		entry_id: string | null;
	}>;
	error?: string;
};

type ActionPayload = {
	occurrenceId: string;
	action: TodayAction;
};

type ActionResponse = {
	entry: {
		id: string;
		habit_id: number;
		date: string;
		status: HabitStatus;
		actual_weight_cu: string;
	};
	week_usage: {
		weekly_capacity_cu: string | null;
		used_cu: string;
		planned_cu: string;
	};
	error?: string;
};

type RecoverySuggestion = {
	occurrenceId: string;
	habitTitle: string;
	contextTag: string | null;
	microTitle: string;
	suggestedWeight: number;
	remainingCapacity: number | null;
};

async function sendAction(payload: ActionPayload) {
	const response = await fetch("/api/today", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	const responseData = (await response
		.json()
		.catch(() => null)) as ActionResponse | null;

	if (!response.ok || !responseData) {
		throw new Error(responseData?.error ?? "Failed to update habit.");
	}

	return responseData;
}

function toNumber(value: string | null | undefined) {
	if (!value) {
		return 0;
	}
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeTodayResponse(data: TodayResponse): TodayData {
	return {
		date: data.date,
		week_start_date: data.week_start_date,
		weekly_capacity_cu: data.weekly_capacity_cu
			? Number(data.weekly_capacity_cu)
			: null,
		used_cu: Number(data.used_cu),
		planned_cu: Number(data.planned_cu),
		items: (data.items ?? []).map((item) => ({
			...item,
			habit_weight_cu: Number(item.habit_weight_cu),
			habit_micro_weight_cu: Number(item.habit_micro_weight_cu),
			planned_weight_cu: Number(item.planned_weight_cu),
			actual_weight_cu: item.actual_weight_cu
				? Number(item.actual_weight_cu)
				: null,
		})),
	};
}

function formatCu(value: number) {
	if (!Number.isFinite(value)) {
		return "0";
	}
	const rounded = Math.round(value * 10) / 10;
	return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
}

function formatDateLabel(dateString: string) {
	const date = new Date(`${dateString}T00:00:00`);
	return new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
	}).format(date);
}

function getContribution(item: TodayItem) {
	if (item.status === "skipped") {
		return 0;
	}
	if (item.status === "planned") {
		return item.planned_weight_cu;
	}
	return item.actual_weight_cu ?? item.planned_weight_cu;
}

function getMicroWeight(item: TodayItem) {
	if (item.habit_has_micro && item.habit_micro_weight_cu > 0) {
		return item.habit_micro_weight_cu;
	}
	return Math.max(0.1, item.planned_weight_cu * 0.5);
}

function getSubtitle(items: TodayItem[]) {
	if (items.length === 0) {
		return "Nothing planned today. Enjoy the space or plan ahead.";
	}

	const allComplete = items.every(
		(item) => item.status === "done" || item.status === "micro_done",
	);

	if (allComplete) {
		return "Nice work. Everything planned for today is complete.";
	}

	const hasSkipped = items.some((item) => item.status === "skipped");
	if (hasSkipped) {
		return "A slip doesn’t end the day. Small steps still count.";
	}

	return "Focus on what matters today. Keep it simple and doable.";
}

export default function TodayPage() {
	const [data, setData] = useState<TodayData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [pendingActions, setPendingActions] = useState<ActionPayload[]>([]);
	const [isSyncing, setIsSyncing] = useState(false);
	const [recovery, setRecovery] = useState<RecoverySuggestion | null>(null);
	const isFlushingRef = useRef(false);

	const subtitle = useMemo(() => (data ? getSubtitle(data.items) : ""), [data]);

	useEffect(() => {
		let isMounted = true;

		const loadToday = async () => {
			try {
				const response = await fetch("/api/today");
				const responseData = (await response
					.json()
					.catch(() => null)) as TodayResponse | null;

				if (!response.ok || !responseData) {
					throw new Error(responseData?.error ?? "Failed to load today.");
				}

				if (isMounted) {
					setData(normalizeTodayResponse(responseData));
				}
			} catch (loadError) {
				if (isMounted) {
					setError(
						loadError instanceof Error
							? loadError.message
							: "Failed to load today.",
					);
				}
			} finally {
				if (isMounted) {
					setIsLoading(false);
				}
			}
		};

		loadToday();

		return () => {
			isMounted = false;
		};
	}, []);

	const applyServerUpdate = useCallback(
		(occurrenceId: string, response: ActionResponse) => {
			setData((prev) => {
				if (!prev) {
					return prev;
				}

				const updatedItems = prev.items.map((item) => {
					if (item.occurrence_id !== occurrenceId) {
						return item;
					}

					return {
						...item,
						status: response.entry.status,
						actual_weight_cu: toNumber(response.entry.actual_weight_cu),
					};
				});

				const nextCapacity =
					response.week_usage.weekly_capacity_cu !== null
						? Number(response.week_usage.weekly_capacity_cu)
						: prev.weekly_capacity_cu;

				return {
					...prev,
					items: updatedItems,
					used_cu: Number(response.week_usage.used_cu),
					planned_cu: Number(response.week_usage.planned_cu),
					weekly_capacity_cu: nextCapacity,
				};
			});
		},
		[],
	);

	const flushPendingActions = useCallback(async () => {
		if (isFlushingRef.current || pendingActions.length === 0) {
			return;
		}

		isFlushingRef.current = true;
		setIsSyncing(true);
		setActionError(null);

		for (const action of pendingActions) {
			try {
				const response = await sendAction(action);
				applyServerUpdate(action.occurrenceId, response);
				setPendingActions((prev) =>
					prev.filter(
						(item) =>
							!(
								item.occurrenceId === action.occurrenceId &&
								item.action === action.action
							),
					),
				);
			} catch (err) {
				const message =
					err instanceof Error ? err.message : "Failed to sync updates.";
				setActionError(message);
				break;
			}
		}

		setIsSyncing(false);
		isFlushingRef.current = false;
	}, [applyServerUpdate, pendingActions]);

	useEffect(() => {
		const handleOnline = () => {
			void flushPendingActions();
		};

		window.addEventListener("online", handleOnline);
		return () => window.removeEventListener("online", handleOnline);
	}, [flushPendingActions]);

	const updateRecovery = (
		item: TodayItem,
		nextUsed: number,
		weeklyCapacity: number | null,
	) => {
		const remaining =
			weeklyCapacity !== null ? Math.max(weeklyCapacity - nextUsed, 0) : null;

		const suggestedWeight = getMicroWeight(item);
		const remainingCapacity =
			remaining !== null ? Math.max(remaining, 0) : null;

		setRecovery({
			occurrenceId: item.occurrence_id,
			habitTitle: item.habit_title,
			contextTag: item.context_tag,
			microTitle:
				item.habit_micro_title?.trim() ||
				`Micro ${item.habit_title.toLowerCase()}`,
			suggestedWeight:
				remainingCapacity !== null
					? Math.min(suggestedWeight, remainingCapacity || suggestedWeight)
					: suggestedWeight,
			remainingCapacity,
		});
	};

	const handleAction = async (
		occurrenceId: string,
		action: TodayAction,
	) => {
		if (!data) {
			return;
		}

		setActionError(null);
		const snapshot = data;

		const target = data.items.find(
			(item) => item.occurrence_id === occurrenceId,
		);

		if (!target) {
			return;
		}

		const previousContribution = getContribution(target);
		const nextItem: TodayItem = {
			...target,
			status: action,
			actual_weight_cu:
				action === "skipped"
					? 0
					: action === "done"
						? target.habit_weight_cu || target.planned_weight_cu
						: getMicroWeight(target),
		};
		const nextContribution = getContribution(nextItem);
		const nextUsed = Math.max(
			0,
			Number(data.used_cu) - previousContribution + nextContribution,
		);

		setData((prev) => {
			if (!prev) {
				return prev;
			}

			return {
				...prev,
				used_cu: nextUsed,
				items: prev.items.map((item) =>
					item.occurrence_id === occurrenceId ? nextItem : item,
				),
			};
		});

		if (action === "skipped") {
			updateRecovery(nextItem, nextUsed, data.weekly_capacity_cu);
		} else if (recovery?.occurrenceId === occurrenceId) {
			setRecovery(null);
		}

		setPendingActions((prev) => [...prev, { occurrenceId, action }]);

		try {
			const response = await sendAction({ occurrenceId, action });
			applyServerUpdate(occurrenceId, response);
			setPendingActions((prev) =>
				prev.filter(
					(item) =>
						!(item.occurrenceId === occurrenceId && item.action === action),
				),
			);
		} catch (err) {
			const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
			if (isOffline) {
				setActionError("You’re offline. Updates will sync when you reconnect.");
			} else {
				const message =
					err instanceof Error ? err.message : "Failed to update habit.";
				setActionError(message);
				setPendingActions((prev) =>
					prev.filter(
						(item) =>
							!(item.occurrenceId === occurrenceId && item.action === action),
					),
				);
				setData(snapshot);
			}
		}
	};

	const todayLabel = data ? formatDateLabel(data.date) : "Today";
	const weeklyCapacity = data?.weekly_capacity_cu ?? null;
	const usedCu = data?.used_cu ?? 0;
	const capacityRatio =
		weeklyCapacity && weeklyCapacity > 0 ? usedCu / weeklyCapacity : 0;
	const capacityState =
		capacityRatio > 1 ? "over" : capacityRatio > 0.9 ? "high" : "ok";

	const capacityBarClass = cn(
		"h-2 rounded-full transition-all",
		capacityState === "over" && "bg-rose-500",
		capacityState === "high" && "bg-amber-500",
		capacityState === "ok" && "bg-emerald-500",
	);

	return (
		<section className="space-y-4 w-full md:space-y-6">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div className="max-w-xl">
					<p className="text-sm text-muted-foreground">{todayLabel}</p>
					{subtitle ? (
						<p className="text-sm text-muted-foreground">{subtitle}</p>
					) : null}
				</div>

				<div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
					<div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
						<span>Weekly capacity</span>
						<span>
							{weeklyCapacity
								? `${formatCu(usedCu)} / ${formatCu(weeklyCapacity)} CU`
								: "Set weekly capacity"}
						</span>
					</div>
					<div className="mt-2 h-2 rounded-full bg-muted">
						<div
							className={capacityBarClass}
							style={{
								width: `${Math.min(capacityRatio * 100, 100)}%`,
							}}
						/>
					</div>
					{capacityState === "over" ? (
						<p className="mt-2 text-xs text-rose-600">
							You’re over capacity. Consider micro-steps today.
						</p>
					) : null}
				</div>
			</header>

			{actionError ? (
				<div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
					{actionError}
				</div>
			) : null}

			{isSyncing || pendingActions.length > 0 ? (
				<div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
					{isSyncing
						? "Syncing updates..."
						: `${pendingActions.length} update${pendingActions.length === 1 ? "" : "s"} waiting to sync.`}
				</div>
			) : null}

			<div className="grid gap-4">
				{isLoading ? (
					<div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
						Loading today’s habits...
					</div>
				) : error ? (
					<div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
						{error}
					</div>
				) : data && data.items.length === 0 ? (
					<div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
						<p>No habits planned for today.</p>
						<Link
							href="/plan"
							className={cn(buttonVariants({ size: "sm" }), "mt-4")}
						>
							Plan your week
						</Link>
					</div>
				) : (
					data?.items.map((item) => {
						const isPending = pendingActions.some(
							(action) => action.occurrenceId === item.occurrence_id,
						);

						return (
							<TodayHabitItem
								key={item.occurrence_id}
								item={item}
								isPending={isPending}
								onAction={handleAction}
								formatCu={formatCu}
							/>
						);
					})
				)}
			</div>

			{recovery ? (
				<section className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
					<h3 className="text-lg font-semibold">Slip recovery</h3>
					<p className="mt-2 text-sm text-muted-foreground">
						Missing one habit is normal. A tiny step keeps the day on track.
					</p>
					<div className="mt-3 rounded-lg border border-border/70 bg-background p-3 text-sm">
						<p className="font-medium">{recovery.microTitle}</p>
						<p className="text-xs text-muted-foreground">
							{recovery.contextTag ? `${recovery.contextTag} • ` : ""}
							Suggested: {formatCu(recovery.suggestedWeight)} CU
							{recovery.remainingCapacity !== null
								? ` • ${formatCu(recovery.remainingCapacity)} CU remaining`
								: ""}
						</p>
					</div>
					<Button
						type="button"
						size="sm"
						className="mt-4"
						onClick={() => handleAction(recovery.occurrenceId, "micro_done")}
					>
						Mark micro-done
					</Button>
				</section>
			) : null}
		</section>
	);
}
