import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prismaClient";
import { createClient } from "@/lib/supabase/server";
import { formatDateUTC, getDateContext } from "@/lib/date";

const addOccurrenceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
  context_tag: z
    .preprocess((value) => {
      if (typeof value === "undefined") {
        return undefined;
      }
      if (value === null) {
        return null;
      }
      if (typeof value !== "string") {
        return null;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }, z.string().nullable())
    .optional(),
});

const updateOccurrenceSchema = z
  .object({
    occurrence_id: z.string().uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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
    context_tag: z
      .preprocess((value) => {
        if (typeof value === "undefined") {
          return undefined;
        }
        if (value === null) {
          return null;
        }
        if (typeof value !== "string") {
          return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      }, z.string().nullable())
      .optional(),
  })
  .refine(
    ({ date, planned_weight_cu, context_tag }) =>
      date !== undefined ||
      planned_weight_cu !== undefined ||
      context_tag !== undefined,
    { message: "No fields to update", path: ["fields"] },
  );

const deleteOccurrenceSchema = z.object({
  occurrence_id: z.string().uuid(),
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

async function getPlannedTotal(userId: number, weekStart: Date, weekEnd: Date) {
  const plannedSum = await prisma.plannedOccurrence.aggregate({
    where: {
      habit: { user_id: userId },
      date: { gte: weekStart, lte: weekEnd },
    },
    _sum: { planned_weight_cu: true },
  });

  return plannedSum._sum.planned_weight_cu?.toString() ?? "0";
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

    const {
      todayDateString,
      weekStartDate,
      weekEndDate,
      weekStartDateString,
      weekEndDateString,
    } = getDateContext(user.tz ?? undefined);

    const capacityPromise = prisma.capacityPlan.findFirst({
      where: {
        user_id: user.id,
        week_start_date: weekStartDate,
      },
    });

    const habitsPromise = prisma.habit.findMany({
      where: { user_id: user.id, is_active: true },
      orderBy: { created_at: "asc" },
    });

    const occurrencesPromise = prisma.plannedOccurrence.findMany({
      where: {
        habit: { user_id: user.id },
        date: { gte: weekStartDate, lte: weekEndDate },
      },
      include: { habit: true },
      orderBy: { date: "asc" },
    });

    const [capacityPlan, habits, occurrences] = await Promise.all([
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
        context_tag: string | null;
        habit_weight_cu: string;
        habit_has_micro: boolean;
        habit_micro_weight_cu: string;
      }>
    >();

    let plannedTotal = 0;

    occurrences.forEach((occurrence) => {
      const dateKey = formatDateUTC(occurrence.date);
      const plannedWeight = occurrence.planned_weight_cu.toString();
      plannedTotal += toNumber(plannedWeight);

      const list = occurrencesByDate.get(dateKey) ?? [];
      list.push({
        id: occurrence.id,
        habit_id: occurrence.habit_id,
        habit_title: occurrence.habit.title,
        planned_weight_cu: plannedWeight,
        context_tag: occurrence.context_tag,
        habit_weight_cu: occurrence.habit.weight_cu.toString(),
        habit_has_micro: occurrence.habit.has_micro,
        habit_micro_weight_cu: occurrence.habit.micro_weight_cu.toString(),
      });
      occurrencesByDate.set(dateKey, list);
    });

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStartDate);
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
        week_start_date: weekStartDateString,
        week_end_date: weekEndDateString,
        today_date: todayDateString,
        weekly_capacity_cu: weeklyCapacity?.toString() ?? null,
        planned_cu: plannedTotal.toString(),
        days,
        habits: habits.map((habit) => ({
          id: habit.id,
          title: habit.title,
          weight_cu: habit.weight_cu.toString(),
          has_micro: habit.has_micro,
          micro_weight_cu: habit.micro_weight_cu.toString(),
          context_tags: habit.context_tags ?? [],
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
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parsed = addOccurrenceSchema.safeParse(payload);
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

    const { weekStartDate, weekEndDate } = getDateContext(
      user.tz ?? undefined,
    );

    const habit = await prisma.habit.findFirst({
      where: { id: parsed.data.habit_id, user_id: user.id },
    });

    if (!habit) {
      return NextResponse.json(
        { error: "Habit not found." },
        { status: 404 },
      );
    }

    const date = new Date(`${parsed.data.date}T00:00:00Z`);

    const existing = await prisma.plannedOccurrence.findFirst({
      where: {
        habit_id: habit.id,
        date,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Habit already planned for this day." },
        { status: 409 },
      );
    }

    const plannedWeight =
      parsed.data.planned_weight_cu && parsed.data.planned_weight_cu !== ""
        ? parsed.data.planned_weight_cu
        : habit.weight_cu.toString();

    const created = await prisma.plannedOccurrence.create({
      data: {
        habit_id: habit.id,
        date,
        planned_weight_cu: plannedWeight,
        context_tag: parsed.data.context_tag ?? null,
      },
    });

    const plannedTotal = await getPlannedTotal(
      user.id,
      weekStartDate,
      weekEndDate,
    );

    return NextResponse.json(
      {
        occurrence: {
          id: created.id,
          habit_id: created.habit_id,
          date: parsed.data.date,
          planned_weight_cu: created.planned_weight_cu.toString(),
          context_tag: created.context_tag,
          habit_title: habit.title,
          habit_weight_cu: habit.weight_cu.toString(),
          habit_has_micro: habit.has_micro,
          habit_micro_weight_cu: habit.micro_weight_cu.toString(),
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
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parsed = updateOccurrenceSchema.safeParse(payload);
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

    const { weekStartDate, weekEndDate } = getDateContext(
      user.tz ?? undefined,
    );

    const occurrence = await prisma.plannedOccurrence.findFirst({
      where: {
        id: parsed.data.occurrence_id,
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

    const updateData: {
      date?: Date;
      planned_weight_cu?: string;
      context_tag?: string | null;
    } = {};

    if (parsed.data.date) {
      updateData.date = new Date(`${parsed.data.date}T00:00:00Z`);
    }

    if (parsed.data.planned_weight_cu) {
      updateData.planned_weight_cu = parsed.data.planned_weight_cu;
    }

    if (parsed.data.context_tag !== undefined) {
      updateData.context_tag = parsed.data.context_tag ?? null;
    }

    if (updateData.date) {
      const existing = await prisma.plannedOccurrence.findFirst({
        where: {
          habit_id: occurrence.habit_id,
          date: updateData.date,
          NOT: { id: occurrence.id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Habit already planned for this day." },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.plannedOccurrence.update({
      where: { id: occurrence.id },
      data: updateData,
    });

    const plannedTotal = await getPlannedTotal(
      user.id,
      weekStartDate,
      weekEndDate,
    );

    return NextResponse.json(
      {
        occurrence: {
          id: updated.id,
          habit_id: updated.habit_id,
          date: formatDateUTC(updated.date),
          planned_weight_cu: updated.planned_weight_cu.toString(),
          context_tag: updated.context_tag,
          habit_title: occurrence.habit.title,
          habit_weight_cu: occurrence.habit.weight_cu.toString(),
          habit_has_micro: occurrence.habit.has_micro,
          habit_micro_weight_cu: occurrence.habit.micro_weight_cu.toString(),
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
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parsed = deleteOccurrenceSchema.safeParse(payload);
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

    const { weekStartDate, weekEndDate } = getDateContext(
      user.tz ?? undefined,
    );

    const occurrence = await prisma.plannedOccurrence.findFirst({
      where: {
        id: parsed.data.occurrence_id,
        habit: { user_id: user.id },
      },
    });

    if (!occurrence) {
      return NextResponse.json(
        { error: "Planned habit not found." },
        { status: 404 },
      );
    }

    await prisma.plannedOccurrence.delete({
      where: { id: occurrence.id },
    });

    const plannedTotal = await getPlannedTotal(
      user.id,
      weekStartDate,
      weekEndDate,
    );

    return NextResponse.json(
      { planned_cu: plannedTotal },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete plan error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
