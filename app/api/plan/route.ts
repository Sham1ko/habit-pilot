import { and, asc, eq, gte, lte, ne, sum } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRequestUser } from "@/lib/api/auth";
import { hasRouteError, parseJsonBody } from "@/lib/api/http";
import { formatDateUTC, getDateContext } from "@/lib/date";
import { getDb } from "@/lib/db";
import { capacityPlans, habits, plannedOccurrences } from "@/lib/db/schema";
import { toNumber } from "@/lib/number";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const isoDateSchema = z
  .string()
  .regex(isoDateRegex, {
    message: "Date must be in YYYY-MM-DD format",
  })
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()), {
    message: "Invalid date value",
  });

const capacityValueSchema = z
  .preprocess((value) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value.toString() : "";
    }

    if (typeof value === "string") {
      return value.trim();
    }

    return value;
  }, z.coerce.string())
  .refine((value) => value !== "" && !Number.isNaN(Number(value)), {
    message: "Capacity is required.",
  })
  .refine((value) => Number(value) > 0, {
    message: "Capacity must be greater than 0.",
  });

const addOccurrenceSchema = z.object({
  date: isoDateSchema,
  habit_id: z.coerce.number().int().positive(),
  planned_weight_cu: z
    .preprocess((value) => {
      if (typeof value === "number") {
        return Number.isFinite(value) ? value.toString() : "";
      }

      if (typeof value === "string") {
        return value.trim();
      }

      return value;
    }, z.coerce.string())
    .refine((value) => value === "" || !Number.isNaN(Number(value)), {
      message: "Invalid planned weight",
    })
    .optional(),
});

const updateOccurrenceSchema = z
  .object({
    occurrence_id: z.string().uuid(),
    date: isoDateSchema.optional(),
    planned_weight_cu: z
      .preprocess((value) => {
        if (typeof value === "number") {
          return Number.isFinite(value) ? value.toString() : "";
        }

        if (typeof value === "string") {
          return value.trim();
        }

        return value;
      }, z.coerce.string())
      .refine((value) => value !== "" && !Number.isNaN(Number(value)), {
        message: "Invalid planned weight",
      })
      .optional(),
  })
  .refine(
    ({ date, planned_weight_cu }) =>
      date !== undefined || planned_weight_cu !== undefined,
    { message: "No fields to update", path: ["fields"] },
  );

const updateCapacitySchema = z.object({
  capacity_cu: capacityValueSchema,
  week_start_date: isoDateSchema.optional(),
});

const deleteOccurrenceSchema = z.object({
  occurrence_id: z.string().uuid(),
});

function parseIsoDate(value: string) {
  return new Date(`${value}T00:00:00Z`);
}

function toWeekStartDate(date: Date) {
  const weekStart = new Date(date);
  const weekday = weekStart.getUTCDay();
  const shift = weekday === 0 ? 6 : weekday - 1;
  weekStart.setUTCDate(weekStart.getUTCDate() - shift);
  weekStart.setUTCHours(0, 0, 0, 0);
  return weekStart;
}

function getWeekWindowFromStart(startDate: Date) {
  const weekStartDate = toWeekStartDate(startDate);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);

  return {
    weekStartDate,
    weekEndDate,
    weekStartDateString: formatDateUTC(weekStartDate),
    weekEndDateString: formatDateUTC(weekEndDate),
  };
}

function getWeekWindowFromDate(date: Date) {
  return getWeekWindowFromStart(date);
}

async function getPlannedTotal(
  userId: number,
  weekStartStr: string,
  weekEndStr: string,
) {
  const db = await getDb();
  const [result] = await db
    .select({ total: sum(plannedOccurrences.planned_weight_cu) })
    .from(plannedOccurrences)
    .innerJoin(habits, eq(plannedOccurrences.habit_id, habits.id))
    .where(
      and(
        eq(habits.user_id, userId),
        eq(habits.is_active, true),
        gte(plannedOccurrences.date, weekStartStr),
        lte(plannedOccurrences.date, weekEndStr),
      ),
    );

  return result?.total ?? "0";
}

