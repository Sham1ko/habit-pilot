import { NextResponse } from "next/server";
import { prisma } from "@/lib/prismaClient";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

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

async function parseJsonOr400<T>(request: Request) {
  try {
    const data = (await request.json()) as T;
    return { data };
  } catch {
    return {
      error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }
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
    ({ id, ...rest }) =>
      Object.values(rest).some((value) => value !== undefined),
    { message: "No fields to update", path: ["fields"] },
  );

export async function POST(request: Request) {
  try {
    const { data: payload, error: jsonError } =
      await parseJsonOr400<HabitPayload>(request);
    if (jsonError) {
      return jsonError;
    }

    const parsed = habitCreateSchema.safeParse(payload);
    if (!parsed.success) {
      const issuePath = parsed.error.issues[0]?.path?.[0];
      const fieldLabel = issuePath ? String(issuePath) : "field";
      return NextResponse.json(
        { error: `${fieldLabel} is required` },
        { status: 400 },
      );
    }

    const { email, error: authError } = await requireAuthUserEmail();
    if (authError) {
      return authError;
    }

    const { user, error: userError } = await requireDbUser(email);
    if (userError) {
      return userError;
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

    const microTitle = micro_title ?? null;
    const hasMicro = computeHasMicro(microTitle, micro_weight_cu);

    const createdHabit = await prisma.habit.create({
      data: {
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
      },
    });

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
    const { email, error: authError } = await requireAuthUserEmail();
    if (authError) {
      return authError;
    }

    const { user, error: userError } = await requireDbUser(email);
    if (userError) {
      return userError;
    }

    const habits = await prisma.habit.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ habits }, { status: 200 });
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
    const { data: payload, error: jsonError } =
      await parseJsonOr400<unknown>(request);
    if (jsonError) {
      return jsonError;
    }

    const parsed = habitUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const message = firstIssue?.message ?? "Invalid request body";
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

    const habit = await prisma.habit.findFirst({
      where: { id: parsed.data.id, user_id: user.id },
    });

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

    const updatedHabit = await prisma.habit.update({
      where: { id: habit.id },
      data: updateData,
    });

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
