import { and, asc, eq, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRequestUser } from "@/lib/api/auth";
import { hasRouteError, parseJsonBody } from "@/lib/api/http";
import { formatDateUTC, getDateContext } from "@/lib/date";
import { getDb } from "@/lib/db";
import {
  capacityPlans,
  habitEntries,
  habits,
  plannedOccurrences,
} from "@/lib/db/schema";
import { toNumber } from "@/lib/number";

const actionSchema = z.object({
  occurrenceId: z.string().uuid(),
  action: z.enum(["done", "micro_done", "skipped"]),
});

function computeWeekUsage(
  plannedOccurrences: Array<{
    habit_id: number;
    date: string;
    planned_weight_cu: unknown;
  }>,
  entries: Array<{
    habit_id: number;
    date: string;
    actual_weight_cu: { toString(): string };
    status: string;
    id?: string | number;
  }>,
) {
  const plannedByKey = new Map<string, number>();
  let plannedTotal = 0;

  plannedOccurrences.forEach((occurrence) => {
    const dateKey = occurrence.date;
    const key = `${occurrence.habit_id}-${dateKey}`;
    const plannedWeight = toNumber(occurrence.planned_weight_cu);
    plannedByKey.set(key, plannedWeight);
    plannedTotal += plannedWeight;
  });

  const entryByKey = new Map<string, (typeof entries)[number]>();
  entries.forEach((entry) => {
    const dateKey = entry.date;
    const key = `${entry.habit_id}-${dateKey}`;
    entryByKey.set(key, entry);
  });

  let used = 0;

  plannedByKey.forEach((plannedWeight, key) => {
    const entry = entryByKey.get(key);
    if (!entry) {
      used += plannedWeight;
      return;
    }

    if (entry.status === "skipped") {
      return;
    }

    used += toNumber(entry.actual_weight_cu);
  });

  entryByKey.forEach((entry, key) => {
    if (plannedByKey.has(key)) {
      return;
    }
    if (entry.status === "skipped") {
      return;
    }
    used += toNumber(entry.actual_weight_cu);
  });

  return { used, plannedTotal, entryByKey };
}

