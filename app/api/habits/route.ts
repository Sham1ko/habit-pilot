import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { habits } from "@/lib/db/schema";
import { requireRequestUser } from "@/lib/api/auth";
import { hasRouteError, parseJsonBody } from "@/lib/api/http";

type HabitPayload = {
  title?: string;
  description?: string | null;
  weight_cu?: number | string;
  micro_title?: string | null;
  micro_weight_cu?: number | string;
  freq_type?: string;
  freq_per_week?: number | string;
  context_tags?: string[] | string;
};

function computeHasMicro(
  microTitle: string | null | undefined,
  microWeightCuString: string | null | undefined,
) {
  const normalizedTitle = microTitle?.trim();
  const weightValue = microWeightCuString ?? "0";
  return Boolean(normalizedTitle) || Number.parseFloat(weightValue) > 0;
}

const decimalString = z
  .preprocess((value) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value.toString() : "";
    }

    if (typeof value === "string") {
      return value.trim();
    }

    if (value === null) {
      return "";
    }

    return value;
  }, z.coerce.string())
  .refine((value) => value !== "" && !Number.isNaN(Number(value)), {
    message: "Invalid number",
  });

const requiredText = z.string().trim().min(1);

const nullableText = z.preprocess((value) => {
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
}, z.string().nullable());

const tagsSchema = z.preprocess(
  (value) => {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "string") {
      return value.split(",");
    }

    return value;
  },
  z
    .array(z.string())
    .transform((tags) => tags.map((tag) => tag.trim()).filter(Boolean)),
);

const habitCreateSchema = z.object({
  title: requiredText,
  description: nullableText.optional(),
  weight_cu: decimalString,
  freq_type: requiredText,
  freq_per_week: decimalString,
  micro_title: nullableText.optional(),
  micro_weight_cu: decimalString,
  context_tags: tagsSchema.optional().default([]),
});

const habitUpdateSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    title: requiredText.optional(),
    description: nullableText.optional(),
    weight_cu: decimalString.optional(),
    freq_type: requiredText.optional(),
    freq_per_week: decimalString.optional(),
    micro_title: nullableText.optional(),
    micro_weight_cu: decimalString.optional(),
    context_tags: tagsSchema.optional(),
  })
  .refine(
    (value) =>
      Object.entries(value).some(
        ([key, fieldValue]) => key !== "id" && fieldValue !== undefined,
      ),
    { message: "No fields to update", path: ["fields"] },
  );

const habitDeleteSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const bodyResult = await parseJsonBody<HabitPayload>(request);
    if (hasRouteError(bodyResult)) {
      return bodyResult.error;
    }

    const parsed = habitCreateSchema.safeParse(bodyResult.data);
    if (!parsed.success) {
      const issuePath = parsed.error.issues[0]?.path?.[0];
      const fieldLabel = issuePath ? String(issuePath) : "field";
      return NextResponse.json(
        { error: `${fieldLabel} is required` },
        { status: 400 },
      );
    }

    const userResult = await requireRequestUser();
    if (hasRouteError(userResult)) {
      return userResult.error;
    }
    const user = userResult.data;

    const {
      title,
      description,
      weight_cu,
      freq_type,
      freq_per_week,
      micro_title,
      micro_weight_cu,
      context_tags,
    } = parsed.data;

    const microTitle = micro_title ?? null;
    const hasMicro = computeHasMicro(microTitle, micro_weight_cu);

    const [createdHabit] = await db
      .insert(habits)
      .values({
        user_id: user.id,
        title,
        description: description ?? null,
        weight_cu,
        freq_type,
        freq_per_week,
        has_micro: hasMicro,
        micro_title: microTitle,
        micro_weight_cu,
        context_tags,
        is_active: true,
      })
      .returning();

    return NextResponse.json(
      {
        message: "Habit created",
        habit: createdHabit,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create habit error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const userResult = await requireRequestUser();
    if (hasRouteError(userResult)) {
      return userResult.error;
    }
    const user = userResult.data;

    const allHabits = await db
      .select()
      .from(habits)
      .where(eq(habits.user_id, user.id))
      .orderBy(desc(habits.created_at));

    return NextResponse.json({ habits: allHabits }, { status: 200 });
  } catch (error) {
    console.error("Fetch habits error:", error);
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

    const parsed = habitUpdateSchema.safeParse(bodyResult.data);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const message = firstIssue?.message ?? "Invalid request body";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const userResult = await requireRequestUser();
    if (hasRouteError(userResult)) {
      return userResult.error;
    }
    const user = userResult.data;

    const [habit] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, parsed.data.id), eq(habits.user_id, user.id)))
      .limit(1);

    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const {
      title,
      description,
      weight_cu,
      freq_type,
      freq_per_week,
      micro_title,
      micro_weight_cu,
      context_tags,
    } = parsed.data;

    const hasMicroInput =
      micro_title !== undefined || micro_weight_cu !== undefined;

    const updateData: {
      title?: string;
      description?: string | null;
      weight_cu?: string;
      freq_type?: string;
      freq_per_week?: string;
      micro_title?: string | null;
      micro_weight_cu?: string;
      context_tags?: string[];
      has_micro?: boolean;
    } = {
      title,
      description,
      weight_cu,
      freq_type,
      freq_per_week,
      micro_title,
      micro_weight_cu,
      context_tags,
    };

    if (hasMicroInput) {
      const nextMicroTitle =
        micro_title !== undefined ? micro_title : habit.micro_title;
      const nextMicroWeight =
        micro_weight_cu !== undefined
          ? micro_weight_cu
          : habit.micro_weight_cu.toString();
      updateData.has_micro = computeHasMicro(nextMicroTitle, nextMicroWeight);
    }

    const [updatedHabit] = await db
      .update(habits)
      .set(updateData)
      .where(eq(habits.id, habit.id))
      .returning();

    return NextResponse.json(
      { message: "Habit updated", habit: updatedHabit },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update habit error:", error);
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

    const parsed = habitDeleteSchema.safeParse(bodyResult.data);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request body";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const userResult = await requireRequestUser();
    if (hasRouteError(userResult)) {
      return userResult.error;
    }
    const user = userResult.data;

    const [habit] = await db
      .select({ id: habits.id })
      .from(habits)
      .where(and(eq(habits.id, parsed.data.id), eq(habits.user_id, user.id)))
      .limit(1);

    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    await db.delete(habits).where(eq(habits.id, habit.id));

    return NextResponse.json({ message: "Habit deleted" }, { status: 200 });
  } catch (error) {
    console.error("Delete habit error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
