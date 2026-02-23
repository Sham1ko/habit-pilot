import { and, eq, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRequestUser } from "@/lib/api/auth";
import { hasRouteError } from "@/lib/api/http";
import { getDateContext } from "@/lib/date";
import { getDb } from "@/lib/db";
import {
  capacityPlans,
  habitEntries,
  habits,
  plannedOccurrences,
} from "@/lib/db/schema";
import {
  resolveProgressRange,
  shiftIsoDate,
  getWeekStartIso,
} from "@/lib/progress/date-range";
import { buildProgressResponse } from "@/lib/progress/metrics";
import type { CapacityByWeekMap } from "@/lib/progress/types";

const querySchema = z
  .object({
    preset: z
      .enum(["this_week", "last_week", "four_weeks", "three_months", "custom"])
      .default("this_week"),
    start: z.string().optional(),
    end: z.string().optional(),
  })
  .refine(
    (data) =>
      data.preset !== "custom" ||
      (Boolean(data.start?.trim()) && Boolean(data.end?.trim())),
    {
      message: "Custom range requires start and end dates.",
      path: ["start"],
    },
  );

export async function GET(request: Request) {
  try {
    const userResult = await requireRequestUser();
    if (hasRouteError(userResult)) {
      return userResult.error;
    }
    const user = userResult.data;

    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      preset: url.searchParams.get("preset") ?? undefined,
      start: url.searchParams.get("start") ?? undefined,
      end: url.searchParams.get("end") ?? undefined,
    });

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid query params.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const dateContext = getDateContext(user.tz ?? undefined);
    let range: ReturnType<typeof resolveProgressRange>;
    try {
      range = resolveProgressRange({
        preset: parsed.data.preset,
        start: parsed.data.start,
        end: parsed.data.end,
        today: dateContext.todayDateString,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not resolve date range.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const rangeStartStr = range.start;
    const rangeEndStr = range.end;
    const previousStartStr = range.previousStart;
    const previousEndStr = range.previousEnd;
    const historyStartStr = shiftIsoDate(range.end, -20);

    const db = await getDb();
    const habitsPromise = db
      .select({
        id: habits.id,
        title: habits.title,
        weight_cu: habits.weight_cu,
        micro_title: habits.micro_title,
        micro_weight_cu: habits.micro_weight_cu,
        has_micro: habits.has_micro,
        is_active: habits.is_active,
      })
      .from(habits)
      .where(eq(habits.user_id, user.id));

    const plannedInRangePromise = db
      .select({
        id: plannedOccurrences.id,
        habit_id: plannedOccurrences.habit_id,
        date: plannedOccurrences.date,
        planned_weight_cu: plannedOccurrences.planned_weight_cu,
      })
      .from(plannedOccurrences)
      .innerJoin(habits, eq(plannedOccurrences.habit_id, habits.id))
      .where(
        and(
          eq(habits.user_id, user.id),
          gte(plannedOccurrences.date, rangeStartStr),
          lte(plannedOccurrences.date, rangeEndStr),
        ),
      );

    const entriesInRangePromise = db
      .select({
        id: habitEntries.id,
        habit_id: habitEntries.habit_id,
        date: habitEntries.date,
        actual_weight_cu: habitEntries.actual_weight_cu,
        status: habitEntries.status,
        note: habitEntries.note,
      })
      .from(habitEntries)
      .innerJoin(habits, eq(habitEntries.habit_id, habits.id))
      .where(
        and(
          eq(habits.user_id, user.id),
          gte(habitEntries.date, rangeStartStr),
          lte(habitEntries.date, rangeEndStr),
        ),
      );

    const plannedInPreviousRangePromise = db
      .select({
        id: plannedOccurrences.id,
        habit_id: plannedOccurrences.habit_id,
        date: plannedOccurrences.date,
        planned_weight_cu: plannedOccurrences.planned_weight_cu,
      })
      .from(plannedOccurrences)
      .innerJoin(habits, eq(plannedOccurrences.habit_id, habits.id))
      .where(
        and(
          eq(habits.user_id, user.id),
          gte(plannedOccurrences.date, previousStartStr),
          lte(plannedOccurrences.date, previousEndStr),
        ),
      );

    const entriesInPreviousRangePromise = db
      .select({
        id: habitEntries.id,
        habit_id: habitEntries.habit_id,
        date: habitEntries.date,
        actual_weight_cu: habitEntries.actual_weight_cu,
        status: habitEntries.status,
        note: habitEntries.note,
      })
      .from(habitEntries)
      .innerJoin(habits, eq(habitEntries.habit_id, habits.id))
      .where(
        and(
          eq(habits.user_id, user.id),
          gte(habitEntries.date, previousStartStr),
          lte(habitEntries.date, previousEndStr),
        ),
      );

    const plannedHistoryPromise = db
      .select({
        id: plannedOccurrences.id,
        habit_id: plannedOccurrences.habit_id,
        date: plannedOccurrences.date,
        planned_weight_cu: plannedOccurrences.planned_weight_cu,
      })
      .from(plannedOccurrences)
      .innerJoin(habits, eq(plannedOccurrences.habit_id, habits.id))
      .where(
        and(
          eq(habits.user_id, user.id),
          gte(plannedOccurrences.date, historyStartStr),
          lte(plannedOccurrences.date, rangeEndStr),
        ),
      );

    const entriesHistoryPromise = db
      .select({
        id: habitEntries.id,
        habit_id: habitEntries.habit_id,
        date: habitEntries.date,
        actual_weight_cu: habitEntries.actual_weight_cu,
        status: habitEntries.status,
        note: habitEntries.note,
      })
      .from(habitEntries)
      .innerJoin(habits, eq(habitEntries.habit_id, habits.id))
      .where(
        and(
          eq(habits.user_id, user.id),
          gte(habitEntries.date, historyStartStr),
          lte(habitEntries.date, rangeEndStr),
        ),
      );

    const capacityStartIso = getWeekStartIso(range.start);
    const capacityEndIso = getWeekStartIso(range.end);

    const capacityPlansPromise = db
      .select({
        week_start_date: capacityPlans.week_start_date,
        capacity_cu: capacityPlans.capacity_cu,
      })
      .from(capacityPlans)
      .where(
        and(
          eq(capacityPlans.user_id, user.id),
          gte(capacityPlans.week_start_date, capacityStartIso),
          lte(capacityPlans.week_start_date, capacityEndIso),
        ),
      );

    const [
      userHabits,
      plannedInRange,
      entriesInRange,
      plannedInPreviousRange,
      entriesInPreviousRange,
      plannedHistory,
      entriesHistory,
      capacityRows,
    ] = await Promise.all([
      habitsPromise,
      plannedInRangePromise,
      entriesInRangePromise,
      plannedInPreviousRangePromise,
      entriesInPreviousRangePromise,
      plannedHistoryPromise,
      entriesHistoryPromise,
      capacityPlansPromise,
    ]);

    const capacityByWeek: CapacityByWeekMap = new Map();
    for (const row of capacityRows) {
      capacityByWeek.set(
        row.week_start_date,
        Number(row.capacity_cu.toString()),
      );
    }

    const response = buildProgressResponse({
      range,
      habits: userHabits,
      plannedInRange,
      entriesInRange,
      plannedInPreviousRange,
      entriesInPreviousRange,
      plannedHistory21: plannedHistory,
      entriesHistory21: entriesHistory,
      capacityByWeek,
      weeklyCapacityDefault: user.weekly_capacity_cu_default
        ? Number(user.weekly_capacity_cu_default.toString())
        : null,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Fetch progress error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
