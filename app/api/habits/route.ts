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

type HabitUpdatePayload = HabitPayload & {
  id?: number | string;
};

function toDecimalString(value: number | string | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed && !Number.isNaN(Number(trimmed))) {
      return trimmed;
    }
  }

  return null;
}

function toInteger(value: number | string | undefined) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed && Number.isInteger(Number(trimmed))) {
      return Number(trimmed);
    }
  }

  return null;
}

function normalizeText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeTags(value?: string[] | string) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((tag) => tag.trim()).filter(Boolean);
  }

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

const habitSchema = z.object({
  title: z.preprocess(normalizeText, z.string()),
  weight_cu: z.preprocess(toDecimalString, z.string()),
  freq_type: z.preprocess(normalizeText, z.string()),
  freq_per_week: z.preprocess(toDecimalString, z.string()),
  micro_weight_cu: z.preprocess(toDecimalString, z.string()),
});

const habitUpdateSchema = z.object({
  id: z.preprocess(toInteger, z.number().int().positive()),
  title: z.preprocess(normalizeText, z.string()).optional(),
  weight_cu: z.preprocess(toDecimalString, z.string()).optional(),
  freq_type: z.preprocess(normalizeText, z.string()).optional(),
  freq_per_week: z.preprocess(toDecimalString, z.string()).optional(),
  micro_weight_cu: z.preprocess(toDecimalString, z.string()).optional(),
});

export async function POST(request: Request) {
  try {
    let payload: HabitPayload;
    try {
      payload = (await request.json()) as HabitPayload;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: data.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const parsed = habitSchema.safeParse(payload);
    if (!parsed.success) {
      const issuePath = parsed.error.issues[0]?.path?.[0];
      const fieldLabel = issuePath ? String(issuePath) : "field";
      return NextResponse.json(
        { error: `${fieldLabel} is required` },
        { status: 400 }
      );
    }

    const { title, weight_cu, freq_type, freq_per_week, micro_weight_cu } =
      parsed.data;

    const description = normalizeText(payload.description);
    const microTitle = normalizeText(payload.micro_title);
    const hasMicro =
      Boolean(microTitle) || Number.parseFloat(micro_weight_cu) > 0;

    const createdHabit = await prisma.habit.create({
      data: {
        user_id: user.id,
        title,
        description,
        weight_cu,
        freq_type,
        freq_per_week,
        has_micro: hasMicro,
        micro_title: microTitle,
        micro_weight_cu,
        context_tags: normalizeTags(payload.context_tags),
        is_active: true,
      },
    });

    return NextResponse.json(
      {
        message: "Habit created",
        habit: createdHabit,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create habit error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: data.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    let payload: HabitUpdatePayload;
    try {
      payload = (await request.json()) as HabitUpdatePayload;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const parsed = habitUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const issuePath = firstIssue?.path?.[0];
      const fieldLabel = issuePath ? String(issuePath) : "field";
      const errorMessage =
        firstIssue?.code === "invalid_type" &&
        typeof firstIssue.input === "undefined"
          ? `${fieldLabel} is required`
          : `${fieldLabel} is invalid`;

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: data.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const habit = await prisma.habit.findFirst({
      where: { id: parsed.data.id, user_id: user.id },
    });

    if (!habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

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
    } = {};

    if (parsed.data.title !== undefined) {
      updateData.title = parsed.data.title;
    }

    if (parsed.data.weight_cu !== undefined) {
      updateData.weight_cu = parsed.data.weight_cu;
    }

    if (parsed.data.freq_type !== undefined) {
      updateData.freq_type = parsed.data.freq_type;
    }

    if (parsed.data.freq_per_week !== undefined) {
      updateData.freq_per_week = parsed.data.freq_per_week;
    }

    if (parsed.data.micro_weight_cu !== undefined) {
      updateData.micro_weight_cu = parsed.data.micro_weight_cu;
    }

    if (payload.description !== undefined) {
      updateData.description = normalizeText(payload.description);
    }

    if (payload.micro_title !== undefined) {
      updateData.micro_title = normalizeText(payload.micro_title);
    }

    if (payload.context_tags !== undefined) {
      updateData.context_tags = normalizeTags(payload.context_tags);
    }

    const hasMicroInput =
      payload.micro_title !== undefined ||
      parsed.data.micro_weight_cu !== undefined;

    if (hasMicroInput) {
      const nextMicroTitle =
        payload.micro_title !== undefined
          ? normalizeText(payload.micro_title)
          : habit.micro_title;
      const nextMicroWeight =
        parsed.data.micro_weight_cu !== undefined
          ? parsed.data.micro_weight_cu
          : habit.micro_weight_cu.toString();
      updateData.has_micro =
        Boolean(nextMicroTitle) || Number.parseFloat(nextMicroWeight) > 0;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updatedHabit = await prisma.habit.update({
      where: { id: habit.id },
      data: updateData,
    });

    return NextResponse.json(
      { message: "Habit updated", habit: updatedHabit },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update habit error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