export async function GET(request: Request) {
  try {
    const userResult = await requireRequestUser();
    if (hasRouteError(userResult)) {
      return userResult.error;
    }
    const user = userResult.data;

    const dateContext = getDateContext(user.tz ?? undefined);

    const requestUrl = new URL(request.url);
    const weekStartQuery = requestUrl.searchParams.get("week_start");

    if (weekStartQuery && !isoDateRegex.test(weekStartQuery)) {
      return NextResponse.json(
        { error: "Invalid week_start date format." },
        { status: 400 },
      );
    }

    const selectedWeekWindow = weekStartQuery
      ? getWeekWindowFromStart(parseIsoDate(weekStartQuery))
      : getWeekWindowFromStart(dateContext.weekStartDate);

    const db = await getDb();
    const capacityPromise = db
      .select()
      .from(capacityPlans)
      .where(
        and(
          eq(capacityPlans.user_id, user.id),
          eq(
            capacityPlans.week_start_date,
            selectedWeekWindow.weekStartDateString,
          ),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    const habitsPromise = db
      .select()
      .from(habits)
      .where(and(eq(habits.user_id, user.id), eq(habits.is_active, true)))
      .orderBy(asc(habits.created_at));

    const occurrencesPromise = db
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
          eq(habits.user_id, user.id),
          eq(habits.is_active, true),
          gte(plannedOccurrences.date, selectedWeekWindow.weekStartDateString),
          lte(plannedOccurrences.date, selectedWeekWindow.weekEndDateString),
        ),
      )
      .orderBy(asc(plannedOccurrences.date));

    const [capacityPlan, userHabits, occurrences] = await Promise.all([
      capacityPromise,
      habitsPromise,
      occurrencesPromise,
    ]);

    const weeklyCapacity =
      capacityPlan?.capacity_cu ?? user.weekly_capacity_cu_default ?? null;

    const occurrencesByDate = new Map<
      string,
      Array<{
        id: string;
        habit_id: number;
        habit_title: string;
        planned_weight_cu: string;
        habit_weight_cu: string;
        habit_has_micro: boolean;
        habit_micro_weight_cu: string;
      }>
    >();

    let plannedTotal = 0;

    occurrences.forEach((occurrence) => {
      const dateKey = occurrence.date;
      const plannedWeight = occurrence.planned_weight_cu?.toString() ?? "0";
      plannedTotal += toNumber(plannedWeight);

      const list = occurrencesByDate.get(dateKey) ?? [];
      list.push({
        id: occurrence.id,
        habit_id: occurrence.habit_id,
        habit_title: occurrence.habit_title,
        planned_weight_cu: plannedWeight,
        habit_weight_cu: occurrence.habit_weight_cu?.toString() ?? "0",
        habit_has_micro: occurrence.habit_has_micro,
        habit_micro_weight_cu:
          occurrence.habit_micro_weight_cu?.toString() ?? "0",
      });
      occurrencesByDate.set(dateKey, list);
    });

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(selectedWeekWindow.weekStartDate);
      date.setUTCDate(date.getUTCDate() + index);
      const dateString = formatDateUTC(date);
      const dayOccurrences = occurrencesByDate.get(dateString) ?? [];
      const plannedCu = dayOccurrences.reduce(
        (sum, item) => sum + toNumber(item.planned_weight_cu),
        0,
      );

      return {
        date: dateString,
        planned_cu: plannedCu.toString(),
        occurrences: dayOccurrences,
      };
    });

    return NextResponse.json(
      {
        week_start_date: selectedWeekWindow.weekStartDateString,
        week_end_date: selectedWeekWindow.weekEndDateString,
        today_date: dateContext.todayDateString,
        weekly_capacity_cu: weeklyCapacity?.toString() ?? null,
        planned_cu: plannedTotal.toString(),
        days,
        habits: userHabits.map((habit) => ({
          id: habit.id,
          title: habit.title,
          weight_cu: habit.weight_cu?.toString() ?? "0",
          freq_per_week: habit.freq_per_week?.toString() ?? "0",
          has_micro: habit.has_micro,
          micro_weight_cu: habit.micro_weight_cu?.toString() ?? "0",
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fetch plan error:", error);
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

    const parsed = addOccurrenceSchema.safeParse(bodyResult.data);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request body";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const userResult = await requireRequestUser();
    if (hasRouteError(userResult)) {
      return userResult.error;
    }
    const user = userResult.data;

    const db = await getDb();
    const [habit] = await db
      .select()
      .from(habits)
      .where(
        and(
          eq(habits.id, parsed.data.habit_id),
          eq(habits.user_id, user.id),
          eq(habits.is_active, true),
        ),
      )
      .limit(1);

    if (!habit) {
      return NextResponse.json({ error: "Habit not found." }, { status: 404 });
    }

    const date = parsed.data.date;

    const [existing] = await db
      .select({ id: plannedOccurrences.id })
      .from(plannedOccurrences)
      .where(
        and(
          eq(plannedOccurrences.habit_id, habit.id),
          eq(plannedOccurrences.date, date),
        ),
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Habit already planned for this day." },
        { status: 409 },
      );
    }

    const plannedWeight =
      parsed.data.planned_weight_cu && parsed.data.planned_weight_cu !== ""
        ? parsed.data.planned_weight_cu
        : (habit.weight_cu?.toString() ?? "0");

    const [created] = await db
      .insert(plannedOccurrences)
      .values({
        habit_id: habit.id,
        date,
        planned_weight_cu: plannedWeight,
      })
      .returning();

    const weekWindow = getWeekWindowFromDate(parseIsoDate(date));

    const plannedTotal = await getPlannedTotal(
      user.id,
      weekWindow.weekStartDateString,
      weekWindow.weekEndDateString,
    );

    return NextResponse.json(
      {
        occurrence: {
          id: created.id,
          habit_id: created.habit_id,
          date: parsed.data.date,
          planned_weight_cu: created.planned_weight_cu?.toString() ?? "0",
          habit_title: habit.title,
          habit_weight_cu: habit.weight_cu?.toString() ?? "0",
          habit_has_micro: habit.has_micro,
          habit_micro_weight_cu: habit.micro_weight_cu?.toString() ?? "0",
        },
        planned_cu: plannedTotal,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Add plan error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const bodyResult = await parseJsonBody(request);
    if (hasRouteError(bodyResult)) {
      return bodyResult.error;
    }

    const body = bodyResult.data;
    const isCapacityUpdate =
      typeof body === "object" && body !== null && "capacity_cu" in body;

    if (isCapacityUpdate) {
      const parsedCapacity = updateCapacitySchema.safeParse(body);
      if (!parsedCapacity.success) {
        const message =
          parsedCapacity.error.issues[0]?.message ?? "Invalid request body";
        return NextResponse.json({ error: message }, { status: 400 });
      }

      const userResult = await requireRequestUser();
      if (hasRouteError(userResult)) {
        return userResult.error;
      }
      const user = userResult.data;

      const fallbackContext = getDateContext(user.tz ?? undefined);
      const weekWindow = parsedCapacity.data.week_start_date
        ? getWeekWindowFromStart(
            parseIsoDate(parsedCapacity.data.week_start_date),
          )
        : getWeekWindowFromStart(fallbackContext.weekStartDate);

      const db = await getDb();
      const [existingPlan] = await db
        .select()
        .from(capacityPlans)
        .where(
          and(
            eq(capacityPlans.user_id, user.id),
            eq(capacityPlans.week_start_date, weekWindow.weekStartDateString),
          ),
        )
        .limit(1);

      const updatedPlan = existingPlan
        ? (
            await db
              .update(capacityPlans)
              .set({ capacity_cu: parsedCapacity.data.capacity_cu })
              .where(eq(capacityPlans.id, existingPlan.id))
              .returning()
          )[0]
        : (
            await db
              .insert(capacityPlans)
              .values({
                user_id: user.id,
                week_start_date: weekWindow.weekStartDateString,
                capacity_cu: parsedCapacity.data.capacity_cu,
              })
              .returning()
          )[0];

      const plannedTotal = await getPlannedTotal(
        user.id,
        weekWindow.weekStartDateString,
        weekWindow.weekEndDateString,
      );

      return NextResponse.json(
        {
          week_start_date: weekWindow.weekStartDateString,
          week_end_date: weekWindow.weekEndDateString,
          capacity_cu: updatedPlan?.capacity_cu?.toString() ?? "0",
          planned_cu: plannedTotal,
        },
        { status: 200 },
      );
    }

    const parsed = updateOccurrenceSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request body";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const userResult = await requireRequestUser();
    if (hasRouteError(userResult)) {
      return userResult.error;
    }
    const user = userResult.data;

    const db = await getDb();
    const [occurrence] = await db
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
          eq(plannedOccurrences.id, parsed.data.occurrence_id),
          eq(habits.user_id, user.id),
          eq(habits.is_active, true),
        ),
      )
      .limit(1);

    if (!occurrence) {
      return NextResponse.json(
        { error: "Planned habit not found." },
        { status: 404 },
      );
    }

    const updateData: {
      date?: string;
      planned_weight_cu?: string;
    } = {};

    if (parsed.data.date) {
      updateData.date = parsed.data.date;
    }

    if (parsed.data.planned_weight_cu) {
      updateData.planned_weight_cu = parsed.data.planned_weight_cu;
    }

    if (updateData.date) {
      const [existing] = await db
        .select({ id: plannedOccurrences.id })
        .from(plannedOccurrences)
        .where(
          and(
            eq(plannedOccurrences.habit_id, occurrence.habit_id),
            eq(plannedOccurrences.date, updateData.date),
            ne(plannedOccurrences.id, occurrence.id),
          ),
        )
        .limit(1);

      if (existing) {
        return NextResponse.json(
          { error: "Habit already planned for this day." },
          { status: 409 },
        );
      }
    }

    const [updated] = await db
      .update(plannedOccurrences)
      .set(updateData)
      .where(eq(plannedOccurrences.id, occurrence.id))
      .returning();

    const targetDate = updateData.date ?? occurrence.date;
    const weekWindow = getWeekWindowFromDate(parseIsoDate(targetDate));

    const plannedTotal = await getPlannedTotal(
      user.id,
      weekWindow.weekStartDateString,
      weekWindow.weekEndDateString,
    );

    return NextResponse.json(
      {
        occurrence: {
          id: updated.id,
          habit_id: updated.habit_id,
          date: updated.date,
          planned_weight_cu: updated.planned_weight_cu?.toString() ?? "0",
          habit_title: occurrence.habit_title,
          habit_weight_cu: occurrence.habit_weight_cu?.toString() ?? "0",
          habit_has_micro: occurrence.habit_has_micro,
          habit_micro_weight_cu:
            occurrence.habit_micro_weight_cu?.toString() ?? "0",
        },
        planned_cu: plannedTotal,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update plan error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const bodyResult = await parseJsonBody(request);
    if (hasRouteError(bodyResult)) {
      return bodyResult.error;
    }

    const parsed = deleteOccurrenceSchema.safeParse(bodyResult.data);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request body";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const userResult = await requireRequestUser();
    if (hasRouteError(userResult)) {
      return userResult.error;
    }
    const user = userResult.data;

    const db = await getDb();
    const [occurrence] = await db
      .select({
        id: plannedOccurrences.id,
        date: plannedOccurrences.date,
      })
      .from(plannedOccurrences)
      .innerJoin(habits, eq(plannedOccurrences.habit_id, habits.id))
      .where(
        and(
          eq(plannedOccurrences.id, parsed.data.occurrence_id),
          eq(habits.user_id, user.id),
        ),
      )
      .limit(1);

    if (!occurrence) {
      return NextResponse.json(
        { error: "Planned habit not found." },
        { status: 404 },
      );
    }

    const weekWindow = getWeekWindowFromDate(parseIsoDate(occurrence.date));

    await db
      .delete(plannedOccurrences)
      .where(eq(plannedOccurrences.id, occurrence.id));

    const plannedTotal = await getPlannedTotal(
      user.id,
      weekWindow.weekStartDateString,
      weekWindow.weekEndDateString,
    );

    return NextResponse.json({ planned_cu: plannedTotal }, { status: 200 });
  } catch (error) {
    console.error("Delete plan error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