export async function GET() {
  try {
    const userResult = await requireRequestUser();
    if (hasRouteError(userResult)) {
      return userResult.error;
    }
    const user = userResult.data;

    const { todayDateString, weekStartDate, weekEndDate, weekStartDateString } =
      getDateContext(user.tz ?? undefined);

    const weekStartStr = formatDateUTC(weekStartDate);
    const weekEndStr = formatDateUTC(weekEndDate);

    const db = await getDb();
    const [capacityPlan] = await db
      .select()
      .from(capacityPlans)
      .where(
        and(
          eq(capacityPlans.user_id, user.id),
          eq(capacityPlans.week_start_date, weekStartStr),
        ),
      )
      .limit(1);

    const weeklyCapacity =
      capacityPlan?.capacity_cu ?? user.weekly_capacity_cu_default ?? null;

    const allPlannedOccurrences = await db
      .select({
        id: plannedOccurrences.id,
        habit_id: plannedOccurrences.habit_id,
        date: plannedOccurrences.date,
        planned_weight_cu: plannedOccurrences.planned_weight_cu,
        habit_emoji: habits.emoji,
        habit_title: habits.title,
        habit_weight_cu: habits.weight_cu,
        habit_has_micro: habits.has_micro,
        habit_micro_title: habits.micro_title,
        habit_micro_weight_cu: habits.micro_weight_cu,
      })
      .from(plannedOccurrences)
      .innerJoin(habits, eq(plannedOccurrences.habit_id, habits.id))
      .where(
        and(
          eq(habits.user_id, user.id),
          eq(habits.is_active, true),
          gte(plannedOccurrences.date, weekStartStr),
          lte(plannedOccurrences.date, weekEndStr),
        ),
      )
      .orderBy(asc(plannedOccurrences.date));

    const allEntries = await db
      .select()
      .from(habitEntries)
      .innerJoin(habits, eq(habitEntries.habit_id, habits.id))
      .where(
        and(
          eq(habits.user_id, user.id),
          eq(habits.is_active, true),
          gte(habitEntries.date, weekStartStr),
          lte(habitEntries.date, weekEndStr),
        ),
      );

    const entries = allEntries.map((row) => row.habit_entries);

    const { used, plannedTotal, entryByKey } = computeWeekUsage(
      allPlannedOccurrences,
      entries,
    );

    const items = allPlannedOccurrences
      .filter((occurrence) => occurrence.date === todayDateString)
      .map((occurrence) => {
        const dateKey = occurrence.date;
        const entryKey = `${occurrence.habit_id}-${dateKey}`;
        const entry = entryByKey.get(entryKey);

        return {
          occurrence_id: occurrence.id,
          habit_id: occurrence.habit_id,
          habit_emoji: occurrence.habit_emoji,
          habit_title: occurrence.habit_title,
          habit_weight_cu: occurrence.habit_weight_cu?.toString() ?? "0",
          habit_has_micro: occurrence.habit_has_micro,
          habit_micro_title: occurrence.habit_micro_title,
          habit_micro_weight_cu:
            occurrence.habit_micro_weight_cu?.toString() ?? "0",
          planned_weight_cu: occurrence.planned_weight_cu?.toString() ?? "0",
          status: entry?.status ?? "planned",
          actual_weight_cu: entry
            ? (entry.actual_weight_cu?.toString() ?? null)
            : null,
          entry_id: entry?.id ?? null,
        };
      });

    return NextResponse.json(
      {
        date: todayDateString,
        week_start_date: weekStartDateString,
        weekly_capacity_cu: weeklyCapacity?.toString() ?? null,
        used_cu: used.toString(),
        planned_cu: plannedTotal.toString(),
        items,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fetch today error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const bodyResult = await parseJsonBody(request);
    if (hasRouteError(bodyResult)) {
      return bodyResult.error;
    }

    const parsed = actionSchema.safeParse(bodyResult.data);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request body";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const userResult = await requireRequestUser();
    if (hasRouteError(userResult)) {
      return userResult.error;
    }
    const user = userResult.data;

    const { todayDateString, weekStartDate, weekEndDate, weekStartDateString } =
      getDateContext(user.tz ?? undefined);

    const weekStartStr = formatDateUTC(weekStartDate);
    const weekEndStr = formatDateUTC(weekEndDate);

    const db = await getDb();
    const [occurrenceRow] = await db
      .select({
        id: plannedOccurrences.id,
        habit_id: plannedOccurrences.habit_id,
        date: plannedOccurrences.date,
        planned_weight_cu: plannedOccurrences.planned_weight_cu,
        habit_title: habits.title,
        habit_weight_cu: habits.weight_cu,
        habit_has_micro: habits.has_micro,
        habit_micro_weight_cu: habits.micro_weight_cu,
      })
      .from(plannedOccurrences)
      .innerJoin(habits, eq(plannedOccurrences.habit_id, habits.id))
      .where(
        and(
          eq(plannedOccurrences.id, parsed.data.occurrenceId),
          eq(habits.user_id, user.id),
          eq(habits.is_active, true),
        ),
      )
      .limit(1);

    if (!occurrenceRow) {
      return NextResponse.json(
        { error: "Planned habit not found." },
        { status: 404 },
      );
    }

    const occurrenceDate = occurrenceRow.date;
    if (occurrenceDate !== todayDateString) {
      return NextResponse.json(
        { error: "Only today’s habits can be updated here." },
        { status: 400 },
      );
    }

    const { action } = parsed.data;
    const plannedWeight = toNumber(occurrenceRow.planned_weight_cu);
    const habitWeight = toNumber(occurrenceRow.habit_weight_cu);
    const habitMicroWeight = toNumber(occurrenceRow.habit_micro_weight_cu);

    let actualWeight = 0;
    if (action === "done") {
      actualWeight = habitWeight || plannedWeight;
    } else if (action === "micro_done") {
      if (occurrenceRow.habit_has_micro && habitMicroWeight > 0) {
        actualWeight = habitMicroWeight;
      } else {
        actualWeight = Math.max(0.1, plannedWeight * 0.5);
      }
    }

    const [existingEntry] = await db
      .select()
      .from(habitEntries)
      .where(
        and(
          eq(habitEntries.habit_id, occurrenceRow.habit_id),
          eq(habitEntries.date, occurrenceRow.date),
        ),
      )
      .limit(1);

    const entryPayload = {
      habit_id: occurrenceRow.habit_id,
      date: occurrenceRow.date,
      actual_weight_cu: actualWeight.toString(),
      status: action as "done" | "micro_done" | "skipped",
    };

    const entry = existingEntry
      ? (
          await db
            .update(habitEntries)
            .set(entryPayload)
            .where(eq(habitEntries.id, existingEntry.id))
            .returning()
        )[0]
      : (await db.insert(habitEntries).values(entryPayload).returning())[0];

    const [capacityPlan] = await db
      .select()
      .from(capacityPlans)
      .where(
        and(
          eq(capacityPlans.user_id, user.id),
          eq(capacityPlans.week_start_date, weekStartStr),
        ),
      )
      .limit(1);

    const weeklyCapacity =
      capacityPlan?.capacity_cu ?? user.weekly_capacity_cu_default ?? null;

    const weekPlannedOccurrences = await db
      .select({
        habit_id: plannedOccurrences.habit_id,
        date: plannedOccurrences.date,
        planned_weight_cu: plannedOccurrences.planned_weight_cu,
      })
      .from(plannedOccurrences)
      .innerJoin(habits, eq(plannedOccurrences.habit_id, habits.id))
      .where(
        and(
          eq(habits.user_id, user.id),
          eq(habits.is_active, true),
          gte(plannedOccurrences.date, weekStartStr),
          lte(plannedOccurrences.date, weekEndStr),
        ),
      );

    const weekEntries = await db
      .select()
      .from(habitEntries)
      .innerJoin(habits, eq(habitEntries.habit_id, habits.id))
      .where(
        and(
          eq(habits.user_id, user.id),
          eq(habits.is_active, true),
          gte(habitEntries.date, weekStartStr),
          lte(habitEntries.date, weekEndStr),
        ),
      )
      .then((rows) => rows.map((r) => r.habit_entries));

    const { used, plannedTotal } = computeWeekUsage(
      weekPlannedOccurrences,
      weekEntries,
    );

    return NextResponse.json(
      {
        message: "Habit updated.",
        entry: {
          id: entry?.id,
          habit_id: entry?.habit_id,
          date: entry?.date ?? null,
          status: entry?.status,
          actual_weight_cu: entry?.actual_weight_cu?.toString() ?? "0",
        },
        week_usage: {
          weekly_capacity_cu: weeklyCapacity?.toString() ?? null,
          used_cu: used.toString(),
          planned_cu: plannedTotal.toString(),
          week_start_date: weekStartDateString,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update today error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
