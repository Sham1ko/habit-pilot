import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaClient";
import { createClient } from "@/lib/supabase/server";
import { formatDateUTC, getDateContext } from "@/lib/date";

const actionSchema = z.object({
  occurrenceId: z.string().uuid(),
  action: z.enum(["done", "micro_done", "skipped"]),
});


function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    return Number(value);
  }
  if (value && typeof value === "object" && "toString" in value) {
    return Number(String(value));
  }
  return 0;
}

function computeWeekUsage(
  plannedOccurrences: Array<{
    habit_id: number;
    date: Date;
    planned_weight_cu: unknown;
  }>,
  entries: Array<{
    habit_id: number;
    date: Date;
    actual_weight_cu: unknown;
    status: string;
  }>,
) {
  const plannedByKey = new Map<string, number>();
  let plannedTotal = 0;

  plannedOccurrences.forEach((occurrence) => {
    const dateKey = formatDateUTC(occurrence.date);
    const key = `${occurrence.habit_id}-${dateKey}`;
    const plannedWeight = toNumber(occurrence.planned_weight_cu);
    plannedByKey.set(key, plannedWeight);
    plannedTotal += plannedWeight;
  });

  const entryByKey = new Map<string, (typeof entries)[number]>();
  entries.forEach((entry) => {
    const dateKey = formatDateUTC(entry.date);
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

async function requireAuthUserEmail() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  const email = data.user?.email;
  if (error || !email) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { email };
}

async function requireDbUser(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return {
      error: NextResponse.json({ error: "User not found" }, { status: 404 }),
    };
  }

  return { user };
}

export async function GET() {
  try {
    const { email, error: authError } = await requireAuthUserEmail();
    if (authError) {
      return authError;
    }

    const { user, error: userError } = await requireDbUser(email);
    if (userError) {
      return userError;
    }

    const { todayDateString, weekStartDate, weekEndDate, weekStartDateString } =
      getDateContext(user.tz ?? undefined);

    const capacityPlan = await prisma.capacityPlan.findFirst({
      where: {
        user_id: user.id,
        week_start_date: weekStartDate,
      },
    });

    const weeklyCapacity =
      capacityPlan?.capacity_cu ?? user.weekly_capacity_cu_default ?? null;

    const plannedOccurrences = await prisma.plannedOccurrence.findMany({
      where: {
        habit: { user_id: user.id },
        date: { gte: weekStartDate, lte: weekEndDate },
      },
      include: { habit: true },
      orderBy: { date: "asc" },
    });

    const entries = await prisma.habitEntry.findMany({
      where: {
        habit: { user_id: user.id },
        date: { gte: weekStartDate, lte: weekEndDate },
      },
    });

    const { used, plannedTotal, entryByKey } = computeWeekUsage(
      plannedOccurrences,
      entries,
    );

    const items = plannedOccurrences
      .filter((occurrence) => formatDateUTC(occurrence.date) === todayDateString)
      .map((occurrence) => {
        const dateKey = formatDateUTC(occurrence.date);
        const entryKey = `${occurrence.habit_id}-${dateKey}`;
        const entry = entryByKey.get(entryKey);
        const contextTag =
          occurrence.context_tag ??
          occurrence.habit.context_tags?.[0] ??
          null;

        return {
          occurrence_id: occurrence.id,
          habit_id: occurrence.habit_id,
          habit_title: occurrence.habit.title,
          habit_weight_cu: occurrence.habit.weight_cu.toString(),
          habit_has_micro: occurrence.habit.has_micro,
          habit_micro_title: occurrence.habit.micro_title,
          habit_micro_weight_cu: occurrence.habit.micro_weight_cu.toString(),
          planned_weight_cu: occurrence.planned_weight_cu.toString(),
          context_tag: contextTag,
          status: entry?.status ?? "planned",
          actual_weight_cu: entry ? entry.actual_weight_cu.toString() : null,
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
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parsed = actionSchema.safeParse(payload);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Invalid request body";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { email, error: authError } = await requireAuthUserEmail();
    if (authError) {
      return authError;
    }

    const { user, error: userError } = await requireDbUser(email);
    if (userError) {
      return userError;
    }

    const { todayDateString, weekStartDate, weekEndDate, weekStartDateString } =
      getDateContext(user.tz ?? undefined);

    const occurrence = await prisma.plannedOccurrence.findFirst({
      where: {
        id: parsed.data.occurrenceId,
        habit: { user_id: user.id },
      },
      include: { habit: true },
    });

    if (!occurrence) {
      return NextResponse.json(
        { error: "Planned habit not found." },
        { status: 404 },
      );
    }

    const occurrenceDate = formatDateUTC(occurrence.date);
    if (occurrenceDate !== todayDateString) {
      return NextResponse.json(
        { error: "Only today’s habits can be updated here." },
        { status: 400 },
      );
    }

    const { action } = parsed.data;
    const habit = occurrence.habit;
    const plannedWeight = toNumber(occurrence.planned_weight_cu);
    const habitWeight = toNumber(habit.weight_cu);
    const habitMicroWeight = toNumber(habit.micro_weight_cu);

    let actualWeight = 0;
    if (action === "done") {
      actualWeight = habitWeight || plannedWeight;
    } else if (action === "micro_done") {
      if (habit.has_micro && habitMicroWeight > 0) {
        actualWeight = habitMicroWeight;
      } else {
        actualWeight = Math.max(0.1, plannedWeight * 0.5);
      }
    }

    const existingEntry = await prisma.habitEntry.findFirst({
      where: {
        habit_id: occurrence.habit_id,
        date: occurrence.date,
      },
    });

    const entryPayload = {
      habit_id: occurrence.habit_id,
      date: occurrence.date,
      actual_weight_cu: actualWeight.toString(),
      status: action,
    };

    const entry = existingEntry
      ? await prisma.habitEntry.update({
          where: { id: existingEntry.id },
          data: entryPayload,
        })
      : await prisma.habitEntry.create({ data: entryPayload });

    const capacityPlan = await prisma.capacityPlan.findFirst({
      where: {
        user_id: user.id,
        week_start_date: weekStartDate,
      },
    });

    const weeklyCapacity =
      capacityPlan?.capacity_cu ?? user.weekly_capacity_cu_default ?? null;

    const plannedOccurrences = await prisma.plannedOccurrence.findMany({
      where: {
        habit: { user_id: user.id },
        date: { gte: weekStartDate, lte: weekEndDate },
      },
    });

    const entries = await prisma.habitEntry.findMany({
      where: {
        habit: { user_id: user.id },
        date: { gte: weekStartDate, lte: weekEndDate },
      },
    });

    const { used, plannedTotal } = computeWeekUsage(
      plannedOccurrences,
      entries,
    );

    return NextResponse.json(
      {
        message: "Habit updated.",
        entry: {
          id: entry.id,
          habit_id: entry.habit_id,
          date: formatDateUTC(entry.date),
          status: entry.status,
          actual_weight_cu: entry.actual_weight_cu.toString(),
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
